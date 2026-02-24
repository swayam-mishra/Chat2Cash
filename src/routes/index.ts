import { Router } from "express";
import * as orderController from "../controllers/orderController";
import * as invoiceController from "../controllers/invoiceController";
import { extractLimiter, generalLimiter } from "../middlewares/rateLimiter";
import { sanitizeInputs } from "../middlewares/sanitizer";
import { redactPII } from "../middlewares/piiRedactor";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "Chat2Cash API Online" }));

// Read Operations: General Rate Limit + PII Redaction
router.get("/stats", generalLimiter, orderController.getStats);
router.get("/orders", generalLimiter, redactPII, orderController.getOrders);
router.get("/orders/:id", generalLimiter, redactPII, orderController.getOrderById);

// Write Operations: Strict Rate Limit + Input Sanitization
router.post("/extract", extractLimiter, sanitizeInputs, orderController.extractOrder);
router.post("/extract-order", extractLimiter, sanitizeInputs, orderController.extractChatOrder);
router.post("/generate-invoice", extractLimiter, sanitizeInputs, invoiceController.generateInvoice);

// Updates: Strict Rate Limit + Input Sanitization
router.patch("/orders/:id/edit", extractLimiter, sanitizeInputs, orderController.editOrder);
router.patch("/orders/:id", extractLimiter, sanitizeInputs, orderController.updateOrderStatus);
router.delete("/orders/:id", extractLimiter, orderController.deleteOrder);

export default router;