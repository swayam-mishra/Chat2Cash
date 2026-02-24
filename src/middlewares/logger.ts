import { Request, Response, NextFunction } from "express";

// NEW: Define keys that contain PII
const SENSITIVE_KEYS = new Set([
  "customerName", "customerPhone", "customer_name", 
  "customer_phone", "phone", "deliveryAddress", "delivery_address",
  "gst_number"
]);

// NEW: Helper function to recursively mask PII
function maskPII(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskPII);
  
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key) && typeof value === "string") {
      masked[key] = "***REDACTED***";
    } else if (typeof value === "object") {
      masked[key] = maskPII(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export function logError(message: string, error?: Error) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.error(`${formattedTime} [error] ${message}`, error || "");
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // CHANGED: Mask PII before stringifying the log
        const safeResponse = maskPII(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }
      // CHANGED: Increased length to see more of the safe log
      if (logLine.length > 150) {
        logLine = logLine.slice(0, 149) + "…";
      }
      log(logLine);
    }
  });
  next();
}