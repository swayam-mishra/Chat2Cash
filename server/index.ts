/*
 * Chat2Cash API — Testing Guide
 *
 * 1. Health Check
 *    curl http://localhost:5000/api/health
 *
 * 2. Load Sample Data (for demo)
 *    curl -X POST http://localhost:5000/api/demo/load-sample-data
 *
 * 3. Extract Order from Hinglish WhatsApp messages
 *    curl -X POST http://localhost:5000/api/extract-order \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "messages": [
 *          { "sender": "Priya", "text": "Bhaiya 5 piece red kurti chahiye 450 wali" },
 *          { "sender": "Priya", "text": "Aur 2 dupatta bhi 300 each, kal tak bhej do Lajpat Nagar" }
 *        ]
 *      }'
 *
 * 4. Get All Orders
 *    curl http://localhost:5000/api/orders
 *
 * 5. Get Dashboard Stats
 *    curl http://localhost:5000/api/stats
 *
 * 6. Generate Invoice (replace ORDER_ID with a real order id)
 *    curl -X POST http://localhost:5000/api/generate-invoice \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "order_id": "ORDER_ID",
 *        "business_name": "Sharma Sarees",
 *        "gst_number": "07AABCS1234D1Z5"
 *      }'
 */
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import rateLimit from "express-rate-limit";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("FATAL: ANTHROPIC_API_KEY is not set. Please add it to your Replit Secrets.");
}

const app = express();
const httpServer = createServer(app);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const LOG_COLORS: Record<string, string> = {
  express: "\x1b[36m",
  anthropic: "\x1b[35m",
  routes: "\x1b[34m",
  error: "\x1b[31m",
  success: "\x1b[32m",
  warn: "\x1b[33m",
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const color = LOG_COLORS[source] || "\x1b[37m";
  console.log(`${DIM}${formattedTime}${RESET} ${color}[${source}]${RESET} ${message}`);
}

export function logError(message: string, error?: Error) {
  log(`${message}${error?.stack ? `\n${error.stack}` : ""}`, "error");
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  const bodySize = req.headers["content-length"] ? `${req.headers["content-length"]}B` : "0B";
  if (path.startsWith("/api")) {
    log(`--> ${req.method} ${path} (${bodySize})`, "express");
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const status = res.statusCode;
      const source = status >= 400 ? "error" : "success";
      let logLine = `<-- ${req.method} ${path} ${status} in ${duration}ms`;
      if (capturedJsonResponse) {
        const summary = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${summary.length > 200 ? summary.slice(0, 200) + "..." : summary}`;
      }
      log(logLine, source);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logError(`${_req.method} ${_req.path} — ${message}`, err instanceof Error ? err : new Error(String(err)));

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0"
    },
    () => {
      log(`Chat2Cash API Online`);
      log(`URL: http://0.0.0.0:${port}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
      log(`Rate limit: 100 requests per 15 minutes per IP`);
      log(`ANTHROPIC_API_KEY: configured`);
    },
  );
})();
