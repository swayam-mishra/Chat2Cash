import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";
import { getCorrelationId } from "../middlewares/logger";
import * as anthropicService from "./anthropicService";
import { storage } from "./storageService";
import type { ChatMessage } from "../schema";

// ==========================================
// REDIS CONNECTION
// ==========================================
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

connection.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

connection.on("connect", () => {
  logger.info("Redis connected for job queue");
});

// ==========================================
// QUEUE DEFINITIONS
// ==========================================
export const extractionQueue = new Queue("order-extraction", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 3600 * 24 }, // Keep completed jobs for 24h
    removeOnFail: false,                   // DLQ: Keep ALL failed jobs for manual review
  },
});

// Phase 3: Separate webhook queue — decoupled from extraction processing
export const webhookQueue = new Queue("webhook-delivery", {
  connection,
  defaultJobOptions: {
    attempts: 10,                                // Retry up to 10 times
    backoff: { type: "exponential", delay: 5000 }, // 5s, 10s, 20s, ... up to ~24h total
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 72 },             // Keep failed webhooks for 72h
  },
});

// ==========================================
// JOB TYPES
// ==========================================
export interface ExtractionJobData {
  type: "single_message" | "chat_log";
  orgId: string;              // Organization context for multi-tenancy
  correlationId?: string;     // Phase 5: trace request → queue → worker → DB
  message?: string;           // For single message extraction
  messages?: ChatMessage[];   // For chat extraction
  webhookUrl?: string;        // Optional callback URL
}

export interface ExtractionJobResult {
  orderId: string;
  status: "completed" | "failed";
  error?: string;
}

export interface WebhookJobData {
  webhookUrl: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

// ==========================================
// EXTRACTION WORKER (processes AI jobs from the queue)
// ==========================================
let worker: Worker | null = null;

export function startExtractionWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<ExtractionJobData, ExtractionJobResult>(
    "order-extraction",
    async (job: Job<ExtractionJobData, ExtractionJobResult>) => {
      const cid = job.data.correlationId ?? job.id;
      logger.info({ jobId: job.id, type: job.data.type, correlationId: cid }, "Processing extraction job");

      await job.updateProgress(10);

      let savedOrder;

      const { orgId } = job.data;
      if (!orgId) throw new Error("Invalid job data: missing orgId");

      if (job.data.type === "single_message" && job.data.message) {
        const order = await anthropicService.extractOrderFromMessage(job.data.message);
        await job.updateProgress(70);
        savedOrder = await storage.addOrder(orgId, order);
      } else if (job.data.type === "chat_log" && job.data.messages) {
        const order = await anthropicService.extractOrderFromChat(job.data.messages);
        await job.updateProgress(70);
        savedOrder = await storage.addChatOrder(orgId, order);
      } else {
        throw new Error("Invalid job data: missing message or messages");
      }

      await job.updateProgress(90);

      // Phase 3: Enqueue webhook delivery to a SEPARATE queue (decoupled)
      if (job.data.webhookUrl) {
        await webhookQueue.add("deliver", {
          webhookUrl: job.data.webhookUrl,
          correlationId: cid,
          payload: {
            jobId: job.id,
            status: "completed",
            orderId: savedOrder.id,
            order: savedOrder,
          },
        });
        logger.info({ jobId: job.id, correlationId: cid }, "Webhook delivery enqueued");
      }

      await job.updateProgress(100);

      return { orderId: savedOrder.id, status: "completed" };
    },
    {
      connection,
      concurrency: 3, // Process up to 3 extractions in parallel
      limiter: {
        max: 10,       // Max 10 jobs
        duration: 60000, // per minute (respects Anthropic rate limits)
      },
    }
  );

  worker.on("completed", (job, result) => {
    logger.info({ jobId: job.id, orderId: result.orderId }, "Extraction job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Extraction job failed");

    // Enqueue failure webhook (decoupled) so the worker doesn't block
    if (job?.data.webhookUrl) {
      webhookQueue.add("deliver", {
        webhookUrl: job.data.webhookUrl,
        correlationId: job.data.correlationId ?? job.id,
        payload: {
          jobId: job.id,
          status: "failed",
          error: err.message,
        },
      }).catch((enqueueErr) => {
        logger.error({ jobId: job.id, err: enqueueErr }, "Failed to enqueue failure webhook");
      });
    }
  });

  worker.on("error", (err) => {
    logger.error({ err }, "Extraction worker error");
  });

  logger.info("Extraction worker started (concurrency: 3, rate: 10/min)");
  return worker;
}

