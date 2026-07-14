import { sql } from "drizzle-orm";
import {
  boolean,
  date,
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
export const accountStatusEnum = pgEnum("account_status", [
  "Pending",
  "Active",
  "Paused",
  "Churned",
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
  followUpDate: date("follow_up_date"), // When to next act — powers due/overdue
  agentId: integer("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  monthlyFee: integer("monthly_fee"), // Agreed recurring fee in Le/month, set when Won
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
  // Customer lifecycle after onboarding. Starts Pending until the admin confirms live.
  accountStatus: accountStatusEnum("account_status").notNull().default("Pending"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  churnedAt: timestamp("churned_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type OnboardingAccount = typeof onboardingAccounts.$inferSelect;
