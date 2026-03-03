import { Queue, Worker, Job, UnrecoverableError } from "bullmq";
import IORedis from "ioredis";
import * as Sentry from "@sentry/node";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";
import { getCorrelationId } from "../middlewares/logger";
import * as anthropicService from "./anthropicService";
import { storage } from "./storageService";
import type { ChatMessage } from "../schema";

/**
 * BullMQ requires its own dedicated IORedis connection with
 * maxRetriesPerRequest: null — it must NOT share the instance in
 * src/config/redis.ts which uses maxRetriesPerRequest: 3.
 */
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
  logger.error({ err }, "BullMQ Redis connection error");
});

connection.on("connect", () => {
  logger.info("BullMQ Redis connected for job queue");
});

// --- Queue definitions ---
export const extractionQueue = new Queue("order-extraction", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: false,
  },
});

export const webhookQueue = new Queue("webhook-delivery", {
  connection,
  defaultJobOptions: {
    attempts: 10,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 72 },
  },
});

// --- Job types ---
export interface ExtractionJobData {
  type: "single_message" | "chat_log";
  orgId: string;
  correlationId?: string;
  message?: string;
  messages?: ChatMessage[];
  webhookUrl?: string;
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

// --- Extraction worker ---
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

      // Enqueue webhook delivery to a separate queue
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
    const isFinalAttempt = job !== undefined &&
      job.attemptsMade >= (job.opts.attempts ?? 1);

    if (isFinalAttempt) {
      // Alert on hard-fail (all retries exhausted) so the team sees it immediately
      logger.error({ jobId: job?.id, err }, "Extraction job hard-failed (DLQ)");
      if (env.SENTRY_DSN) {
        Sentry.captureException(err, {
          tags: { queue: "order-extraction", jobId: job?.id ?? "unknown" },
          extra: {
            orgId: job?.data.orgId,
            type: job?.data.type,
            correlationId: job?.data.correlationId,
            attemptsMade: job?.attemptsMade,
          },
        });
      }
    } else {
      logger.warn({ jobId: job?.id, attempt: job?.attemptsMade, err }, "Extraction job failed (will retry)");
    }

    // Enqueue failure webhook so the worker doesn't block
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

// --- Webhook worker ---
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
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const status = response.status;

        // 4xx errors (except 408 Request Timeout and 429 Too Many Requests) are
        // permanent client-side failures — retrying will never succeed, so drop
        // the job immediately to avoid wasting up to 10 retry attempts.
        const isRetryable =
          status === 408 ||   // Request Timeout
          status === 429 ||   // Too Many Requests
          status >= 500;      // Server Error (transient)

        if (!isRetryable) {
          throw new UnrecoverableError(
            `Webhook permanently failed with ${status} ${response.statusText} — dropping job (non-retryable client error)`
          );
        }

        throw new Error(`Webhook returned ${status}: ${response.statusText}`);
      }

      logger.info({ jobId: job.id, correlationId }, "Webhook delivered successfully");
    },
    {
      connection,
      concurrency: 5,
    }
  );

  webhookWorker.on("failed", (job, err) => {
    const isFinalAttempt = job !== undefined &&
      job.attemptsMade >= (job.opts.attempts ?? 1);
    const isUnrecoverable = err instanceof UnrecoverableError;

    if (isFinalAttempt || isUnrecoverable) {
      logger.error(
        { jobId: job?.id, webhookUrl: job?.data.webhookUrl, err: err.message },
        `Webhook delivery hard-failed${isUnrecoverable ? " (unrecoverable)" : " (retries exhausted)"}`
      );
      if (env.SENTRY_DSN) {
        Sentry.captureException(err, {
          tags: {
            queue: "webhook-delivery",
            jobId: job?.id ?? "unknown",
            unrecoverable: String(isUnrecoverable),
          },
          extra: {
            webhookUrl: job?.data.webhookUrl,
            correlationId: job?.data.correlationId,
            attemptsMade: job?.attemptsMade,
          },
        });
      }
    } else {
      logger.warn(
        { jobId: job?.id, attempt: job?.attemptsMade, maxAttempts: 10, err: err.message },
        "Webhook delivery failed (will retry)"
      );
    }
  });

  webhookWorker.on("error", (err) => {
    logger.error({ err }, "Webhook worker error");
  });

  logger.info("Webhook worker started (concurrency: 5, max retries: 10)");
  return webhookWorker;
}

// --- Queue helpers ---

export async function addExtractionJob(data: ExtractionJobData): Promise<string> {
  const correlationId = data.correlationId ?? getCorrelationId();

  const job = await extractionQueue.add("extract", { ...data, correlationId }, {
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
    state,
    progress,
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

// --- DLQ management ---

/** Lists failed extraction jobs (Dead Letter Queue). */
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

/** Retries a specific failed job from the DLQ. */
export async function retryFailedJob(jobId: string): Promise<boolean> {
  const job = await Job.fromId(extractionQueue, jobId);
  if (!job) return false;

  const state = await job.getState();
  if (state !== "failed") return false;

  await job.retry();
  logger.info({ jobId }, "DLQ: Job retried");
  return true;
}

/** Retries ALL failed jobs in the DLQ. */
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
