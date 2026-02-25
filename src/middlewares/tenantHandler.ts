import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// Extend Express Request to carry the resolved Organization ID throughout the lifecycle
declare global {
  namespace Express {
    interface Request {
      orgId?: string;
    }
  }
}

/**
 * Tenant Context Middleware
 *
 * Intercepts every protected request and extracts the Organization ID.
 * In production this value would come from a verified JWT claim (req.user.orgId).
 * During development it falls back to the `x-organization-id` header.
 *
 * Fails closed: any request without a resolvable orgId is rejected with 401.
 */
export const tenantHandler = (req: Request, _res: Response, next: NextFunction) => {
  // TODO (production): replace header lookup with JWT-claim extraction:
  //   const orgId = (req as any).user?.orgId;
  const orgId = req.headers["x-organization-id"] as string | undefined;

  if (!orgId || orgId.trim() === "") {
    throw new AppError("Unauthorized: Organization context missing", 401);
  }

  req.orgId = orgId.trim();
  next();
};
