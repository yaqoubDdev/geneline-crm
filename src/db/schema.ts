import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/* ---------- Enums ---------- */
export const roleEnum = pgEnum("role", ["agent", "admin"]);
export const businessTypeEnum = pgEnum("business_type", [
  "Salon",
  "Restaurant",
  "Corporate",
]);
export const stageEnum = pgEnum("stage", [
  "New",
  "Interested",
  "Reluctant",
  "Absent",
  "Won",
  "Lost",
]);

/* ---------- Business ID sequence: drives the GX-0001 code ---------- */
export const gxSeq = pgSequence("gx_seq", { startWith: 1, increment: 1 });

/* ---------- Users (agents + admin) ---------- */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------- Business (prospect record) ---------- */
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  // Auto-generated GX-0001 code — the key that links prospecting -> onboarding.
  code: text("code")
    .notNull()
    .unique()
    .default(sql`'GX-' || lpad(nextval('gx_seq')::text, 4, '0')`),
  name: text("name").notNull(),
  address: text("address"),
  contact: text("contact").notNull(),
  type: businessTypeEnum("type").notNull().default("Salon"),
  stage: stageEnum("stage").notNull().default("New"),
  objection: text("objection"),
  lostReason: text("lost_reason"),
  nextAction: text("next_action"),
  agentId: integer("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  price: integer("price"), // Agreed price in Le, set at close
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------- Onboarding account (linked 1:1 to a business) ---------- */
export const onboardingAccounts = pgTable("onboarding_accounts", {
  businessId: integer("business_id")
    .primaryKey()
    .references(() => businesses.id, { onDelete: "cascade" }),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull(),
  personalPhone: text("personal_phone"),
  passwordHash: text("password_hash").notNull(),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type OnboardingAccount = typeof onboardingAccounts.$inferSelect;
