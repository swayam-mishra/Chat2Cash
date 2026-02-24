import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";
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
// QUEUE DEFINITION
// ==========================================
export const extractionQueue = new Queue("order-extraction", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 3600 * 24 }, // Keep completed jobs for 24h
    removeOnFail: { age: 3600 * 72 },     // Keep failed jobs for 72h
  },
});

// ==========================================
// JOB TYPES
// ==========================================
export interface ExtractionJobData {
  type: "single_message" | "chat_log";
  message?: string;          // For single message extraction
  messages?: ChatMessage[];   // For chat extraction
  webhookUrl?: string;        // Optional callback URL
}

export interface ExtractionJobResult {
  orderId: string;
  status: "completed" | "failed";
  error?: string;
}

// ==========================================
// WORKER (processes jobs from the queue)
// ==========================================
let worker: Worker | null = null;

export function startExtractionWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<ExtractionJobData, ExtractionJobResult>(
    "order-extraction",
    async (job: Job<ExtractionJobData, ExtractionJobResult>) => {
      logger.info({ jobId: job.id, type: job.data.type }, "Processing extraction job");

      await job.updateProgress(10);

      let savedOrder;

      if (job.data.type === "single_message" && job.data.message) {
        const order = await anthropicService.extractOrderFromMessage(job.data.message);
        await job.updateProgress(70);
        savedOrder = await storage.addOrder(order);
      } else if (job.data.type === "chat_log" && job.data.messages) {
        const order = await anthropicService.extractOrderFromChat(job.data.messages);
        await job.updateProgress(70);
        savedOrder = await storage.addChatOrder(order);
      } else {
        throw new Error("Invalid job data: missing message or messages");
      }

      await job.updateProgress(90);

      // Fire webhook if provided
      if (job.data.webhookUrl) {
        try {
          await fetch(job.data.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId: job.id,
              status: "completed",
              orderId: savedOrder.id,
              order: savedOrder,
            }),
          });
          logger.info({ jobId: job.id, webhook: job.data.webhookUrl }, "Webhook delivered");
        } catch (webhookErr) {
          // Webhook failure shouldn't fail the job
          logger.warn({ jobId: job.id, err: webhookErr }, "Webhook delivery failed");
        }
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

    // Fire webhook on failure too
    if (job?.data.webhookUrl) {
      fetch(job.data.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          status: "failed",
          error: err.message,
        }),
      }).catch(() => {}); // Swallow errors
    }
  });

  worker.on("error", (err) => {
    logger.error({ err }, "Extraction worker error");
  });

  logger.info("Extraction worker started (concurrency: 3, rate: 10/min)");
  return worker;
}

// ==========================================
// QUEUE HELPERS
// ==========================================

export async function addExtractionJob(data: ExtractionJobData): Promise<string> {
  const job = await extractionQueue.add("extract", data, {
    // Higher priority for single messages (faster to process)
    priority: data.type === "single_message" ? 1 : 2,
  });

  logger.info({ jobId: job.id, type: data.type }, "Extraction job enqueued");
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

  return { waiting, active, completed, failed, delayed };
}

// Graceful shutdown
export async function shutdownQueue() {
  if (worker) {
    await worker.close();
    logger.info("Extraction worker shut down");
  }
  await extractionQueue.close();
  await connection.quit();
  logger.info("Queue and Redis connections closed");
}
