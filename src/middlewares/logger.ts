import pino from "pino";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

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
});

// Backward compatibility helpers for your existing code
export const log = (msg: string, source = "info") => logger.info({ source }, msg);
export const logError = (msg: string, error?: any) => logger.error({ err: error }, msg);

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