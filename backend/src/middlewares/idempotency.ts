import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { log } from "./logger";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const PROCESSING_TTL_SECONDS = 60 * 5;         // 5-minute lock while in-flight

interface CachedResponse {
  status: number;
  body: unknown;
}

/**
 * Idempotency middleware for write endpoints.
 *
 * Clients pass an `Idempotency-Key` header (UUID or any opaque string).
 * The key is scoped per organisation so cross-tenant collisions are impossible.
 *
 * Lifecycle
 * ─────────
 * 1. No key         → pass through (idempotency is opt-in).
 * 2. Key seen (done)→ replay cached response with `X-Idempotent-Replayed: true`.
 * 3. Key in-flight  → return 409 so the client knows to wait and retry.
 * 4. Key unseen     → set a short "processing" lock, run the handler,
 *                     then store the response for 24 h.
 * 5. Handler error  → delete the lock so the client can retry safely.
 */
export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
  const rawKey = req.headers["idempotency-key"] as string | undefined;

  // Idempotency is opt-in; skip if no key is present
  if (!rawKey) return next();

  // Scope key to the authenticated organisation
  const orgId = req.orgId ?? "anon";
  const redisKey = `idempotency:${orgId}:${Buffer.from(rawKey).toString("base64")}`;

  try {
    const existing = await redis.get(redisKey);

    if (existing === "processing") {
      // First request is still in-flight
      return res.status(409).json({
        error: "A request with this Idempotency-Key is already being processed. Retry after it completes.",
        idempotencyKey: rawKey,
      });
    }

    if (existing) {
      // Replay the earlier completed response
      const cached: CachedResponse = JSON.parse(existing);
      log(`Replaying idempotent response for key ${rawKey}`, "idempotency");
      res.setHeader("X-Idempotent-Replayed", "true");
      return res.status(cached.status).json(cached.body);
    }

    // First time seeing this key — lock it while we process
    await redis.setex(redisKey, PROCESSING_TTL_SECONDS, "processing");

    // Intercept res.json to capture and cache the outgoing response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const statusCode = res.statusCode;

      if (statusCode < 400) {
        // Cache successful response for 24 h (overwrites the processing lock)
        const value: CachedResponse = { status: statusCode, body };
        redis
          .setex(redisKey, IDEMPOTENCY_TTL_SECONDS, JSON.stringify(value))
          .catch(() => {/* best-effort */});
      } else {
        // On failure, release the lock so the client can safely retry
        redis.del(redisKey).catch(() => {/* best-effort */});
      }

      return originalJson(body);
    };

    next();
  } catch (err) {
    // If Redis is unavailable, degrade gracefully rather than blocking the request
    log("Idempotency Redis check failed — proceeding without idempotency guarantee", "warn");
    next();
  }
};
