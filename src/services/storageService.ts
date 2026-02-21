import { ExtractedOrder, ExtractedChatOrder, Invoice } from "../schema";
import { db } from "../config/db";
import { extractedOrdersTable, chatOrdersTable } from "../schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getOrders(): Promise<ExtractedOrder[]>;
  getOrder(id: string): Promise<ExtractedOrder | undefined>;
  addOrder(order: ExtractedOrder): Promise<ExtractedOrder>;
  updateOrderStatus(id: string, status: ExtractedOrder["status"]): Promise<ExtractedOrder | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getChatOrders(): Promise<ExtractedChatOrder[]>;
  getChatOrder(id: string): Promise<ExtractedChatOrder | undefined>;
  addChatOrder(order: ExtractedChatOrder): Promise<ExtractedChatOrder>;
  attachInvoice(orderId: string, invoice: Invoice): Promise<(ExtractedChatOrder & { invoice: Invoice }) | undefined>;
  updateChatOrderDetails(id: string, updates: Partial<ExtractedChatOrder>): Promise<ExtractedChatOrder | undefined>; // NEW method
}

export class DatabaseStorage implements IStorage {
  async getOrders(): Promise<ExtractedOrder[]> {
    return await db.select().from(extractedOrdersTable).orderBy(desc(extractedOrdersTable.createdAt));
  }

  async getOrder(id: string): Promise<ExtractedOrder | undefined> {
    const [order] = await db.select().from(extractedOrdersTable).where(eq(extractedOrdersTable.id, id));
    return order as ExtractedOrder | undefined;
  }

  async addOrder(order: ExtractedOrder): Promise<ExtractedOrder> {
    const [newOrder] = await db.insert(extractedOrdersTable).values(order).returning();
    return newOrder as ExtractedOrder;
  }

  async updateOrderStatus(id: string, status: ExtractedOrder["status"]): Promise<ExtractedOrder | undefined> {
    const [updated] = await db
      .update(extractedOrdersTable)
      .set({ status })
      .where(eq(extractedOrdersTable.id, id))
      .returning();
    return updated as ExtractedOrder | undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const [deleted] = await db.delete(extractedOrdersTable).where(eq(extractedOrdersTable.id, id)).returning();
    return !!deleted;
  }

  async getChatOrders(): Promise<ExtractedChatOrder[]> {
    return await db.select().from(chatOrdersTable).orderBy(desc(chatOrdersTable.created_at));
  }

  async getChatOrder(id: string): Promise<ExtractedChatOrder | undefined> {
    const [order] = await db.select().from(chatOrdersTable).where(eq(chatOrdersTable.id, id));
    return order as ExtractedChatOrder | undefined;
  }

  async addChatOrder(order: ExtractedChatOrder): Promise<ExtractedChatOrder> {
    const [newOrder] = await db.insert(chatOrdersTable).values(order).returning();
    return newOrder as ExtractedChatOrder;
  }

  async attachInvoice(orderId: string, invoice: Invoice): Promise<(ExtractedChatOrder & { invoice: Invoice }) | undefined> {
    const [updated] = await db
      .update(chatOrdersTable)
      .set({ invoice })
      .where(eq(chatOrdersTable.id, orderId))
      .returning();
    return updated as (ExtractedChatOrder & { invoice: Invoice }) | undefined;
  }

  // NEW: Update any detail of the chat order
  async updateChatOrderDetails(id: string, updates: Partial<ExtractedChatOrder>): Promise<ExtractedChatOrder | undefined> {
    const [updated] = await db
      .update(chatOrdersTable)
      .set(updates)
      .where(eq(chatOrdersTable.id, id))
      .returning();
      
    return updated as ExtractedChatOrder | undefined;
  }
}

export const storage = new DatabaseStorage();