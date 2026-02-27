/**
 * Vitest Global Setup
 *
 * Lifecycle:
 *   1. Start ephemeral PostgreSQL + Redis containers (Testcontainers)
 *   2. Apply Drizzle schema to the fresh PostgreSQL instance (`drizzle-kit push`)
 *   3. Write the dynamic connection URIs to a temp JSON file
 *   4. Vitest workers load the URIs via `test-env.ts` (setupFiles)
 *   5. After ALL test suites finish → stop containers + delete temp file
 */

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// ── Paths ──────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const STATE_PATH = resolve(__dirname, ".testcontainers-state.json");

// ── Shared type (imported as type-only by test-env.ts) ─────────
export interface ContainerState {
  databaseUrl: string;
  redisUrl: string;
}

// ── Container image versions (pin for reproducible CI builds) ──
const PG_IMAGE = "postgres:16-alpine";
const REDIS_IMAGE = "redis:7-alpine";

export default async function setup(): Promise<() => Promise<void>> {
  console.log("\n🐳  Starting test containers...\n");

  let pgContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedTestContainer;

  try {
    // ── 1. PostgreSQL ────────────────────────────────────────────
    pgContainer = await new PostgreSqlContainer(PG_IMAGE)
      .withDatabase("chat2cash_test")
      .withUsername("test")
      .withPassword("test")
      .start();

    const databaseUrl = pgContainer.getConnectionUri();
    console.log(`  ✅  PostgreSQL : ${databaseUrl}`);

    // ── 2. Redis ─────────────────────────────────────────────────
    redisContainer = await new GenericContainer(REDIS_IMAGE)
      .withExposedPorts(6379)
      .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    const redisUrl = `redis://${redisHost}:${redisPort}`;
    console.log(`  ✅  Redis      : ${redisUrl}`);

    // ── 3. Apply Drizzle schema ──────────────────────────────────
    // Uses `drizzle-kit push` which reads drizzle.config.ts at the
    // project root. We override DATABASE_URL via the env of the
    // child process; dotenv.config() inside drizzle.config.ts will
    // NOT override an existing process.env value.
    console.log("  ⏳  Applying Drizzle schema (drizzle-kit push)...");

    try {
      execSync("npx drizzle-kit push", {
        cwd: PROJECT_ROOT,
        env: { ...process.env, DATABASE_URL: databaseUrl },
        // Auto-accept any interactive prompts (e.g. new table creation)
        input: "y\n",
        stdio: ["pipe", "pipe", "pipe"],
      });
      console.log("  ✅  Schema applied\n");
    } catch (pushErr: unknown) {
      const stdout = (pushErr as { stdout?: Buffer }).stdout?.toString() ?? "";
      const stderr = (pushErr as { stderr?: Buffer }).stderr?.toString() ?? "";
      throw new Error(
        `drizzle-kit push failed.\n\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`
      );
    }

    // ── 4. Persist container URIs for test workers ───────────────
    const state: ContainerState = { databaseUrl, redisUrl };
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("\n  ❌  Container startup failed:\n", err);
    // Re-throw so Vitest aborts the run with a clear error
    throw err;
  }

  // ── 5. Teardown (runs after ALL test suites complete) ──────────
  return async () => {
    console.log("\n🐳  Stopping test containers...");

    const results = await Promise.allSettled([
      pgContainer.stop(),
      redisContainer.stop(),
    ]);

    // Log any errors during container shutdown (non-fatal)
    for (const r of results) {
      if (r.status === "rejected") {
        console.warn("  ⚠️  Container stop warning:", r.reason);
      }
    }

    // Clean up temp state file
    if (existsSync(STATE_PATH)) {
      unlinkSync(STATE_PATH);
    }

    console.log("  ✅  Containers stopped\n");
  };
}
