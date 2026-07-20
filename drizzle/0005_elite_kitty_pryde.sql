CREATE TABLE "business_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"monthly_fee" integer DEFAULT 500 NOT NULL,
	"icon" text DEFAULT 'Building2' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "type" SET DATA TYPE text USING "type"::text;--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "type" SET DEFAULT 'Salon';--> statement-breakpoint
DROP TYPE "public"."business_type";--> statement-breakpoint
INSERT INTO "business_types" ("name", "monthly_fee", "icon", "sort_order") VALUES
	('Salon', 500, 'Scissors', 1),
	('Barbershop', 500, 'Scissors', 2),
	('Restaurant', 500, 'Utensils', 3),
	('Bar / Lounge', 500, 'Wine', 4),
	('Shop / Retail', 500, 'ShoppingBag', 5),
	('Boutique / Fashion', 500, 'Shirt', 6),
	('Supermarket', 1000, 'ShoppingCart', 7),
	('Pharmacy', 500, 'Cross', 8),
	('Clinic / Health', 1000, 'Stethoscope', 9),
	('Hotel / Guesthouse', 1000, 'Hotel', 10),
	('School', 1000, 'GraduationCap', 11),
	('Hardware', 500, 'Hammer', 12),
	('Electronics', 500, 'Smartphone', 13),
	('Auto / Mechanic', 500, 'Wrench', 14),
	('Real Estate', 1000, 'Home', 15),
	('Corporate', 1500, 'Briefcase', 16),
	('NGO', 1000, 'HandHeart', 17),
	('Other', 500, 'Building2', 18)
ON CONFLICT ("name") DO NOTHING;
