import { Request, Response, NextFunction } from "express";

/**
 * Input sanitization is handled entirely by Zod at the controller layer:
 *
 * - `.strict()` schemas (e.g. updateChatOrderSchema) reject unknown fields.
 * - Type-specific validators (z.string(), z.number(), …) enforce shape.
 *
 * The previous recursive HTML-escape approach was removed for two reasons:
 *
 * 1. Performance — deep-cloning and regex-replacing every string in large chat
 *    payloads is O(n) CPU work on the hot path for every write request.
 *
 * 2. Data corruption — escaping "<" / ">" mutates user content before it
 *    reaches the LLM (e.g. "width < 5cm" → "width &lt; 5cm"), causing
 *    misinterpretation and storing corrupted data in the database.
 *
 * XSS prevention is a rendering concern: sanitize on the *frontend* at
 * render time (e.g. with DOMPurify), not when writing to the database.
 */
export const sanitizeInputs = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};