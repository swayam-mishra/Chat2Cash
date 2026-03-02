/**
 * Vitest setupFile — runs inside every worker process BEFORE any test file.
 * Loads static test env vars from `.env.test` and overlays dynamic container URIs.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { ContainerState } from "./setup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATE_PATH = resolve(__dirname, ".testcontainers-state.json");


dotenv.config({
  path: resolve(__dirname, "../.env.test"),
  override: true,
});

// Overlay dynamic container URIs (only exists for integration/e2e runs)
if (existsSync(STATE_PATH)) {
  const state: ContainerState = JSON.parse(
    readFileSync(STATE_PATH, "utf-8")
  );

  // Override placeholder values from .env.test
  process.env.DATABASE_URL = state.databaseUrl;
  process.env.REDIS_URL = state.redisUrl;
}
