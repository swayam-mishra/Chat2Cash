import { ExtractedOrder, ExtractedChatOrder, Invoice, Organization } from "../schema";
import { db } from "../config/db";
import { ordersTable, customersTable, organizationsTable, productsTable, orderItemsTable } from "../schema";
import { eq, desc, max, count, sum, and, isNull, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Organization
  getOrganization(orgId: string): Promise<Organization | undefined>;

  // Single-message orders (scoped by org)
  getOrders(orgId: string): Promise<ExtractedOrder[]>;
  getOrder(orgId: string, id: string): Promise<ExtractedOrder | undefined>;
  addOrder(orgId: string, order: ExtractedOrder): Promise<ExtractedOrder>;
  updateOrderStatus(orgId: string, id: string, status: ExtractedOrder["status"]): Promise<ExtractedOrder | undefined>;
  deleteOrder(orgId: string, id: string): Promise<boolean>;
  
  // Chat orders (scoped by org)
  getChatOrders(orgId: string, limit?: number, offset?: number): Promise<ExtractedChatOrder[]>;
  getChatOrder(orgId: string, id: string): Promise<ExtractedChatOrder | undefined>;
  addChatOrder(orgId: string, order: ExtractedChatOrder): Promise<ExtractedChatOrder>;
  attachInvoice(orgId: string, orderId: string, invoice: Invoice): Promise<ExtractedChatOrder | undefined>;
  updateChatOrderDetails(orgId: string, id: string, updates: Partial<ExtractedChatOrder>): Promise<ExtractedChatOrder | undefined>;
  generateAndAttachInvoice(orgId: string, orderId: string, generateInvoiceFn: (order: ExtractedChatOrder, nextSequence: number) => Invoice): Promise<ExtractedChatOrder | undefined>;
  
  getChatOrdersCount(orgId: string, statusFilter?: string): Promise<number>;
  getTotalRevenue(orgId: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function mapToExtractedOrder(orderRow: any, customerRow: any, itemRows: any[] = []): ExtractedOrder {
  return {
    id: orderRow.id,
    customerName: customerRow?.name || undefined,
    customerPhone: customerRow?.phone || undefined,
    items: itemRows.length > 0
      ? itemRows.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          unit: i.unit ?? undefined,
          pricePerUnit: i.pricePerUnit ?? undefined,
          totalPrice: i.totalPrice ?? undefined,
        }))
      : orderRow.rawAiResponse ?? [], // fallback to JSONB audit column
    totalAmount: orderRow.totalAmount || undefined,
    currency: orderRow.currency || "INR",
    notes: orderRow.specialInstructions || undefined,
    rawMessage: Array.isArray(orderRow.rawMessages)
      ? orderRow.rawMessages.map((m: any) => m.text).join('\n')
      : orderRow.rawMessages,
    confidence: Number(orderRow.confidence),
    status: orderRow.status,
    createdAt: orderRow.createdAt,
  };
}

function mapToExtractedChatOrder(orderRow: any, customerRow: any, itemRows: any[] = []): ExtractedChatOrder {
  return {
    id: orderRow.id,
    customer_name: customerRow?.name || undefined,
    items: itemRows.length > 0
      ? itemRows.map((i) => ({
          product_name: i.productName,
          quantity: i.quantity,
          price: i.pricePerUnit ?? null,
        }))
      : orderRow.rawAiResponse ?? [], // fallback to JSONB audit column
    delivery_address: orderRow.deliveryAddress || undefined,
    delivery_date: orderRow.deliveryDate || undefined,
    special_instructions: orderRow.specialInstructions || undefined,
    total: orderRow.totalAmount || undefined,
    confidence: orderRow.confidence,
    status: orderRow.status,
    created_at: orderRow.createdAt,
    raw_messages: orderRow.rawMessages,
    invoice: orderRow.invoice || undefined,
  };
}

// ---------------------------------------------------------------------------
// Storage implementation
// ---------------------------------------------------------------------------

export class DatabaseStorage implements IStorage {

  // ==========================================
  // ORGANIZATION
  // ==========================================

