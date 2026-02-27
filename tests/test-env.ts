/**
 * Vitest setupFile — runs inside every worker process BEFORE any test file
 * (and therefore before any app module like `src/config/env.ts`) is imported.
 *
 * Responsibilities:
 *   1. Load static test env vars from `.env.test`
 *   2. Overlay dynamic container URIs written by globalSetup → `setup.ts`
 *
 * Why this ordering matters:
 *   - `src/config/env.ts` calls `dotenv.config()` at import time, which
 *     reads `.env`. However, dotenv does NOT override existing process.env
 *     values. Because this setupFile has already populated process.env,
 *     any '.env' file (if present) won't overwrite the test values.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { ContainerState } from "./setup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATE_PATH = resolve(__dirname, ".testcontainers-state.json");

// ── 1. Load .env.test as the base layer ────────────────────────
// `override: true` ensures .env.test values take precedence over
// any env vars that might leak in from the host / CI environment.
dotenv.config({
  path: resolve(__dirname, "../.env.test"),
  override: true,
});

// ── 2. Overlay dynamic container URIs from globalSetup ─────────
// The state file only exists when globalSetup ran (integration/e2e).
// For unit tests, the placeholders from .env.test are sufficient.
if (existsSync(STATE_PATH)) {
  const state: ContainerState = JSON.parse(
    readFileSync(STATE_PATH, "utf-8")
  );

  // These override the placeholder values from .env.test
  process.env.DATABASE_URL = state.databaseUrl;
  process.env.REDIS_URL = state.redisUrl;
}
