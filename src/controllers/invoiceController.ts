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
    const order = await storage.getChatOrder(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Delegate math and generation to the invoice service
    const invoice = generateInvoiceData(order, business_name, gst_number);

    await storage.attachInvoice(order_id, invoice);
    log(`Invoice ${invoice.invoice_number} generated for order ${order_id}`);
    
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to generate invoice" });
  }
};