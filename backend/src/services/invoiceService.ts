import type { ExtractedChatOrder, Invoice, InvoiceItem } from "@shared/schema";

export const generateInvoiceData = (order: ExtractedChatOrder, business_name?: string, gst_number?: string): Invoice => {
  const dateStr = new Date().toLocaleDateString("en-IN", { 
    day: "2-digit", month: "2-digit", year: "numeric" 
  });
  
  const invoiceItems: InvoiceItem[] = order.items.map((item) => {
    const price = item.price ?? 0;
    return { 
      product_name: item.product_name, 
      quantity: item.quantity, 
      price, 
      amount: parseFloat((item.quantity * price).toFixed(2)) 
    };
  });

  const subtotal = parseFloat(invoiceItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const cgst = parseFloat((subtotal * 0.09).toFixed(2));
  const sgst = parseFloat((subtotal * 0.09).toFixed(2));
  const total = parseFloat((subtotal + cgst + sgst).toFixed(2));

  return {
    invoice_number: `INV-${Date.now()}`,
    date: dateStr,
    customer_name: order.customer_name || "Customer",
    items: invoiceItems,
    subtotal,
    cgst,
    sgst,
    total,
    business_name: business_name || "Your Business Name",
    gst_number: gst_number || "29XXXXX1234X1Z5",
  };
};