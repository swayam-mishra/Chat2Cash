import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { ExtractedOrder, ChatMessage, ExtractedChatOrder } from "../schema";
import { log, logError } from "../middlewares/logger";
import { getPrompt } from "./promptManager";
import { env } from "../config/env";
import { getEncoding, type Tiktoken } from "js-tiktoken";

/**
 * cl100k_base is the closest public approximation to Claude's BPE tokenizer.
 * It consistently handles multi-byte scripts (Devanagari, Arabic, CJK) which
 * can consume 2-3× more tokens per character than ASCII — the root cause of
 * accidental Token Limit Exceeded errors on Hinglish conversations.
 */
let _encoder: Tiktoken | null = null;
function getEncoder(): Tiktoken {
  if (!_encoder) _encoder = getEncoding("cl100k_base");
  return _encoder;
}

function countTokens(text: string): number {
  return getEncoder().encode(text).length;
}

const DEFAULT_MODEL_STR = env.AI_MODEL_SMART;
const CHAT_EXTRACT_MODEL = env.AI_MODEL_SMART;

const REQUEST_TIMEOUT_MS = parseInt(env.AI_REQUEST_TIMEOUT_MS);
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 10000;

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  timeout: REQUEST_TIMEOUT_MS,
});

/**
 * Trim the message list so the conversation fits within maxTokens.
 *
 * Uses the cl100k_base tokenizer (js-tiktoken) instead of character count.
 * Character count is unreliable for mixed-language text: Devanagari/Hindi
 * script consumes ~2-3 tokens per character, so a 12 000-char limit can
 * silently exceed Claude's input budget on Hinglish chats.
 *
 * Token budget is deliberately set 20 % below the character-equivalent
 * to leave headroom for the system prompt and output tokens.
 */
function applySlidingWindow(messages: ChatMessage[], maxTokens: number = 8000): ChatMessage[] {
  let currentTokens = 0;
  const pruned: ChatMessage[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    // Approximate the wire format seen by the model: "sender: text\n"
    const line = `${messages[i].sender}: ${messages[i].text}\n`;
    const lineTokens = countTokens(line);
    if (currentTokens + lineTokens > maxTokens) break;
    currentTokens += lineTokens;
    pruned.unshift(messages[i]);
  }

  log(`applySlidingWindow: kept ${pruned.length}/${messages.length} messages (~${currentTokens} tokens)`, "anthropic");
  return pruned;
}

/** Exponential backoff with jitter to avoid thundering herd on simultaneous failures. */
const calculateBackoff = (attempt: number): number => {
  const baseDelay = Math.min(
    MAX_RETRY_DELAY,
    INITIAL_RETRY_DELAY * Math.pow(2, attempt)
  );
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
};

