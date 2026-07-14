import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, onboardingAccounts, users } from "@/db/schema";
import type { Row } from "@/lib/types";

const selection = {
  dbId: businesses.id,
  code: businesses.code,
  name: businesses.name,
  address: businesses.address,
  contact: businesses.contact,
  type: businesses.type,
  stage: businesses.stage,
  objection: businesses.objection,
  lostReason: businesses.lostReason,
  nextAction: businesses.nextAction,
  price: businesses.price,
  onboarded: businesses.onboarded,
  agent: users.name,
  accOwner: onboardingAccounts.ownerName,
  accEmail: onboardingAccounts.email,
  accPhone: onboardingAccounts.personalPhone,
};

type RawRow = {
  dbId: number; code: string; name: string; address: string | null; contact: string;
  type: Row["type"]; stage: Row["stage"]; objection: string | null; lostReason: string | null;
  nextAction: string | null; price: number | null; onboarded: boolean;
  agent: string; accOwner: string | null; accEmail: string | null; accPhone: string | null;
};

function normalize(r: RawRow): Row {
  return {
    dbId: r.dbId,
    code: r.code,
    name: r.name,
    address: r.address,
    contact: r.contact,
    type: r.type,
    stage: r.stage,
    objection: r.objection,
    lostReason: r.lostReason,
    nextAction: r.nextAction,
    agent: r.agent,
    price: r.price,
    onboarded: r.onboarded,
    // Never expose the password hash to the client.
    account: r.accOwner
      ? { ownerName: r.accOwner, email: r.accEmail ?? "", personalPhone: r.accPhone }
      : null,
  };
}

/** All businesses (admin view). */
export async function getAllRows(): Promise<Row[]> {
  const rows = await db
    .select(selection)
    .from(businesses)
    .innerJoin(users, eq(businesses.agentId, users.id))
    .leftJoin(onboardingAccounts, eq(onboardingAccounts.businessId, businesses.id))
    .orderBy(desc(businesses.createdAt));
  return rows.map(normalize);
}

/** Businesses owned by a single agent (agent view — server-side scoped). */
export async function getRowsForAgent(agentId: number): Promise<Row[]> {
  const rows = await db
    .select(selection)
    .from(businesses)
    .innerJoin(users, eq(businesses.agentId, users.id))
    .leftJoin(onboardingAccounts, eq(onboardingAccounts.businessId, businesses.id))
    .where(eq(businesses.agentId, agentId))
    .orderBy(desc(businesses.createdAt));
  return rows.map(normalize);
}

export type AgentInfo = { id: number; name: string; email: string };

/** All agents (for admin filters, leaderboard, and the agents view). */
export async function getAgents(): Promise<AgentInfo[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "agent"))
    .orderBy(users.name);
}
