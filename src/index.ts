import app from "./app";
import { log } from "./middlewares/logger";
import { env } from "./config/env";

const PORT = env.PORT;

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