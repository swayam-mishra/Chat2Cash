import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  ScanText,
  FileText,
  Package,
  TrendingUp,
  AlertTriangle,
  Activity,
  Search,
  Bell,
  Filter,
  ChevronRight,
  Lock,
  MessageCircle,
  Download,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/* ─── Shared Design Tokens ─── */
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
  fontSize: 10,
  color: "#9E9E9E",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  fontFamily: "'DM Sans', sans-serif",
};

/* ─── PII Blur Pill ─── */
function RedactedPill({ width = 120, small }: { width?: number; small?: boolean }) {
  return (
    <span
      className="inline-block"
      style={{
        backgroundColor: "#E5E7EB",
        borderRadius: 100,
        fontSize: small ? 11 : 13,
        fontWeight: 500,
        userSelect: "none",
        width,
        textAlign: "center",
        display: "inline-block",
        padding: small ? "2px 0" : "4px 0",
      }}
    >
      <span
        style={{
          filter: "blur(5px)",
          display: "inline-block",
          color: "#9E9E9E",
        }}
      >
        Protected
      </span>
    </span>
  );
}

/* ─── iPhone 14 Frame ─── */
function PhoneFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="text-[13px]"
        style={{ fontWeight: 600, color: "#0D0F12", fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </span>
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          border: "6px solid #1A1A2E",
          backgroundColor: "#F8F9FA",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 pt-3 pb-1"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0D0F12" }}>
            9:41
          </span>
          <div
            style={{
              width: 120,
              height: 28,
              backgroundColor: "#0D0F12",
              borderRadius: 20,
            }}
          />
          <div className="flex items-center gap-1">
            <div
              style={{
                width: 16,
                height: 10,
                border: "1.5px solid #0D0F12",
                borderRadius: 2,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 1.5,
                  top: 1.5,
                  bottom: 1.5,
                  right: 4,
                  backgroundColor: "#0D0F12",
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex flex-col"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Bottom Tab Bar ─── */
function BottomTabBar({ active = 0 }: { active?: number }) {
  const tabs = [
    { icon: LayoutDashboard, label: "Home" },
    { icon: ShoppingCart, label: "Orders" },
    { icon: ScanText, label: "Extract" },
    { icon: FileText, label: "Invoices" },
    { icon: Package, label: "More" },
  ];

  return (
    <div
      className="flex items-end justify-around shrink-0"
      style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
        paddingTop: 8,
        paddingBottom: 28,
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      {tabs.map((t, i) => {
        const Icon = t.icon;
        const isActive = i === active;
        return (
          <div
            key={t.label}
            className="flex flex-col items-center gap-1"
            style={{ width: 60 }}
          >
            <div
              className="w-[36px] h-[36px] flex items-center justify-center"
              style={{
                borderRadius: 12,
                backgroundColor: isActive
                  ? "rgba(26,26,46,0.08)"
                  : "transparent",
              }}
            >
              <Icon
                size={20}
                color={isActive ? "#1A1A2E" : "#9E9E9E"}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#1A1A2E" : "#9E9E9E",
              }}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════
   SCREEN 1: Mobile Dashboard
   ════════════════════════════════════════ */
function MobileDashboard() {
  return (
    <PhoneFrame label="Screen 1 — Mobile Dashboard">
      <div className="flex flex-col h-full" style={{ paddingTop: 48 }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}
        >
          <div className="flex flex-col">
            <span style={{ fontWeight: 700, fontSize: 20, color: "#0D0F12" }}>
              Chat2Cash
            </span>
            <span className="text-[11px]" style={{ color: "#6B7280", fontWeight: 400 }}>
              Command Center
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-[36px] h-[36px] flex items-center justify-center"
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
              }}
            >
              <Bell size={18} color="#6B7280" />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
          style={{ backgroundColor: "#F8F9FA" }}
        >
          {/* Revenue Card */}
          <div style={CARD} className="p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span style={LABEL}>REVENUE RECOVERED</span>
              <div
                className="flex items-center gap-1 px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(0,200,83,0.08)",
                  borderRadius: 100,
                }}
              >
                <TrendingUp size={11} color="#00C853" strokeWidth={2.5} />
                <span className="text-[11px]" style={{ fontWeight: 600, color: "#00C853" }}>
                  +12%
                </span>
              </div>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 28,
                color: "#1A1A2E",
                lineHeight: 1.1,
              }}
            >
              ₹1,24,850
            </span>
            <span className="text-[11px]" style={{ color: "#9E9E9E" }}>
              This week
            </span>
          </div>

          {/* Two-column row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Orders */}
            <div style={CARD} className="p-4 flex flex-col gap-1.5">
              <span style={LABEL}>ORDERS</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 24,
                  color: "#1A1A2E",
                  lineHeight: 1.1,
                }}
              >
                247
              </span>
              <span className="text-[11px]" style={{ color: "#6B7280" }}>
                ↑ 18 today
              </span>
            </div>

            {/* Pending */}
            <div
              style={{
                ...CARD,
                backgroundColor: "#FFF8F0",
                border: "1px solid rgba(255,109,0,0.15)",
              }}
              className="p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span style={LABEL}>PENDING</span>
                <AlertTriangle size={14} color="#FF6D00" strokeWidth={2.2} />
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 24,
                  color: "#FF6D00",
                  lineHeight: 1.1,
                }}
              >
                9
              </span>
              <span className="text-[11px]" style={{ color: "#6B7280" }}>
                Need attention
              </span>
            </div>
          </div>

          {/* AI Status */}
          <div style={CARD} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-[36px] h-[36px] flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1A1A2E, #2979FF)",
                  borderRadius: 10,
                }}
              >
                <Activity size={18} color="#FFFFFF" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px]" style={{ fontWeight: 600, color: "#0D0F12" }}>
                  AI Queue Health
                </span>
                <span className="text-[11px]" style={{ color: "#6B7280" }}>
                  2 active workers • 0 waiting
                </span>
              </div>
            </div>
            <div
              className="w-[8px] h-[8px]"
              style={{
                backgroundColor: "#00C853",
                borderRadius: 100,
                boxShadow: "0 0 6px rgba(0,200,83,0.5)",
              }}
            />
          </div>

          {/* Recent Orders mini-list */}
          <div style={CARD} className="overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid #E5E7EB" }}
            >
              <span className="text-[13px]" style={{ fontWeight: 600, color: "#0D0F12" }}>
                Recent Orders
              </span>
              <span className="text-[11px]" style={{ color: "#2979FF", fontWeight: 500 }}>
                View all
              </span>
            </div>
            {[
              { id: "#ORD-0091", items: "Aaloo, Pyaaz, Namak", amt: "₹90", status: "Paid", sColor: "#00C853" },
              { id: "#ORD-0090", items: "5x Thali Plate", amt: "₹750", status: "Pending", sColor: "#FF6D00" },
              { id: "#ORD-0089", items: "Rice, Dal, Oil", amt: "₹520", status: "Paid", sColor: "#00C853" },
            ].map((o, i) => (
              <div
                key={o.id}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: i < 2 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span style={{ ...MONO, fontSize: 12, color: "#2979FF" }}>
                    {o.id}
                  </span>
                  <span className="text-[11px]" style={{ color: "#6B7280" }}>
                    {o.items}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ ...MONO, fontSize: 12, color: "#0D0F12" }}>
                    {o.amt}
                  </span>
                  <span
                    className="text-[9px] px-2 py-0.5"
                    style={{
                      fontWeight: 600,
                      color: "#FFFFFF",
                      backgroundColor: o.sColor,
                      borderRadius: 100,
                    }}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Extract CTA */}
          <button
            className="flex items-center justify-center gap-2 py-4 w-full cursor-pointer"
            style={{
              backgroundColor: "#1A1A2E",
              borderRadius: 16,
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#FFFFFF",
            }}
          >
            <ScanText size={18} />
            Paste WhatsApp Chat
          </button>
        </div>

        {/* Bottom Tab Bar */}
        <BottomTabBar active={0} />
      </div>
    </PhoneFrame>
  );
}

