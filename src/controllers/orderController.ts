import { Request, Response } from "express";
import * as anthropicService from "../services/anthropicService";
import { storage } from "../services/storageService";
import { addExtractionJob, getJobStatus, getQueueHealth } from "../services/queueService";
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
  const savedOrder = await storage.addOrder(req.orgId!, order);
  res.status(201).json(sanitizeResponse(savedOrder));
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.orgId!;
  const totalOrders = await storage.getChatOrdersCount(orgId);
  const pendingOrders = await storage.getChatOrdersCount(orgId, "pending");
  const confirmedOrders = await storage.getChatOrdersCount(orgId, "confirmed");
  const totalRevenue = await storage.getTotalRevenue(orgId);

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
  
  const orders = await storage.getChatOrders(req.orgId!, limit, offset);
  res.json(orders.map(sanitizeResponse));
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await storage.getChatOrder(req.orgId!, id);
  
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  
  res.json(sanitizeResponse(order));
});

export const extractChatOrder = asyncHandler(async (req: Request, res: Response) => {
  const { messages } = extractOrderFromChatRequestSchema.parse(req.body);
  const order = await anthropicService.extractOrderFromChat(messages);
  const savedOrder = await storage.addChatOrder(req.orgId!, order);
  res.status(201).json(sanitizeResponse(savedOrder));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body; // Basic validation, extend via Zod if needed schema

  if (!status) throw new AppError("Status is required", 400);

  // Since storage methods are specific, we might need to check order type or try both
  // For this optimized version, we assume Chat Orders are the primary entity
  const updatedOrder = await storage.updateChatOrderDetails(req.orgId!, id, { status });
  
  if (!updatedOrder) {
    throw new AppError("Order not found", 404);
  }
  
  res.json(sanitizeResponse(updatedOrder));
});

export const editOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updates = updateChatOrderSchema.parse(req.body);

  const updatedOrder = await storage.updateChatOrderDetails(req.orgId!, id, updates);
  
  if (!updatedOrder) {
    throw new AppError("Order not found", 404);
  }

  res.json(sanitizeResponse(updatedOrder));
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const success = await storage.deleteOrder(req.orgId!, id);
  
  if (!success) {
    throw new AppError("Order not found or already deleted", 404);
  }
  
  res.json({ success: true, message: "Order deleted successfully" });
});

// ==========================================
// ASYNC EXTRACTION (BullMQ Background Jobs)
// ==========================================

export const asyncExtractOrder = asyncHandler(async (req: Request, res: Response) => {
  const { message } = extractOrderRequestSchema.parse(req.body);
  const { webhookUrl } = req.body;

  const jobId = await addExtractionJob({
    type: "single_message",
    orgId: req.orgId!,
    message,
    webhookUrl,
  });

  res.status(202).json({
    status: "queued",
    jobId,
    message: "Order extraction queued for processing",
    statusUrl: `/api/jobs/${jobId}`,
  });
});

export const asyncExtractChatOrder = asyncHandler(async (req: Request, res: Response) => {
  const { messages } = extractOrderFromChatRequestSchema.parse(req.body);
  const { webhookUrl } = req.body;

  const jobId = await addExtractionJob({
    type: "chat_log",
    orgId: req.orgId!,
    messages,
    webhookUrl,
  });

  res.status(202).json({
    status: "queued",
    jobId,
    message: "Chat order extraction queued for processing",
    statusUrl: `/api/jobs/${jobId}`,
  });
});

export const getJobStatusById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const status = await getJobStatus(id);

  if (!status) {
    throw new AppError("Job not found", 404);
  }

  res.json(status);
});

export const getQueueStats = asyncHandler(async (_req: Request, res: Response) => {
  const health = await getQueueHealth();
  res.json(health);
});