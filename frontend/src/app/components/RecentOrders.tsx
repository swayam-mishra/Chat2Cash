import React from "react";
import { Download, MessageCircle, Eye, PenLine } from "lucide-react";

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

const orders: OrderRow[] = [
  {
    id: "#ORD-0091",
    items: "2kg Aaloo, 1kg Pyaaz",
    amount: "₹180",
    status: "Paid",
    action: "Invoice ↓",
    actionIcon: <Download size={13} />,
  },
  {
    id: "#ORD-0090",
    items: "5 plate thali order",
    amount: "₹750",
    status: "Pending",
    action: "Remind",
    actionIcon: <MessageCircle size={13} />,
  },
  {
    id: "#ORD-0089",
    items: "10 litre doodh",
    amount: "₹520",
    status: "Processing",
    action: "View",
    actionIcon: <Eye size={13} />,
  },
  {
    id: "#ORD-0088",
    items: "Bread x4, Butter x2",
    amount: "₹320",
    status: "Draft",
    action: "Complete",
    actionIcon: <PenLine size={13} />,
  },
  {
    id: "#ORD-0087",
    items: "Chai patti 500g",
    amount: "₹95",
    status: "Paid",
    action: "Invoice ↓",
    actionIcon: <Download size={13} />,
  },
];

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
        filter: "blur(0px)",
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
      {orders.map((order, i) => (
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
      ))}
    </div>
  );
}
