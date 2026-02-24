import rateLimit from "express-rate-limit";

// OPTIMIZATION: Strict limiter for expensive AI & Write operations
// Prevents API key exhaustion and abuse of the Anthropic service
export const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 extraction requests per window
  message: { message: "Rate limit exceeded for AI extraction. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// OPTIMIZATION: General limiter for lighter Read operations
// Allows for frequent dashboard polling without hitting strict limits
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});