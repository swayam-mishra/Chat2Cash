import { storage } from "./storageService";

export const getOrderStats = async () => {
  const chatOrders = await storage.getChatOrders();
  const sorted = chatOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const pending_payments = sorted.filter((o) => o.status === "pending").length;
  const total_revenue = sorted.reduce((sum, o) => sum + (o.total || 0), 0);
  
  return {
    total_orders: sorted.length,
    pending_payments,
    total_revenue,
    recent_orders: sorted.slice(0, 10),
  };
};

export const getAllOrders = async () => {
  const chatOrders = await storage.getChatOrders();
  const allOrders = chatOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const pending = allOrders.filter((o) => o.status === "pending").length;
  
  return {
    orders: allOrders,
    total: allOrders.length,
    pending,
  };
};