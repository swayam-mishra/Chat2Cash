import type { ExtractedOrder, ExtractedChatOrder, Invoice } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private orders: ExtractedOrder[];
  private chatOrders: ExtractedChatOrder[];

  constructor() {
    this.orders = [];
    this.chatOrders = [];
  }

  async getOrders(): Promise<ExtractedOrder[]> {
    return [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrder(id: string): Promise<ExtractedOrder | undefined> {
    return this.orders.find((o) => o.id === id);
  }

  async addOrder(order: ExtractedOrder): Promise<ExtractedOrder> {
    this.orders.push(order);
    return order;
  }

  async updateOrderStatus(
    id: string,
    status: ExtractedOrder["status"]
  ): Promise<ExtractedOrder | undefined> {
    const order = this.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
    }
    return order;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    this.orders.splice(idx, 1);
    return true;
  }

  async getChatOrders(): Promise<ExtractedChatOrder[]> {
    return [...this.chatOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getChatOrder(id: string): Promise<ExtractedChatOrder | undefined> {
    return this.chatOrders.find((o) => o.id === id);
  }

  async addChatOrder(order: ExtractedChatOrder): Promise<ExtractedChatOrder> {
    this.chatOrders.push(order);
    return order;
  }

  async attachInvoice(orderId: string, invoice: Invoice): Promise<(ExtractedChatOrder & { invoice: Invoice }) | undefined> {
    const order = this.chatOrders.find((o) => o.id === orderId);
    if (!order) return undefined;
    const orderWithInvoice = order as ExtractedChatOrder & { invoice: Invoice };
    orderWithInvoice.invoice = invoice;
    return orderWithInvoice;
  }
}

export const storage = new MemStorage();
