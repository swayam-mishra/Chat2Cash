/**
 * E2E Concurrency Tests
 *
 * Validates two critical production guarantees:
 *
 *  1. Postgres Deadlock Safety
 *     Fires CONCURRENCY_JOB_COUNT extraction jobs in parallel, all writing to
 *     the same organization's tables.  Every job must complete — any deadlock
 *     or serialization failure would surface here as a rejected promise or a
 *     missing row in the final COUNT query.
 *
 *  2. BullMQ Concurrency Limit Enforcement
 *     The extraction worker is configured with `concurrency: 3`.  A custom
 *     mock with an artificial delay lets us count how many `messages.create`
 *     calls are in-flight at the same time and assert the ceiling is never
 *     exceeded.
 *
 * Isolation strategy
 * ------------------
 * This file creates its own dedicated BullMQ Queue + Worker bound to a
 * *separate* queue name ("order-extraction-concurrency-test") so it never
 * competes with the extraction worker started in extractionWorker.test.ts.
 * Job completion is checked by polling Redis via Job.fromId() rather than
 * relying on event listeners, which makes the assertions resilient to any
 * future test-parallelism changes.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, count } from "drizzle-orm";

import * as schema from "../../src/schema";
import { ordersTable } from "../../src/schema";
import * as anthropicService from "../../src/services/anthropicService";
import { storage } from "../../src/services/storageService";
import {
  seedTestOrg,
  clearAllTables,
  type TestDb,
  type SeededOrg,
} from "../fixtures/mockDbState";

// ---------------------------------------------------------------------------
// Anthropic SDK mock
//
// vi.hoisted() ensures mockCreate is defined before vi.mock() is evaluated,
// so tests can reconfigure the mock on a per-call basis.
// ---------------------------------------------------------------------------

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

const MOCK_ORDER_RESPONSE = {
  customer_name: "Concurrent Customer",
  items: [{ product_name: "Basmati Rice", quantity: 1, price: 100 }],
  delivery_address: "1 Test Lane, Bengaluru",
  delivery_date: null,
  special_instructions: null,
  total: 100,
  confidence: "high" as const,
};

const buildAiResponse = (input = MOCK_ORDER_RESPONSE) => ({
  content: [
    {
      type: "tool_use",
      id: "mock_tool_call",
      name: "record_chat_order",
      input,
    },
  ],
  usage: { input_tokens: 80, output_tokens: 40 },
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    constructor(_opts?: any) {}
    messages = { create: mockCreate };
  },
}));

// ---------------------------------------------------------------------------
// Dedicated isolated queue + worker
//
// Using a unique queue name prevents this worker from stealing jobs that
// belong to the worker started in extractionWorker.test.ts.
// ---------------------------------------------------------------------------

const ISOLATION_QUEUE = "order-extraction-concurrency-test";
const WORKER_CONCURRENCY = 3;

let connection: IORedis;
let testQueue: Queue;
let testWorker: Worker;
let webhookDeliveryQueue: Queue; // used by processor to mirror production behaviour
let testDb: TestDb;
let pool: pg.Pool;
let seeded: SeededOrg;

/** Lightweight processor that mirrors the production worker's core logic. */
async function extractionProcessor(
  job: Job<{ orgId: string; messages: schema.ChatMessage[]; webhookUrl?: string }>,
) {
  const order = await anthropicService.extractOrderFromChat(job.data.messages);
  const saved = await storage.addChatOrder(job.data.orgId, order);

  // Mirror the production webhook-enqueue path so the webhook test is accurate
  if (job.data.webhookUrl) {
    await webhookDeliveryQueue.add("deliver", {
      webhookUrl: job.data.webhookUrl,
      payload: { jobId: job.id, status: "completed", orderId: saved.id },
    });
  }

  return { orderId: saved.id, status: "completed" };
}

beforeAll(async () => {
  // Own Redis connection — BullMQ requires maxRetriesPerRequest: null
  connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
  });

  testQueue = new Queue(ISOLATION_QUEUE, { connection });
  webhookDeliveryQueue = new Queue("webhook-delivery", { connection });

  // Drain any stale jobs left from a previous run to guarantee a clean slate
  await testQueue.drain();
  await testQueue.obliterate({ force: true });

  testWorker = new Worker(ISOLATION_QUEUE, extractionProcessor, {
    connection,
    concurrency: WORKER_CONCURRENCY,
  });

  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  testDb = drizzle(pool, { schema });
});

afterAll(async () => {
  await testWorker.close();
  await testQueue.close();
  await webhookDeliveryQueue.close();
  await connection.quit();
  await pool.end();
});

