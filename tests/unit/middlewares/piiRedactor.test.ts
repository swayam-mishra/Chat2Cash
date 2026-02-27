import { describe, it, expect } from "vitest";
import {
  redactString,
  redactPhoneNumbers,
  redactSensitiveData,
} from "../../../src/middlewares/piiRedactor";

// ════════════════════════════════════════════════════════════════
// PII Redactor — Unit Tests (No DB / Redis / Express required)
// ════════════════════════════════════════════════════════════════

describe("piiRedactor", () => {
  // ──────────────────────────────────────────────────────────────
  // redactString — regex-based pattern matching
  // ──────────────────────────────────────────────────────────────
  describe("redactString", () => {
    // --- Emails ---
    it("should redact a simple email address", () => {
      expect(redactString("contact me at john@example.com please")).toBe(
        "contact me at [EMAIL REDACTED] please"
      );
    });

    it("should redact multiple emails in the same string", () => {
      const input = "Send to alice@foo.org and bob@bar.co.in";
      const result = redactString(input);
      expect(result).not.toContain("alice@foo.org");
      expect(result).not.toContain("bob@bar.co.in");
      expect(result).toContain("[EMAIL REDACTED]");
    });

    it("should redact emails with subdomains and plus addressing", () => {
      expect(redactString("user+tag@sub.domain.com")).toBe("[EMAIL REDACTED]");
    });

    // --- Indian PAN ---
    it("should redact Indian PAN numbers", () => {
      expect(redactString("My PAN is ABCDE1234F")).toBe(
        "My PAN is [PAN REDACTED]"
      );
    });

    it("should NOT redact strings that look like PAN but aren't valid", () => {
      // Lowercase won't match the PAN regex (which requires uppercase)
      expect(redactString("abcde1234f")).toBe("abcde1234f");
    });

    // --- Indian GST ---
    it("should redact Indian GST numbers", () => {
      expect(redactString("GST: 22AAAAA0000A1Z5")).toBe(
        "GST: [GST REDACTED]"
      );
    });

    // --- US SSN ---
    it("should redact US Social Security numbers", () => {
      expect(redactString("SSN 123-45-6789")).toBe("SSN [SSN REDACTED]");
    });

    // --- Credit Card ---
    it("should redact credit card–like sequences", () => {
      const result = redactString("Card: 4111 1111 1111 1111");
      expect(result).not.toContain("4111");
    });

    // --- Aadhaar ---
    it("should redact Aadhaar numbers (12 digits with spaces)", () => {
      const result = redactString("Aadhaar: 1234 5678 9012");
      expect(result).not.toContain("1234 5678 9012");
    });

    it("should redact Aadhaar numbers without separators", () => {
      const result = redactString("Aadhaar: 123456789012");
      expect(result).not.toContain("123456789012");
    });

    // --- IPv4 ---
    it("should redact IPv4 addresses", () => {
      expect(redactString("from IP 192.168.1.1")).toBe(
        "from IP [IP REDACTED]"
      );
    });

    // --- UK NI ---
    it("should redact UK National Insurance numbers", () => {
      expect(redactString("NI: AB123456C")).toBe("NI: [NI REDACTED]");
    });

    // --- No PII ---
    it("should leave clean text untouched", () => {
      const clean = "Order for 5 kg rice and 2 kg dal";
      expect(redactString(clean)).toBe(clean);
    });

    // --- Mixed PII ---
    it("should redact multiple PII types in a single string", () => {
      const input = "Email john@test.com, PAN ABCDE1234F, SSN 111-22-3333";
      const result = redactString(input);
      expect(result).not.toContain("john@test.com");
      expect(result).not.toContain("ABCDE1234F");
      expect(result).not.toContain("111-22-3333");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // redactPhoneNumbers — google-libphonenumber based
  // ──────────────────────────────────────────────────────────────
  describe("redactPhoneNumbers", () => {
    it("should redact Indian phone numbers with +91 prefix", () => {
      const result = redactPhoneNumbers("Call me at +91 98765 43210");
      expect(result).not.toContain("98765");
      expect(result).toContain("[PHONE REDACTED]");
    });

    it("should redact Indian phone numbers without country code", () => {
      const result = redactPhoneNumbers("Phone: 9876543210");
      expect(result).not.toContain("9876543210");
    });

    it("should redact US phone numbers", () => {
      const result = redactPhoneNumbers("US: +1 (650) 253-0000");
      expect(result).not.toContain("650");
      expect(result).toContain("[PHONE REDACTED]");
    });

    it("should redact UK phone numbers", () => {
      const result = redactPhoneNumbers("UK: +44 20 7946 0958");
      expect(result).not.toContain("7946");
    });

    it("should NOT redact short numbers that aren't valid phones", () => {
      // "12345" is too short / invalid for any region
      const result = redactPhoneNumbers("order #12345");
      expect(result).toBe("order #12345");
    });

    it("should redact multiple phone numbers in one string", () => {
      const input = "Primary: +91 98765 43210, Secondary: +1 650-253-0000";
      const result = redactPhoneNumbers(input);
      expect(result).not.toContain("98765");
      expect(result).not.toContain("650");
    });

    it("should leave text with no phone-like sequences unchanged", () => {
      const text = "Ship 10 boxes of tea to warehouse B";
      expect(redactPhoneNumbers(text)).toBe(text);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // redactSensitiveData — recursive object redaction
  // ──────────────────────────────────────────────────────────────
  describe("redactSensitiveData", () => {
    it("should redact SENSITIVE_KEYS with [REDACTED]", () => {
      const data = {
        customerName: "Ravi Kumar",
        phone: "+91 98765 43210",
        email: "ravi@shop.com",
        items: [{ name: "Rice", qty: 5 }],
      };
      const result = redactSensitiveData(data);
      expect(result.customerName).toBe("[REDACTED]");
      expect(result.phone).toBe("[REDACTED]");
      expect(result.email).toBe("[REDACTED]");
    });

    it("should NOT redact non-sensitive keys", () => {
      const data = { items: [{ name: "Rice", qty: 5 }] };
      const result = redactSensitiveData(data);
      expect(result.items[0].name).toBe("Rice");
      expect(result.items[0].qty).toBe(5);
    });

    it("should redact PII patterns inside non-sensitive string values", () => {
      const data = {
        notes: "Customer email is test@mail.com and PAN ABCDE1234F",
      };
      const result = redactSensitiveData(data);
      expect(result.notes).not.toContain("test@mail.com");
      expect(result.notes).not.toContain("ABCDE1234F");
      expect(result.notes).toContain("[EMAIL REDACTED]");
      expect(result.notes).toContain("[PAN REDACTED]");
    });

    it("should handle deeply nested objects", () => {
      const data = {
        order: {
          customer: {
            phone: "9876543210",
            address: "123 Main St",
          },
        },
      };
      const result = redactSensitiveData(data);
      expect(result.order.customer.phone).toBe("[REDACTED]");
      expect(result.order.customer.address).toBe("[REDACTED]");
    });

    it("should handle arrays of objects", () => {
      const data = [
        { customerName: "Alice", amount: 500 },
        { customerName: "Bob", amount: 300 },
      ];
      const result = redactSensitiveData(data);
      expect(result[0].customerName).toBe("[REDACTED]");
      expect(result[1].customerName).toBe("[REDACTED]");
      expect(result[0].amount).toBe(500);
    });

    it("should return null/undefined as-is", () => {
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData(undefined)).toBeUndefined();
    });

    it("should redact a plain string containing PII", () => {
      const result = redactSensitiveData("Contact: john@site.com");
      expect(result).toBe("Contact: [EMAIL REDACTED]");
    });

    it("should return non-string primitives unchanged", () => {
      expect(redactSensitiveData(42)).toBe(42);
      expect(redactSensitiveData(true)).toBe(true);
    });

    it("should handle empty objects and arrays", () => {
      expect(redactSensitiveData({})).toEqual({});
      expect(redactSensitiveData([])).toEqual([]);
    });

    it("should redact password and secret keys", () => {
      const data = { password: "s3cret!", secret: "abc123", token: "jwt.xyz" };
      const result = redactSensitiveData(data);
      expect(result.password).toBe("[REDACTED]");
      expect(result.secret).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
    });

    it("should not mutate the original input", () => {
      const original = { customerName: "Alice", status: "confirmed" };
      const copy = { ...original };
      redactSensitiveData(original);
      expect(original).toEqual(copy);
    });
  });
});
