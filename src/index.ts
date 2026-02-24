import "./config/env"; // OPTIMIZATION: Validate ENV before anything else
import express from "express";
import cors from "cors";
import router from "./routes";
import { log, requestLogger } from "./middlewares/logger";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";
import { startExtractionWorker, shutdownQueue } from "./services/queueService";

const app = express();
const PORT = env.PORT; // Type-safe access

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api", router);

// OPTIMIZATION: Centralized Error Handling
app.use(globalErrorHandler);

// Start BullMQ extraction worker
startExtractionWorker();

const server = app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`, "info");
  log(`Environment: ${env.NODE_ENV}`, "info");
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  log(`${signal} received. Shutting down gracefully...`, "info");
  await shutdownQueue();
  server.close(() => {
    log("Server closed", "info");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));