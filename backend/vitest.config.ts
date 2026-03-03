import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 120_000,
    reporters: ["verbose"],

    projects: [
      {
        // Unit tests — no containers needed
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          globalSetup: [],
          setupFiles: ["./tests/test-env.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
          reporters: ["verbose"],
        },
      },
      {
        // Integration + E2E — requires PostgreSQL & Redis containers
        //
        // singleThread: true  → test files run serially in a single thread,
        //   preventing two BullMQ workers from competing for the same Redis
        //   queue and accidentally stealing each other's test jobs.
        // isolate: true (default) → each file still gets fresh module state
        //   so singleton connections (IORedis, PG pool) are re-created cleanly.
        test: {
          name: "integration",
          environment: "node",
          include: [
            "tests/integration/**/*.test.ts",
            "tests/e2e/**/*.test.ts",
          ],
          globalSetup: ["./tests/setup.ts"],
          setupFiles: ["./tests/test-env.ts"],
          testTimeout: 30_000,
          hookTimeout: 120_000,
          reporters: ["verbose"],
          poolOptions: {
            threads: {
              singleThread: true, // serial execution for shared-infrastructure tests
            },
          },
        },
      },
    ],
  },
});
