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

// ---------------------------------------------------------------------------
// Anthropic SDK mock
//
// vi.hoisted() lifts the mockCreate ref ABOVE vi.mock() hoisting so the same
// function reference is visible both inside the factory and in test bodies.
// This lets individual tests configure responses with mockResolvedValueOnce /
// mockRejectedValueOnce without touching the module boundary.
// ---------------------------------------------------------------------------

const { mockCreate } = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockCreate: vi.fn<any, any>(),
}));

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

/** Canonical happy-path Anthropic response reused across tests. */
const buildAiResponse = (input = MOCK_AI_RESPONSE) => ({
  content: [
    {
      type: "tool_use",
      id: "mock_tool_call",
      name: "record_chat_order",
      input,
    },
  ],
  usage: { input_tokens: 350, output_tokens: 120 },
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    constructor(_opts?: any) {}
    messages = { create: mockCreate };
  },
}));

// Lazy imports — must resolve after vi.mock registration
type QueueServiceModule = typeof import("../../src/services/queueService");
let queueMod: QueueServiceModule;
let worker: WorkerType;

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

describe("Extraction Worker E2E", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);

    // Reset call history and install the default happy-path response so each
    // test starts from a known state. Tests that need a custom response can
    // call mockCreate.mockResolvedValueOnce(...) or mockRejectedValueOnce(...).
    mockCreate.mockReset();
    mockCreate.mockResolvedValue(buildAiResponse());
  });

  it("processes a chat_log job and inserts structured data into PostgreSQL", async () => {
    const mockMessages: schema.ChatMessage[] = [
      { sender: "Rahul Sharma", text: "Bhaiya 5 kilo basmati rice chahiye" },
      { sender: "Shop Owner", text: "Haan, aur kuch?" },
      { sender: "Rahul Sharma", text: "2 kg toor dal bhi bhej do, 42 MG Road Bangalore" },
      { sender: "Shop Owner", text: "Done, kal tak pahunch jayega" },
    ];

    const job = await queueMod.extractionQueue.add("extract", {
      type: "chat_log" as const,
      orgId: seeded.org.id,
      messages: mockMessages,
    });

    expect(job.id).toBeDefined();

    const result = await waitForJobCompletion(worker, job.id!);

    expect(result).toBeDefined();
    expect(result.status).toBe("completed");
    expect(result.orderId).toBeDefined();

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
    expect(dbOrder.totalAmount).toBe("790.00");
    expect(dbOrder.deliveryAddress).toBe("42 MG Road, Bangalore");
    expect(dbOrder.specialInstructions).toBe("Jaldi bhej do bhaiya");

    // Raw messages should be preserved for audit
    expect(dbOrder.rawMessages).toEqual(mockMessages);

    const items = await testDb
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, result.orderId));

    expect(items).toHaveLength(2);

    const rice = items.find((i) => i.productName === "Basmati Rice");
    const dal = items.find((i) => i.productName === "Toor Dal");

    expect(rice).toBeDefined();
    expect(rice!.quantity).toBe("5.000");
    expect(rice!.pricePerUnit).toBe("120.00");
    expect(rice!.totalPrice).toBe("600.00"); // 5 × 120

    expect(dal).toBeDefined();
    expect(dal!.quantity).toBe("2.000");
    expect(dal!.pricePerUnit).toBe("95.00");
    expect(dal!.totalPrice).toBe("190.00"); // 2 × 95

    const [customer] = await testDb
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, dbOrder.customerId));

    expect(customer).toBeDefined();
    expect(customer.name).toBe("Rahul Sharma");
    expect(customer.organizationId).toBe(seeded.org.id);

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

  // ---------------------------------------------------------------------------
  // single_message path
  // ---------------------------------------------------------------------------

  it("processes a single_message job and persists the order", async () => {
    const SINGLE_MSG_RESPONSE = {
      customerName: "Priya Patel",
      items: [{ name: "Sunflower Oil", quantity: 3, pricePerUnit: 150 }],
      notes: "15 Park Street, Mumbai",
      totalAmount: 450,
      confidence: 0.8,
    };

    mockCreate.mockResolvedValueOnce(buildAiResponse(SINGLE_MSG_RESPONSE));

    const job = await queueMod.extractionQueue.add("extract", {
      type: "single_message" as const,
      orgId: seeded.org.id,
      message: "3 bottles sunflower oil chahiye, 15 Park Street Mumbai",
    });

    const result = await waitForJobCompletion(worker, job.id!);

    expect(result.status).toBe("completed");
    expect(result.orderId).toBeDefined();

    const [dbOrder] = await testDb
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.orderId));

    expect(dbOrder.extractionType).toBe("single_message");
    expect(dbOrder.confidence).toBe("0.8");
    expect(dbOrder.totalAmount).toBe("450.00");

    const items = await testDb
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, result.orderId));

    expect(items).toHaveLength(1);
    expect(items[0].productName).toBe("Sunflower Oil");
    expect(items[0].quantity).toBe("3.000");
    expect(items[0].pricePerUnit).toBe("150.00");
  });

  // ---------------------------------------------------------------------------
  // Retry on transient Anthropic error
  // ---------------------------------------------------------------------------

  it("retries the job once on a transient Anthropic error then succeeds", async () => {
    // First call → transient 503; second call → success.
    mockCreate
      .mockRejectedValueOnce(new Error("Service temporarily unavailable"))
      .mockResolvedValueOnce(buildAiResponse());

    const messages: schema.ChatMessage[] = [
      { sender: "Customer", text: "1 kg salt please" },
    ];

    // Allow 2 attempts so the retry path is exercised.
    const job = await queueMod.extractionQueue.add(
      "extract",
      { type: "chat_log" as const, orgId: seeded.org.id, messages },
      { attempts: 2 },
    );

    const result = await waitForJobCompletion(worker, job.id!, 30_000);

    expect(result.status).toBe("completed");
    // The mock must have been called exactly twice (fail + succeed)
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // Observability: mock call count reflects number of enqueued jobs
  // ---------------------------------------------------------------------------

  it("calls the Anthropic SDK exactly once per job", async () => {
    const messages: schema.ChatMessage[] = [
      { sender: "Customer", text: "2 dozen eggs please" },
    ];

    const job = await queueMod.extractionQueue.add("extract", {
      type: "chat_log" as const,
      orgId: seeded.org.id,
      messages,
    });

    await waitForJobCompletion(worker, job.id!);

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

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
