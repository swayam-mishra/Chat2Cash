import { storage } from "./storageService";

export const getOrderStats = async () => {
  // CHANGED: Let the database calculate these via aggregation queries
  const total_orders = await storage.getChatOrdersCount();
  const pending_payments = await storage.getChatOrdersCount("pending");
  const total_revenue = await storage.getTotalRevenue();
  const recent_orders = await storage.getChatOrders(10, 0); // Limit to 10 for dashboard
  
  return {
    total_orders,
    pending_payments,
    total_revenue,
    recent_orders,
  };
};

export const getAllOrders = async (page: number = 1, limit: number = 50) => {
  // CHANGED: Implementing pagination logic
  const offset = (page - 1) * limit;
  
  const orders = await storage.getChatOrders(limit, offset);
  const total = await storage.getChatOrdersCount();
  const pending = await storage.getChatOrdersCount("pending");
  
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