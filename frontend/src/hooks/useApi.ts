import { useFetch, useMutation } from "./useFetch";
import { useApiClient } from "@/app/ApiClientContext";
import type { Order, Stats, QueueHealth } from "@/lib/types";

// ─── Orders ───────────────────────────────────────────────

export function useOrders(limit = 50, offset = 0) {
  const client = useApiClient();
  return useFetch<Order[]>(() => client.getOrders(limit, offset), [limit, offset]);
}

export function useOrder(id: string | null) {
  const client = useApiClient();
  return useFetch<Order | null>(
    () => (id ? client.getOrder(id) : Promise.resolve(null)),
    [id],
  );
}

export function useUpdateOrderStatus() {
  const client = useApiClient();
  return useMutation(client.updateOrderStatus);
}

export function useDeleteOrder() {
  const client = useApiClient();
  return useMutation(client.deleteOrder);
}

// ─── Stats ────────────────────────────────────────────────

export function useStats() {
  const client = useApiClient();
  return useFetch<Stats>(() => client.getStats(), []);
}

// ─── Queue Health ─────────────────────────────────────────

export function useQueueHealth() {
  const client = useApiClient();
  return useFetch<QueueHealth>(() => client.queueHealth(), []);
}

// ─── Extraction ───────────────────────────────────────────

export function useExtractMessage() {
  const client = useApiClient();
  return useMutation(client.extractMessage);
}

export function useExtractChat() {
  const client = useApiClient();
  return useMutation(client.extractChat);
}

// ─── Invoices ─────────────────────────────────────────────

export function useGenerateInvoice() {
  const client = useApiClient();
  return useMutation(client.generateInvoice);
}

// Re-export context hook so callers only need one import
export { useApiClient } from "@/app/ApiClientContext";