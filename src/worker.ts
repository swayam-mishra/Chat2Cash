import "./config/env"; // Load and validate env vars before anything else
import { startExtractionWorker, startWebhookWorker, shutdownQueue } from "./services/queueService";
import { log, logError } from "./middlewares/logger";
import { db } from "./config/db";
import { sql } from "drizzle-orm";

const start = async () => {
  log("Worker service starting...", "worker");

  // Verify database reachability before accepting jobs
  try {
    await db.execute(sql`SELECT 1`);
    log("Database connected", "worker");
  } catch (err) {
    logError("Database connection failed — aborting worker startup", err);
    process.exit(1);
  }

  // Start both BullMQ processors (Phase 3: decoupled queues)
  startExtractionWorker();
  startWebhookWorker();
  log("Extraction + Webhook workers running and polling for jobs", "worker");
};

const shutdown = async (signal: string) => {
  log(`${signal} received. Shutting down worker gracefully...`, "worker");
  try {
    await shutdownQueue();
    log("Worker shut down successfully", "worker");
    process.exit(0);
  } catch (err) {
    logError("Error during worker shutdown", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  logError("Fatal worker startup error", err);
  process.exit(1);
});
