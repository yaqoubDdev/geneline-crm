import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js keeps secrets in .env.local; load that (falling back to .env).
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
