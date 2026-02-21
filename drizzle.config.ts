import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// .env is now in the same root folder
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});