// ==========================================
// WEBHOOK WORKER (Phase 3: separated from extraction)
// ==========================================
let webhookWorker: Worker | null = null;

export function startWebhookWorker(): Worker {
  if (webhookWorker) return webhookWorker;

  webhookWorker = new Worker<WebhookJobData>(
    "webhook-delivery",
    async (job: Job<WebhookJobData>) => {
      const { webhookUrl, payload, correlationId } = job.data;
      logger.info({ jobId: job.id, webhookUrl, correlationId }, "Delivering webhook");

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": correlationId ?? "",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000), // 10s timeout per attempt
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
      }

      logger.info({ jobId: job.id, correlationId }, "Webhook delivered successfully");
    },
    {
      connection,
      concurrency: 5,
    }
  );

  webhookWorker.on("failed", (job, err) => {
    logger.warn(
      { jobId: job?.id, attempt: job?.attemptsMade, maxAttempts: 10, err: err.message },
      "Webhook delivery failed (will retry)"
    );
  });

  webhookWorker.on("error", (err) => {
    logger.error({ err }, "Webhook worker error");
  });

  logger.info("Webhook worker started (concurrency: 5, max retries: 10)");
  return webhookWorker;
}

// ==========================================
// QUEUE HELPERS
// ==========================================

export async function addExtractionJob(data: ExtractionJobData): Promise<string> {
  // Phase 5: Attach correlation ID from the current request context
  const correlationId = data.correlationId ?? getCorrelationId();

  const job = await extractionQueue.add("extract", { ...data, correlationId }, {
    // Higher priority for single messages (faster to process)
    priority: data.type === "single_message" ? 1 : 2,
  });

  logger.info({ jobId: job.id, type: data.type, correlationId }, "Extraction job enqueued");
  return job.id!;
}

export async function getJobStatus(jobId: string) {
  const job = await Job.fromId(extractionQueue, jobId);
  
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress;

  return {
    jobId: job.id,
    state,       // "waiting" | "active" | "completed" | "failed" | "delayed"
    progress,    // 0-100
    result: state === "completed" ? job.returnvalue : undefined,
    error: state === "failed" ? job.failedReason : undefined,
    createdAt: new Date(job.timestamp).toISOString(),
    processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
    completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    attempts: job.attemptsMade,
  };
}

export async function getQueueHealth() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    extractionQueue.getWaitingCount(),
    extractionQueue.getActiveCount(),
    extractionQueue.getCompletedCount(),
    extractionQueue.getFailedCount(),
    extractionQueue.getDelayedCount(),
  ]);

  // Include webhook queue stats
  const [whWaiting, whActive, whFailed] = await Promise.all([
    webhookQueue.getWaitingCount(),
    webhookQueue.getActiveCount(),
    webhookQueue.getFailedCount(),
  ]);

  return {
    extraction: { waiting, active, completed, failed, delayed },
    webhook: { waiting: whWaiting, active: whActive, failed: whFailed },
  };
}

// ==========================================
// DLQ MANAGEMENT (Phase 3)
// ==========================================

/** List failed extraction jobs (Dead Letter Queue) */
export async function getFailedJobs(start = 0, end = 20) {
  const jobs = await extractionQueue.getFailed(start, end);
  return jobs.map((job) => ({
    jobId: job.id,
    type: job.data.type,
    orgId: job.data.orgId,
    error: job.failedReason,
    attempts: job.attemptsMade,
    failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    correlationId: job.data.correlationId,
  }));
}

/** Retry a specific failed job from the DLQ */
export async function retryFailedJob(jobId: string): Promise<boolean> {
  const job = await Job.fromId(extractionQueue, jobId);
  if (!job) return false;

  const state = await job.getState();
  if (state !== "failed") return false;

  await job.retry();
  logger.info({ jobId }, "DLQ: Job retried");
  return true;
}

/** Retry ALL failed jobs in the DLQ */
export async function retryAllFailedJobs(): Promise<number> {
  const failed = await extractionQueue.getFailed(0, 1000);
  let retried = 0;
  for (const job of failed) {
    try {
      await job.retry();
      retried++;
    } catch {
      // Job may have been removed or already retried
    }
  }
  logger.info({ count: retried }, "DLQ: Bulk retry completed");
  return retried;
}

// Graceful shutdown
export async function shutdownQueue() {
  if (worker) {
    await worker.close();
    logger.info("Extraction worker shut down");
  }
  if (webhookWorker) {
    await webhookWorker.close();
    logger.info("Webhook worker shut down");
  }
  await extractionQueue.close();
  await webhookQueue.close();
  await connection.quit();
  logger.info("Queue and Redis connections closed");
}
