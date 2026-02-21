import { Request, Response } from "express";
import { storage } from "../services/storageService";
import { extractOrderFromMessage, extractOrderFromChat } from "../services/anthropicService";
import { extractOrderRequestSchema, extractOrderFromChatRequestSchema, updateChatOrderSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "../middlewares/logger";

export const getStats = async (_req: Request, res: Response) => {
  const chatOrders = await storage.getChatOrders();
  const sorted = chatOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const pending_payments = sorted.filter((o) => o.status === "pending").length;
  const total_revenue = sorted.reduce((sum, o) => sum + (o.total || 0), 0);
  res.json({ total_orders: sorted.length, pending_payments, total_revenue, recent_orders: sorted.slice(0, 10) });
};

export const getOrders = async (_req: Request, res: Response) => {
  const chatOrders = await storage.getChatOrders();
  const allOrders = chatOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ orders: allOrders, total: allOrders.length, pending: allOrders.filter((o) => o.status === "pending").length });
};

export const getOrderById = async (req: Request, res: Response) => {
  const order = await storage.getOrder(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

export const extractOrder = async (req: Request, res: Response) => {
  try {
    const parsed = extractOrderRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const order = await extractOrderFromMessage(parsed.data.message);
    const saved = await storage.addOrder(order);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to extract order" });
  }
};

export const extractChatOrder = async (req: Request, res: Response) => {
  try {
    const parsed = extractOrderFromChatRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    if (parsed.data.messages.length === 0) return res.status(400).json({ message: "No messages provided" });

    const order = await extractOrderFromChat(parsed.data.messages);
    const saved = await storage.addChatOrder(order);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to extract order from chat" });
  }
};

export const editOrder = async (req: Request, res: Response) => {
  try {
    const parsed = updateChatOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const updatedOrder = await storage.updateChatOrderDetails(req.params.id, parsed.data);
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to update order details" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid status" });

    const order = await storage.updateOrderStatus(req.params.id, parsed.data.status);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to update order" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deleted = await storage.deleteOrder(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to delete order" });
  }
};