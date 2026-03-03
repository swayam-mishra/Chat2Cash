import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  MessageCircle,
  Eye,
  PenLine,
  X,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Send,
  Printer,
} from "lucide-react";
import { useOrders } from "@/hooks/useApi";
import type { Order as ApiOrder } from "@/lib/types";
import { formatINR, formatDate, mapStatus, summarizeItems } from "@/lib/format";

type Status = "Paid" | "Pending" | "Processing" | "Draft" | "Failed";

interface Order {
  id: string;
  customer: string;
  items: string;
  itemsList: { name: string; qty: string; price: string }[];
  amount: string;
  status: Status;
  date: string;
  source: string;
  notes?: string;
}

/** Convert a backend Order into the display shape used by the UI. */
function toDisplayOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    customer: o.customer_name ?? "Unknown",
    items: summarizeItems(o.items),
    itemsList: o.items.map((i) => ({
      name: i.product_name,
      qty: `${i.quantity}`,
      price: formatINR(i.price),
    })),
    amount: formatINR(o.total),
    status: mapStatus(o.status),
    date: formatDate(o.created_at),
    source: o.raw_messages?.length ? "WhatsApp" : "Manual",
    notes: o.special_instructions ?? undefined,
  };
}

const statusStyles: Record<Status, { bg: string; color: string; icon: React.ReactNode }> = {
  Paid: { bg: "#00C853", color: "#FFF", icon: <CheckCircle2 size={14} /> },
  Pending: { bg: "#FF6D00", color: "#FFF", icon: <Clock size={14} /> },
  Processing: { bg: "#2979FF", color: "#FFF", icon: <Loader2 size={14} /> },
  Draft: { bg: "#9E9E9E", color: "#FFF", icon: <PenLine size={14} /> },
  Failed: { bg: "#D32F2F", color: "#FFF", icon: <AlertCircle size={14} /> },
};

const CARD: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
  fontFamily: "'DM Sans', sans-serif",
};

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 500,
  fontSize: 13,
};

const LABEL: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 11,
  color: "#6B7280",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontFamily: "'DM Sans', sans-serif",
};

const FALLBACK_ORDERS: Order[] = [];

const tabs: { label: string; status: Status | "All" }[] = [
  { label: "All Orders", status: "All" },
  { label: "Paid", status: "Paid" },
  { label: "Pending", status: "Pending" },
  { label: "Processing", status: "Processing" },
  { label: "Draft", status: "Draft" },
  { label: "Failed", status: "Failed" },
];

