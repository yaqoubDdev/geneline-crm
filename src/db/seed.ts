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
    { name: "Chibex Hair", address: "22 Wilkinson Rd, Freetown", contact: "077883025", type: "Salon", stage: "Won", objection: "Price high earlier", lostReason: null, nextAction: "Onboarding Monday", agent: "Fiona", price: 300, onboarded: true },
    { name: "Beccy Salon", address: "Lumley Beach Rd, Freetown", contact: "077688399", type: "Salon", stage: "Won", objection: "Price high", lostReason: null, nextAction: "Onboarding Wednesday", agent: "Beccy", price: 300, onboarded: false },
    { name: "Rugcess Beauty Bar", address: "8 Circular Rd, Freetown", contact: "078932350", type: "Salon", stage: "Interested", objection: "Talking to husband tomorrow", lostReason: null, nextAction: "Reach out tomorrow", agent: "Fiona", price: null, onboarded: false },
    { name: "MU Beauty", address: "Kissy St, Freetown", contact: "075521886", type: "Salon", stage: "Interested", objection: "Discuss as a whole", lostReason: null, nextAction: "Reach this week", agent: "Musu Saffa", price: null, onboarded: false },
    { name: "Koslain Restaurant", address: "Aberdeen, Freetown", contact: "076360200", type: "Restaurant", stage: "Absent", objection: "Manager absent", lostReason: null, nextAction: "Reach out tomorrow", agent: "Rashida", price: null, onboarded: false },
    { name: "House of Beauty", address: "Congo Cross, Freetown", contact: "076611021", type: "Salon", stage: "Lost", objection: "Maybe another time", lostReason: "Not interested right now", nextAction: null, agent: "Musu Saffa", price: null, onboarded: false },
    { name: "MIRAG Beauty", address: "Hill Station, Freetown", contact: "077224981", type: "Salon", stage: "Interested", objection: "Will talk to husband today", lostReason: null, nextAction: "Reach this week", agent: "Fiona", price: null, onboarded: false },
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
        agentId: byName[r.agent],
        price: r.price,
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