/* ════════════════════════════════════════
   SCREEN 2: Mobile Order Details Bottom Sheet
   ════════════════════════════════════════ */
function MobileOrderDetails() {
  const bgOrders = [
    { id: "#ORD-0091", summary: "Aaloo, Pyaaz, Namak", amt: "₹90", status: "Paid", sColor: "#00C853" },
    { id: "#ORD-0090", summary: "5x Thali Plate", amt: "₹750", status: "Pending", sColor: "#FF6D00" },
    { id: "#ORD-0089", summary: "Rice, Dal, Oil", amt: "₹520", status: "Paid", sColor: "#00C853" },
    { id: "#ORD-0088", summary: "Sugar 5kg, Atta 10kg", amt: "₹320", status: "Action", sColor: "#D32F2F" },
  ];

  return (
    <PhoneFrame label="Screen 2 — Order Details Bottom Sheet">
      <div className="flex flex-col h-full relative" style={{ paddingTop: 48 }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}
        >
          <span style={{ fontWeight: 600, fontSize: 17, color: "#0D0F12" }}>
            Orders
          </span>
          <div className="flex items-center gap-2">
            <div
              className="w-[36px] h-[36px] flex items-center justify-center"
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
              }}
            >
              <Filter size={16} color="#6B7280" />
            </div>
          </div>
        </div>

        {/* Search + filter chips */}
        <div
          className="flex flex-col gap-2.5 px-4 py-3 shrink-0"
          style={{ backgroundColor: "#F8F9FA" }}
        >
          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
            }}
          >
            <Search size={16} color="#9E9E9E" />
            <span className="text-[13px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
              Search orders...
            </span>
          </div>
          {/* Filter chips */}
          <div className="flex items-center gap-2">
            {[
              { label: "All", active: false },
              { label: "Pending", active: true },
              { label: "Paid", active: false },
              { label: "Action Needed", active: false },
            ].map((f) => (
              <div
                key={f.label}
                className="px-3 py-1.5 text-[11px]"
                style={{
                  fontWeight: f.active ? 600 : 400,
                  color: f.active ? "#FFFFFF" : "#6B7280",
                  backgroundColor: f.active ? "#1A1A2E" : "#FFFFFF",
                  borderRadius: 100,
                  border: f.active ? "none" : "1px solid #E5E7EB",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Order list (behind sheet) */}
        <div
          className="flex-1 overflow-hidden flex flex-col gap-2 px-4 py-2"
          style={{ backgroundColor: "#F8F9FA" }}
        >
          {bgOrders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between p-3.5"
              style={{
                ...CARD,
                opacity: 0.5,
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span style={{ ...MONO, fontSize: 12, color: "#2979FF" }}>
                  {o.id}
                </span>
                <span className="text-[11px]" style={{ color: "#6B7280" }}>
                  {o.summary}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5"
                  style={{
                    ...MONO,
                    fontSize: 12,
                    color: "#0D0F12",
                    backgroundColor: "#F3F4F6",
                    borderRadius: 6,
                  }}
                >
                  {o.amt}
                </span>
                <span
                  className="text-[9px] px-2 py-0.5"
                  style={{
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundColor: o.sColor,
                    borderRadius: 100,
                  }}
                >
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dimmed overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            zIndex: 10,
          }}
        />

        {/* ── Bottom Sheet ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "75%",
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div
              style={{
                width: 36,
                height: 4,
                backgroundColor: "#D1D5DB",
                borderRadius: 100,
              }}
            />
          </div>

          {/* Sheet header */}
          <div
            className="flex items-center justify-between px-5 pb-3 shrink-0"
            style={{ borderBottom: "1px solid #E5E7EB" }}
          >
            <div className="flex flex-col gap-0.5">
              <span style={{ ...MONO, fontWeight: 700, fontSize: 17, color: "#0D0F12" }}>
                #ORD-0090
              </span>
              <span className="text-[11px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
                Received via WhatsApp • 2h ago
              </span>
            </div>
            <span
              className="text-[11px] px-3 py-1"
              style={{
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#FF6D00",
                borderRadius: 100,
              }}
            >
              Pending
            </span>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
            {/* Original Message Preview */}
            <div
              className="flex flex-col gap-2 p-3.5"
              style={{
                backgroundColor: "#FFFBEB",
                borderRadius: 12,
                border: "1px solid #F5E6C8",
              }}
            >
              <span style={LABEL}>ORIGINAL CHAT</span>
              <p
                className="m-0 text-[13px]"
                style={{
                  color: "#374151",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                "bhai 5 thali ready rakhna kal ke liye, evening..."
              </p>
              <span
                className="text-[12px]"
                style={{
                  fontWeight: 600,
                  color: "#1A1A2E",
                  cursor: "pointer",
                }}
              >
                Show full chat →
              </span>
            </div>

            {/* Order Summary */}
            <div className="flex flex-col gap-1.5">
              <span style={LABEL}>ORDER SUMMARY</span>
              <div
                className="flex flex-col"
                style={{
                  backgroundColor: "#F8F9FA",
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <span className="text-[13px]" style={{ color: "#374151" }}>
                    5× Thali Plate
                  </span>
                  <span style={{ ...MONO, fontSize: 13, color: "#0D0F12" }}>
                    ₹750
                  </span>
                </div>
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <span className="text-[12px]" style={{ fontWeight: 600, color: "#0D0F12" }}>
                    Subtotal
                  </span>
                  <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: "#0D0F12" }}>
                    ₹750
                  </span>
                </div>
                <div
                  className="flex items-center justify-between px-4 py-2"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <span className="text-[11px]" style={{ color: "#6B7280" }}>
                    GST @ 5%
                  </span>
                  <span style={{ ...MONO, fontSize: 11, color: "#6B7280" }}>
                    ₹37.50
                  </span>
                </div>
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}>
                    Grand Total
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: 22,
                      color: "#1A1A2E",
                    }}
                  >
                    ₹787.50
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info (PII) */}
            <div className="flex flex-col gap-2">
              <span style={LABEL}>CUSTOMER INFO</span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Lock size={12} color="#9E9E9E" />
                  <span className="text-[12px]" style={{ color: "#6B7280" }}>
                    Customer:
                  </span>
                  <RedactedPill width={110} small />
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={12} color="#9E9E9E" />
                  <span className="text-[12px]" style={{ color: "#6B7280" }}>
                    Phone:
                  </span>
                  <RedactedPill width={100} small />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px]" style={{ color: "#6B7280" }}>
                    Delivery:
                  </span>
                  <span className="text-[13px]" style={{ fontWeight: 500, color: "#0D0F12" }}>
                    Tomorrow Evening
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer actions */}
          <div
            className="flex flex-col gap-2 px-5 pt-3 shrink-0"
            style={{
              borderTop: "1px solid #E5E7EB",
              paddingBottom: 28,
            }}
          >
            <button
              className="flex items-center justify-center gap-2 w-full cursor-pointer"
              style={{
                height: 52,
                backgroundColor: "#1A1A2E",
                borderRadius: 14,
                border: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              <FileText size={18} />
              Generate Invoice
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  height: 44,
                  backgroundColor: "#00C853",
                  borderRadius: 12,
                  border: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#FFFFFF",
                }}
              >
                Mark as Paid
              </button>
              <button
                className="flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  height: 44,
                  backgroundColor: "#FF6D00",
                  borderRadius: 12,
                  border: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#FFFFFF",
                }}
              >
                Send Reminder
              </button>
            </div>
            <div className="flex justify-center pt-1">
              <span
                className="text-[12px]"
                style={{ fontWeight: 500, color: "#2979FF", cursor: "pointer" }}
              >
                View Extraction Details →
              </span>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ════════════════════════════════════════
   SCREEN 3: Invoice Success State
   ════════════════════════════════════════ */