function RedactedPill() {
  return (
    <span
      className="inline-block px-4 py-0.5"
      style={{
        backgroundColor: "#E5E7EB",
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 500,
        userSelect: "none",
        minWidth: 80,
        textAlign: "center",
      }}
    >
      <span style={{ filter: "blur(4px)", display: "inline-block", color: "#E5E7EB" }}>
        Customer Name
      </span>
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] w-fit"
      style={{
        fontWeight: 600,
        borderRadius: 100,
        backgroundColor: s.bg,
        color: s.color,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {status}
    </span>
  );
}

/* ─── Slide-over Panel ─── */
function OrderDetailPanel({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const s = statusStyles[order.status];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: 460,
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
          fontFamily: "'DM Sans', sans-serif",
          animation: "slideInRight 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid #E5E7EB" }}
        >
          <div className="flex items-center gap-3">
            <span style={{ ...MONO, color: "#2979FF", fontSize: 15 }}>
              #{order.id}
            </span>
            <StatusPill status={order.status} />
          </div>
          <button
            onClick={onClose}
            className="w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
            }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span style={LABEL}>CUSTOMER</span>
              <RedactedPill />
            </div>
            <div className="flex flex-col gap-1">
              <span style={LABEL}>DATE</span>
              <span className="text-[13px]" style={{ fontWeight: 500, color: "#0D0F12" }}>
                {order.date}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={LABEL}>SOURCE</span>
              <span
                className="text-[12px] px-2.5 py-1 self-start"
                style={{
                  fontWeight: 500,
                  color: order.source === "WhatsApp" ? "#25D366" : "#6B7280",
                  backgroundColor:
                    order.source === "WhatsApp" ? "rgba(37,211,102,0.08)" : "#F8F9FA",
                  borderRadius: 100,
                }}
              >
                {order.source}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={LABEL}>TOTAL</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#1A1A2E",
                }}
              >
                {order.amount}
              </span>
            </div>
          </div>

          {/* Items table */}
          <div
            className="overflow-hidden"
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 12,
            }}
          >
            <div
              className="grid grid-cols-3 gap-2 px-4 py-2.5"
              style={{
                backgroundColor: "#F8F9FA",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <span style={LABEL}>ITEM</span>
              <span style={LABEL}>QTY</span>
              <span style={{ ...LABEL, textAlign: "right" }}>PRICE</span>
            </div>
            {order.itemsList.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-2 px-4 py-3 items-center"
                style={{
                  borderBottom:
                    i < order.itemsList.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <span className="text-[13px]" style={{ fontWeight: 500, color: "#0D0F12" }}>
                  {item.name}
                </span>
                <span className="text-[13px]" style={{ color: "#6B7280" }}>
                  {item.qty}
                </span>
                <span style={{ ...MONO, color: "#0D0F12", textAlign: "right" }}>
                  {item.price}
                </span>
              </div>
            ))}
            <div
              className="grid grid-cols-3 gap-2 px-4 py-3"
              style={{ borderTop: "1px solid #E5E7EB", backgroundColor: "#FAFBFC" }}
            >
              <span className="text-[13px] col-span-2" style={{ fontWeight: 600, color: "#0D0F12" }}>
                Total
              </span>
              <span
                style={{
                  ...MONO,
                  fontWeight: 700,
                  color: "#1A1A2E",
                  textAlign: "right",
                }}
              >
                {order.amount}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="flex flex-col gap-2">
              <span style={LABEL}>NOTES</span>
              <div
                className="p-3"
                style={{
                  backgroundColor: "#F8F9FA",
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                }}
              >
                <span
                  className="text-[13px]"
                  style={{ color: "#374151", lineHeight: 1.6 }}
                >
                  {order.notes}
                </span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="flex flex-col gap-2">
            <span style={LABEL}>ACTIVITY</span>
            <div className="flex flex-col gap-0">
              {[
                { text: "Order created from WhatsApp chat", time: order.date, dot: "#2979FF" },
                { text: "AI extracted 3 items successfully", time: order.date, dot: "#00C853" },
                ...(order.status === "Paid"
                  ? [{ text: "Payment confirmed via UPI", time: order.date, dot: "#00C853" }]
                  : []),
                ...(order.status === "Failed"
                  ? [{ text: "Payment failed — bank declined", time: order.date, dot: "#D32F2F" }]
                  : []),
              ].map((event, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5">
                  <div className="flex flex-col items-center gap-0 mt-1.5">
                    <div
                      className="w-[8px] h-[8px] shrink-0"
                      style={{ backgroundColor: event.dot, borderRadius: 100 }}
                    />
                    {i < 2 && (
                      <div className="w-[1px] h-[20px]" style={{ backgroundColor: "#E5E7EB" }} />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px]" style={{ fontWeight: 500, color: "#0D0F12" }}>
                      {event.text}
                    </span>
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>
                      {event.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center gap-2 px-6 py-4 shrink-0"
          style={{ borderTop: "1px solid #E5E7EB" }}
        >
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] cursor-pointer flex-1 justify-center"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: "#6B7280",
              backgroundColor: "#F8F9FA",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
            }}
          >
            <Printer size={14} />
            Print
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] cursor-pointer flex-1 justify-center"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: "#6B7280",
              backgroundColor: "#F8F9FA",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
            }}
          >
            <Send size={14} />
            Send Reminder
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] cursor-pointer flex-1 justify-center"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              color: "#FFFFFF",
              backgroundColor: "#1A1A2E",
              borderRadius: 10,
              border: "none",
            }}
          >
            <FileText size={14} />
            Generate Invoice
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

