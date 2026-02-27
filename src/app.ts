import "./config/env";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import router from "./routes";
import { requestLogger, correlationId } from "./middlewares/logger";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

const app = express();

// ── Sentry Error Tracking (Phase 5) ─────────────────────────
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}

// ── Security Headers (Phase 2) ──────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Correlation ID + Request Logging (Phase 5) ──────────────
app.use(correlationId);
app.use(requestLogger);

app.use("/api", router);

// ── Sentry Error Handler (must be before globalErrorHandler) ─
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(globalErrorHandler);

export default app;
