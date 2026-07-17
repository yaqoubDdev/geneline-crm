import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { businesses, users } from "./schema.ts";

/**
 * One-off maintenance for the LIVE database. Unlike seed.ts this does NOT touch
 * businesses — it only resets the agent roster:
 *   1. Deletes the demo agents (Fiona, Beccy, Musu Saffa, Rashida).
 *   2. Keeps the "Unassigned" bucket so the 20 imported businesses keep an owner
 *      and no FK breaks.
 *   3. Upserts a secure admin (admin@geneline-x.com) + 4 fresh agents, each with a
 *      strong random password printed once at the end.
 *
 * Run: node --env-file=.env.local src/db/reset-agents.ts
 */

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { users, businesses } });

// Readable-but-strong: 12 url-safe chars, no ambiguous +/=.
function strongPassword() {
  return randomBytes(9).toString("base64url");
}

const DEMO_AGENT_EMAILS = [
  "fiona@geneline-x.com",
  "beccy@geneline-x.com",
  "musu@geneline-x.com",
  "rashida@geneline-x.com",
];

// Accounts to (re)create. Passwords generated at run time.
const NEW_ACCOUNTS = [
  { name: "Admin", email: "admin@geneline-x.com", role: "admin" as const },
  { name: "Agent 1", email: "agent1@geneline-x.com", role: "agent" as const },
  { name: "Agent 2", email: "agent2@geneline-x.com", role: "agent" as const },
  { name: "Agent 3", email: "agent3@geneline-x.com", role: "agent" as const },
  { name: "Agent 4", email: "agent4@geneline-x.com", role: "agent" as const },
];

async function main() {
  // 1. Guard: refuse to delete a demo agent that still owns businesses.
  const demoAgents = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.email, DEMO_AGENT_EMAILS));

  for (const a of demoAgents) {
    const owned = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.agentId, a.id))
      .limit(1);
    if (owned.length) {
      throw new Error(
        `Refusing to delete ${a.name} (${a.email}) — still owns businesses. Reassign first.`
      );
    }
  }

  if (demoAgents.length) {
    await db.delete(users).where(inArray(users.email, DEMO_AGENT_EMAILS));
    console.log(`Removed ${demoAgents.length} demo agents: ${demoAgents.map((a) => a.name).join(", ")}`);
  } else {
    console.log("No demo agents found to remove.");
  }

  // 2. Upsert admin + 4 agents with fresh strong passwords.
  const credentials: { name: string; email: string; role: string; password: string }[] = [];
  for (const acc of NEW_ACCOUNTS) {
    const password = strongPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await db
      .insert(users)
      .values({ name: acc.name, email: acc.email, passwordHash, role: acc.role })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: acc.name, passwordHash, role: acc.role },
      });
    credentials.push({ ...acc, password });
  }

  console.log("\n=== NEW LOGIN CREDENTIALS (share securely, then have them changed) ===");
  for (const c of credentials) {
    console.log(`${c.role.toUpperCase().padEnd(5)}  ${c.email.padEnd(26)}  ${c.password}`);
  }
  console.log("======================================================================\n");

  const remaining = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .orderBy(users.role, users.name);
  console.log("Current roster:");
  for (const u of remaining) console.log(`  [${u.role}] ${u.name} <${u.email}>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