/* ─── Main Orders Page ─── */
export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Status | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch real orders from the API
  const { data: apiOrders, loading, error } = useOrders();
  const allOrders: Order[] = apiOrders ? apiOrders.map(toDisplayOrder) : FALLBACK_ORDERS;

  const filtered = allOrders.filter((o) => {
    const matchesTab = activeTab === "All" || o.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts: Record<string, number> = { All: allOrders.length };
  allOrders.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  return (
    <div className="p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1
            className="m-0"
            style={{ fontWeight: 700, fontSize: 24, color: "#0D0F12", lineHeight: 1.2 }}
          >
            Orders
          </h1>
          <p className="m-0 text-[13px]" style={{ color: "#6B7280" }}>
            Manage all orders from WhatsApp and manual entry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[12px] px-3 py-1.5"
            style={{
              ...MONO,
              color: "#2979FF",
              backgroundColor: "rgba(41,121,255,0.06)",
              borderRadius: 100,
              fontSize: 11,
            }}
          >
            {allOrders.length} total
          </span>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" color="#2979FF" />
          <span className="ml-2 text-[14px]" style={{ color: "#6B7280" }}>Loading orders…</span>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center py-8 mb-4" style={{ backgroundColor: "#FEF2F2", borderRadius: 12, border: "1px solid #FECACA" }}>
          <AlertCircle size={16} color="#D32F2F" />
          <span className="ml-2 text-[13px]" style={{ color: "#D32F2F" }}>
            Failed to load orders. Using offline view.
          </span>
        </div>
      )}

      {/* Filters bar */}
      <div
        style={CARD}
        className="mb-4 overflow-hidden"
      >
        {/* Tabs */}
        <div
          className="flex items-center gap-0 px-2 overflow-x-auto"
          style={{ borderBottom: "1px solid #E5E7EB" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.status;
            return (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                className="flex items-center gap-1.5 px-4 py-3.5 cursor-pointer whitespace-nowrap"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1A1A2E" : "#6B7280",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid #1A1A2E" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                <span
                  className="text-[11px] px-1.5 py-0.5"
                  style={{
                    fontWeight: 600,
                    color: isActive ? "#1A1A2E" : "#9E9E9E",
                    backgroundColor: isActive ? "rgba(26,26,46,0.06)" : "#F3F4F6",
                    borderRadius: 6,
                  }}
                >
                  {counts[tab.status] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & actions bar */}
        <div className="flex items-center justify-between px-5 py-3">
          <div
            className="flex items-center gap-2 flex-1 max-w-[320px]"
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              padding: "8px 12px",
            }}
          >
            <Search size={16} color="#6B7280" />
            <input
              type="text"
              placeholder="Search by Order ID or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none border-none bg-transparent flex-1"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#0D0F12",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                color: "#6B7280",
                backgroundColor: "#F8F9FA",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
              }}
            >
              <Filter size={14} />
              Filter
              <ChevronDown size={12} />
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                color: "#6B7280",
                backgroundColor: "#F8F9FA",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
              }}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {/* Table header */}
          <div
            className="grid px-5 py-3 gap-3 min-w-[700px]"
            style={{
              gridTemplateColumns: "100px 130px 1fr 90px 90px 80px 90px",
              backgroundColor: "#F8F9FA",
              borderTop: "1px solid #E5E7EB",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            {["Order ID", "Customer", "Items", "Amount", "Status", "Source", "Date"].map((h) => (
              <span key={h} style={LABEL}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[14px]" style={{ color: "#6B7280" }}>
                No orders match your filters.
              </span>
            </div>
          ) : (
            filtered.map((order, i) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="grid px-5 py-3.5 gap-3 items-center cursor-pointer min-w-[700px]"
                style={{
                  gridTemplateColumns: "100px 130px 1fr 90px 90px 80px 90px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span style={{ ...MONO, color: "#2979FF" }}>{`#${order.id}`}</span>
                <RedactedPill />
                <span
                  className="text-[13px] truncate"
                  style={{ fontWeight: 400, color: "#374151" }}
                >
                  {order.items}
                </span>
                <span style={{ ...MONO, color: "#0D0F12" }}>{order.amount}</span>
                <StatusPill status={order.status} />
                <span
                  className="text-[12px] px-2 py-0.5 self-start mt-0.5"
                  style={{
                    fontWeight: 500,
                    color: order.source === "WhatsApp" ? "#25D366" : "#6B7280",
                    backgroundColor:
                      order.source === "WhatsApp" ? "rgba(37,211,102,0.08)" : "#F8F9FA",
                    borderRadius: 100,
                    textAlign: "center",
                  }}
                >
                  {order.source}
                </span>
                <span className="text-[12px]" style={{ color: "#6B7280" }}>
                  {order.date}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide-over */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
