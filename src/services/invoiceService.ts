import Decimal from "decimal.js";
import type { ExtractedChatOrder, Invoice, InvoiceItem } from "../schema";

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface InvoiceOptions {
  businessName?: string;
  gstNumber?: string;
  invoiceSequence: number; // Required for sequential numbering
  taxRatePercent?: number; // Total tax rate (e.g., 18 for 18%)
  isInterstate?: boolean;  // True = IGST, False = CGST + SGST
}

export const generateInvoiceData = (
  order: ExtractedChatOrder,
  options: InvoiceOptions
): Invoice => {
  const {
    businessName = "Your Business Name",
    gstNumber = "29XXXXX1234X1Z5",
    invoiceSequence,
    taxRatePercent = 18, // Default 18% GST
    isInterstate = false,
  } = options;

  const date = new Date();
  const dateStr = date.toLocaleDateString("en-IN", { 
    day: "2-digit", month: "2-digit", year: "numeric" 
  });
  
  // 1. Sequential Invoice Numbering (e.g., INV-2026-001)
  const year = date.getFullYear();
  const seqStr = String(invoiceSequence).padStart(3, '0');
  const invoice_number = `INV-${year}-${seqStr}`;

  // 2. Precision-safe math using Decimal.js (eliminates IEEE 754 float errors)
  let subtotal = new Decimal(0);

  const invoiceItems: InvoiceItem[] = order.items.map((item) => {
    const price = new Decimal(item.price ?? 0);
    const quantity = new Decimal(item.quantity);
    const amount = price.times(quantity).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    subtotal = subtotal.plus(amount);

    return { 
      product_name: item.product_name, 
      quantity: item.quantity, 
      price: price.toNumber(),       // keep display price in rupees
      amount: amount.toNumber(),     // precise line total
    };
  });

  // 3. Dynamic Tax Calculations using Decimal.js
  const taxRate = new Decimal(taxRatePercent);
  let cgst = new Decimal(0);
  let sgst = new Decimal(0);
  let igst = new Decimal(0);

  if (isInterstate) {
    igst = subtotal.times(taxRate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  } else {
    const halfRate = taxRate.div(2);
    cgst = subtotal.times(halfRate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    sgst = subtotal.times(halfRate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  const total = subtotal.plus(cgst).plus(sgst).plus(igst);

  return {
    invoice_number,
    date: dateStr,
    customer_name: order.customer_name || "Customer",
    items: invoiceItems,
    subtotal: subtotal.toNumber(),
    cgst: cgst.toNumber(),
    sgst: sgst.toNumber(),
    igst: isInterstate ? igst.toNumber() : undefined,
    total: total.toNumber(),
    business_name: businessName,
    gst_number: gstNumber,
  };
};