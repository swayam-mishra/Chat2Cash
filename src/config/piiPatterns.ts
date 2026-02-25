/**
 * PII Redaction patterns — configurable without code changes.
 * In the future, these can be loaded from a DB table or remote config.
 */

export interface PIIPattern {
  name: string;
  regex: RegExp;
  replacement: string;
}

// Patterns that work internationally
export const PII_PATTERNS: PIIPattern[] = [
  // Email addresses
  {
    name: "email",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: "[EMAIL REDACTED]",
  },
  // Credit/Debit Card Numbers (Visa, Mastercard, Amex, etc.)
  {
    name: "credit_card",
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: "[CARD REDACTED]",
  },
  // Indian Aadhaar numbers (12 digits with optional spaces/dashes)
  {
    name: "aadhaar",
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: "[AADHAAR REDACTED]",
  },
  // Indian PAN
  {
    name: "pan",
    regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    replacement: "[PAN REDACTED]",
  },
  // Indian GST Numbers
  {
    name: "gst",
    regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g,
    replacement: "[GST REDACTED]",
  },
  // US Social Security Numbers
  {
    name: "ssn",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN REDACTED]",
  },
  // UK National Insurance Numbers
  {
    name: "uk_ni",
    regex: /\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/gi,
    replacement: "[NI REDACTED]",
  },
  // IP Addresses (IPv4)
  {
    name: "ipv4",
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: "[IP REDACTED]",
  },
];

// Keys in JSON objects that should be fully redacted
export const SENSITIVE_KEYS = new Set([
  "customerName",
  "customer_name",
  "customerPhone",
  "customer_phone",
  "gst_number",
  "gstNumber",
  "phone",
  "phoneNumber",
  "phone_number",
  "mobile",
  "email",
  "address",
  "deliveryAddress",
  "delivery_address",
  "aadhaar",
  "pan",
  "ssn",
  "cardNumber",
  "card_number",
  "cvv",
  "password",
  "secret",
  "token",
]);
