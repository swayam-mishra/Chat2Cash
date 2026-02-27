/**
 * E2E Test — BullMQ Extraction Worker
 *
 * Validates the full async extraction pipeline:
 *   Enqueue job → Worker picks it up → Anthropic SDK is mocked →
 *   Worker parses AI response → Structured data lands in PostgreSQL.
 *
 * Dependencies resolved automatically by the test infrastructure:
 *   • PostgreSQL (Testcontainers) — via tests/setup.ts globalSetup
 *   • Redis      (Testcontainers) — via tests/setup.ts globalSetup
 *   • Anthropic SDK — mocked with vi.mock (no real API calls)
 *
 * The `test-env.ts` setupFile injects DATABASE_URL and REDIS_URL
 * into process.env BEFORE any app module is imported.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Job, type Worker as WorkerType } from "bullmq";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "../../src/schema";
import { ordersTable, orderItemsTable, customersTable } from "../../src/schema";
import {
  seedTestOrg,
  clearAllTables,
  type TestDb,
  type SeededOrg,
} from "../fixtures/mockDbState";

// ── Mock Anthropic SDK ─────────────────────────────────────────
// vi.mock is auto-hoisted by Vitest to the top of the file,
// so it intercepts the SDK before any app code imports it.

const MOCK_AI_RESPONSE = {
  customer_name: "Rahul Sharma",
  items: [
    { product_name: "Basmati Rice", quantity: 5, price: 120 },
    { product_name: "Toor Dal", quantity: 2, price: 95 },
  ],
  delivery_address: "42 MG Road, Bangalore",
  delivery_date: null,               // free-text dates like "kal" aren't valid timestamps
  special_instructions: "Jaldi bhej do bhaiya",
  total: 790,
  confidence: "high",
};

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      constructor(_opts?: any) {}
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "tool_use",
              id: "mock_tool_call",
              name: "record_chat_order",
              input: MOCK_AI_RESPONSE,
            },
          ],
          usage: { input_tokens: 350, output_tokens: 120 },
        }),
      };
    },
  };
});

// ── Lazy imports (after mock registration) ─────────────────────
// These modules transitively import the Anthropic SDK, so they
// MUST be resolved after vi.mock has been registered.
type QueueServiceModule = typeof import("../../src/services/queueService");
let queueMod: QueueServiceModule;
let worker: WorkerType;

// ── Test-scoped resources ──────────────────────────────────────
let testDb: TestDb;
let pool: pg.Pool;
let seeded: SeededOrg;

beforeAll(async () => {
  // Dynamic imports trigger module evaluation with mocks in place
  queueMod = await import("../../src/services/queueService");

  // Start the BullMQ worker once for the entire suite.
  // The singleton inside queueService guarantees only one instance.
  worker = queueMod.startExtractionWorker();

  // Test DB connection (independent of the app's db singleton)
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  testDb = drizzle(pool, { schema });
});

afterAll(async () => {
  // Graceful shutdown: worker → queue → Redis → PG pool
  if (queueMod) await queueMod.shutdownQueue();
  if (pool) await pool.end();
});

// ================================================================
// Test suite
// ================================================================

describe("Extraction Worker E2E", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);
  });

  it("processes a chat_log job and inserts structured data into PostgreSQL", async () => {
    const mockMessages: schema.ChatMessage[] = [
      { sender: "Rahul Sharma", text: "Bhaiya 5 kilo basmati rice chahiye" },
      { sender: "Shop Owner", text: "Haan, aur kuch?" },
      { sender: "Rahul Sharma", text: "2 kg toor dal bhi bhej do, 42 MG Road Bangalore" },
      { sender: "Shop Owner", text: "Done, kal tak pahunch jayega" },
    ];

    // ── 1. Enqueue the job ───────────────────────────────────────
    const job = await queueMod.extractionQueue.add("extract", {
      type: "chat_log" as const,
      orgId: seeded.org.id,
      messages: mockMessages,
    });

    expect(job.id).toBeDefined();

    // ── 2. Wait for the worker to finish processing ──────────────
    const result = await waitForJobCompletion(worker, job.id!);

    expect(result).toBeDefined();
    expect(result.status).toBe("completed");
    expect(result.orderId).toBeDefined();

    // ── 3. Verify the order row in PostgreSQL ────────────────────
    const [dbOrder] = await testDb
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.id, result.orderId),
          eq(ordersTable.organizationId, seeded.org.id),
        ),
      );

    expect(dbOrder).toBeDefined();
    expect(dbOrder.extractionType).toBe("chat_log");
    expect(dbOrder.confidence).toBe("high");
    expect(dbOrder.status).toBe("pending");
    expect(dbOrder.totalAmount).toBe(790);
    expect(dbOrder.deliveryAddress).toBe("42 MG Road, Bangalore");
    expect(dbOrder.specialInstructions).toBe("Jaldi bhej do bhaiya");

    // Raw messages should be preserved for audit
    expect(dbOrder.rawMessages).toEqual(mockMessages);

    // ── 4. Verify normalized order items ─────────────────────────
    const items = await testDb
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, result.orderId));

    expect(items).toHaveLength(2);

    const rice = items.find((i) => i.productName === "Basmati Rice");
    const dal = items.find((i) => i.productName === "Toor Dal");

    expect(rice).toBeDefined();
    expect(rice!.quantity).toBe(5);
    expect(rice!.pricePerUnit).toBe(120);
    expect(rice!.totalPrice).toBe(600); // 5 × 120

    expect(dal).toBeDefined();
    expect(dal!.quantity).toBe(2);
    expect(dal!.pricePerUnit).toBe(95);
    expect(dal!.totalPrice).toBe(190); // 2 × 95

    // ── 5. Verify customer was created with tenant isolation ─────
    const [customer] = await testDb
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, dbOrder.customerId));

    expect(customer).toBeDefined();
    expect(customer.name).toBe("Rahul Sharma");
    expect(customer.organizationId).toBe(seeded.org.id);

    // ── 6. Verify BullMQ job completed ───────────────────────────
    const finishedJob = await Job.fromId(queueMod.extractionQueue, job.id!);
    expect(await finishedJob!.getState()).toBe("completed");
    expect(finishedJob!.returnvalue.orderId).toBe(result.orderId);
  });

  it("fails gracefully when orgId is missing from job data", async () => {
    // Enqueue a malformed job (empty orgId)
    const job = await queueMod.extractionQueue.add(
      "extract",
      {
        type: "chat_log",
        orgId: "",
        messages: [{ sender: "Test", text: "some message" }],
      },
      {
        // Override default retries so the test doesn't wait for 3 exponential backoffs
        attempts: 1,
      },
    );

    const failReason = await waitForJobFailure(worker, job.id!);
    expect(failReason).toContain("missing orgId");

    // The job should be marked as failed in Redis
    const failedJob = await Job.fromId(queueMod.extractionQueue, job.id!);
    expect(await failedJob!.getState()).toBe("failed");
  });

  it("fails gracefully when job data is invalid (no messages)", async () => {
    const job = await queueMod.extractionQueue.add(
      "extract",
      {
        type: "chat_log",
        orgId: seeded.org.id,
        // messages intentionally omitted
      } as any,
      { attempts: 1 },
    );

    const failReason = await waitForJobFailure(worker, job.id!);
    expect(failReason).toContain("missing message or messages");
  });
});

// ── Helpers ────────────────────────────────────────────────────

interface WorkerResult {
  orderId: string;
  status: string;
}

/**
 * Returns a promise that resolves when the specified job completes
 * on the worker, or rejects after a timeout.
 */
