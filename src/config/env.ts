import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),

  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  AI_MODEL_FAST: z.string().default("claude-3-haiku-20240307"),
  AI_MODEL_SMART: z.string().default("claude-3-5-sonnet-20241022"),
  AI_REQUEST_TIMEOUT_MS: z.string().default("60000"),

  /** Fallback when no business_profile row exists */
  DEFAULT_GST_NUMBER: z.string().default("22AAAAA0000A1Z5"),
  DEFAULT_BUSINESS_NAME: z.string().default("Chat2Cash Store"),

  /** Per-tier rate limits (overridable without redeploy) */
  RATE_LIMIT_FREE: z.string().default("20"),
  RATE_LIMIT_PRO: z.string().default("200"),
  RATE_LIMIT_ENTERPRISE: z.string().default("2000"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"),

  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  NEON_AUTH_URL: z.string().url("NEON_AUTH_URL is required"),
  NEON_JWKS_URL: z.string().url("NEON_JWKS_URL is required"),

  AZURE_STORAGE_ACCOUNT_NAME: z.string().min(1, "AZURE_STORAGE_ACCOUNT_NAME is required"),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().min(1, "AZURE_STORAGE_ACCOUNT_KEY is required"),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default("invoices"),

  SENTRY_DSN: z.string().url().optional(),
  DATABASE_CA_CERT: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;