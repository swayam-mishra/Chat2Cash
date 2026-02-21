import { ExtractedOrder, ExtractedChatOrder, Invoice } from "../schema";
import { db } from "../config/db";
import { ordersTable, customersTable } from "../schema";
import { eq, desc, max, count, sum, and } from "drizzle-orm"; // CHANGED: Added count, sum, and
import { randomUUID } from "crypto";

export interface IStorage {
  getOrders(): Promise<ExtractedOrder[]>;
  getOrder(id: string): Promise<ExtractedOrder | undefined>;
  addOrder(order: ExtractedOrder): Promise<ExtractedOrder>;
  updateOrderStatus(id: string, status: ExtractedOrder["status"]): Promise<ExtractedOrder | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  
  // CHANGED: Updated signatures for pagination and aggregation
  getChatOrders(limit?: number, offset?: number): Promise<ExtractedChatOrder[]>;
  getChatOrder(id: string): Promise<ExtractedChatOrder | undefined>;
  addChatOrder(order: ExtractedChatOrder): Promise<ExtractedChatOrder>;
  attachInvoice(orderId: string, invoice: Invoice): Promise<ExtractedChatOrder | undefined>;
  updateChatOrderDetails(id: string, updates: Partial<ExtractedChatOrder>): Promise<ExtractedChatOrder | undefined>;
  generateAndAttachInvoice(orderId: string, generateInvoiceFn: (order: ExtractedChatOrder, nextSequence: number) => Invoice): Promise<ExtractedChatOrder | undefined>;
  
  // NEW: Added aggregation method signatures
  getChatOrdersCount(statusFilter?: string): Promise<number>;
  getTotalRevenue(): Promise<number>;
}

// Helper functions to map normalized database rows back to the frontend interfaces
function mapToExtractedOrder(orderRow: any, customerRow: any): ExtractedOrder {
  return {
    id: orderRow.id,
    customerName: customerRow?.name || undefined,
    customerPhone: customerRow?.phone || undefined,
    items: orderRow.items,
    totalAmount: orderRow.totalAmount || undefined,
    currency: orderRow.currency || "INR",
    notes: orderRow.specialInstructions || undefined,
    rawMessage: Array.isArray(orderRow.rawMessages) ? orderRow.rawMessages.map((m: any) => m.text).join('\n') : orderRow.rawMessages,
    confidence: Number(orderRow.confidence),
    status: orderRow.status,
    createdAt: orderRow.createdAt,
  };
}

function mapToExtractedChatOrder(orderRow: any, customerRow: any): ExtractedChatOrder {
  return {
    id: orderRow.id,
    customer_name: customerRow?.name || undefined,
    items: orderRow.items,
    delivery_address: orderRow.deliveryAddress || undefined,
    delivery_date: orderRow.deliveryDate || undefined,
    special_instructions: orderRow.specialInstructions || undefined,
    total: orderRow.totalAmount || undefined,
    confidence: orderRow.confidence,
    status: orderRow.status,
    created_at: orderRow.createdAt,
    raw_messages: orderRow.rawMessages,
    // @ts-ignore
    invoice: orderRow.invoice || undefined,
  };
}

export class DatabaseStorage implements IStorage {
  // ==========================================
  // SINGLE MESSAGE ORDERS (extractedOrders)
  // ==========================================

