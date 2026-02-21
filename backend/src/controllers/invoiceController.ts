import { Request, Response } from "express";
import { storage } from "../services/storageService";
import type { Invoice, InvoiceItem } from "@shared/schema";
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

    const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const invoiceItems: InvoiceItem[] = order.items.map((item) => {
      const price = item.price ?? 0;
      return { product_name: item.product_name, quantity: item.quantity, price, amount: parseFloat((item.quantity * price).toFixed(2)) };
    });

    const subtotal = parseFloat(invoiceItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    const cgst = parseFloat((subtotal * 0.09).toFixed(2));
    const sgst = parseFloat((subtotal * 0.09).toFixed(2));
    const total = parseFloat((subtotal + cgst + sgst).toFixed(2));

    const invoice: Invoice = {
      invoice_number: `INV-${Date.now()}`,
      date: dateStr,
      customer_name: order.customer_name || "Customer",
      items: invoiceItems,
      subtotal, cgst, sgst, total,
      business_name: business_name || "Your Business Name",
      gst_number: gst_number || "29XXXXX1234X1Z5",
    };

    await storage.attachInvoice(order_id, invoice);
    log(`Invoice ${invoice.invoice_number} generated for order ${order_id}`);
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to generate invoice" });
  }
};