import "./config/env"; // Validate ENV before anything else
import express from "express";
import cors from "cors";
import router from "./routes";
import { log, requestLogger } from "./middlewares/logger";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

const app = express();
const PORT = env.PORT; // Type-safe access

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api", router);

app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`, "info");
  log(`Environment: ${env.NODE_ENV}`, "info");
});

// Graceful shutdown — API does not own the queue worker any more
const shutdown = (signal: string) => {
  log(`${signal} received. Shutting down API...`, "info");
  server.close(() => {
    log("Server closed", "info");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));