import { Request, Response, NextFunction } from "express";

/** Escapes HTML special characters to prevent XSS in string values. */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return text;
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Recursively sanitizes all string values in an object or array. */
function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeObject(v));
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeObject(obj[key]);
      }
    }
    return newObj;
  }
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }
  return obj;
}

/** Express middleware that sanitizes all string values in `req.body`. */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};