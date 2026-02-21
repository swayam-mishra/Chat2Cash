import type { ExtractedChatOrder, Invoice, InvoiceItem } from "../schema";

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

  // 2. Rounding & Precision: Perform all math in Paise (integers)
  let subtotalPaise = 0;

  const invoiceItems: InvoiceItem[] = order.items.map((item) => {
    const priceRupees = item.price ?? 0;
    // Convert to integers before multiplying
    const pricePaise = Math.round(priceRupees * 100);
    const amountPaise = pricePaise * item.quantity;
    
    subtotalPaise += amountPaise;

    return { 
      product_name: item.product_name, 
      quantity: item.quantity, 
      price: priceRupees, // keep display price in rupees
      amount: amountPaise / 100 // convert back to rupees for display
    };
  });

  // 3. Dynamic Tax Calculations (in Paise)
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isInterstate) {
    igstPaise = Math.round((subtotalPaise * taxRatePercent) / 100);
  } else {
    const halfTax = taxRatePercent / 2;
    cgstPaise = Math.round((subtotalPaise * halfTax) / 100);
    sgstPaise = Math.round((subtotalPaise * halfTax) / 100);
  }

  const totalPaise = subtotalPaise + cgstPaise + sgstPaise + igstPaise;

  return {
    invoice_number,
    date: dateStr,
    customer_name: order.customer_name || "Customer",
    items: invoiceItems,
    subtotal: subtotalPaise / 100,      // Convert final integers back to Rupees
    cgst: cgstPaise / 100,
    sgst: sgstPaise / 100,
    igst: isInterstate ? igstPaise / 100 : undefined,
    total: totalPaise / 100,
    business_name: businessName,
    gst_number: gstNumber,
  };
};