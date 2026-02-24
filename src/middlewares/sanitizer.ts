import { Request, Response, NextFunction } from "express";

function escapeHtml(text: string): string {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};