function waitForJobCompletion(
  w: WorkerType,
  jobId: string,
  timeoutMs: number = 15_000,
): Promise<WorkerResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        cleanup();
        reject(new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`));
      },
      timeoutMs,
    );

    const cleanup = () => {
      clearTimeout(timer);
      w.off("completed", onCompleted);
      w.off("failed", onFailed);
    };

    const onCompleted = (completedJob: Job, result: WorkerResult) => {
      if (completedJob.id === jobId) {
        cleanup();
        resolve(result);
      }
    };

    const onFailed = (failedJob: Job | undefined, err: Error) => {
      if (failedJob?.id === jobId) {
        cleanup();
        reject(new Error(`Job ${jobId} failed unexpectedly: ${err.message}`));
      }
    };

    w.on("completed", onCompleted);
    w.on("failed", onFailed);
  });
}

/**
 * Returns the failure reason when a job permanently fails, or
 * rejects on timeout / unexpected completion.
 */
function waitForJobFailure(
  w: WorkerType,
  jobId: string,
  timeoutMs: number = 15_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        cleanup();
        reject(new Error(`Job ${jobId} did not fail within ${timeoutMs}ms`));
      },
      timeoutMs,
    );

    const cleanup = () => {
      clearTimeout(timer);
      w.off("failed", onFailed);
      w.off("completed", onCompleted);
    };

    const onFailed = (failedJob: Job | undefined, err: Error) => {
      if (failedJob?.id === jobId) {
        cleanup();
        resolve(err.message);
      }
    };

    const onCompleted = (completedJob: Job) => {
      if (completedJob.id === jobId) {
        cleanup();
        reject(new Error(`Expected job ${jobId} to fail, but it completed`));
      }
    };

    w.on("failed", onFailed);
    w.on("completed", onCompleted);
  });
}
