import { Request, Response, NextFunction } from "express";
import { PhoneNumberUtil } from "google-libphonenumber";
import { hasPermission, PERMISSIONS } from "../services/permissionService";
import { PII_PATTERNS, SENSITIVE_KEYS } from "../config/piiPatterns";

const phoneUtil = PhoneNumberUtil.getInstance();

// Regions to check when parsing phone numbers
const PHONE_REGIONS = ["IN", "US", "GB", "CA", "AU", "DE", "FR", "JP", "SG"];

/**
 * Detects and redacts phone numbers in any international format
 * using google-libphonenumber instead of hardcoded +91 regex.
 */
export function redactPhoneNumbers(text: string): string {
  const matches = text.match(/[+]?[\d\s\-()]{7,20}/g);
  if (!matches) return text;

  for (const match of matches) {
    for (const region of PHONE_REGIONS) {
      try {
        const parsed = phoneUtil.parse(match.trim(), region);
        if (phoneUtil.isValidNumber(parsed)) {
          text = text.replace(match, "[PHONE REDACTED]");
          break; // matched in one region, no need to try others
        }
      } catch {
        // Not a valid phone number for this region, skip
      }
    }
  }

  return text;
}

/**
 * Redact string values using all configured PII patterns + international phone parsing.
 */
export function redactString(value: string): string {
  let result = value;

  // Apply regex patterns from config
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern.regex, pattern.replacement);
  }

  // Apply international phone number redaction
  result = redactPhoneNumbers(result);

  return result;
}

/**
 * Recursively redact sensitive data from an object.
 */
export function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return redactString(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === "object") {
    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.has(key) && typeof value === "string") {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return data;
}

/**
 * PII redaction middleware.
 * Uses permission-based access control instead of hardcoded role names.
 */
export const redactPII = async (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  res.json = ((data: any) => {
    (async () => {
      try {
        let shouldRedact = true;

        // Permission-based check (replaces hardcoded FULL_ACCESS_ROLES)
        if (req.user?.id && req.orgId) {
          shouldRedact = !(await hasPermission(
            req.user.id,
            req.orgId,
            PERMISSIONS.VIEW_PII,
          ));
        }

        if (shouldRedact) {
          data = redactSensitiveData(data);
        }

        originalJson(data);
      } catch {
        // On failure, redact by default (secure fallback)
        originalJson(redactSensitiveData(data));
      }
    })();
  }) as any;

  next();
};