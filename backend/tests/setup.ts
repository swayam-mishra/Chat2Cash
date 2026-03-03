/**
 * Vitest Global Setup
 *
 * Starts ephemeral PostgreSQL + Redis containers (Testcontainers),
 * applies the Drizzle schema, and writes dynamic connection URIs
 * to a temp file for test workers to consume.
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

const PROJECT_ROOT = resolve(__dirname, "..");
const STATE_PATH = resolve(__dirname, ".testcontainers-state.json");

export interface ContainerState {
  databaseUrl: string;
  redisUrl: string;
}

const PG_IMAGE = "postgres:16-alpine";
const REDIS_IMAGE = "redis:7-alpine";

export default async function setup(): Promise<() => Promise<void>> {
  console.log("\n🐳  Starting test containers...\n");

  let pgContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedTestContainer;

  try {
    pgContainer = await new PostgreSqlContainer(PG_IMAGE)
      .withDatabase("chat2cash_test")
      .withUsername("test")
      .withPassword("test")
      .start();

    const databaseUrl = pgContainer.getConnectionUri();
    console.log(`  ✅  PostgreSQL : ${databaseUrl}`);


    redisContainer = await new GenericContainer(REDIS_IMAGE)
      .withExposedPorts(6379)
      .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    const redisUrl = `redis://${redisHost}:${redisPort}`;
    console.log(`  ✅  Redis      : ${redisUrl}`);

    // Apply Drizzle schema
    console.log("  ⏳  Applying Drizzle schema (drizzle-kit push)...");

    try {
      execSync("npx drizzle-kit push", {
        cwd: PROJECT_ROOT,
        env: { ...process.env, DATABASE_URL: databaseUrl },
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

    // Persist container URIs for test workers
    const state: ContainerState = { databaseUrl, redisUrl };
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("\n  ❌  Container startup failed:\n", err);
    // Re-throw so Vitest aborts the run with a clear error
    throw err;
  }

  // Teardown
  return async () => {
    console.log("\n🐳  Stopping test containers...");

    const results = await Promise.allSettled([
      pgContainer.stop(),
      redisContainer.stop(),
    ]);

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
