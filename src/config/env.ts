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
  
  // AI Models (hot-swappable without redeploy)
  AI_MODEL_FAST: z.string().default("claude-3-haiku-20240307"),
  AI_MODEL_SMART: z.string().default("claude-3-5-sonnet-20241022"),
  AI_REQUEST_TIMEOUT_MS: z.string().default("60000"),
  
  // Business Defaults (fallback when no business_profile row exists)
  DEFAULT_GST_NUMBER: z.string().default("22AAAAA0000A1Z5"),
  DEFAULT_BUSINESS_NAME: z.string().default("Chat2Cash Store"),
  
  // Rate Limiting defaults (overridden per-tier from DB)
  RATE_LIMIT_FREE: z.string().default("20"),
  RATE_LIMIT_PRO: z.string().default("200"),
  RATE_LIMIT_ENTERPRISE: z.string().default("2000"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
  
  // Redis (for BullMQ async job queue)
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  
  // Neon Auth
  NEON_AUTH_URL: z.string().url("NEON_AUTH_URL is required"),
  NEON_JWKS_URL: z.string().url("NEON_JWKS_URL is required"),

  // Azure Blob Storage (invoice PDFs)
  AZURE_STORAGE_ACCOUNT_NAME: z.string().min(1, "AZURE_STORAGE_ACCOUNT_NAME is required"),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().min(1, "AZURE_STORAGE_ACCOUNT_KEY is required"),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default("invoices"),

  // Sentry (optional — Phase 5)
  SENTRY_DSN: z.string().url().optional(),

  // Database CA Certificate (optional — for production SSL)
  DATABASE_CA_CERT: z.string().optional(),
});

// Validate and export
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;