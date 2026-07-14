CREATE TYPE "public"."account_status" AS ENUM('Pending', 'Active', 'Paused', 'Churned');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('Salon', 'Restaurant', 'Corporate');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('agent', 'admin');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('New', 'Interested', 'Reluctant', 'Absent', 'Won', 'Lost');--> statement-breakpoint
CREATE SEQUENCE "public"."gx_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text DEFAULT 'GX-' || lpad(nextval('gx_seq')::text, 4, '0') NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"contact" text NOT NULL,
	"type" "business_type" DEFAULT 'Salon' NOT NULL,
	"stage" "stage" DEFAULT 'New' NOT NULL,
	"objection" text,
	"lost_reason" text,
	"next_action" text,
	"follow_up_date" date,
	"agent_id" integer NOT NULL,
	"monthly_fee" integer,
	"onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "onboarding_accounts" (
	"business_id" integer PRIMARY KEY NOT NULL,
	"owner_name" text NOT NULL,
	"email" text NOT NULL,
	"personal_phone" text,
	"password_hash" text NOT NULL,
	"onboarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_status" "account_status" DEFAULT 'Pending' NOT NULL,
	"activated_at" timestamp with time zone,
	"churned_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'agent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_accounts" ADD CONSTRAINT "onboarding_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;