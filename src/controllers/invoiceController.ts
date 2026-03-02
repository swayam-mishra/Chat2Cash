import { Request, Response } from "express";
import { generateInvoiceData } from "../services/invoiceService";
import { storage } from "../services/storageService";
import { pdfService } from "../services/pdfService";
import { asyncHandler, AppError } from "../middlewares/errorHandler";

import { z } from "zod";

const generateInvoiceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = generateInvoiceSchema.parse(req.body);
  const orgId = req.orgId!;

  const profile = await storage.getBusinessProfile(orgId);

  const updatedOrder = await storage.generateAndAttachInvoice(orgId, orderId, (orderData, seq) => {
    return generateInvoiceData(orderData, {
      invoiceSequence: seq,
      businessName: profile.businessName,
      gstNumber: profile.gstNumber,
      taxRatePercent: profile.taxRate,
    });
  });

  if (!updatedOrder || !updatedOrder.invoice) {
    throw new AppError("Failed to generate invoice", 500);
  }

  // 2. Generate PDF Binary
  const pdfBuffer = await pdfService.generateInvoicePDF(updatedOrder.invoice);

  const fileName = `invoice_${updatedOrder.invoice.invoice_number}.pdf`;
  await pdfService.uploadToStorage(fileName, pdfBuffer);

  res.status(201).json({
    message: "Invoice generated successfully",
    invoice: updatedOrder.invoice,
    downloadEndpoint: `/api/orders/${orderId}/download`,
  });
});

/**
 * GET /api/orders/:id/download
 *
 * Generates a short-lived (5-minute) SAS token after verifying
 * auth + org ownership, then redirects the client to the signed URL.
 */
export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const orgId = req.orgId!;

  const order = await storage.getChatOrder(orgId, orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!order.invoice) {
    throw new AppError("No invoice generated for this order", 404);
  }

  const fileName = `invoice_${order.invoice.invoice_number}.pdf`;
  const signedUrl = await pdfService.generateDownloadUrl(fileName, 5);

  res.redirect(signedUrl);
});