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
  
  // Storage (Placeholder for future S3 config)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
});

// Validate and export
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;