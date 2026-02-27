import pino from "pino";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AsyncLocalStorage } from "async_hooks";

// ── Correlation ID Store (Phase 5) ─────────────────────────────
// AsyncLocalStorage propagates the correlation ID through the entire
// request lifecycle without passing it as a function argument.
export const requestContext = new AsyncLocalStorage<{ correlationId: string }>();

/** Get the current correlation ID (returns "no-context" outside a request) */
export function getCorrelationId(): string {
  return requestContext.getStore()?.correlationId ?? "no-context";
}

// Define keys that contain PII for masking
const SENSITIVE_KEYS = ["customerName", "customerPhone", "customer_name", "customer_phone", "phone", "deliveryAddress", "delivery_address", "gst_number"];

// Configure Pino Logger
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  // In development, use pino-pretty for human-readable output
  transport: env.NODE_ENV !== "production" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  // Redact PII automatically in JSON output
  redact: {
    paths: SENSITIVE_KEYS.flatMap(key => [`req.body.${key}`, `res.body.${key}`, `*.${key}`]),
    censor: "***REDACTED***",
  },
  // Inject correlation ID into every log entry automatically
  mixin() {
    return { correlationId: getCorrelationId() };
  },
});

// Backward compatibility helpers for your existing code
export const log = (msg: string, source = "info") => logger.info({ source }, msg);
export const logError = (msg: string, error?: any) => logger.error({ err: error }, msg);

/** Middleware: Assign a unique correlation ID to every request (Phase 5) */
export function correlationId(req: Request, _res: Response, next: NextFunction) {
  const id = (req.headers["x-correlation-id"] as string) || crypto.randomUUID();
  // Store in AsyncLocalStorage so all downstream code (including worker jobs) can access it
  requestContext.run({ correlationId: id }, () => {
    // Also set on the response header for client-side tracing
    _res.setHeader("x-correlation-id", id);
    next();
  });
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    }, "HTTP Request Processed");
  });
  
  next();
}