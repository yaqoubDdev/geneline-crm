import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { businesses, users } from "./schema.ts";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { users, businesses } });

const DEMO_PASSWORD = "demo1234";

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Users: admin + demo agents + an "Unassigned" bucket agent that owns the
  //     imported field records until real agents exist and reassignment is built. ---
  const seededUsers = await db
    .insert(users)
    .values([
      { name: "Diallo", email: "diallo@geneline-x.com", passwordHash: hash, role: "admin" },
      { name: "Fiona", email: "fiona@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Beccy", email: "beccy@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Musu Saffa", email: "musu@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Rashida", email: "rashida@geneline-x.com", passwordHash: hash, role: "agent" },
      { name: "Unassigned", email: "unassigned@geneline-x.com", passwordHash: hash, role: "agent" },
    ])
    .returning();

  const byName = Object.fromEntries(seededUsers.map((u) => [u.name, u.id]));
  const IMPORT_AGENT = byName["Unassigned"];

  // --- Real field data. Owner -> contactName; source "Stage" mapped to our enum:
  //     Interested/Tempted/Really Interested -> Interested; Absent manager/not around -> Absent;
  //     Reluctant -> Reluctant; deal closed -> Won; reluctant + "Closed" -> Lost.
  //     Type is a best guess (source has none): Salon default, Koslain -> Restaurant. ---
  const rows = [
    { name: "J3 HairLine", contactName: null, contact: "078778433", type: "Salon", stage: "Reluctant", objection: "Has somebody doing it", lostReason: null, nextAction: "Reaching later this week" },
    { name: "House of Beauty", contactName: null, contact: "076611021", type: "Salon", stage: "Lost", objection: "Maybe another time", lostReason: "Maybe another time", nextAction: "Closed" },
    { name: "Unnamed (074544554)", contactName: "Fiona", contact: "074544554", type: "Salon", stage: "Interested", objection: "Sounds new", lostReason: null, nextAction: "Reach out later this week" },
    { name: "Memetocute", contactName: null, contact: "078984666", type: "Salon", stage: "Absent", objection: null, lostReason: null, nextAction: "Reach out" },
    { name: "House of Deeja", contactName: "Deeja", contact: "030404305", type: "Salon", stage: "Absent", objection: "Manager not around", lostReason: null, nextAction: "Reach when manager is around" },
    { name: "Chibex Hair", contactName: null, contact: "077883025", type: "Salon", stage: "Won", objection: "Price high earlier", lostReason: null, nextAction: "Deal closed at a lower price (500 to 300); onboarding on Monday", monthlyFee: 300 },
    { name: "Beccy Salon", contactName: "Beccy", contact: "077688399", type: "Salon", stage: "Won", objection: "Price high", lostReason: null, nextAction: "Deal closed; onboarding on Wednesday" },
    { name: "Dolley Beauty", contactName: "Mary", contact: "088847842", type: "Salon", stage: "Interested", objection: null, lostReason: null, nextAction: "Reach out on Friday" },
    { name: "Rush Hour Studio", contactName: null, contact: "078989290", type: "Salon", stage: "Absent", objection: "Manager absent", lostReason: null, nextAction: "Reach out when around" },
    { name: "House of Splendor", contactName: null, contact: "076344333", type: "Salon", stage: "Absent", objection: "Absent manager", lostReason: null, nextAction: "Reach out when around" },
    { name: "Rugcess Beauty Bar & Essentials", contactName: "Rugcess", contact: "078932350", type: "Salon", stage: "Interested", objection: "Talking to husband tomorrow, she'll get back to me", lostReason: null, nextAction: "Reach out tomorrow" },
    { name: "Koslain Restaurant", contactName: "Rashida Ibrahim", contact: "076360200", type: "Restaurant", stage: "Absent", objection: "Manager absent", lostReason: null, nextAction: "Reach out tomorrow" },
    { name: "MU Beauty", contactName: "Musu Saffa", contact: "075521886", type: "Salon", stage: "Interested", objection: "Discuss as a whole and get back to us", lostReason: null, nextAction: "Will reach out this week" },
    { name: "Unnamed (088091176)", contactName: "Aminata", contact: "088091176", type: "Salon", stage: "Interested", objection: "Newly opened, waiting for them to settle", lostReason: null, nextAction: "Will reach out after settled" },
    { name: "MIGO", contactName: null, contact: "033392664", type: "Salon", stage: "Interested", objection: "Owner not available; need to reach out to owner instead to move forward", lostReason: null, nextAction: "Reach out to owner (branches at both East and West end)" },
    { name: "Uni Fashion Boutique", contactName: "David & Mustapha", contact: "076929910", type: "Salon", stage: "Interested", objection: "Will discuss with partner and agree", lostReason: null, nextAction: "Will reach out this week" },
    { name: "The Classic Real Beauty Salon", contactName: "Theresa", contact: "075721072", type: "Salon", stage: "Interested", objection: "Price should be around 250, they just opened", lostReason: null, nextAction: "Will reach out after asking for help" },
    { name: "MIRAG Beauty", contactName: "Yema", contact: "077224981", type: "Salon", stage: "Interested", objection: "Will talk to husband first today", lostReason: null, nextAction: "Will reach out this week" },
    { name: "Saitas's Beauty Glam", contactName: "Christiana", contact: "031473063", type: "Salon", stage: "Absent", objection: "Owner absent", lostReason: null, nextAction: "Should check tomorrow" },
    { name: "ANBIN", contactName: "Binta", contact: "033227218", type: "Salon", stage: "Interested", objection: "Will text me today and see what can happen", lostReason: null, nextAction: "Reach out tomorrow" },
  ] as const;

  const insertedBiz = await db
    .insert(businesses)
    .values(
      rows.map((r) => ({
        name: r.name,
        contactName: r.contactName,
        contact: r.contact,
        type: r.type,
        stage: r.stage,
        objection: r.objection,
        lostReason: r.lostReason,
        nextAction: r.nextAction,
        agentId: IMPORT_AGENT,
        monthlyFee: "monthlyFee" in r ? r.monthlyFee : null,
        onboarded: false,
      }))
    )
    .returning();

  console.log(`Seeded ${seededUsers.length} users and ${insertedBiz.length} businesses (owner: Unassigned).`);
  console.log(`First / last codes: ${insertedBiz[0].code} … ${insertedBiz[insertedBiz.length - 1].code}`);
  console.log(`Password for every login account: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
