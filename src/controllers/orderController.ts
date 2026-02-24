import { Request, Response } from "express";
import * as anthropicService from "../services/anthropicService";
import { storage } from "../services/storageService";
import { extractOrderRequestSchema, extractOrderFromChatRequestSchema, updateChatOrderSchema, ExtractedChatOrder } from "../schema";
import { asyncHandler, AppError } from "../middlewares/errorHandler";

// Helper to remove circular references (if any) or unwanted fields before sending response
// (Though PII Redactor handles the heavy lifting now)
const sanitizeResponse = (order: any) => {
  return order; 
};

export const extractOrder = asyncHandler(async (req: Request, res: Response) => {
  const { message } = extractOrderRequestSchema.parse(req.body);
  const order = await anthropicService.extractOrderFromMessage(message);
  const savedOrder = await storage.addOrder(order);
  res.status(201).json(sanitizeResponse(savedOrder));
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const totalOrders = await storage.getChatOrdersCount();
  const pendingOrders = await storage.getChatOrdersCount("pending");
  const confirmedOrders = await storage.getChatOrdersCount("confirmed");
  const totalRevenue = await storage.getTotalRevenue();

  res.json({
    total_orders: totalOrders,
    pending_orders: pendingOrders,
    confirmed_orders: confirmedOrders,
    total_revenue: totalRevenue
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;
  
  const orders = await storage.getChatOrders(limit, offset);
  res.json(orders.map(sanitizeResponse));
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await storage.getChatOrder(id);
  
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  
  res.json(sanitizeResponse(order));
});

export const extractChatOrder = asyncHandler(async (req: Request, res: Response) => {
  const { messages } = extractOrderFromChatRequestSchema.parse(req.body);
  const order = await anthropicService.extractOrderFromChat(messages);
  const savedOrder = await storage.addChatOrder(order);
  res.status(201).json(sanitizeResponse(savedOrder));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body; // Basic validation, extend via Zod if needed schema

  if (!status) throw new AppError("Status is required", 400);

  // Since storage methods are specific, we might need to check order type or try both
  // For this optimized version, we assume Chat Orders are the primary entity
  const updatedOrder = await storage.updateChatOrderDetails(id, { status });
  
  if (!updatedOrder) {
    throw new AppError("Order not found", 404);
  }
  
  res.json(sanitizeResponse(updatedOrder));
});

export const editOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updates = updateChatOrderSchema.parse(req.body);

  const updatedOrder = await storage.updateChatOrderDetails(id, updates);
  
  if (!updatedOrder) {
    throw new AppError("Order not found", 404);
  }

  res.json(sanitizeResponse(updatedOrder));
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const success = await storage.deleteOrder(id);
  
  if (!success) {
    throw new AppError("Order not found or already deleted", 404);
  }
  
  res.json({ success: true, message: "Order deleted successfully" });
});