import { Router } from "express";
import * as orderController from "../controllers/orderController";
import * as invoiceController from "../controllers/invoiceController";
import { extractLimiter, generalLimiter } from "../middlewares/rateLimiter";
import { sanitizeInputs } from "../middlewares/sanitizer";
import { redactPII } from "../middlewares/piiRedactor";
import { db } from "../config/db";
import { sql } from "drizzle-orm";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";
import { getQueueHealth } from "../services/queueService";

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

  // 1. Check Database
  try {
    await db.execute(sql`SELECT 1`);
    healthStatus.services.database = "connected";
  } catch (err) {
    healthStatus.status = "error";
    healthStatus.services.database = "disconnected";
    logger.error({ err }, "Health Check: Database connection failed");
  }

  // 2. Check Anthropic Latency (Lightweight check)
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "HEAD", // Head request to check if endpoint is reachable
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
  
  // 3. Check Queue Health
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

// Read Operations: General Rate Limit + PII Redaction
router.get("/stats", generalLimiter, orderController.getStats);
router.get("/orders", generalLimiter, redactPII, orderController.getOrders);
router.get("/orders/:id", generalLimiter, redactPII, orderController.getOrderById);

// Write Operations: Strict Rate Limit + Input Sanitization
router.post("/extract", extractLimiter, sanitizeInputs, orderController.extractOrder);
router.post("/extract-order", extractLimiter, sanitizeInputs, orderController.extractChatOrder);
router.post("/generate-invoice", extractLimiter, sanitizeInputs, invoiceController.generateInvoice);

// Async Extraction (BullMQ Background Jobs) — returns 202 with job ID
router.post("/async/extract", extractLimiter, sanitizeInputs, orderController.asyncExtractOrder);
router.post("/async/extract-order", extractLimiter, sanitizeInputs, orderController.asyncExtractChatOrder);

// Job Status & Queue Health
router.get("/jobs/:id", generalLimiter, orderController.getJobStatusById);
router.get("/queue/health", generalLimiter, orderController.getQueueStats);

// Updates: Strict Rate Limit + Input Sanitization
router.patch("/orders/:id/edit", extractLimiter, sanitizeInputs, orderController.editOrder);
router.patch("/orders/:id", extractLimiter, sanitizeInputs, orderController.updateOrderStatus);
router.delete("/orders/:id", extractLimiter, orderController.deleteOrder);

export default router;