  async getOrganization(orgId: string): Promise<Organization | undefined> {
    const result = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId));
    return result[0];
  }

  // ==========================================
  // SINGLE MESSAGE ORDERS
  // ==========================================

  async getOrders(orgId: string): Promise<ExtractedOrder[]> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(and(
        eq(ordersTable.organizationId, orgId),           // 🔒 Data isolation
        eq(ordersTable.extractionType, 'single_message'),
        isNull(ordersTable.deletedAt)
      ))
      .orderBy(desc(ordersTable.createdAt));

    const orderIds = results.map((r) => r.order.id);
    const allItems = orderIds.length > 0
      ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds))
      : [];
    const itemsByOrderId = new Map<string, any[]>();
    for (const item of allItems) {
      const arr = itemsByOrderId.get(item.orderId) ?? [];
      arr.push(item);
      itemsByOrderId.set(item.orderId, arr);
    }

    return results.map((row) =>
      mapToExtractedOrder(row.order, row.customer, itemsByOrderId.get(row.order.id) ?? [])
    );
  }

  async getOrder(orgId: string, id: string): Promise<ExtractedOrder | undefined> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(and(
        eq(ordersTable.id, id),
        eq(ordersTable.organizationId, orgId),           // 🔒 Data isolation
        isNull(ordersTable.deletedAt)
      ));

    if (results.length === 0) return undefined;
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    return mapToExtractedOrder(results[0].order, results[0].customer, items);
  }

  async addOrder(orgId: string, order: ExtractedOrder): Promise<ExtractedOrder> {
    return await db.transaction(async (tx) => {
      const customerId = randomUUID();
      const [customer] = await tx.insert(customersTable).values({
        id: customerId,
        organizationId: orgId,                           // 🔒 Scoped
        name: order.customerName || "Unknown Customer",
        phone: order.customerPhone || undefined,
      }).returning();

      const [newOrder] = await tx.insert(ordersTable).values({
        id: order.id,
        organizationId: orgId,                           // 🔒 Scoped
        customerId: customer.id,
        extractionType: 'single_message',
        rawAiResponse: order.items,                      // audit/debug copy
        totalAmount: order.totalAmount,
        currency: order.currency,
        specialInstructions: order.notes,
        rawMessages: order.rawMessage,
        confidence: String(order.confidence),
        status: order.status,
        createdAt: order.createdAt,
      }).returning();

      // Insert normalized order items
      const itemRows = order.items.length > 0
        ? await tx.insert(orderItemsTable).values(
            order.items.map((item) => ({
              id: randomUUID(),
              orderId: newOrder.id,
              organizationId: orgId,
              productName: item.name,
              quantity: item.quantity,
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              totalPrice: item.totalPrice,
            }))
          ).returning()
        : [];

      return mapToExtractedOrder(newOrder, customer, itemRows);
    });
  }

  async updateOrderStatus(orgId: string, id: string, status: ExtractedOrder["status"]): Promise<ExtractedOrder | undefined> {
    return await db.transaction(async (tx) => {
      const [updatedOrder] = await tx.update(ordersTable)
        .set({ status })
        .where(and(
          eq(ordersTable.id, id),
          eq(ordersTable.organizationId, orgId),         // 🔒 Data isolation
          isNull(ordersTable.deletedAt)
        ))
        .returning();

      if (!updatedOrder) return undefined;

      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, updatedOrder.customerId));
      const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
      return mapToExtractedOrder(updatedOrder, customer, items);
    });
  }

  async deleteOrder(orgId: string, id: string): Promise<boolean> {
    const [deleted] = await db.update(ordersTable)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(
        eq(ordersTable.id, id),
        eq(ordersTable.organizationId, orgId)            // 🔒 Data isolation
      ))
      .returning();
      
    return !!deleted;
  }

  // ==========================================
  // CHAT ORDERS
  // ==========================================

  async getChatOrders(orgId: string, limit: number = 50, offset: number = 0): Promise<ExtractedChatOrder[]> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(and(
        eq(ordersTable.organizationId, orgId),           // 🔒 Data isolation
        eq(ordersTable.extractionType, 'chat_log'),
        isNull(ordersTable.deletedAt)
      ))
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const orderIds = results.map((r) => r.order.id);
    const allItems = orderIds.length > 0
      ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds))
      : [];
    const itemsByOrderId = new Map<string, any[]>();
    for (const item of allItems) {
      const arr = itemsByOrderId.get(item.orderId) ?? [];
      arr.push(item);
      itemsByOrderId.set(item.orderId, arr);
    }

    return results.map((row) =>
      mapToExtractedChatOrder(row.order, row.customer, itemsByOrderId.get(row.order.id) ?? [])
    );
  }

  async getChatOrdersCount(orgId: string, statusFilter?: string): Promise<number> {
    const conditions: any[] = [
      eq(ordersTable.organizationId, orgId),             // 🔒 Data isolation
      eq(ordersTable.extractionType, 'chat_log'),
      isNull(ordersTable.deletedAt),
    ];
    
    if (statusFilter) {
      conditions.push(eq(ordersTable.status, statusFilter));
    }
    
    const result = await db.select({ value: count() })
      .from(ordersTable)
      .where(and(...conditions));
      
    return result[0].value;
  }

  async getTotalRevenue(orgId: string): Promise<number> {
    const result = await db.select({ value: sum(ordersTable.totalAmount) })
      .from(ordersTable)
      .where(and(
        eq(ordersTable.organizationId, orgId),           // 🔒 Data isolation
        eq(ordersTable.extractionType, 'chat_log'),
        isNull(ordersTable.deletedAt)
      ));
      
    return Number(result[0].value || 0);
  }

  async getChatOrder(orgId: string, id: string): Promise<ExtractedChatOrder | undefined> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(and(
        eq(ordersTable.id, id),
        eq(ordersTable.organizationId, orgId),           // 🔒 Data isolation
        isNull(ordersTable.deletedAt)
      ));

    if (results.length === 0) return undefined;
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    return mapToExtractedChatOrder(results[0].order, results[0].customer, items);
  }

  async addChatOrder(orgId: string, order: ExtractedChatOrder): Promise<ExtractedChatOrder> {
    return await db.transaction(async (tx) => {
      // Find or create customer scoped to this organization (match by name+phone when available)
      let customerId: string;
      const lookupConditions: any[] = [eq(customersTable.organizationId, orgId)];
      if (order.customer_name) {
        lookupConditions.push(eq(customersTable.name, order.customer_name));
      }

      const existing = await tx.select()
        .from(customersTable)
        .where(and(...lookupConditions))
        .limit(1);

      if (existing.length > 0) {
        customerId = existing[0].id;
      } else {
        customerId = randomUUID();
        await tx.insert(customersTable).values({
          id: customerId,
          organizationId: orgId,                         // 🔒 Scoped
          name: order.customer_name || "Unknown Customer",
        });
      }

      const [newOrder] = await tx.insert(ordersTable).values({
        id: order.id,
        organizationId: orgId,                           // 🔒 Scoped
        customerId,
        extractionType: 'chat_log',
        items: order.items,
        totalAmount: order.total,
        deliveryAddress: order.delivery_address,
        deliveryDate: order.delivery_date,
        specialInstructions: order.special_instructions,
        rawMessages: order.raw_messages,
        confidence: order.confidence,
        status: order.status,
        createdAt: order.created_at,
      }).returning();

      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, customerId));
      return mapToExtractedChatOrder(newOrder, customer);
    });
  }

  async attachInvoice(orgId: string, orderId: string, invoice: Invoice): Promise<ExtractedChatOrder | undefined> {
    return await db.transaction(async (tx) => {
      const [updatedOrder] = await tx.update(ordersTable)
        .set({ invoice })
        .where(and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.organizationId, orgId),         // 🔒 Data isolation
          isNull(ordersTable.deletedAt)
        ))
        .returning();

      if (!updatedOrder) return undefined;

      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, updatedOrder.customerId));
      const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
      return mapToExtractedChatOrder(updatedOrder, customer, items);
    });
  }

  async updateChatOrderDetails(orgId: string, id: string, updates: Partial<ExtractedChatOrder>): Promise<ExtractedChatOrder | undefined> {
    return await db.transaction(async (tx) => {
      const dbUpdates: any = {};
      // Note: items are managed in the normalized order_items table, not as a JSONB column
      if (updates.total !== undefined) dbUpdates.totalAmount = updates.total;
      if (updates.delivery_address !== undefined) dbUpdates.deliveryAddress = updates.delivery_address;
      if (updates.delivery_date !== undefined) dbUpdates.deliveryDate = updates.delivery_date;
      if (updates.special_instructions !== undefined) dbUpdates.specialInstructions = updates.special_instructions;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const [updatedOrder] = await tx.update(ordersTable)
        .set(dbUpdates)
        .where(and(
          eq(ordersTable.id, id),
          eq(ordersTable.organizationId, orgId),         // 🔒 Data isolation
          isNull(ordersTable.deletedAt)
        ))
        .returning();

      if (!updatedOrder) return undefined;

      // Update normalized items if provided (delete-then-insert pattern)
      let itemRows: any[] = [];
      if (updates.items !== undefined) {
        await tx.delete(orderItemsTable).where(eq(orderItemsTable.orderId, id));
        if (updates.items.length > 0) {
          itemRows = await tx.insert(orderItemsTable).values(
            updates.items.map((item) => ({
              id: randomUUID(),
              orderId: id,
              organizationId: orgId,
              productName: item.product_name,
              quantity: item.quantity,
              pricePerUnit: item.price ?? undefined,
              totalPrice: item.price != null ? item.quantity * item.price : undefined,
            }))
          ).returning();
        }
      } else {
        itemRows = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
      }

      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, updatedOrder.customerId));

      if (updates.customer_name && updates.customer_name !== customer.name) {
        const [updatedCustomer] = await tx.update(customersTable)
          .set({ name: updates.customer_name })
          .where(and(
            eq(customersTable.id, customer.id),
            eq(customersTable.organizationId, orgId)     // 🔒 Data isolation
          ))
          .returning();
        return mapToExtractedChatOrder(updatedOrder, updatedCustomer, itemRows);
      }

      return mapToExtractedChatOrder(updatedOrder, customer, itemRows);
    });
  }

  // ==========================================
  // TRANSACTIONAL BUSINESS LOGIC
  // ==========================================

  async generateAndAttachInvoice(
    orgId: string,
    orderId: string,
    generateInvoiceFn: (order: ExtractedChatOrder, nextSequence: number) => Invoice,
  ): Promise<ExtractedChatOrder | undefined> {
    return await db.transaction(async (tx) => {
      const result = await tx.select({ order: ordersTable, customer: customersTable })
        .from(ordersTable)
        .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
        .where(and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.organizationId, orgId),         // 🔒 Data isolation
          isNull(ordersTable.deletedAt)
        ));

      if (result.length === 0) {
        tx.rollback();
        return undefined;
      }

      // Invoice sequence is scoped per organization so each org has its own INV-YYYY-NNN series
      const maxSeqResult = await tx.select({ maxSeq: max(ordersTable.invoiceSequence) })
        .from(ordersTable)
        .where(eq(ordersTable.organizationId, orgId));   // 🔒 Org-scoped sequence
        
      const nextSequenceNumber = (maxSeqResult[0]?.maxSeq || 0) + 1;

      const { order: dbOrder, customer: dbCustomer } = result[0];
      // Load normalized items once — used for both invoice generation and the return value
      const orderItems = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
      const chatOrder = mapToExtractedChatOrder(dbOrder, dbCustomer, orderItems);
      
      const invoiceData = generateInvoiceFn(chatOrder, nextSequenceNumber);

      const [updatedOrder] = await tx.update(ordersTable)
        .set({ 
          invoice: invoiceData,
          invoiceSequence: nextSequenceNumber,
          status: "confirmed",
        })
        .where(and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.organizationId, orgId)          // 🔒 Security check
        ))
        .returning();

      return mapToExtractedChatOrder(updatedOrder, dbCustomer, orderItems);
    });
  }
}

export const storage = new DatabaseStorage();
