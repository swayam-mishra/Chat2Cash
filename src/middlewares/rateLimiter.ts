import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { organizationsTable } from "../schema";
import { eq } from "drizzle-orm";
import { env } from "../config/env";

// Tier-based limits (from env, overridable without redeploy)
const TIER_LIMITS: Record<string, number> = {
  free: parseInt(env.RATE_LIMIT_FREE),
  pro: parseInt(env.RATE_LIMIT_PRO),
  enterprise: parseInt(env.RATE_LIMIT_ENTERPRISE),
};

const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS);

/**
 * Get the rate limit for an organization based on its tier.
 */
async function getOrgRateLimit(orgId: string | undefined): Promise<number> {
  if (!orgId) return TIER_LIMITS.free;

  try {
    const org = await db
      .select({ tier: organizationsTable.tier })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId))
      .limit(1);

    if (org.length > 0 && org[0].tier) {
      return TIER_LIMITS[org[0].tier] ?? TIER_LIMITS.free;
    }
  } catch {
    // If DB lookup fails, fall back to free tier
  }

  return TIER_LIMITS.free;
}

// Cache limiters per max value to avoid recreating on every request
const limiterCache = new Map<number, ReturnType<typeof rateLimit>>();

function getLimiter(max: number) {
  if (limiterCache.has(max)) return limiterCache.get(max)!;

  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.orgId ?? req.ip ?? "unknown",
    message: {
      error: `Rate limit exceeded. Your plan allows ${max} requests per ${windowMs / 60000} minutes.`,
    },
  });

  limiterCache.set(max, limiter);
  return limiter;
}

/**
 * Dynamic rate limiter that adjusts based on organization tier.
 * Replaces the old hardcoded `max: 20` extractLimiter.
 */
export const extractLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const limit = await getOrgRateLimit(req.orgId);
  getLimiter(limit)(req, res, next);
};

/**
 * General limiter for lighter read operations.
 * Also tier-aware but with a 5x multiplier.
 */
export const generalLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const baseLimit = await getOrgRateLimit(req.orgId);
  getLimiter(baseLimit * 5)(req, res, next);
};