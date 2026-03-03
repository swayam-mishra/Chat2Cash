import { useFetch, useMutation } from "./useFetch";
import * as api from "@/lib/api";
import type { Order, Stats, QueueHealth } from "@/lib/types";

// ─── Orders ───────────────────────────────────────────────

export function useOrders(limit = 50, offset = 0) {
  return useFetch<Order[]>(() => api.getOrders(limit, offset), [limit, offset]);
}

export function useOrder(id: string | null) {
  return useFetch<Order | null>(
    () => (id ? api.getOrder(id) : Promise.resolve(null)),
    [id],
  );
}

export function useUpdateOrderStatus() {
  return useMutation(api.updateOrderStatus);
}

export function useDeleteOrder() {
  return useMutation(api.deleteOrder);
}

// ─── Stats ────────────────────────────────────────────────

export function useStats() {
  return useFetch<Stats>(() => api.getStats(), []);
}

// ─── Queue Health ─────────────────────────────────────────

export function useQueueHealth() {
  return useFetch<QueueHealth>(() => api.queueHealth(), []);
}

// ─── Extraction ───────────────────────────────────────────

export function useExtractMessage() {
  return useMutation(api.extractMessage);
}

export function useExtractChat() {
  return useMutation(api.extractChat);
}

// ─── Invoices ─────────────────────────────────────────────

export function useGenerateInvoice() {
  return useMutation(api.generateInvoice);
}
