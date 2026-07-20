"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import { businesses, businessTypes, onboardingAccounts, users } from "@/db/schema";
import type { AccountStatus, BizType, Stage } from "@/lib/types";
import { recordAudit } from "@/lib/audit";

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

  await recordAudit({
    userId: Number(session.user.id),
    actorName: session.user.name ?? session.user.email ?? "Admin",
    action: "create_user",
    details: `Created ${role} ${name} <${email}>`,
  });

  revalidatePath("/admin");
  return { ok: true, name };
}

/* ---------------- Passwords ---------------- */
export type PasswordFormState = { error?: string; ok?: boolean };

/** Any signed-in user changes their own password (must know the current one). */
export async function changeOwnPassword(
  _prev: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const session = await auth();
  if (!session?.user) return { error: "You're not signed in." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next) return { error: "Fill in every field." };
  if (next.length < 6) return { error: "New password must be at least 6 characters." };
  if (next !== confirm) return { error: "New passwords don't match." };

  const userId = Number(session.user.id);
  const [u] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return { error: "Account not found." };

  if (!(await bcrypt.compare(current, u.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  if (await bcrypt.compare(next, u.passwordHash)) {
    return { error: "New password must be different from the current one." };
  }

  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(users.id, userId));

  await recordAudit({
    userId,
    actorName: session.user.name ?? session.user.email ?? "Unknown",
    action: "change_password",
    details: "Changed their own password",
  });

  return { ok: true };
}

/** Admin resets any user's password (no need for the old one). */
export async function resetUserPassword(
  _prev: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Only admins can reset passwords." };

  const targetId = Number(formData.get("userId"));
  const next = String(formData.get("next") ?? "");
  if (!targetId) return { error: "Missing user." };
  if (next.length < 6) return { error: "Password must be at least 6 characters." };

  const [target] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);
  if (!target) return { error: "That user no longer exists." };

  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(users.id, targetId));

  await recordAudit({
    userId: Number(session.user.id),
    actorName: session.user.name ?? session.user.email ?? "Admin",
    action: "reset_password",
    details: `Reset password for ${target.name} <${target.email}>`,
  });

  revalidatePath("/admin");
  return { ok: true };
}

/** The holding account that owns orphaned businesses — must never be deleted. */
const UNASSIGNED_EMAIL = "unassigned@geneline-x.com";

/** Admin removes an agent. Their businesses are reassigned first (FK is restrict). */
export async function removeAgent(
  agentId: number,
  reassignToId: number
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Only admins can remove agents." };
  if (Number(session.user.id) === agentId) return { error: "You can't remove your own account." };

  const [target] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, agentId))
    .limit(1);
  if (!target) return { error: "That agent no longer exists." };
  if (target.email === UNASSIGNED_EMAIL) {
    return { error: "The Unassigned account can't be removed — it keeps orphaned businesses valid." };
  }

  // Reassign any businesses this agent owns before deleting (agentId is NOT NULL, onDelete restrict).
  const owned = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.agentId, agentId));
  if (owned.length > 0) {
    if (!reassignToId || reassignToId === agentId) {
      return { error: "Choose who should take over this agent's businesses." };
    }
    const [dest] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, reassignToId))
      .limit(1);
    if (!dest) return { error: "That reassignment target no longer exists." };
    await db.update(businesses).set({ agentId: reassignToId }).where(eq(businesses.agentId, agentId));
  }

  await db.delete(users).where(eq(users.id, agentId));

  await recordAudit({
    userId: Number(session.user.id),
    actorName: session.user.name ?? session.user.email ?? "Admin",
    action: "delete_user",
    details: owned.length > 0
      ? `Removed agent ${target.name} <${target.email}>, reassigned ${owned.length} business${owned.length === 1 ? "" : "es"}`
      : `Removed agent ${target.name} <${target.email}>`,
  });

  revalidatePath("/admin");
  return { ok: true };
}

/* ---------------- Admin: business types ---------------- */
export type TypeFormState = { error?: string; ok?: boolean; name?: string };

export async function createBusinessType(
  _prev: TypeFormState,
  formData: FormData
): Promise<TypeFormState> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Only admins can add types." };

  const name = String(formData.get("name") ?? "").trim();
  const monthlyFee = Number(formData.get("monthlyFee") ?? 0);
  const icon = String(formData.get("icon") ?? "").trim() || "Building2";

  if (!name) return { error: "Give the type a name." };
  if (name.length > 40) return { error: "That name is too long." };
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0) return { error: "Enter a valid default fee." };

  // Case-insensitive uniqueness so "Salon" and "salon" don't both exist.
  const [existing] = await db
    .select({ id: businessTypes.id })
    .from(businessTypes)
    .where(sql`lower(${businessTypes.name}) = ${name.toLowerCase()}`)
    .limit(1);
  if (existing) return { error: "That type already exists." };

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${businessTypes.sortOrder}), 0)` })
    .from(businessTypes);

  await db.insert(businessTypes).values({
    name,
    monthlyFee: Math.round(monthlyFee),
    icon,
    sortOrder: Number(max) + 1,
  });

  revalidatePath("/admin");
  revalidatePath("/agent");
  return { ok: true, name };
}

export async function setBusinessTypeActive(id: number, active: boolean): Promise<{ error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Only admins can change types." };

  await db.update(businessTypes).set({ active }).where(eq(businessTypes.id, id));

  revalidatePath("/admin");
  revalidatePath("/agent");
  return {};
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

  const actorName = session.user.name ?? session.user.email ?? "Unknown";

  if (input.dbId) {
    const existing = await loadOwned(input.dbId, userId, isAdmin);
    await db.update(businesses).set(fields).where(eq(businesses.id, input.dbId));
    await recordAudit({
      userId,
      actorName,
      action: "update_business",
      businessId: input.dbId,
      businessCode: existing.code,
      businessName: fields.name,
      details: `Stage: ${fields.stage}`,
    });
  } else {
    // New businesses are owned by the logged-in agent.
    const [created] = await db
      .insert(businesses)
      .values({ ...fields, agentId: userId })
      .returning({ id: businesses.id, code: businesses.code });
    await recordAudit({
      userId,
      actorName,
      action: "create_business",
      businessId: created.id,
      businessCode: created.code,
      businessName: fields.name,
      details: `Stage: ${fields.stage}`,
    });
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
  const business = await loadOwned(dbId, userId, isAdmin);

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

  await recordAudit({
    userId,
    actorName: session.user.name ?? session.user.email ?? "Unknown",
    action: "onboard_business",
    businessId: dbId,
    businessCode: business.code,
    businessName: business.name,
    details: `Onboarded at Le ${monthlyFee}/mo`,
  });

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

  const [biz] = await db
    .select({ code: businesses.code, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, dbId))
    .limit(1);
  await recordAudit({
    userId: Number(session.user.id),
    actorName: session.user.name ?? session.user.email ?? "Admin",
    action: "account_status_change",
    businessId: dbId,
    businessCode: biz?.code ?? null,
    businessName: biz?.name ?? null,
    details: `Status → ${status}`,
  });

  revalidatePath("/admin");
}
