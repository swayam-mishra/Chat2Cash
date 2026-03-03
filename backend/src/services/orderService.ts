import { storage } from "./storageService";

export const getOrderStats = async (orgId: string) => {
  const total_orders = await storage.getChatOrdersCount(orgId);
  const pending_payments = await storage.getChatOrdersCount(orgId, "pending");
  const total_revenue = await storage.getTotalRevenue(orgId);
  const recent_orders = await storage.getChatOrders(orgId, 10, 0);
  
  return {
    total_orders,
    pending_payments,
    total_revenue,
    recent_orders,
  };
};

export const getAllOrders = async (orgId: string, page: number = 1, limit: number = 50) => {
  const offset = (page - 1) * limit;
  
  const orders = await storage.getChatOrders(orgId, limit, offset);
  const total = await storage.getChatOrdersCount(orgId);
  const pending = await storage.getChatOrdersCount(orgId, "pending");
  
  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    pending,
  };
};