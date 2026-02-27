import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Backend tests run in a Node environment, not jsdom
    environment: "node",

    // ── Timeouts ────────────────────────────────────────────────
    // Generous to account for Docker image pulls and container startup.
    testTimeout: 30_000,
    hookTimeout: 120_000,

    reporters: ["verbose"],

    // ── Projects ────────────────────────────────────────────────
    // Separate unit tests (no containers) from integration/e2e (containers).
    projects: [
      {
        // Unit tests: pure logic, NO Docker / DB / Redis required
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          globalSetup: [],              // Skip container startup
          setupFiles: ["./tests/test-env.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
          reporters: ["verbose"],
        },
      },
      {
        // Integration + E2E: need PostgreSQL & Redis containers
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
        },
      },
    ],
  },
});
