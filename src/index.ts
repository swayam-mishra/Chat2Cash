import { Router } from "express";
import routes from "./routes/index";
import { db } from "./config/db";
import { sql } from "drizzle-orm";

const router = Router();

// CHANGED: True readiness health check
router.get("/health", async (_req, res) => {
  try {
    // 1. Check Database Connectivity
    await db.execute(sql`SELECT 1`);
    
    // 2. Check AI Service Readiness
    const isAnthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

    res.status(200).json({ 
      status: "ok", 
      database: "connected",
      ai_service: isAnthropicConfigured ? "ready" : "missing_key",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: "error", 
      database: "disconnected",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Use the routes with sanitization, PII redaction, and rate limiting
router.use(routes);

export default router;