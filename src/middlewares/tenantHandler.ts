import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      orgId?: string;
    }
  }
}

/**
 * Extracts the Organization ID from the request headers and sets `req.orgId`.
 * Rejects any request that lacks a resolvable org context.
 */
export const tenantHandler = (req: Request, _res: Response, next: NextFunction) => {
  const orgId = req.headers["x-organization-id"] as string | undefined;

  if (!orgId || orgId.trim() === "") {
    throw new AppError("Unauthorized: Organization context missing", 401);
  }

  req.orgId = orgId.trim();
  next();
};
