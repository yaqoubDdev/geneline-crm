"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import { businesses, onboardingAccounts, users } from "@/db/schema";
import type { AccountStatus, BizType, Stage } from "@/lib/types";

/* ---------------- Auth ---------------- */
export async function authenticate(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid email or password.";
    throw error; // re-throw NEXT_REDIRECT and everything else
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/* ---------------- Admin: create a user (agent/admin) ---------------- */
export type AgentFormState = { error?: string; ok?: boolean; name?: string };

export async function createAgent(
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Only admins can add users." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "agent";

  if (!name || !email || !password) return { error: "All fields are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { error: "That email is already in use." };

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash, role });

  revalidatePath("/admin");
  return { ok: true, name };
}

/* ---------------- Business CRUD ---------------- */
type SaveInput = {
  dbId?: number;
  name: string;
  address: string;
  contactName: string;
  contact: string;
  type: BizType;
  stage: Stage;
  objection: string;
  lostReason: string;
  nextAction: string;
  followUpDate: string; // YYYY-MM-DD or ""
};

async function loadOwned(dbId: number, userId: number, isAdmin: boolean) {
  const [b] = await db.select().from(businesses).where(eq(businesses.id, dbId)).limit(1);
  if (!b) throw new Error("Business not found");
  if (!isAdmin && b.agentId !== userId) throw new Error("Forbidden");
  return b;
}

export async function saveBusiness(input: SaveInput): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = Number(session.user.id);
  const isAdmin = session.user.role === "admin";

  // Duplicate prevention: no two businesses may share a phone number.
  // Compare on digits only so "077 883 025" and "077883025" collide.
  const contactDigits = input.contact.replace(/\D/g, "");
  if (contactDigits) {
    const [dup] = await db
      .select({
        code: businesses.code,
        name: businesses.name,
        agentId: businesses.agentId,
        agentName: users.name,
      })
      .from(businesses)
      .innerJoin(users, eq(businesses.agentId, users.id))
      .where(
        and(
          sql`regexp_replace(${businesses.contact}, '\D', '', 'g') = ${contactDigits}`,
          input.dbId ? ne(businesses.id, input.dbId) : undefined
        )
      )
      .limit(1);

    if (dup) {
      if (isAdmin) {
        return { error: `That number is already logged: ${dup.name} (${dup.code}) by ${dup.agentName}.` };
      }
      if (dup.agentId === userId) {
        return { error: `You've already logged this number — ${dup.name} (${dup.code}).` };
      }
      return { error: "That phone number is already logged by another agent. Ask your admin to check." };
    }
  }

  const fields = {
    name: input.name.trim(),
    address: input.address.trim() || null,
    contactName: input.contactName.trim() || null,
    contact: input.contact.trim(),
    type: input.type,
    stage: input.stage,
    objection: input.objection.trim() || null,
    // Lost reason only applies to Lost deals; clear it otherwise.
    lostReason: input.stage === "Lost" ? input.lostReason.trim() || null : null,
    nextAction: input.nextAction.trim() || null,
    followUpDate: input.followUpDate || null,
  };

  if (input.dbId) {
    await loadOwned(input.dbId, userId, isAdmin);
    await db.update(businesses).set(fields).where(eq(businesses.id, input.dbId));
  } else {
    // New businesses are owned by the logged-in agent.
    await db.insert(businesses).values({ ...fields, agentId: userId });
  }

  revalidatePath("/agent");
  revalidatePath("/admin");
  return {};
}

type OnboardInput = {
  ownerName: string;
  email: string;
  personalPhone: string;
  password: string;
};

export async function onboardBusiness(dbId: number, account: OnboardInput, monthlyFee: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = Number(session.user.id);
  const isAdmin = session.user.role === "admin";
  await loadOwned(dbId, userId, isAdmin);

  const passwordHash = await bcrypt.hash(account.password, 10);

  // New accounts start Pending until the admin confirms the customer is live.
  await db
    .insert(onboardingAccounts)
    .values({
      businessId: dbId,
      ownerName: account.ownerName.trim(),
      email: account.email.trim(),
      personalPhone: account.personalPhone.trim() || null,
      passwordHash,
    })
    .onConflictDoUpdate({
      target: onboardingAccounts.businessId,
      set: {
        ownerName: account.ownerName.trim(),
        email: account.email.trim(),
        personalPhone: account.personalPhone.trim() || null,
        passwordHash,
      },
    });

  await db
    .update(businesses)
    .set({ onboarded: true, stage: "Won", monthlyFee })
    .where(eq(businesses.id, dbId));

  revalidatePath("/agent");
  revalidatePath("/admin");
}

/* ---------------- Admin: customer lifecycle ---------------- */
export async function setAccountStatus(dbId: number, status: AccountStatus) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Only admins can change customer status.");

  const set: {
    accountStatus: AccountStatus;
    activatedAt?: Date | null;
    churnedAt?: Date | null;
  } = { accountStatus: status };

  // Stamp activation the first time it goes Active; stamp/clear churn accordingly.
  if (status === "Active") {
    const [acc] = await db
      .select({ activatedAt: onboardingAccounts.activatedAt })
      .from(onboardingAccounts)
      .where(eq(onboardingAccounts.businessId, dbId))
      .limit(1);
    if (acc && !acc.activatedAt) set.activatedAt = new Date();
    set.churnedAt = null;
  } else if (status === "Churned") {
    set.churnedAt = new Date();
  }

  await db
    .update(onboardingAccounts)
    .set(set)
    .where(eq(onboardingAccounts.businessId, dbId));

  revalidatePath("/admin");
}
