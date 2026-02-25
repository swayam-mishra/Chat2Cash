import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Core
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  
  // AI Service
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  
  // Business Defaults
  DEFAULT_GST_NUMBER: z.string().default("22AAAAA0000A1Z5"),
  DEFAULT_BUSINESS_NAME: z.string().default("Chat2Cash Store"),
  
  // Redis (for BullMQ async job queue)
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  
  // Supabase (Auth)
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),

  // Azure Blob Storage (invoice PDFs)
  AZURE_STORAGE_ACCOUNT_NAME: z.string().min(1, "AZURE_STORAGE_ACCOUNT_NAME is required"),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().min(1, "AZURE_STORAGE_ACCOUNT_KEY is required"),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default("invoices"),
});

// Validate and export
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;