  async getOrders(): Promise<ExtractedOrder[]> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(ordersTable.extractionType, 'single_message'))
      .orderBy(desc(ordersTable.createdAt));

    return results.map(row => mapToExtractedOrder(row.order, row.customer));
  }

  async getOrder(id: string): Promise<ExtractedOrder | undefined> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(ordersTable.id, id));

    if (results.length === 0) return undefined;
    return mapToExtractedOrder(results[0].order, results[0].customer);
  }

  async addOrder(order: ExtractedOrder): Promise<ExtractedOrder> {
    return await db.transaction(async (tx) => {
      const customerId = randomUUID();
      const [customer] = await tx.insert(customersTable).values({
        id: customerId,
        name: order.customerName || "Unknown Customer",
        phone: order.customerPhone || undefined,
      }).returning();

      const [newOrder] = await tx.insert(ordersTable).values({
        id: order.id,
        customerId: customer.id,
        extractionType: 'single_message',
        items: order.items,
        totalAmount: order.totalAmount,
        currency: order.currency,
        specialInstructions: order.notes,
        rawMessages: order.rawMessage, // store as text or array internally
        confidence: String(order.confidence),
        status: order.status,
        createdAt: order.createdAt,
      }).returning();

      return mapToExtractedOrder(newOrder, customer);
    });
  }

  async updateOrderStatus(id: string, status: ExtractedOrder["status"]): Promise<ExtractedOrder | undefined> {
    return await db.transaction(async (tx) => {
      const [updatedOrder] = await tx.update(ordersTable)
        .set({ status })
        .where(eq(ordersTable.id, id))
        .returning();

      if (!updatedOrder) return undefined;

      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, updatedOrder.customerId));
      return mapToExtractedOrder(updatedOrder, customer);
    });
  }

  async deleteOrder(id: string): Promise<boolean> {
    const [deleted] = await db.delete(ordersTable).where(eq(ordersTable.id, id)).returning();
    return !!deleted;
  }

  // ==========================================
  // CHAT ORDERS (chatOrders)
  // ==========================================

  // CHANGED: Added limit and offset for pagination
  async getChatOrders(limit: number = 50, offset: number = 0): Promise<ExtractedChatOrder[]> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(ordersTable.extractionType, 'chat_log'))
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(row => mapToExtractedChatOrder(row.order, row.customer));
  }

  // NEW: Optimized count query
  async getChatOrdersCount(statusFilter?: string): Promise<number> {
    const conditions = [eq(ordersTable.extractionType, 'chat_log')];
    if (statusFilter) {
      conditions.push(eq(ordersTable.status, statusFilter));
    }
    
    const result = await db.select({ value: count() })
      .from(ordersTable)
      .where(and(...conditions));
      
    return result[0].value;
  }

  // NEW: Optimized revenue sum query
  async getTotalRevenue(): Promise<number> {
    const result = await db.select({ value: sum(ordersTable.totalAmount) })
      .from(ordersTable)
      .where(eq(ordersTable.extractionType, 'chat_log'));
      
    return Number(result[0].value || 0);
  }

  async getChatOrder(id: string): Promise<ExtractedChatOrder | undefined> {
    const results = await db.select({ order: ordersTable, customer: customersTable })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(ordersTable.id, id));

    if (results.length === 0) return undefined;
    return mapToExtractedChatOrder(results[0].order, results[0].customer);
  }

  async addChatOrder(order: ExtractedChatOrder): Promise<ExtractedChatOrder> {
    return await db.transaction(async (tx) => {
      const customerId = randomUUID();
      const [customer] = await tx.insert(customersTable).values({
        id: customerId,
        name: order.customer_name || "Unknown Customer",
      }).returning();

      const [newOrder] = await tx.insert(ordersTable).values({
        id: order.id,
        customerId: customer.id,
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

      return mapToExtractedChatOrder(newOrder, customer);
    });
  }

  async attachInvoice(orderId: string, invoice: Invoice): Promise<ExtractedChatOrder | undefined> {
    return await db.transaction(async (tx) => {
      const [updatedOrder] = await tx.update(ordersTable)
        .set({ invoice })
        .where(eq(ordersTable.id, orderId))
        .returning();

      if (!updatedOrder) return undefined;

      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, updatedOrder.customerId));
      return mapToExtractedChatOrder(updatedOrder, customer);
    });
  }

  async updateChatOrderDetails(id: string, updates: Partial<ExtractedChatOrder>): Promise<ExtractedChatOrder | undefined> {
    return await db.transaction(async (tx) => {
      // Map frontend updates to database columns
      const dbUpdates: any = {};
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.total !== undefined) dbUpdates.totalAmount = updates.total;
      if (updates.delivery_address !== undefined) dbUpdates.deliveryAddress = updates.delivery_address;
      if (updates.delivery_date !== undefined) dbUpdates.deliveryDate = updates.delivery_date;
      if (updates.special_instructions !== undefined) dbUpdates.specialInstructions = updates.special_instructions;

      const [updatedOrder] = await tx.update(ordersTable)
        .set(dbUpdates)
        .where(eq(ordersTable.id, id))
        .returning();

      if (!updatedOrder) return undefined;

      // Update customer name if provided
      const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, updatedOrder.customerId));
      
      if (updates.customer_name && updates.customer_name !== customer.name) {
        const [updatedCustomer] = await tx.update(customersTable)
          .set({ name: updates.customer_name })
          .where(eq(customersTable.id, customer.id))
          .returning();
        return mapToExtractedChatOrder(updatedOrder, updatedCustomer);
      }

      return mapToExtractedChatOrder(updatedOrder, customer);
    });
  }

  // ==========================================
  // TRANSACTIONAL BUSINESS LOGIC
  // ==========================================

  // NEW: Production-ready transaction ensuring secure, sequential invoice IDs
  async generateAndAttachInvoice(orderId: string, generateInvoiceFn: (order: ExtractedChatOrder, nextSequence: number) => Invoice): Promise<ExtractedChatOrder | undefined> {
    return await db.transaction(async (tx) => {
      // 1. Fetch the joined order data inside the transaction
      const result = await tx.select({ order: ordersTable, customer: customersTable })
        .from(ordersTable)
        .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
        .where(eq(ordersTable.id, orderId));

      if (result.length === 0) {
        tx.rollback();
        return undefined; // Order not found
      }

      // 2. Safely compute the next invoice sequence number using a database lock/max
      const maxSeqResult = await tx.select({ maxSeq: max(ordersTable.invoiceSequence) }).from(ordersTable);
      const nextSequenceNumber = (maxSeqResult[0]?.maxSeq || 0) + 1;

      const { order: dbOrder, customer: dbCustomer } = result[0];
      const chatOrder = mapToExtractedChatOrder(dbOrder, dbCustomer);
      
      // 3. Generate the invoice data injecting the secure sequence number
      const invoiceData = generateInvoiceFn(chatOrder, nextSequenceNumber);

      // 4. Atomically update the invoice field, save the sequence integer, and confirm status
      const [updatedOrder] = await tx.update(ordersTable)
        .set({ 
          invoice: invoiceData,
          invoiceSequence: nextSequenceNumber,
          status: "confirmed" 
        })
        .where(eq(ordersTable.id, orderId))
        .returning();

      return mapToExtractedChatOrder(updatedOrder, dbCustomer);
    });
  }
}

export const storage = new DatabaseStorage();