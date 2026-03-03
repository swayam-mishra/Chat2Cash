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

app.use(helmet());

// Restrict CORS to your frontend's origins
const allowedOrigins = [
  "http://localhost:5173", // Local Vite frontend
  env.FRONTEND_URL // Production frontend URL from .env
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use(correlationId);
app.use(requestLogger);

app.use("/api", router);

// Sentry error handler must be registered before the global error handler
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(globalErrorHandler);

export default app;
