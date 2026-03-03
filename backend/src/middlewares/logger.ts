import pino from "pino";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AsyncLocalStorage } from "async_hooks";

/**
 * AsyncLocalStorage propagates the correlation ID through the entire
 * request lifecycle without passing it as a function argument.
 */
export const requestContext = new AsyncLocalStorage<{ correlationId: string }>();

/** Returns the current correlation ID, or "no-context" outside a request. */
export function getCorrelationId(): string {
  return requestContext.getStore()?.correlationId ?? "no-context";
}

const SENSITIVE_KEYS = ["customerName", "customerPhone", "customer_name", "customer_phone", "phone", "deliveryAddress", "delivery_address", "gst_number"];

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV !== "production" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: SENSITIVE_KEYS.flatMap(key => [`req.body.${key}`, `res.body.${key}`, `*.${key}`]),
    censor: "***REDACTED***",
  },
  // Inject correlation ID into every log line
  mixin() {
    return { correlationId: getCorrelationId() };
  },
});

// Backward compatibility helpers for your existing code
export const log = (msg: string, source = "info") => logger.info({ source }, msg);
export const logError = (msg: string, error?: any) => logger.error({ err: error }, msg);

/** Assigns a unique correlation ID to every incoming request. */
export function correlationId(req: Request, _res: Response, next: NextFunction) {
  const id = (req.headers["x-correlation-id"] as string) || crypto.randomUUID();
  requestContext.run({ correlationId: id }, () => {
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