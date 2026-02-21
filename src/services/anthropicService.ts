import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { ExtractedOrder, ChatMessage, ExtractedChatOrder } from "../schema";
import { log, logError } from "../middlewares/logger";
import { getPrompt } from "./promptManager";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

// NEW: Fail-fast validation for the API Key at startup
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("CRITICAL: ANTHROPIC_API_KEY environment variable is missing. The AI extraction service cannot start.");
}

// Updated to the valid standard models that support prompt caching and tool use
const DEFAULT_MODEL_STR = "claude-3-5-sonnet-20241022";
const CHAT_EXTRACT_MODEL = "claude-3-5-sonnet-20241022";

const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 1;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: REQUEST_TIMEOUT_MS,
});

// Utility: Sliding Window to prevent exceeding token limits on long chats
function applySlidingWindow(messages: ChatMessage[], maxChars: number = 12000): ChatMessage[] {
  let currentCount = 0;
  const pruned: ChatMessage[] = [];
  
  // Iterate backwards to keep the most recent messages (bottom of chat)
  for (let i = messages.length - 1; i >= 0; i--) {
    currentCount += messages[i].text.length;
    if (currentCount > maxChars) break;
    pruned.unshift(messages[i]);
  }
  
  return pruned;
}

// Utility: Core tool invocation leveraging Prompt Caching 
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
        log(`Retry attempt ${attempt} for Claude API call`, "warn");
      }

      log(`Claude API call starting (model: ${model}, input: ${userContent.length} chars)`, "anthropic");
      const attemptStart = Date.now();

      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" } // Prompt Caching
          }
        ],
        tools: [{
          name: toolName,
          description: "Record structured order details from the provided message/chat",
          input_schema: toolSchema
        }],
        tool_choice: { type: "tool", name: toolName }, // Forces Claude to use this tool
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
    raw_messages: messages, // We preserve full original array in database
  };

  return order;
}

// Implement Streaming extraction capability to report progress for long sequences
export async function* streamExtractOrderFromChat(messages: ChatMessage[]) {
  const optimizedMessages = applySlidingWindow(messages);
  const conversationText = optimizedMessages.map((m) => `${m.sender}: ${m.text}`).join("\n");
  const systemPrompt = getPrompt("CHAT_EXTRACT", "v1");

  const stream = await anthropic.messages.create({
    model: CHAT_EXTRACT_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }
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