// ─── API Client ───────────────────────────────────────────
// Thin wrapper around fetch(). Uses the Vite proxy, so all
// calls go to "/api/..." and get forwarded to the Express
// backend.  Auth token (JWT) or API key can be injected via
// setAuthToken() / setApiKey().

import type { Order, Stats, QueueHealth, HealthCheck, AsyncJobResponse, JobStatus, Invoice } from "./types";

let _authToken: string | null = null;
let _apiKey: string | null = null;

/** Set a JWT bearer token for subsequent requests. */
export function setAuthToken(token: string | null) {
  _authToken = token;
}

/** Set an API key for machine-to-machine access. */
export function setApiKey(key: string | null) {
  _apiKey = key;
}

// ─── Base helpers ─────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (_apiKey) {
    headers["x-api-key"] = _apiKey;
  } else if (_authToken) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }
  return headers;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Health ───────────────────────────────────────────────

export const health = () => request<HealthCheck>("/api/health");

export const queueHealth = () => request<QueueHealth>("/api/queue/health");

// ─── Stats ────────────────────────────────────────────────

export const getStats = () => request<Stats>("/api/stats");

// ─── Orders ───────────────────────────────────────────────

export const getOrders = (limit = 50, offset = 0) =>
  request<Order[]>(`/api/orders?limit=${limit}&offset=${offset}`);

export const getOrder = (id: string) =>
  request<Order>(`/api/orders/${id}`);

export const updateOrderStatus = (id: string, status: string) =>
  request<Order>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const editOrder = (id: string, updates: Partial<Pick<Order, "customer_name" | "items" | "delivery_address" | "delivery_date" | "special_instructions" | "total">>) =>
  request<Order>(`/api/orders/${id}/edit`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const deleteOrder = (id: string) =>
  request<{ success: boolean; message: string }>(`/api/orders/${id}`, {
    method: "DELETE",
  });

// ─── Extraction ───────────────────────────────────────────

/** Synchronous single-message extraction. */
export const extractMessage = (message: string) =>
  request<Order>("/api/extract", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

/** Synchronous chat-log extraction. */
export const extractChat = (messages: { sender: string; text: string }[]) =>
  request<Order>("/api/extract-order", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

/** Async single-message extraction (returns job ID). */
export const asyncExtractMessage = (message: string) =>
  request<AsyncJobResponse>("/api/async/extract", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

/** Async chat-log extraction (returns job ID). */
export const asyncExtractChat = (messages: { sender: string; text: string }[]) =>
  request<AsyncJobResponse>("/api/async/extract-order", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

/** Poll job status. */
export const getJobStatus = (jobId: string) =>
  request<JobStatus>(`/api/jobs/${jobId}`);

// ─── Invoices ─────────────────────────────────────────────

export const generateInvoice = (orderId: string) =>
  request<{ message: string; invoice: Invoice; downloadEndpoint: string }>("/api/generate-invoice", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });

/** Returns a redirect URL for the signed PDF. Open in a new tab. */
export const getInvoiceDownloadUrl = (orderId: string) =>
  `/api/orders/${orderId}/download`;
