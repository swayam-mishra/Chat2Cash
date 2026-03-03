// ─── API Client ───────────────────────────────────────────
// Encapsulates auth state as instance properties instead of
// module-level globals. This makes the client session-scoped
// rather than process-scoped, preventing state-bleeding bugs
// under SSR (Next.js / Remix) where module globals live across
// all users' requests.
//
// Consume via ApiClientContext / useApiClient() — never import
// and call these functions directly from page components.

import type { Order, Stats, QueueHealth, HealthCheck, AsyncJobResponse, JobStatus, Invoice } from "./types";

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

export class ApiClient {
  private _authToken: string | null = null;
  private _apiKey: string | null = null;

  /** Set a JWT bearer token for subsequent requests. */
  setAuthToken(token: string | null) {
    this._authToken = token;
  }

  /** Set an API key for machine-to-machine access. */
  setApiKey(key: string | null) {
    this._apiKey = key;
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this._apiKey) {
      headers["x-api-key"] = this._apiKey;
    } else if (this._authToken) {
      headers["Authorization"] = `Bearer ${this._authToken}`;
    }
    return headers;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...this.authHeaders(),
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

  // ─── Health ─────────────────────────────────────────────

  health = () => this.request<HealthCheck>("/api/health");

  queueHealth = () => this.request<QueueHealth>("/api/queue/health");

  // ─── Stats ──────────────────────────────────────────────

  getStats = () => this.request<Stats>("/api/stats");

  // ─── Orders ─────────────────────────────────────────────

  getOrders = (limit = 50, offset = 0) =>
    this.request<Order[]>(`/api/orders?limit=${limit}&offset=${offset}`);

  getOrder = (id: string) =>
    this.request<Order>(`/api/orders/${id}`);

  updateOrderStatus = (id: string, status: string) =>
    this.request<Order>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

  editOrder = (id: string, updates: Partial<Pick<Order, "customer_name" | "items" | "delivery_address" | "delivery_date" | "special_instructions" | "total">>) =>
    this.request<Order>(`/api/orders/${id}/edit`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

  deleteOrder = (id: string) =>
    this.request<{ success: boolean; message: string }>(`/api/orders/${id}`, {
      method: "DELETE",
    });

  // ─── Extraction ─────────────────────────────────────────

  /** Synchronous single-message extraction. */
  extractMessage = (message: string) =>
    this.request<Order>("/api/extract", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

  /** Synchronous chat-log extraction. */
  extractChat = (messages: { sender: string; text: string }[]) =>
    this.request<Order>("/api/extract-order", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });

  /** Async single-message extraction — returns jobId for SSE tracking. */
  asyncExtractMessage = (message: string) =>
    this.request<AsyncJobResponse>("/api/async/extract", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

  /** Async chat-log extraction — returns jobId for SSE tracking. */
  asyncExtractChat = (messages: { sender: string; text: string }[]) =>
    this.request<AsyncJobResponse>("/api/async/extract-order", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });

  /** Poll job status (used as fallback when SSE is unavailable). */
  getJobStatus = (jobId: string) =>
    this.request<JobStatus>(`/api/jobs/${jobId}`);

  // ─── Invoices ───────────────────────────────────────────

  generateInvoice = (orderId: string) =>
    this.request<{ message: string; invoice: Invoice; downloadEndpoint: string }>("/api/generate-invoice", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });

  /** Returns a redirect URL for the signed PDF. Open in a new tab. */
  getInvoiceDownloadUrl = (orderId: string) =>
    `/api/orders/${orderId}/download`;
}

/** Factory used by ApiClientProvider to create a session-scoped instance. */
export function createApiClient(): ApiClient {
  return new ApiClient();
}
