import { z } from "zod";
import { pgTable, text, real, jsonb, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";

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
  product_name: z.string().min(1, "Product name cannot be empty"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  price: z.number().min(0, "Price cannot be negative").nullable().optional(),
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
  igst: z.number().optional(),
  total: z.number(),
  business_name: z.string(),
  gst_number: z.string(),
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
  invoice: invoiceSchema.nullable().optional(),
});

export const updateChatOrderSchema = z.object({
  customer_name: z.string().min(1, "Customer name cannot be empty").nullable().optional(),
  items: z.array(extractedChatOrderItemSchema).optional(),
  delivery_address: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  special_instructions: z.string().nullable().optional(),
  total: z.number().min(0, "Total cannot be negative").nullable().optional(),
}).strict("Request body contains invalid or restricted fields.");

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type ExtractedOrder = z.infer<typeof extractedOrderSchema>;
export type ExtractOrderRequest = z.infer<typeof extractOrderRequestSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ExtractOrderFromChatRequest = z.infer<typeof extractOrderFromChatRequestSchema>;
export type ExtractedChatOrderItem = z.infer<typeof extractedChatOrderItemSchema>;
export type ExtractedChatOrder = z.infer<typeof extractedChatOrderSchema>;
export type UpdateChatOrderRequest = z.infer<typeof updateChatOrderSchema>; 
export type InsertUser = { username: string; password: string };
export type Organization = typeof organizationsTable.$inferSelect;
export type User = { id: string; username: string; password: string };

// ==========================================
// NORMALIZED & CONSOLIDATED DB TABLES
// ==========================================

// Multi-tenancy: Each organization is a business using the platform
export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gstNumber: text("gst_number"),
  tier: text("tier").default("free").notNull(), // 'free' | 'pro' | 'enterprise'
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// Business identity & tax config per organization (1:1 with organizations)
export const businessProfilesTable = pgTable("business_profiles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull().unique(),
  businessName: text("business_name").notNull(),
  gstNumber: text("gst_number"),
  taxRate: real("tax_rate").default(18.0),     // configurable per business (e.g. 3% for jewelry, 18% for consulting)
  currency: text("currency").default("INR"),
  logoUrl: text("logo_url"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const customersTable = pgTable("customers", {
  id: text("id").primaryKey(),
  // Multi-tenancy isolation: customers belong to a single organization
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  name: text("name"),
  // Removed global unique() — same phone can appear across different organizations
  phone: text("phone"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    // Phone is unique only within an organization
    orgPhoneIdx: index("org_phone_idx").on(table.organizationId, table.phone),
  };
});

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  
  // Multi-tenancy isolation: orders belong to a single organization
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  
  customerId: text("customer_id").references(() => customersTable.id).notNull(),
  
  extractionType: text("extraction_type").notNull(), 
  
  rawAiResponse: jsonb("raw_ai_response").notNull(), // Raw AI extraction — kept for audit/debug only
  totalAmount: real("total_amount"),
  currency: text("currency").default("INR"),
  
  deliveryDate: timestamp("delivery_date", { mode: 'string' }),
  deliveryAddress: text("delivery_address"),
  specialInstructions: text("special_instructions"),
  
  rawMessages: jsonb("raw_messages").notNull(),
  confidence: text("confidence").notNull(),
  status: text("status").default("pending").notNull(),
  invoice: jsonb("invoice").$type<Invoice>(),

  invoiceSequence: integer("invoice_sequence"),
  
  deletedAt: timestamp("deleted_at", { mode: 'string' }),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index("status_idx").on(table.status),
    extractionTypeIdx: index("extraction_type_idx").on(table.extractionType),
    customerIdIdx: index("customer_id_idx").on(table.customerId),
    // Index for frequent organization-level queries
    orgIdx: index("org_idx").on(table.organizationId),
    rawAiResponseGinIdx: index("raw_ai_response_gin_idx").using("gin", table.rawAiResponse),
    rawMessagesGinIdx: index("raw_messages_gin_idx").using("gin", table.rawMessages),
  };
});

// PRODUCTS TABLE — per-org product catalog
export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  name: text("name").notNull(),
  unit: text("unit"),            // e.g. "kg", "pcs", "dozen"
  defaultPrice: real("default_price"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    orgProductNameIdx: index("org_product_name_idx").on(table.organizationId, table.name),
  };
});

// ORDER ITEMS TABLE — normalized line items (one row per item per order)
export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => ordersTable.id).notNull(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  // Optional soft-link to a known product in the catalog
  productId: text("product_id").references(() => productsTable.id),
  productName: text("product_name").notNull(), // denormalized for speed
  quantity: real("quantity").notNull(),
  unit: text("unit"),
  pricePerUnit: real("price_per_unit"),
  totalPrice: real("total_price"),
}, (table) => {
  return {
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    orgIdx: index("order_items_org_idx").on(table.organizationId),
  };
});

// ==========================================
// AUTH & ACCESS TABLES
// ==========================================

// ROLES & PERMISSIONS TABLE (RBAC — replaces hardcoded role arrays)
export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  name: text("name").notNull(), // 'owner' | 'admin' | 'manager' | 'auditor' | 'member'
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  // e.g. ['view_orders','edit_orders','view_pii','manage_users','manage_billing']
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// USERS TABLE (Mirrors Neon Auth)
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Matches neon_auth.user.id
  email: text("email").notNull(),
  name: text("name"),

  // Link User -> Organization
  organizationId: text("organization_id").references(() => organizationsTable.id),

  role: text("role").default("member"), // 'owner' | 'member'
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// API KEYS TABLE (For WhatsApp Bots/Machines)
export const apiKeysTable = pgTable("api_keys", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),

  keyHash: text("key_hash").notNull(),     // Store SHA-256 hash, NOT the raw key
  name: text("name").notNull(),            // e.g. "Production Bot"
  maskedKey: text("masked_key").notNull(), // e.g. "sk_...9a2f"

  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    hashIdx: index("api_key_hash_idx").on(table.keyHash),
  };
});