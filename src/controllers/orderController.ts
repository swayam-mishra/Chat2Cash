import { Request, Response } from "express";
import { storage } from "../services/storageService";
import { extractOrderFromMessage, extractOrderFromChat } from "../services/anthropicService";
import * as orderService from "../services/orderService";
import { extractOrderRequestSchema, extractOrderFromChatRequestSchema, updateChatOrderSchema } from "../schema";
import { z } from "zod";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await orderService.getOrderStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get stats" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    // CHANGED: Extract pagination params from the query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const data = await orderService.getAllOrders(page, limit);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const order = await storage.getOrder(req.params.id as string);
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

    const updatedOrder = await storage.updateChatOrderDetails(req.params.id as string, parsed.data);
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

    const order = await storage.updateOrderStatus(req.params.id as string, parsed.data.status);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to update order" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deleted = await storage.deleteOrder(req.params.id as string);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to delete order" });
  }
};