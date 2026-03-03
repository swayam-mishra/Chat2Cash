// ─── API Types ────────────────────────────────────────────
// Mirrors the backend Zod schemas so the frontend has type safety
// without a shared package (for now).

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number | null;
}

export interface InvoiceItem {
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface Invoice {
  invoice_number: string;
  date: string;
  customer_name: string;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst?: number;
  total: number;
  business_name: string;
  gst_number: string;
}

export interface ChatMessage {
  sender: string;
  text: string;
}

export interface Order {
  id: string;
  customer_name: string | null;
  items: OrderItem[];
  delivery_address: string | null;
  delivery_date: string | null;
  special_instructions: string | null;
  total: number | null;
  confidence: "high" | "medium" | "low";
  status: string;
  created_at: string;
  raw_messages: ChatMessage[];
  invoice: Invoice | null;
}

export interface Stats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  total_revenue: number;
}

export interface QueueHealth {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  services: {
    database: string;
    anthropic: string;
    queue: string;
  };
  latency_ms?: number;
  queue?: QueueHealth;
}

export interface AsyncJobResponse {
  status: "queued";
  jobId: string;
  message: string;
  statusUrl: string;
}

export interface JobStatus {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  result?: Order;
  error?: string;
  createdAt?: string;
  processedAt?: string;
  completedAt?: string;
  attempts?: number;
}