beforeEach(async () => {
  await clearAllTables(testDb);
  seeded = await seedTestOrg(testDb);

  mockCreate.mockReset();
  mockCreate.mockResolvedValue(buildAiResponse());
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Poll Redis until the job reaches a terminal state or the timeout elapses.
 *
 * Using polling (rather than worker event listeners) means this helper works
 * correctly even when multiple test files run concurrently and more than one
 * BullMQ Worker instance is attached to the same Redis queue.
 */
async function pollUntilDone(
  queue: Queue,
  jobId: string,
  timeoutMs = 30_000,
): Promise<{ orderId: string; status: string }> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const job = await Job.fromId(queue, jobId);
    if (!job) throw new Error(`Job ${jobId} not found in queue`);

    const state = await job.getState();

    if (state === "completed") return job.returnvalue as { orderId: string; status: string };
    if (state === "failed") throw new Error(`Job ${jobId} failed: ${job.failedReason}`);

    await sleep(150);
  }

  throw new Error(`Job ${jobId} did not reach a terminal state within ${timeoutMs}ms`);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

const CONCURRENCY_JOB_COUNT = 10; // well above the concurrency ceiling of 3

describe("BullMQ Concurrency — no Postgres deadlocks", () => {
  it(`all ${CONCURRENCY_JOB_COUNT} concurrent jobs complete and produce DB rows`, async () => {
    const jobs = await Promise.all(
      Array.from({ length: CONCURRENCY_JOB_COUNT }, (_, i) =>
        testQueue.add(
          "extract",
          {
            orgId: seeded.org.id,
            messages: [
              { sender: "Customer", text: `Order ${i + 1}: 1 kg basmati rice` },
            ],
          },
          { attempts: 1 },
        ),
      ),
    );

    // Wait for ALL jobs to reach a terminal state
    const results = await Promise.allSettled(
      jobs.map((j) => pollUntilDone(testQueue, j.id!)),
    );

    // --- No failures (deadlock or otherwise) ---
    const failures = results.filter((r) => r.status === "rejected");
    expect(
      failures,
      `${failures.length} job(s) failed:\n${failures
        .map((f) => (f as PromiseRejectedResult).reason)
        .join("\n")}`,
    ).toHaveLength(0);

    // --- Every completed result has the expected shape ---
    for (const r of results) {
      if (r.status === "fulfilled") {
        expect(r.value.status).toBe("completed");
        expect(r.value.orderId).toBeTypeOf("string");
      }
    }

    // --- All N orders must exist in Postgres (catches silent write failures) ---
    const [{ count: rowCount }] = await testDb
      .select({ count: count() })
      .from(ordersTable)
      .where(eq(ordersTable.organizationId, seeded.org.id));

    expect(Number(rowCount)).toBe(CONCURRENCY_JOB_COUNT);
  }, 60_000);
});

describe(`BullMQ Concurrency — worker concurrency limit (max ${WORKER_CONCURRENCY})`, () => {
  it(`never exceeds ${WORKER_CONCURRENCY} simultaneous Anthropic calls`, async () => {
    let activeAiCalls = 0;
    let peakActiveAiCalls = 0;

    // Override the default mock: add a 60 ms hold so multiple jobs overlap in
    // the async gap, making the peak measurement stable.
    mockCreate.mockImplementation(async () => {
      activeAiCalls += 1;
      if (activeAiCalls > peakActiveAiCalls) {
        peakActiveAiCalls = activeAiCalls;
      }

      await sleep(60); // hold the slot open long enough for overlap

      activeAiCalls -= 1;
      return buildAiResponse();
    });

    const jobs = await Promise.all(
      Array.from({ length: CONCURRENCY_JOB_COUNT }, (_, i) =>
        testQueue.add(
          "extract",
          {
            orgId: seeded.org.id,
            messages: [{ sender: "Customer", text: `Bulk order ${i + 1}` }],
          },
          { attempts: 1 },
        ),
      ),
    );

    await Promise.all(jobs.map((j) => pollUntilDone(testQueue, j.id!)));

    // All calls must eventually be made
    expect(mockCreate).toHaveBeenCalledTimes(CONCURRENCY_JOB_COUNT);

    // Peak parallelism must not exceed the worker's concurrency setting
    expect(peakActiveAiCalls).toBeLessThanOrEqual(WORKER_CONCURRENCY);

    // Confirm some parallelism actually happened (sanity-check the test itself)
    expect(peakActiveAiCalls).toBeGreaterThan(1);
  }, 60_000);
});

describe("BullMQ Concurrency — webhook enqueue under load", () => {
  it("jobs with a webhookUrl enqueue a delivery job for each completed extraction", async () => {
    // Use an unreachable URL — we only care that the webhook job is enqueued,
    // not that it's actually delivered.
    const FAKE_WEBHOOK = "https://example.invalid/webhook";

    // Drain any leftover webhook jobs so the count is predictable
    await webhookDeliveryQueue.drain();

    const WEBHOOK_JOB_COUNT = 5;
    const jobs = await Promise.all(
      Array.from({ length: WEBHOOK_JOB_COUNT }, (_, i) =>
        testQueue.add(
          "extract",
          {
            orgId: seeded.org.id,
            messages: [{ sender: "Customer", text: `Webhook order ${i + 1}` }],
            webhookUrl: FAKE_WEBHOOK,
          },
          { attempts: 1 },
        ),
      ),
    );

    await Promise.all(jobs.map((j) => pollUntilDone(testQueue, j.id!)));

    // Give the processor a moment to finish enqueuing delivery jobs
    await sleep(500);

    const [waiting, delayed, active] = await Promise.all([
      webhookDeliveryQueue.getWaitingCount(),
      webhookDeliveryQueue.getDelayedCount(),
      webhookDeliveryQueue.getActiveCount(),
    ]);

    const totalWebhookJobs = waiting + delayed + active;
    expect(totalWebhookJobs).toBe(WEBHOOK_JOB_COUNT);

    // Clean up enqueued webhook jobs to avoid polluting other tests
    await webhookDeliveryQueue.drain();
  }, 60_000);
});
