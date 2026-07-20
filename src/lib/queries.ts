import "server-only";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, businesses, businessTypes, onboardingAccounts, users } from "@/db/schema";
import type { Row, TypeAdmin, TypeOption } from "@/lib/types";

/** Businesses each agent must "talk to" per day. */
export const DAILY_TARGET = 15;
const UNASSIGNED_EMAIL = "unassigned@geneline-x.com";

const selection = {
  dbId: businesses.id,
  code: businesses.code,
  name: businesses.name,
  address: businesses.address,
  contactName: businesses.contactName,
  contact: businesses.contact,
  type: businesses.type,
  typeIcon: businessTypes.icon,
  stage: businesses.stage,
  objection: businesses.objection,
  lostReason: businesses.lostReason,
  nextAction: businesses.nextAction,
  followUpDate: businesses.followUpDate,
  monthlyFee: businesses.monthlyFee,
  onboarded: businesses.onboarded,
  agent: users.name,
  accOwner: onboardingAccounts.ownerName,
  accEmail: onboardingAccounts.email,
  accPhone: onboardingAccounts.personalPhone,
  accStatus: onboardingAccounts.accountStatus,
};

type RawRow = {
  dbId: number; code: string; name: string; address: string | null; contactName: string | null; contact: string;
  type: Row["type"]; typeIcon: string | null; stage: Row["stage"]; objection: string | null; lostReason: string | null;
  nextAction: string | null; followUpDate: string | null; monthlyFee: number | null; onboarded: boolean;
  agent: string; accOwner: string | null; accEmail: string | null; accPhone: string | null;
  accStatus: NonNullable<Row["account"]>["status"] | null;
};

function normalize(r: RawRow): Row {
  return {
    dbId: r.dbId,
    code: r.code,
    name: r.name,
    address: r.address,
    contactName: r.contactName,
    contact: r.contact,
    type: r.type,
    typeIcon: r.typeIcon,
    stage: r.stage,
    objection: r.objection,
    lostReason: r.lostReason,
    nextAction: r.nextAction,
    followUpDate: r.followUpDate,
    agent: r.agent,
    monthlyFee: r.monthlyFee,
    onboarded: r.onboarded,
    // Never expose the password hash to the client.
    account: r.accOwner
      ? { ownerName: r.accOwner, email: r.accEmail ?? "", personalPhone: r.accPhone, status: r.accStatus ?? "Pending" }
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
    .leftJoin(businessTypes, eq(businessTypes.name, businesses.type))
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
    .leftJoin(businessTypes, eq(businessTypes.name, businesses.type))
    .where(eq(businesses.agentId, agentId))
    .orderBy(desc(businesses.createdAt));
  return rows.map(normalize);
}

/* ---------------- Business types ---------------- */

/** Active types for the agent-facing pickers (name + default fee + icon). */
export async function getActiveBusinessTypes(): Promise<TypeOption[]> {
  return db
    .select({ name: businessTypes.name, monthlyFee: businessTypes.monthlyFee, icon: businessTypes.icon })
    .from(businessTypes)
    .where(eq(businessTypes.active, true))
    .orderBy(asc(businessTypes.sortOrder), asc(businessTypes.name));
}

/** All types with usage counts (admin management view). */
export async function getAllBusinessTypes(): Promise<TypeAdmin[]> {
  const usageExpr = sql<number>`count(${businesses.id})`;
  const rows = await db
    .select({
      id: businessTypes.id,
      name: businessTypes.name,
      monthlyFee: businessTypes.monthlyFee,
      icon: businessTypes.icon,
      active: businessTypes.active,
      usage: usageExpr,
    })
    .from(businessTypes)
    .leftJoin(businesses, eq(businesses.type, businessTypes.name))
    .groupBy(businessTypes.id)
    .orderBy(asc(businessTypes.sortOrder), asc(businessTypes.name));
  return rows.map((r) => ({ ...r, usage: Number(r.usage) }));
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

/* ---------------- Activity monitoring + daily quota ---------------- */

// A business "touched" today = created or updated today (distinct businesses).
// SLE runs on UTC, so `current_date` (UTC midnight) is the local day boundary.
const touchedTodayExpr = sql<number>`count(distinct ${auditLogs.businessId}) filter (
  where ${auditLogs.action} in ('create_business', 'update_business')
)`;
const createdTodayExpr = sql<number>`count(distinct ${auditLogs.businessId}) filter (
  where ${auditLogs.action} = 'create_business'
)`;

export type AgentProgress = {
  id: number;
  name: string;
  touchedToday: number; // distinct businesses talked to today
  createdToday: number; // of those, newly added today
  target: number;
  metTarget: boolean;
};

/** Per-agent progress against the daily quota (admin monitoring). */
export async function getAgentDailyProgress(): Promise<AgentProgress[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      touchedToday: touchedTodayExpr,
      createdToday: createdTodayExpr,
    })
    .from(users)
    .leftJoin(
      auditLogs,
      and(eq(auditLogs.userId, users.id), sql`${auditLogs.createdAt} >= current_date`)
    )
    .where(and(eq(users.role, "agent"), ne(users.email, UNASSIGNED_EMAIL)))
    .groupBy(users.id, users.name)
    .orderBy(users.name);

  return rows.map((r) => {
    const touchedToday = Number(r.touchedToday);
    return {
      id: r.id,
      name: r.name,
      touchedToday,
      createdToday: Number(r.createdToday),
      target: DAILY_TARGET,
      metTarget: touchedToday >= DAILY_TARGET,
    };
  });
}

/** A single agent's own progress today (for their dashboard). */
export async function getProgressForAgent(agentId: number) {
  const [row] = await db
    .select({ touchedToday: touchedTodayExpr, createdToday: createdTodayExpr })
    .from(auditLogs)
    .where(and(eq(auditLogs.userId, agentId), sql`${auditLogs.createdAt} >= current_date`));
  return {
    touchedToday: Number(row?.touchedToday ?? 0),
    createdToday: Number(row?.createdToday ?? 0),
    target: DAILY_TARGET,
  };
}

export type AuditEntry = {
  id: number;
  actorName: string;
  action: string;
  businessCode: string | null;
  businessName: string | null;
  details: string | null;
  createdAt: Date;
};

/** Recent activity feed (admin monitoring). */
export async function getRecentAudit(limit = 60): Promise<AuditEntry[]> {
  return db
    .select({
      id: auditLogs.id,
      actorName: auditLogs.actorName,
      action: auditLogs.action,
      businessCode: auditLogs.businessCode,
      businessName: auditLogs.businessName,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
