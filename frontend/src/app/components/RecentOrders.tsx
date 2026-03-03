import React from "react";
import { Download, MessageCircle, Eye, PenLine, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useApi";
import { formatINR, formatDate, mapStatus, summarizeItems } from "@/lib/format";

type Status = "Paid" | "Pending" | "Processing" | "Draft";

interface OrderRow {
  id: string;
  items: string;
  amount: string;
  status: Status;
  action: string;
  actionIcon: React.ReactNode;
}

const statusStyles: Record<Status, { bg: string; color: string }> = {
  Paid: { bg: "#00C853", color: "#FFFFFF" },
  Pending: { bg: "#FF6D00", color: "#FFFFFF" },
  Processing: { bg: "#2979FF", color: "#FFFFFF" },
  Draft: { bg: "#9E9E9E", color: "#FFFFFF" },
};

function actionForStatus(status: Status): { action: string; icon: React.ReactNode } {
  switch (status) {
    case "Paid": return { action: "Invoice ↓", icon: <Download size={13} /> };
    case "Pending": return { action: "Remind", icon: <MessageCircle size={13} /> };
    case "Processing": return { action: "View", icon: <Eye size={13} /> };
    case "Draft": return { action: "Complete", icon: <PenLine size={13} /> };
  }
}

function RedactedPill() {
  return (
    <span
      className="inline-block px-4 py-0.5"
      style={{
        backgroundColor: "#E5E7EB",
        borderRadius: 100,
        color: "#E5E7EB",
        fontSize: 12,
        fontWeight: 500,
        userSelect: "none",
        fontFamily: "'DM Sans', sans-serif",
        minWidth: 80,
        textAlign: "center",
      }}
    >
      <span style={{ filter: "blur(4px)", display: "inline-block" }}>
        Customer Name
      </span>
    </span>
  );
}

export function RecentOrders() {
  const { data: apiOrders, loading } = useOrders(5, 0);

  const orders: OrderRow[] = (apiOrders ?? []).map((o) => {
    const status = mapStatus(o.status) as Status;
    const { action, icon } = actionForStatus(status);
    return {
      id: `#${o.id}`,
      items: summarizeItems(o.items),
      amount: formatINR(o.total),
      status,
      action,
      actionIcon: icon,
    };
  });

  return (
    <div
      className="flex flex-col col-span-3"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <span style={{ fontWeight: 600, fontSize: 18, color: "#0D0F12" }}>
          Recent Orders
        </span>
        <span
          className="text-[12px] px-3 py-1 cursor-pointer"
          style={{
            fontWeight: 500,
            color: "#2979FF",
            backgroundColor: "rgba(41,121,255,0.06)",
            borderRadius: 100,
          }}
        >
          View All →
        </span>
      </div>

      {/* Table Header */}
      <div
        className="grid px-6 py-3 gap-3"
        style={{
          gridTemplateColumns: "100px 120px 1fr 80px 100px 100px",
          backgroundColor: "#F8F9FA",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {["Order ID", "Customer", "Items", "Amount", "Status", "Action"].map(
          (h) => (
            <span
              key={h}
              className="text-[11px] tracking-[0.06em] uppercase"
              style={{ fontWeight: 600, color: "#6B7280" }}
            >
              {h}
            </span>
          )
        )}
      </div>

      {/* Rows */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" color="#2979FF" />
          <span className="ml-2 text-[13px]" style={{ color: "#6B7280" }}>Loading…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <span className="text-[13px]" style={{ color: "#6B7280" }}>No orders yet.</span>
        </div>
      ) : (
      orders.map((order, i) => (
        <div
          key={order.id}
          className="grid px-6 py-3.5 gap-3 items-center"
          style={{
            gridTemplateColumns: "100px 120px 1fr 80px 100px 100px",
            borderBottom:
              i < orders.length - 1 ? "1px solid #F3F4F6" : "none",
            transition: "background-color 0.1s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#FAFBFC")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <span
            className="text-[13px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              color: "#2979FF",
            }}
          >
            {order.id}
          </span>
          <RedactedPill />
          <span
            className="text-[13px] truncate"
            style={{ fontWeight: 400, color: "#374151" }}
          >
            {order.items}
          </span>
          <span
            className="text-[13px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              color: "#0D0F12",
            }}
          >
            {order.amount}
          </span>
          <span
            className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] w-fit"
            style={{
              fontWeight: 600,
              borderRadius: 100,
              backgroundColor: statusStyles[order.status].bg,
              color: statusStyles[order.status].color,
            }}
          >
            {order.status}
          </span>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] cursor-pointer w-fit"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: "#1A1A2E",
              backgroundColor: "#F8F9FA",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1A1A2E";
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.borderColor = "#1A1A2E";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F8F9FA";
              e.currentTarget.style.color = "#1A1A2E";
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}
          >
            {order.actionIcon}
            {order.action}
          </button>
        </div>
      ))
      )}
    </div>
  );
}
