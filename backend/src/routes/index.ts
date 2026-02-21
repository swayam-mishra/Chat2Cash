import { Router } from "express";
import * as orderController from "../controllers/orderController";
import * as invoiceController from "../controllers/invoiceController";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "Chat2Cash API Online" }));
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