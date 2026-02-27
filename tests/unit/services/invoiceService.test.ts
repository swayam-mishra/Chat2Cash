import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateInvoiceData, type InvoiceOptions } from "../../../src/services/invoiceService";
import type { ExtractedChatOrder } from "../../../src/schema";

// ════════════════════════════════════════════════════════════════
// invoiceService — Unit Tests (No DB / Redis required)
// ════════════════════════════════════════════════════════════════

// ── Test helpers ───────────────────────────────────────────────

/** Returns a minimal valid order for use in tests. */
function makeOrder(overrides: Partial<ExtractedChatOrder> = {}): ExtractedChatOrder {
  return {
    id: "test-order-001",
    customer_name: "Ravi Kumar",
    items: [
      { product_name: "Basmati Rice", quantity: 2, price: 150 },
      { product_name: "Toor Dal", quantity: 3, price: 120 },
    ],
    confidence: "high",
    status: "pending",
    created_at: new Date().toISOString(),
    raw_messages: [{ sender: "customer", text: "2 rice 3 dal" }],
    ...overrides,
  };
}

const DEFAULT_OPTIONS: InvoiceOptions = {
  businessName: "Test Store",
  gstNumber: "29TESTX1234X1Z5",
  invoiceSequence: 1,
  taxRatePercent: 18,
  isInterstate: false,
};

// ── Freeze the clock so date-dependent fields are deterministic ──
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-15T10:00:00Z"));
});

