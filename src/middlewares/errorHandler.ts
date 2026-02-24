import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logError } from "./logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Wrapper to eliminate try-catch blocks in controllers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logError(`Error processing request ${req.method} ${req.url}`, err);

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation Error",
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  // 2. Handle Trusted Operational Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // 3. Handle JSON Parsing Errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON payload",
    });
  }

  // 4. Handle Unknown/Server Errors
  // In production, don't leak stack traces
  const isDev = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
    ...(isDev && { stack: err.stack, detail: err.message })
  });
};