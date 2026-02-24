import { Request, Response } from "express";
import { generateInvoiceData } from "../services/invoiceService";
import { storage } from "../services/storageService";
import { pdfService } from "../services/pdfService";
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { env } from "../config/env";
import { z } from "zod";

const generateInvoiceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = generateInvoiceSchema.parse(req.body);

  const order = await storage.getChatOrder(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // 1. Generate Structured Invoice Data & Persist to DB
  const updatedOrder = await storage.generateAndAttachInvoice(orderId, (orderData, seq) => {
    return generateInvoiceData(orderData, {
      invoiceSequence: seq,
      businessName: env.DEFAULT_BUSINESS_NAME,
      gstNumber: env.DEFAULT_GST_NUMBER,
    });
  });

  if (!updatedOrder || !updatedOrder.invoice) {
    throw new AppError("Failed to generate invoice", 500);
  }

  // 2. Generate PDF Binary
  const pdfBuffer = await pdfService.generateInvoicePDF(updatedOrder.invoice);

  // 3. Upload to Storage (S3/Local)
  const fileName = `invoice_${updatedOrder.invoice.invoice_number}.pdf`;
  const pdfUrl = await pdfService.uploadToStorage(fileName, pdfBuffer);

  // 4. Return both JSON data and download URL
  res.status(201).json({
    message: "Invoice generated successfully",
    invoice: updatedOrder.invoice,
    downloadUrl: pdfUrl, 
    // In a real S3 setup, this would be a signed URL or public bucket URL
    // Currently returns local server path
  });
});