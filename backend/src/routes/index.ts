import { Router } from "express";
import * as orderController from "../controllers/orderController";
import * as invoiceController from "../controllers/invoiceController";
import { extractLimiter, generalLimiter } from "../middlewares/rateLimiter";
import { sanitizeInputs } from "../middlewares/sanitizer";
import { redactPII } from "../middlewares/piiRedactor";
import { idempotency } from "../middlewares/idempotency";
import { db } from "../config/db";
import { sql } from "drizzle-orm";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";
import { getQueueHealth, getJobStatus, getFailedJobs, retryFailedJob, retryAllFailedJobs } from "../services/queueService";
import { authHandler, requireOrg } from "../middlewares/authHandler";

const router = Router();

router.get("/health", async (_req, res) => {
  const healthStatus: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      anthropic: "unknown",
      queue: "unknown"
    }
  };

  // 1. Database
  try {
    await db.execute(sql`SELECT 1`);
    healthStatus.services.database = "connected";
  } catch (err) {
    healthStatus.status = "error";
    healthStatus.services.database = "disconnected";
    logger.error({ err }, "Health Check: Database connection failed");
  }

  // 2. Anthropic API
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "HEAD",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY },
        signal: controller.signal
    });
    clearTimeout(timeout);
    
    healthStatus.latency_ms = Date.now() - startTime;
    if (anthropicRes.status === 401) {
      healthStatus.services.anthropic = "api_key_invalid";
    } else {
      // Any response (including 405) means the API is reachable
      healthStatus.services.anthropic = "reachable";
    }
  } catch (err) {
    healthStatus.services.anthropic = "unreachable";
    logger.warn("Health Check: Anthropic API unreachable or timed out");
  }

  const statusCode = healthStatus.status === "ok" ? 200 : 503;
  
  // 3. Queue
  try {
    const queueStats = await getQueueHealth();
    healthStatus.services.queue = "connected";
    healthStatus.queue = queueStats;
  } catch (err) {
    healthStatus.services.queue = "disconnected";
    logger.warn("Health Check: Redis/Queue unreachable");
  }

  res.status(statusCode).json(healthStatus);
});

// Auth: inject req.user and req.orgId
router.use(authHandler);

// Read operations
router.get("/stats", generalLimiter, requireOrg, orderController.getStats);
router.get("/orders", generalLimiter, requireOrg, redactPII, orderController.getOrders);
router.get("/orders/:id", generalLimiter, requireOrg, redactPII, orderController.getOrderById);

// Invoice download
router.get("/orders/:id/download", generalLimiter, requireOrg, invoiceController.downloadInvoice);

// Write operations — idempotency is opt-in via Idempotency-Key header
router.post("/extract", extractLimiter, requireOrg, idempotency, sanitizeInputs, orderController.extractOrder);
router.post("/extract-order", extractLimiter, requireOrg, idempotency, sanitizeInputs, orderController.extractChatOrder);
router.post("/generate-invoice", extractLimiter, requireOrg, idempotency, sanitizeInputs, invoiceController.generateInvoice);

// Async extraction (returns 202 with job ID)
router.post("/async/extract", extractLimiter, requireOrg, idempotency, sanitizeInputs, orderController.asyncExtractOrder);
router.post("/async/extract-order", extractLimiter, requireOrg, idempotency, sanitizeInputs, orderController.asyncExtractChatOrder);

// Job status & queue health
router.get("/jobs/:id", generalLimiter, orderController.getJobStatusById);

/**
 * SSE endpoint for real-time job status.
 *
 * The client connects once and receives `status` events pushed by the server
 * as BullMQ progresses the job — no short-polling round trips needed.
 * The connection is closed by the server when the job reaches a terminal state
 * ("completed" or "failed"), or by the client at any time.
 *
 * Event types pushed:
 *   event: status  — JobStatus JSON payload
 *   event: error_event — { message } when the jobId is not found
 */
router.get("/jobs/:id/stream", generalLimiter, async (req, res) => {
  const id = req.params.id as string;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx proxy buffering
  res.flushHeaders();

  const TERMINAL_STATES = new Set(["completed", "failed"]);
  const POLL_INTERVAL_MS = 1_000;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const send = (eventName: string, data: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const tick = async () => {
    try {
      const status = await getJobStatus(id);

      if (!status) {
        send("error_event", { message: `Job ${id} not found` });
        res.end();
        return;
      }

      send("status", status);

      if (TERMINAL_STATES.has(status.state)) {
        res.end();
        return;
      }

      // Job is still running — schedule next poll
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    } catch (err) {
      send("error_event", { message: "Internal error polling job status" });
      res.end();
    }
  };

  // Start polling loop
  await tick();

  // Clean up the timer when the client disconnects early
  req.on("close", () => {
    if (timer) clearTimeout(timer);
    if (!res.writableEnded) res.end();
  });
});
router.get("/queue/health", generalLimiter, orderController.getQueueStats);

// Updates
router.patch("/orders/:id/edit", extractLimiter, requireOrg, sanitizeInputs, orderController.editOrder);
router.patch("/orders/:id", extractLimiter, requireOrg, sanitizeInputs, orderController.updateOrderStatus);
router.delete("/orders/:id", extractLimiter, requireOrg, orderController.deleteOrder);

// DLQ / Admin routes
router.get("/admin/dlq", generalLimiter, requireOrg, async (_req, res) => {
  const start = Number(_req.query.start) || 0;
  const end = Number(_req.query.end) || 20;
  const jobs = await getFailedJobs(start, end);
  res.json({ count: jobs.length, jobs });
});

router.post("/admin/dlq/:jobId/retry", extractLimiter, requireOrg, async (req, res) => {
  const success = await retryFailedJob(req.params.jobId as string);
  if (!success) {
    return res.status(404).json({ message: "Job not found or not in failed state" });
  }
  res.json({ message: "Job retried successfully", jobId: req.params.jobId });
});

router.post("/admin/dlq/retry-all", extractLimiter, requireOrg, async (_req, res) => {
  const count = await retryAllFailedJobs();
  res.json({ message: `${count} jobs retried`, count });
});

export default router;