function MobileInvoiceSuccess() {
  return (
    <PhoneFrame label="Screen 3 — Invoice Success State">
      <div className="flex flex-col h-full">
        {/* ── Top Half: Dark Navy ── */}
        <div
          className="flex flex-col items-center justify-center shrink-0 relative"
          style={{
            backgroundColor: "#1A1A2E",
            paddingTop: 80,
            paddingBottom: 60,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          {/* Subtle radial glow */}
          <div
            style={{
              position: "absolute",
              top: "35%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 200,
              height: 200,
              background:
                "radial-gradient(circle, rgba(0,200,83,0.12) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          {/* Checkmark */}
          <div
            className="w-[72px] h-[72px] flex items-center justify-center mb-5"
            style={{
              backgroundColor: "rgba(0,200,83,0.12)",
              borderRadius: "50%",
              border: "2px solid rgba(0,200,83,0.25)",
              boxShadow: "0 0 40px rgba(0,200,83,0.15)",
            }}
          >
            <CheckCircle2 size={36} color="#00C853" strokeWidth={2} />
          </div>

          <span
            style={{
              fontWeight: 700,
              fontSize: 24,
              color: "#FFFFFF",
              lineHeight: 1.2,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 6,
            }}
          >
            Invoice Generated
          </span>
          <span
            style={{
              ...MONO,
              color: "#7B93DB",
              fontSize: 14,
              marginBottom: 6,
            }}
          >
            #INV-2024-0091
          </span>
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}
          >
            GST Compliant • PDF Ready
          </span>
        </div>

        {/* ── Mini Invoice Preview Card ── */}
        <div
          className="flex justify-center"
          style={{ marginTop: -36, zIndex: 5, padding: "0 28px" }}
        >
          <div
            className="w-full flex flex-col"
            style={{
              ...CARD,
              borderRadius: 16,
              transform: "rotate(-1deg)",
              boxShadow:
                "0px 8px 32px rgba(0,0,0,0.12), 0px 2px 12px rgba(0,0,0,0.07)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Watermark */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-18deg)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <div
                className="flex items-center gap-1 px-3 py-1"
                style={{
                  border: "2px solid rgba(0,200,83,0.15)",
                  borderRadius: 6,
                }}
              >
                <CheckCircle2
                  size={12}
                  color="rgba(0,200,83,0.22)"
                  strokeWidth={2.5}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    color: "rgba(0,200,83,0.18)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Valid for GST Filing
                </span>
              </div>
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: "1px solid #E5E7EB",
                backgroundColor: "#FAFBFC",
              }}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-[16px] h-[16px] flex items-center justify-center"
                    style={{ backgroundColor: "#1A1A2E", borderRadius: 4 }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 9,
                        color: "#FFFFFF",
                      }}
                    >
                      C
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#1A1A2E" }}>
                    Chat2Cash
                  </span>
                </div>
                <span className="text-[9px]" style={{ color: "#9E9E9E" }}>
                  Powered by AI
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#1A1A2E" }}>
                Tax Invoice
              </span>
            </div>

            {/* Meta */}
            <div
              className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-2.5"
              style={{ borderBottom: "1px solid #F3F4F6" }}
            >
              <div className="flex flex-col gap-0">
                <span style={{ ...LABEL, fontSize: 8 }}>INVOICE NO.</span>
                <span style={{ ...MONO, fontSize: 10, color: "#2979FF" }}>
                  INV-2024-0091
                </span>
              </div>
              <div className="flex flex-col gap-0">
                <span style={{ ...LABEL, fontSize: 8 }}>DATE</span>
                <span className="text-[10px]" style={{ fontWeight: 500, color: "#0D0F12" }}>
                  2 Mar 2026
                </span>
              </div>
              <div className="flex flex-col gap-0 mt-1">
                <span style={{ ...LABEL, fontSize: 8 }}>BILL TO</span>
                <RedactedPill width={100} small />
              </div>
            </div>

            {/* Line items */}
            <div style={{ borderBottom: "1px solid #F3F4F6" }}>
              {[
                { item: "Aaloo", price: "₹40" },
                { item: "Pyaaz", price: "₹30" },
                { item: "Namak", price: "₹20" },
              ].map((row, i) => (
                <div
                  key={row.item}
                  className="flex items-center justify-between px-4 py-1.5"
                  style={{
                    backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                  }}
                >
                  <span className="text-[11px]" style={{ color: "#374151" }}>
                    {row.item}
                  </span>
                  <span style={{ ...MONO, fontSize: 10, color: "#0D0F12" }}>
                    {row.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Tax rows */}
            <div
              className="flex flex-col px-4 py-2"
              style={{ backgroundColor: "#FAFBFC" }}
            >
              <div className="flex justify-between py-0.5">
                <span className="text-[10px]" style={{ color: "#9E9E9E" }}>
                  CGST @ 2.5%
                </span>
                <span style={{ ...MONO, fontSize: 10, color: "#6B7280" }}>
                  ₹2.25
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[10px]" style={{ color: "#9E9E9E" }}>
                  SGST @ 2.5%
                </span>
                <span style={{ ...MONO, fontSize: 10, color: "#6B7280" }}>
                  ₹2.25
                </span>
              </div>
              <div
                className="flex justify-between pt-2 mt-1"
                style={{ borderTop: "2px solid #1A1A2E" }}
              >
                <span style={{ fontWeight: 700, fontSize: 12, color: "#1A1A2E" }}>
                  Grand Total
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#1A1A2E",
                  }}
                >
                  ₹94.50
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Action Sheet ── */}
        <div
          className="flex flex-col mt-auto"
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex flex-col gap-2.5 px-5 pt-5">
            {/* Share Invoice (WhatsApp green) */}
            <button
              className="flex items-center justify-center gap-2 w-full cursor-pointer"
              style={{
                height: 52,
                backgroundColor: "#25D366",
                borderRadius: 14,
                border: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              <MessageCircle size={18} />
              Share Invoice
            </button>

            {/* Download PDF */}
            <button
              className="flex items-center justify-center gap-2 w-full cursor-pointer"
              style={{
                height: 48,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                border: "1.5px solid #1A1A2E",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#1A1A2E",
              }}
            >
              <Download size={16} />
              Download PDF
            </button>

            {/* Back to Orders */}
            <div className="flex justify-center py-1">
              <span
                className="text-[13px]"
                style={{ fontWeight: 500, color: "#2979FF", cursor: "pointer" }}
              >
                Back to Orders
              </span>
            </div>
          </div>

          {/* Small footer text */}
          <div
            className="flex justify-center pb-7 pt-2"
          >
            <span
              className="text-[10px]"
              style={{
                color: "#9E9E9E",
                fontWeight: 400,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              PII Redacted • Secure Export • Chat2Cash v2.1
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE: All 3 Mobile Screens
   ════════════════════════════════════════ */
export function MobilePage() {
  return (
    <div
      className="p-6 h-full overflow-y-auto"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Page title */}
      <div className="flex flex-col gap-1 mb-8">
        <h1
          className="m-0"
          style={{
            fontWeight: 700,
            fontSize: 24,
            color: "#0D0F12",
            lineHeight: 1.2,
          }}
        >
          Mobile Screens
        </h1>
        <p className="m-0 text-[13px]" style={{ color: "#6B7280" }}>
          iPhone 14 (390×844) — 3 core mobile flows for Chat2Cash.
        </p>
      </div>

      {/* 3 Phones side-by-side */}
      <div className="flex gap-10 items-start justify-center flex-wrap pb-10">
        <MobileDashboard />
        <MobileOrderDetails />
        <MobileInvoiceSuccess />
      </div>
    </div>
  );
}
