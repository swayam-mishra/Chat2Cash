import { z } from "zod";
import { pgTable, text, real, jsonb } from "drizzle-orm/pg-core";

export const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string().optional(),
  pricePerUnit: z.number().optional(),
  totalPrice: z.number().optional(),
});

export const extractedOrderSchema = z.object({
  id: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(orderItemSchema),
  totalAmount: z.number().optional(),
  currency: z.string().default("INR"),
  notes: z.string().optional(),
  rawMessage: z.string(),
  confidence: z.number().min(0).max(1),
  status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]).default("pending"),
  createdAt: z.string(),
});

export const extractOrderRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const chatMessageSchema = z.object({
  sender: z.string(),
  text: z.string(),
});

export const extractOrderFromChatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message is required"),
});

export const extractedChatOrderItemSchema = z.object({
  product_name: z.string(),
  quantity: z.number(),
  price: z.number().nullable().optional(),
});

export const extractedChatOrderSchema = z.object({
  id: z.string(),
  customer_name: z.string().nullable().optional(),
  items: z.array(extractedChatOrderItemSchema),
  delivery_address: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  special_instructions: z.string().nullable().optional(),
  total: z.number().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  status: z.string().default("pending"),
  created_at: z.string(),
  raw_messages: z.array(chatMessageSchema),
});

// NEW: Schema for validating edit requests
export const updateChatOrderSchema = z.object({
  customer_name: z.string().nullable().optional(),
  items: z.array(extractedChatOrderItemSchema).optional(),
  delivery_address: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  special_instructions: z.string().nullable().optional(),
  total: z.number().nullable().optional(),
});

export const invoiceItemSchema = z.object({
  product_name: z.string(),
  quantity: z.number(),
  price: z.number(),
  amount: z.number(),
});

export const invoiceSchema = z.object({
  invoice_number: z.string(),
  date: z.string(),
  customer_name: z.string(),
  items: z.array(invoiceItemSchema),
  subtotal: z.number(),
  cgst: z.number(),
  sgst: z.number(),
  total: z.number(),
  business_name: z.string(),
  gst_number: z.string(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type ExtractedOrder = z.infer<typeof extractedOrderSchema>;
export type ExtractOrderRequest = z.infer<typeof extractOrderRequestSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ExtractOrderFromChatRequest = z.infer<typeof extractOrderFromChatRequestSchema>;
export type ExtractedChatOrderItem = z.infer<typeof extractedChatOrderItemSchema>;
export type ExtractedChatOrder = z.infer<typeof extractedChatOrderSchema>;
export type UpdateChatOrderRequest = z.infer<typeof updateChatOrderSchema>; // NEW Type
export type InsertUser = { username: string; password: string };
export type User = { id: string; username: string; password: string };

export const extractedOrdersTable = pgTable("extracted_orders", {
  id: text("id").primaryKey(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  totalAmount: real("total_amount"),
  currency: text("currency").default("INR"),
  notes: text("notes"),
  rawMessage: text("raw_message").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: text("created_at").notNull(),
});

// Define the Chat Orders table
export const chatOrdersTable = pgTable("chat_orders", {
  id: text("id").primaryKey(),
  customer_name: text("customer_name"),
  items: jsonb("items").$type<ExtractedChatOrderItem[]>().notNull(),
  delivery_address: text("delivery_address"),
  delivery_date: text("delivery_date"),
  special_instructions: text("special_instructions"),
  total: real("total"),
  confidence: text("confidence").notNull(),
  status: text("status").default("pending").notNull(),
  created_at: text("created_at").notNull(),
  raw_messages: jsonb("raw_messages").$type<ChatMessage[]>().notNull(),
  invoice: jsonb("invoice").$type<Invoice>(),
});

export const extractedOrdersTable = pgTable("extracted_orders", { /* ... */ });
export const chatOrdersTable = pgTable("chat_orders", { /* ... */ });