async function extractWithTool(
  model: string,
  systemPrompt: string,
  userContent: string,
  toolName: string,
  toolSchema: any
): Promise<any> {
  let lastError: Error | null = null;
  const callStart = Date.now();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        log(`Retry attempt ${attempt}/${MAX_RETRIES} for Claude API call`, "warn");
      }

      log(`Claude API call starting (model: ${model}, input: ${userContent.length} chars)`, "anthropic");
      const attemptStart = Date.now();

      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: [
          {
            type: "text" as const,
            text: systemPrompt,
            cache_control: { type: "ephemeral" } 
          } as any,
        ],
        tools: [{
          name: toolName,
          description: "Record structured order details from the provided message/chat",
          input_schema: toolSchema
        }],
        tool_choice: { type: "tool", name: toolName },
        messages: [{ role: "user", content: userContent }],
      });

      const elapsed = Date.now() - attemptStart;
      
      const toolCall = response.content.find(block => block.type === "tool_use");
      if (!toolCall || toolCall.type !== "tool_use") {
        throw new Error("Claude did not return the expected structured tool call.");
      }

      log(`Claude API responded in ${elapsed}ms (usage: ${response.usage.input_tokens}in/${response.usage.output_tokens}out)`, "anthropic");
      
      return toolCall.input;

    } catch (error: any) {
      lastError = error;
      const elapsed = Date.now() - callStart;
      const status = error?.status ?? error?.statusCode ?? 0;
      const isClientError = status >= 400 && status < 500 && status !== 429;
      const isRateLimit = status === 429;
      
      // Fail fast on client errors (e.g. invalid API key)
      if (isClientError) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        let delay: number;

        // Respect Retry-After header from 429 responses
        if (isRateLimit && error.headers?.["retry-after"]) {
          const retryAfterSec = Number(error.headers["retry-after"]);
          delay = (isNaN(retryAfterSec) ? calculateBackoff(attempt) : retryAfterSec * 1000);
          log(`Rate limited (429). Using Retry-After header: ${Math.round(delay)}ms`, "anthropic");
        } else {
          delay = calculateBackoff(attempt);
          log(`${isRateLimit ? "Rate limited (429)" : "Server error"}. Backoff: ${Math.round(delay)}ms`, "anthropic");
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Claude API failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

export async function extractOrderFromMessage(rawMessage: string): Promise<ExtractedOrder> {
  log(`Extracting order from single message (${rawMessage.length} chars)`, "anthropic");

  const systemPrompt = getPrompt("SINGLE_MESSAGE_EXTRACT", "v1");
  const toolSchema = {
    type: "object",
    properties: {
      customerName: { type: ["string", "null"] },
      customerPhone: { type: ["string", "null"] },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            unit: { type: ["string", "null"] },
            pricePerUnit: { type: ["number", "null"] },
            totalPrice: { type: ["number", "null"] }
          },
          required: ["name", "quantity"]
        }
      },
      totalAmount: { type: ["number", "null"] },
      notes: { type: ["string", "null"] },
      confidence: { type: "number", description: "Confidence score from 0.0 to 1.0" }
    },
    required: ["items", "confidence"]
  };

  const parsed = await extractWithTool(DEFAULT_MODEL_STR, systemPrompt, rawMessage, "record_order", toolSchema);

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
          pricePerUnit: item.pricePerUnit != null ? Number(item.pricePerUnit) : undefined,
          totalPrice: item.totalPrice != null ? Number(item.totalPrice) : undefined,
        }))
      : [],
    totalAmount: parsed.totalAmount != null ? Number(parsed.totalAmount) : undefined,
    currency: "INR",
    notes: parsed.notes || undefined,
    rawMessage,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  return order;
}

export async function extractOrderFromChat(messages: ChatMessage[]): Promise<ExtractedChatOrder> {
  const optimizedMessages = applySlidingWindow(messages);
  log(`Extracting order from chat (${optimizedMessages.length} messages, senders: ${Array.from(new Set(optimizedMessages.map((m) => m.sender))).join(", ")})`, "anthropic");

  const conversationText = optimizedMessages.map((m) => `${m.sender}: ${m.text}`).join("\n");
  const systemPrompt = getPrompt("CHAT_EXTRACT", "v1");
  
  const toolSchema = {
    type: "object",
    properties: {
      customer_name: { type: ["string", "null"] },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            quantity: { type: "number" },
            price: { type: ["number", "null"] }
          },
          required: ["product_name", "quantity"]
        }
      },
      delivery_address: { type: ["string", "null"] },
      delivery_date: { type: ["string", "null"] },
      special_instructions: { type: ["string", "null"] },
      total: { type: ["number", "null"] },
      confidence: { type: "string", enum: ["high", "medium", "low"] }
    },
    required: ["items", "confidence"]
  };

  const parsed = await extractWithTool(CHAT_EXTRACT_MODEL, systemPrompt, conversationText, "record_chat_order", toolSchema);

  log(`Chat extraction complete — customer: ${parsed.customer_name || "unknown"}, ${parsed.items?.length || 0} items, confidence: ${parsed.confidence}`, "anthropic");

  const order: ExtractedChatOrder = {
    id: randomUUID(),
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

export async function* streamExtractOrderFromChat(messages: ChatMessage[]) {
  const optimizedMessages = applySlidingWindow(messages);
  const conversationText = optimizedMessages.map((m) => `${m.sender}: ${m.text}`).join("\n");
  const systemPrompt = getPrompt("CHAT_EXTRACT", "v1");

  const stream = await anthropic.messages.create({
    model: CHAT_EXTRACT_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      } as any,
    ],
    messages: [{ role: "user", content: conversationText }],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text;
    }
  }
}