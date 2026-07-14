import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { businesses, onboardingAccounts, users } from "./schema.ts";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { users, businesses, onboardingAccounts } });

const DEMO_PASSWORD = "demo1234";

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Users: one admin + the four field agents from the prototype ---
  const seededUsers = await db
    .insert(users)
    .values([
      { name: "Diallo", email: "diallo@geneline-x.com", passwordHash: hash, role: "admin" },
      { name: "Fiona", email: "fiona@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Beccy", email: "beccy@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Musu Saffa", email: "musu@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Rashida", email: "rashida@geneline-x.com", passwordHash: hash, role: "agent" },
    ])
    .returning();

  const byName = Object.fromEntries(seededUsers.map((u) => [u.name, u.id]));

  // --- Businesses (prospect records) from the prototype seed ---
  const rows = [
    { name: "Chibex Hair", address: "22 Wilkinson Rd, Freetown", contact: "077883025", type: "Salon", stage: "Won", objection: "Price high earlier", lostReason: null, nextAction: "Onboarding Monday", followUpDate: null, agent: "Fiona", monthlyFee: 300, onboarded: true },
    { name: "Beccy Salon", address: "Lumley Beach Rd, Freetown", contact: "077688399", type: "Salon", stage: "Won", objection: "Price high", lostReason: null, nextAction: "Onboarding Wednesday", followUpDate: null, agent: "Beccy", monthlyFee: 300, onboarded: false },
    { name: "Rugcess Beauty Bar", address: "8 Circular Rd, Freetown", contact: "078932350", type: "Salon", stage: "Interested", objection: "Talking to husband tomorrow", lostReason: null, nextAction: "Reach out tomorrow", followUpDate: "2026-07-14", agent: "Fiona", monthlyFee: null, onboarded: false },
    { name: "MU Beauty", address: "Kissy St, Freetown", contact: "075521886", type: "Salon", stage: "Interested", objection: "Discuss as a whole", lostReason: null, nextAction: "Reach this week", followUpDate: "2026-07-10", agent: "Musu Saffa", monthlyFee: null, onboarded: false },
    { name: "Koslain Restaurant", address: "Aberdeen, Freetown", contact: "076360200", type: "Restaurant", stage: "Absent", objection: "Manager absent", lostReason: null, nextAction: "Reach out tomorrow", followUpDate: "2026-07-16", agent: "Rashida", monthlyFee: null, onboarded: false },
    { name: "House of Beauty", address: "Congo Cross, Freetown", contact: "076611021", type: "Salon", stage: "Lost", objection: "Maybe another time", lostReason: "Not interested right now", nextAction: null, followUpDate: null, agent: "Musu Saffa", monthlyFee: null, onboarded: false },
    { name: "MIRAG Beauty", address: "Hill Station, Freetown", contact: "077224981", type: "Salon", stage: "Interested", objection: "Will talk to husband today", lostReason: null, nextAction: "Reach this week", followUpDate: "2026-07-13", agent: "Fiona", monthlyFee: null, onboarded: false },
  ] as const;

  const insertedBiz = await db
    .insert(businesses)
    .values(
      rows.map((r) => ({
        name: r.name,
        address: r.address,
        contact: r.contact,
        type: r.type,
        stage: r.stage,
        objection: r.objection,
        lostReason: r.lostReason,
        nextAction: r.nextAction,
        followUpDate: r.followUpDate,
        agentId: byName[r.agent],
        monthlyFee: r.monthlyFee,
        onboarded: r.onboarded,
      }))
    )
    .returning();

  // --- Onboarding account for the one already-onboarded business (Chibex) ---
  const chibex = insertedBiz.find((b) => b.name === "Chibex Hair");
  if (chibex) {
    await db.insert(onboardingAccounts).values({
      businessId: chibex.id,
      ownerName: "Chibex",
      email: "chibex@mail.com",
      personalPhone: "077883025",
      passwordHash: hash,
      // Chibex is a live, paying customer — seed as Active so MRR is non-zero.
      accountStatus: "Active",
      activatedAt: new Date(),
    });
  }

  console.log(`Seeded ${seededUsers.length} users and ${insertedBiz.length} businesses.`);
  console.log(`Business codes: ${insertedBiz.map((b) => b.code).join(", ")}`);
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
