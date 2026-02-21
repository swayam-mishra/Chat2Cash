import { Request, Response } from "express";
import { storage } from "../services/storageService";
import { generateInvoiceData } from "../services/invoiceService";
import { z } from "zod";
import { log } from "../middlewares/logger";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceRequestSchema = z.object({
      order_id: z.string().min(1),
      business_name: z.string().optional(),
      gst_number: z.string().optional(),
      is_interstate: z.boolean().optional().default(false),
      tax_rate: z.number().optional().default(18),
    });
    
    const parsed = invoiceRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const { order_id, business_name, gst_number, is_interstate, tax_rate } = parsed.data;

    // Production Fallbacks: Fetch from env variables instead of hardcoding
    const finalBusinessName = business_name || process.env.DEFAULT_BUSINESS_NAME || "Unregistered Business";
    const finalGstNumber = gst_number || process.env.DEFAULT_GST_NUMBER || "UNREGISTERED";

    // Call the transaction method. The storage service safely provides `nextSequenceNumber` atomically
    const updatedOrder = await storage.generateAndAttachInvoice(order_id, (orderData, nextSequenceNumber) => {
      return generateInvoiceData(orderData, {
        businessName: finalBusinessName,
        gstNumber: finalGstNumber,
        invoiceSequence: nextSequenceNumber,
        isInterstate: is_interstate,
        taxRatePercent: tax_rate
      });
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found or transaction failed" });
    }

    log(`Invoice generated and attached atomically to order ${order_id}`);
    
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to generate invoice" });
  }
};