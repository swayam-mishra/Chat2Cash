import { Request, Response } from "express";
import { storage } from "../services/storageService";
import { generateInvoiceData } from "../services/invoiceService";
import { z } from "zod";
import { log } from "../middlewares/logger";

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceRequestSchema = z.object({
      order_id: z.string().min(1),
      business_name: z.string().optional(),
      gst_number: z.string().optional(),
    });
    
    const parsed = invoiceRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const { order_id, business_name, gst_number } = parsed.data;

    // Call the transaction method
    const updatedOrder = await storage.generateAndAttachInvoice(order_id, (orderData) => {
      // Pass the math/logic function into the transaction
      return generateInvoiceData(orderData, business_name, gst_number);
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found or transaction failed" });
    }

    log(`Invoice ${updatedOrder.invoice.invoice_number} generated and attached atomically to order ${order_id}`);
    
    res.json(updatedOrder.invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to generate invoice" });
  }
};