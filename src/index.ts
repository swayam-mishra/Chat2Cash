import { Router } from "express";
import * as orderController from "./controllers/orderController";
import * as invoiceController from "./controllers/invoiceController";
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

router.get("/stats", orderController.getStats);
router.get("/orders", orderController.getOrders);
router.get("/orders/:id", orderController.getOrderById);
router.post("/extract", orderController.extractOrder);
router.post("/extract-order", orderController.extractChatOrder);
router.patch("/orders/:id/edit", orderController.editOrder);
router.patch("/orders/:id", orderController.updateOrderStatus);
router.delete("/orders/:id", orderController.deleteOrder);
router.post("/generate-invoice", invoiceController.generateInvoice);

export default router;