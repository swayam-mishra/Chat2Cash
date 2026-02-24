import { Request, Response, NextFunction } from "express";

const SENSITIVE_KEYS = new Set([
  "customerName", "customer_name",
  "customerPhone", "customer_phone", "phone", 
  "deliveryAddress", "delivery_address", "gst_number"
]);

function maskPII(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskPII);
  
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      masked[key] = "***REDACTED***";
    } else if (typeof value === "object") {
      masked[key] = maskPII(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export const redactPII = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, this would come from req.user (JWT/Session)
  // For now, we simulate role checks via a header
  const userRole = (req.headers['x-user-role'] as string) || 'guest';
  
  // Roles permitted to see full PII
  const FULL_ACCESS_ROLES = ['admin', 'manager', 'owner'];
  
  // If user has full access, skip redaction
  if (FULL_ACCESS_ROLES.includes(userRole)) {
    return next();
  }

  // Intercept the JSON response to redact PII for restricted roles
  const originalJson = res.json;
  res.json = function (body) {
    const safeBody = maskPII(body);
    return originalJson.call(this, safeBody);
  };

  next();
};