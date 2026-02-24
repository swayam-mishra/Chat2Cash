import { Request, Response, NextFunction } from "express";

const SENSITIVE_KEYS = new Set([
  "customerName", "customer_name",
  "customerPhone", "customer_phone", "phone", 
  "deliveryAddress", "delivery_address", "gst_number"
]);

// Regex for Indian Mobile Numbers (covers +91, 91, or just 10 digits starting with 6-9)
const PHONE_REGEX = /(?:\+91[\-\s]?)?[6-9]\d{9}/g;

// Basic Email Regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function maskPII(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskPII);
  
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // 1. Key-based Redaction (Fastest)
    if (SENSITIVE_KEYS.has(key)) {
      masked[key] = "***REDACTED***";
      continue;
    } 
    
    // 2. Value-based Scanning (Deep Scan)
    if (typeof value === "string") {
      // Use .replace() directly — it's a no-op if no match, and avoids
      // the lastIndex statefulness bug with .test() + .replace() on /g regexes
      masked[key] = value
        .replace(PHONE_REGEX, "[PHONE REMOVED]")
        .replace(EMAIL_REGEX, "[EMAIL REMOVED]");
    } else if (typeof value === "object") {
      masked[key] = maskPII(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export const redactPII = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req.headers['x-user-role'] as string) || 'guest';
  const FULL_ACCESS_ROLES = ['admin', 'manager', 'owner'];
  
  if (FULL_ACCESS_ROLES.includes(userRole)) {
    return next();
  }

  const originalJson = res.json;
  res.json = function (body) {
    const safeBody = maskPII(body);
    return originalJson.call(this, safeBody);
  };

  next();
};