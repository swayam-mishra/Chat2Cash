import IORedis from "ioredis";
import { env } from "./env";
import { logger } from "../middlewares/logger";

/**
 * Shared Redis client used across the application (rate limiter cache,
 * idempotency store, etc.).  BullMQ requires its own connection with
 * maxRetriesPerRequest: null, so queueService keeps a separate instance.
 */
export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on("error", (err) => {
  logger.error({ err }, "Shared Redis connection error");
});

redis.on("connect", () => {
  logger.info("Shared Redis connected");
});