describe("generateInvoiceData", () => {
  // ──────────────────────────────────────────────────────────────
  // Basic Invoice Generation
  // ──────────────────────────────────────────────────────────────
  describe("basic generation", () => {
    it("should produce a valid invoice with correct structure", () => {
      const invoice = generateInvoiceData(makeOrder(), DEFAULT_OPTIONS);

      expect(invoice).toHaveProperty("invoice_number");
      expect(invoice).toHaveProperty("date");
      expect(invoice).toHaveProperty("customer_name");
      expect(invoice).toHaveProperty("items");
      expect(invoice).toHaveProperty("subtotal");
      expect(invoice).toHaveProperty("cgst");
      expect(invoice).toHaveProperty("sgst");
      expect(invoice).toHaveProperty("total");
      expect(invoice).toHaveProperty("business_name");
      expect(invoice).toHaveProperty("gst_number");
    });

    it("should use the provided business name and GST number", () => {
      const invoice = generateInvoiceData(makeOrder(), DEFAULT_OPTIONS);
      expect(invoice.business_name).toBe("Test Store");
      expect(invoice.gst_number).toBe("29TESTX1234X1Z5");
    });

    it("should use the customer name from the order", () => {
      const invoice = generateInvoiceData(makeOrder(), DEFAULT_OPTIONS);
      expect(invoice.customer_name).toBe("Ravi Kumar");
    });

    it("should fallback to 'Customer' when customer_name is missing", () => {
      const order = makeOrder({ customer_name: null });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.customer_name).toBe("Customer");
    });

    it("should fallback to 'Customer' when customer_name is undefined", () => {
      const order = makeOrder({ customer_name: undefined });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.customer_name).toBe("Customer");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Invoice Numbering
  // ──────────────────────────────────────────────────────────────
  describe("invoice numbering", () => {
    it("should generate sequential invoice number with year", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        invoiceSequence: 42,
      });
      // Clock is set to 2026
      expect(invoice.invoice_number).toBe("INV-2026-042");
    });

    it("should zero-pad sequence numbers to 3 digits", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        invoiceSequence: 1,
      });
      expect(invoice.invoice_number).toBe("INV-2026-001");
    });

    it("should not truncate sequence numbers beyond 3 digits", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        invoiceSequence: 1234,
      });
      expect(invoice.invoice_number).toBe("INV-2026-1234");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Line Items & Subtotal
  // ──────────────────────────────────────────────────────────────
  describe("line items and subtotal", () => {
    it("should map order items to invoice items with correct amounts", () => {
      const invoice = generateInvoiceData(makeOrder(), DEFAULT_OPTIONS);

      expect(invoice.items).toHaveLength(2);
      // Basmati Rice: 2 × 150 = 300
      expect(invoice.items[0]).toEqual({
        product_name: "Basmati Rice",
        quantity: 2,
        price: 150,
        amount: 300,
      });
      // Toor Dal: 3 × 120 = 360
      expect(invoice.items[1]).toEqual({
        product_name: "Toor Dal",
        quantity: 3,
        price: 120,
        amount: 360,
      });
    });

    it("should calculate the correct subtotal", () => {
      const invoice = generateInvoiceData(makeOrder(), DEFAULT_OPTIONS);
      // 300 + 360 = 660
      expect(invoice.subtotal).toBe(660);
    });

    it("should handle a single item", () => {
      const order = makeOrder({
        items: [{ product_name: "Milk", quantity: 1, price: 60 }],
      });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.items).toHaveLength(1);
      expect(invoice.subtotal).toBe(60);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Tax Calculations
  // ──────────────────────────────────────────────────────────────
  describe("tax calculations", () => {
    it("should split tax evenly into CGST + SGST for intra-state", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 18,
        isInterstate: false,
      });
      // Subtotal = 660; CGST = 660 * 9% = 59.40; SGST = 59.40
      expect(invoice.cgst).toBe(59.4);
      expect(invoice.sgst).toBe(59.4);
      expect(invoice.igst).toBeUndefined();
    });

    it("should use IGST for inter-state and zero out CGST/SGST", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 18,
        isInterstate: true,
      });
      // IGST = 660 * 18% = 118.80
      expect(invoice.igst).toBe(118.8);
      expect(invoice.cgst).toBe(0);
      expect(invoice.sgst).toBe(0);
    });

    it("should calculate total = subtotal + taxes (intra-state)", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 18,
        isInterstate: false,
      });
      // 660 + 59.40 + 59.40 = 778.80
      expect(invoice.total).toBe(778.8);
    });

    it("should calculate total = subtotal + IGST (inter-state)", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 18,
        isInterstate: true,
      });
      // 660 + 118.80 = 778.80
      expect(invoice.total).toBe(778.8);
    });

    it("should handle custom tax rates (e.g., 5% for essential goods)", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 5,
        isInterstate: false,
      });
      // CGST = 660 * 2.5% = 16.50; SGST = 16.50
      expect(invoice.cgst).toBe(16.5);
      expect(invoice.sgst).toBe(16.5);
      expect(invoice.total).toBe(693);
    });

    it("should handle 0% tax rate (tax-exempt)", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 0,
        isInterstate: false,
      });
      expect(invoice.cgst).toBe(0);
      expect(invoice.sgst).toBe(0);
      expect(invoice.total).toBe(invoice.subtotal);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Edge Cases: Precision & Rounding
  // ──────────────────────────────────────────────────────────────
  describe("precision and rounding (paise-based math)", () => {
    it("should avoid floating-point errors on fractional prices", () => {
      const order = makeOrder({
        items: [{ product_name: "Spice", quantity: 3, price: 33.33 }],
      });
      const invoice = generateInvoiceData(order, {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 18,
      });
      // 33.33 * 3 = 99.99 (in paise: 3333 * 3 = 9999 → 99.99)
      expect(invoice.subtotal).toBe(99.99);
      // Total should be a valid number, not NaN or Infinity
      expect(Number.isFinite(invoice.total)).toBe(true);
    });

    it("should round tax to 2 decimal places (paise precision)", () => {
      // 1 × 10.01 = 10.01; 18% tax → CGST = 10.01 * 9% = 0.9009 → rounds to 0.90
      const order = makeOrder({
        items: [{ product_name: "Widget", quantity: 1, price: 10.01 }],
      });
      const invoice = generateInvoiceData(order, {
        ...DEFAULT_OPTIONS,
        taxRatePercent: 18,
        isInterstate: false,
      });

      // Verify taxes are rounded to at most 2 decimal places
      const cgstDecimals = (invoice.cgst.toString().split(".")[1] || "").length;
      const sgstDecimals = (invoice.sgst.toString().split(".")[1] || "").length;
      expect(cgstDecimals).toBeLessThanOrEqual(2);
      expect(sgstDecimals).toBeLessThanOrEqual(2);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Edge Cases: Zero-Value & Missing Fields
  // ──────────────────────────────────────────────────────────────
  describe("zero-value and missing fields", () => {
    it("should treat null price as 0", () => {
      const order = makeOrder({
        items: [{ product_name: "Freebie", quantity: 5, price: null }],
      });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.items[0].amount).toBe(0);
      expect(invoice.subtotal).toBe(0);
      expect(invoice.total).toBe(0);
    });

    it("should treat undefined price as 0", () => {
      const order = makeOrder({
        items: [{ product_name: "Sample", quantity: 2, price: undefined }],
      });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.items[0].amount).toBe(0);
      expect(invoice.subtotal).toBe(0);
    });

    it("should handle an item with price of 0", () => {
      const order = makeOrder({
        items: [{ product_name: "Complimentary", quantity: 10, price: 0 }],
      });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.items[0].amount).toBe(0);
      expect(invoice.subtotal).toBe(0);
      expect(invoice.total).toBe(0);
    });

    it("should handle mixed priced and free items", () => {
      const order = makeOrder({
        items: [
          { product_name: "Rice", quantity: 2, price: 100 },
          { product_name: "Free Sample", quantity: 1, price: 0 },
        ],
      });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.subtotal).toBe(200);
      expect(invoice.items[1].amount).toBe(0);
    });

    it("should handle an empty items array", () => {
      const order = makeOrder({ items: [] });
      const invoice = generateInvoiceData(order, DEFAULT_OPTIONS);
      expect(invoice.items).toHaveLength(0);
      expect(invoice.subtotal).toBe(0);
      expect(invoice.total).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Default / Fallback Options
  // ──────────────────────────────────────────────────────────────
  describe("default option fallbacks", () => {
    it("should use default business name when not provided", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        invoiceSequence: 1,
      });
      expect(invoice.business_name).toBe("Your Business Name");
    });

    it("should use default GST number when not provided", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        invoiceSequence: 1,
      });
      expect(invoice.gst_number).toBe("29XXXXX1234X1Z5");
    });

    it("should default to 18% tax and intra-state when not specified", () => {
      const invoice = generateInvoiceData(makeOrder(), {
        invoiceSequence: 1,
      });
      // Subtotal = 660; 9% each side
      expect(invoice.cgst).toBe(59.4);
      expect(invoice.sgst).toBe(59.4);
      expect(invoice.igst).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Date Formatting
  // ──────────────────────────────────────────────────────────────
  describe("date formatting", () => {
    it("should format date in DD/MM/YYYY en-IN locale", () => {
      // Clock is 2026-03-15
      const invoice = generateInvoiceData(makeOrder(), DEFAULT_OPTIONS);
      // en-IN with day:2-digit, month:2-digit, year:numeric → "15/03/2026"
      expect(invoice.date).toMatch(/15\/03\/2026/);
    });
  });
});
