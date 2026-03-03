import { z } from "zod";
import { pgTable, text, numeric, jsonb, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";

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

// --- Database tables ---

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gstNumber: text("gst_number"),
  tier: text("tier").default("free").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

/** Business identity & tax config (1:1 with organizations). */
export const businessProfilesTable = pgTable("business_profiles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull().unique(),
  businessName: text("business_name").notNull(),
  gstNumber: text("gst_number"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("18.00"),
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
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  name: text("name"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    orgPhoneIdx: index("org_phone_idx").on(table.organizationId, table.phone),
  };
});

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  customerId: text("customer_id").references(() => customersTable.id).notNull(),
  extractionType: text("extraction_type").notNull(), 
  rawAiResponse: jsonb("raw_ai_response").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
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
    orgIdx: index("org_idx").on(table.organizationId),
    rawAiResponseGinIdx: index("raw_ai_response_gin_idx").using("gin", table.rawAiResponse),
    rawMessagesGinIdx: index("raw_messages_gin_idx").using("gin", table.rawMessages),
  };
});

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  name: text("name").notNull(),
  unit: text("unit"),
  defaultPrice: numeric("default_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    orgProductNameIdx: index("org_product_name_idx").on(table.organizationId, table.name),
  };
});

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => ordersTable.id).notNull(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  productId: text("product_id").references(() => productsTable.id),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: text("unit"),
  pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2 }),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
}, (table) => {
  return {
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    orgIdx: index("order_items_org_idx").on(table.organizationId),
  };
});

// --- Auth & access tables ---

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  name: text("name").notNull(),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  organizationId: text("organization_id").references(() => organizationsTable.id),
  role: text("role").default("member"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const apiKeysTable = pgTable("api_keys", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizationsTable.id).notNull(),
  keyHash: text("key_hash").notNull(),
  name: text("name").notNull(),
  maskedKey: text("masked_key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
  return {
    hashIdx: index("api_key_hash_idx").on(table.keyHash),
  };
});

// --- Drizzle-Zod derived schemas (DRY: single source of truth) ---

export const insertOrderSchema = createInsertSchema(ordersTable);
export const selectOrderSchema = createSelectSchema(ordersTable);
export const updateOrderDbSchema = createUpdateSchema(ordersTable);

export const insertOrderItemSchema = createInsertSchema(orderItemsTable);
export const selectOrderItemSchema = createSelectSchema(orderItemsTable);

export const insertUserSchema = createInsertSchema(usersTable);
export const selectUserSchema = createSelectSchema(usersTable);

export const insertCustomerSchema = createInsertSchema(customersTable);
export const selectCustomerSchema = createSelectSchema(customersTable);

export const insertBusinessProfileSchema = createInsertSchema(businessProfilesTable);
export const selectBusinessProfileSchema = createSelectSchema(businessProfilesTable);

export const insertOrganizationSchema = createInsertSchema(organizationsTable);
export const selectOrganizationSchema = createSelectSchema(organizationsTable);

// --- Drizzle-Zod inferred types (replace manual type declarations) ---

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type SelectOrder = z.infer<typeof selectOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type SelectCustomer = z.infer<typeof selectCustomerSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type SelectBusinessProfile = z.infer<typeof selectBusinessProfileSchema>;