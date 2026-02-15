import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { ExtractedOrder, ChatMessage, ExtractedChatOrder } from "@shared/schema";
import { log, logError } from "./index";

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";
const CHAT_EXTRACT_MODEL = "claude-sonnet-4-5-20250929";

const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 1;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: REQUEST_TIMEOUT_MS,
});

async function callClaudeWithRetry(
  model: string,
  system: string,
  userContent: string,
): Promise<string> {
  let lastError: Error | null = null;
  const callStart = Date.now();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        log(`Retry attempt ${attempt} for Claude API call`, "warn");
      }

      log(`Claude API call starting (model: ${model}, input: ${userContent.length} chars)`, "anthropic");
      const attemptStart = Date.now();

      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: userContent }],
      });

      const elapsed = Date.now() - attemptStart;
      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      log(`Claude API responded in ${elapsed}ms (${text.length} chars, usage: ${response.usage.input_tokens}in/${response.usage.output_tokens}out)`, "anthropic");
      return text;
    } catch (error: any) {
      lastError = error;
      const elapsed = Date.now() - callStart;
      logError(
        `Claude API call failed after ${elapsed}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${error.message}`,
        error instanceof Error ? error : undefined,
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw new Error(`Claude API failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

function parseJsonResponse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("AI extraction failed");
  }
}

const SYSTEM_PROMPT = `You are an AI assistant that extracts order details from WhatsApp messages sent to Indian businesses.
These messages can be in English, Hindi, Hinglish (Hindi written in English), or any Indian language.

Your job is to parse the message and return a structured JSON object with the following fields:
- customerName (string or null): The customer's name if mentioned
- customerPhone (string or null): The customer's phone number if mentioned
- items (array): List of items ordered, each with:
  - name (string): Item name
  - quantity (number): Quantity ordered
  - unit (string or null): Unit of measurement (kg, pcs, dozen, litre, packet, etc.)
  - pricePerUnit (number or null): Price per unit if mentioned
  - totalPrice (number or null): Total price for this item if mentioned
- totalAmount (number or null): Total order amount if mentioned or calculable
- currency (string): Always "INR"
- notes (string or null): Any special instructions, delivery details, or additional notes
- confidence (number): Your confidence in the extraction accuracy from 0 to 1

Important rules:
- Be smart about Indian units and colloquial terms (e.g., "kilo" = kg, "darjan" = dozen = 12 pcs)
- Handle Hinglish naturally (e.g., "2 kilo aloo" = 2 kg potatoes)
- If prices are mentioned in various formats (₹, Rs, Rs., rupees), normalize them as numbers
- Extract delivery addresses or special instructions as notes
- If the message is not an order at all, still return a valid JSON with empty items array and low confidence

Return ONLY valid JSON, no markdown, no explanation.`;

export async function extractOrderFromMessage(
  rawMessage: string,
): Promise<ExtractedOrder> {
  log(`Extracting order from single message (${rawMessage.length} chars)`, "anthropic");

  const text = await callClaudeWithRetry(DEFAULT_MODEL_STR, SYSTEM_PROMPT, rawMessage);
  const parsed = parseJsonResponse(text);

  log(`Extraction complete — ${parsed.items?.length || 0} items found`, "anthropic");

  const order: ExtractedOrder = {
    id: randomUUID(),
    customerName: parsed.customerName || undefined,
    customerPhone: parsed.customerPhone || undefined,
    items: Array.isArray(parsed.items)
      ? parsed.items.map((item: any) => ({
          name: String(item.name || "Unknown"),
          quantity: Number(item.quantity) || 1,
          unit: item.unit || undefined,
          pricePerUnit:
            item.pricePerUnit != null ? Number(item.pricePerUnit) : undefined,
          totalPrice:
            item.totalPrice != null ? Number(item.totalPrice) : undefined,
        }))
      : [],
    totalAmount:
      parsed.totalAmount != null ? Number(parsed.totalAmount) : undefined,
    currency: "INR",
    notes: parsed.notes || undefined,
    rawMessage,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  return order;
}

const CHAT_EXTRACT_SYSTEM_PROMPT = `You are an AI assistant for Indian SMBs extracting order details from WhatsApp conversations. You are an expert in Indian business communication patterns and Hinglish (Hindi-English mix).

LANGUAGE & CULTURAL CONTEXT:
- "bhaiya", "didi", "aunty", "uncle", "ji" are respectful address terms — NOT customer names
- "chahiye" = need/want, "bhej do" / "bhejiye" = please send, "kitna" = how much
- "wala/wali" = "the one", used for referencing previously discussed items (e.g., "wo wala" = "that one")
- "piece" / "pcs" = individual units
- "darjan" / "dozen" = 12 pieces
- "kilo" = kg, "litre" = L, "packet" / "dabba" = pack
- Numbers can be written as digits ("5") or words ("five", "paanch", "das" = 10, "bees" = 20)
- "aur" = and, "bhi" = also

EDGE CASES YOU MUST HANDLE:
1. VAGUE REFERENCES: When someone says "wo wala", "last time wala", "same as before" — describe the item as best you can from context (e.g., "yellow kurti (referenced from previous order)"). Set confidence to "medium" or "low" if the item is ambiguous.
2. PRICE NEGOTIATION: If original and negotiated prices are discussed, use the FINAL agreed price. If no final agreement, use the last mentioned price. If no price at all, set price to null — never fail or make up prices.
3. CUSTOMER NAME: Extract from the "sender" field in the messages. If sender is generic like "Customer" or unnamed, default to "Customer".
4. MISSING PRICES: Always set price to null when not mentioned. Never guess or fabricate prices. Set total to null if prices are unavailable.
5. DATES & DEADLINES:
   - "kal" = tomorrow, "parso" = day after tomorrow
   - "aaj" = today
   - "Friday tak" = by Friday
   - "next week", "is hafte", "agle hafte" = next week
   - "jaldi" = soon/urgent
   - Keep delivery_date in natural language as stated.
6. NON-ORDER MESSAGES: Greetings ("Hi", "Hello", "Namaste"), pleasantries, and follow-ups are common. Ignore them and focus only on order-related content. If the conversation has NO order content at all, return empty items array with confidence "low".

OUTPUT FORMAT — return ONLY this JSON structure, no markdown fences:
{
  "customer_name": "string or null (use sender name, default to 'Customer' if unknown)",
  "items": [
    {
      "product_name": "string (descriptive, include color/size/variant if mentioned)",
      "quantity": number,
      "price": number_or_null (per unit final price, null if not mentioned)
    }
  ],
  "delivery_address": "string or null",
  "delivery_date": "string or null (keep in natural language as stated)",
  "special_instructions": "string or null (any notes, preferences, urgency)",
  "total": number_or_null (calculate only if all item prices are known, else null),
  "confidence": "high | medium | low"
}

CONFIDENCE GUIDE:
- "high": Clear items, quantities, and (optionally) prices stated explicitly
- "medium": Items identifiable but some ambiguity (vague references, missing details)
- "low": Very unclear, mostly chit-chat, or heavily relies on context not in the conversation`;

export async function extractOrderFromChat(
  messages: ChatMessage[],
): Promise<ExtractedChatOrder> {
  log(
    `Extracting order from chat (${messages.length} messages, senders: ${Array.from(new Set(messages.map((m) => m.sender))).join(", ")})`,
    "anthropic",
  );

  const conversationText = messages
    .map((m) => `${m.sender}: ${m.text}`)
    .join("\n");

  const text = await callClaudeWithRetry(
    CHAT_EXTRACT_MODEL,
    CHAT_EXTRACT_SYSTEM_PROMPT,
    conversationText,
  );
  const parsed = parseJsonResponse(text);

  log(
    `Chat extraction complete — customer: ${parsed.customer_name || "unknown"}, ${parsed.items?.length || 0} items, confidence: ${parsed.confidence}`,
    "anthropic",
  );

  const order: ExtractedChatOrder = {
    id: String(Date.now()),
    customer_name: parsed.customer_name || null,
    items: Array.isArray(parsed.items)
      ? parsed.items.map((item: any) => ({
          product_name: String(item.product_name || item.name || "Unknown"),
          quantity: Number(item.quantity) || 1,
          price: item.price != null ? Number(item.price) : null,
        }))
      : [],
    delivery_address: parsed.delivery_address || null,
    delivery_date: parsed.delivery_date || null,
    special_instructions: parsed.special_instructions || null,
    total: parsed.total != null ? Number(parsed.total) : null,
    confidence: ["high", "medium", "low"].includes(parsed.confidence)
      ? parsed.confidence
      : "medium",
    status: "pending",
    created_at: new Date().toISOString(),
    raw_messages: messages,
  };

  return order;
}
