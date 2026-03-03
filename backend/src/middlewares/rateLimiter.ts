import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { organizationsTable } from "../schema";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { redis } from "../config/redis";

/** How long (in seconds) a cached org-tier entry lives in Redis. */
const TIER_CACHE_TTL = 300; // 5 minutes

const TIER_LIMITS: Record<string, number> = {
  free: parseInt(env.RATE_LIMIT_FREE),
  pro: parseInt(env.RATE_LIMIT_PRO),
  enterprise: parseInt(env.RATE_LIMIT_ENTERPRISE),
};

const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS);

/**
 * Get the rate limit for an organization based on its tier.
 *
 * Tier is cached in Redis for TIER_CACHE_TTL seconds to avoid a DB round-trip
 * on every authenticated request (N+1 problem at the middleware level).
 */
async function getOrgRateLimit(orgId: string | undefined): Promise<number> {
  if (!orgId) return TIER_LIMITS.free;

  const cacheKey = `org:tier:${orgId}`;

  // 1. Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached && TIER_LIMITS[cached] !== undefined) {
      return TIER_LIMITS[cached];
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  // 2. Cache miss: query DB then populate cache
  try {
    const org = await db
      .select({ tier: organizationsTable.tier })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId))
      .limit(1);

    if (org.length > 0 && org[0].tier) {
      const tier = org[0].tier;
      // Populate Redis cache; ignore errors so a Redis blip doesn't break auth
      redis.setex(cacheKey, TIER_CACHE_TTL, tier).catch(() => {});
      return TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    }
  } catch {
    // Fall back to free tier on DB lookup failure
  }

  return TIER_LIMITS.free;
}

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
 * Dynamic rate limiter that adjusts limits based on organization tier.
 */
export const extractLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const limit = await getOrgRateLimit(req.orgId);
  getLimiter(limit)(req, res, next);
};

/**
 * General limiter for read operations — tier-aware with a 5x multiplier.
 */
export const generalLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const baseLimit = await getOrgRateLimit(req.orgId);
  getLimiter(baseLimit * 5)(req, res, next);
};