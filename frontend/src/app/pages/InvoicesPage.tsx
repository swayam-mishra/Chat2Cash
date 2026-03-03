import React, { useState } from "react";
import {
  FileText,
  Eye,
  MessageCircle,
  IndianRupee,
  Receipt,
  Download,
  X,
  CheckCircle2,
  Leaf,
} from "lucide-react";

/* ─── Design Tokens ─── */
const CARD: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
  fontFamily: "'DM Sans', sans-serif",
  overflow: "hidden",
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
  textTransform: "uppercase" as const,
  fontFamily: "'DM Sans', sans-serif",
};

/* ─── Types ─── */
type InvoiceStatus = "Sent" | "Downloaded" | "Pending";

interface InvoiceRow {
  invoiceNo: string;
  orderRef: string;
  date: string;
  amount: string;
  gst: string;
  status: InvoiceStatus;
}

const statusStyles: Record<
  InvoiceStatus,
  { bg: string; color: string }
> = {
  Sent: { bg: "#2979FF", color: "#FFFFFF" },
  Downloaded: { bg: "#00C853", color: "#FFFFFF" },
  Pending: { bg: "#FF6D00", color: "#FFFFFF" },
};

/* ─── Mock Data ─── */
const invoices: InvoiceRow[] = [
  {
    invoiceNo: "INV-2024-0091",
    orderRef: "#ORD-0091",
    date: "2 Mar 2026",
    amount: "₹90.00",
    gst: "₹4.50",
    status: "Downloaded",
  },
  {
    invoiceNo: "INV-2024-0090",
    orderRef: "#ORD-0090",
    date: "2 Mar 2026",
    amount: "₹750.00",
    gst: "₹37.50",
    status: "Sent",
  },
  {
    invoiceNo: "INV-2024-0089",
    orderRef: "#ORD-0089",
    date: "1 Mar 2026",
    amount: "₹520.00",
    gst: "₹26.00",
    status: "Pending",
  },
  {
    invoiceNo: "INV-2024-0088",
    orderRef: "#ORD-0088",
    date: "1 Mar 2026",
    amount: "₹320.00",
    gst: "₹16.00",
    status: "Sent",
  },
  {
    invoiceNo: "INV-2024-0087",
    orderRef: "#ORD-0087",
    date: "28 Feb 2026",
    amount: "₹95.00",
    gst: "₹4.75",
    status: "Downloaded",
  },
  {
    invoiceNo: "INV-2024-0086",
    orderRef: "#ORD-0086",
    date: "28 Feb 2026",
    amount: "₹1,549.50",
    gst: "₹77.48",
    status: "Pending",
  },
];

/* ─── PII Blur Pill ─── */
function RedactedPill({ width = 120 }: { width?: number }) {
  return (
    <span
      className="inline-block py-1"
      style={{
        backgroundColor: "#E5E7EB",
        borderRadius: 100,
        fontSize: 13,
        fontWeight: 500,
        userSelect: "none",
        width,
        textAlign: "center",
        display: "inline-block",
      }}
    >
      <span
        style={{
          filter: "blur(5px)",
          display: "inline-block",
          color: "#9E9E9E",
        }}
      >
        Customer PII
      </span>
    </span>
  );
}

/* ─── Status Pill ─── */
function StatusPill({ status }: { status: InvoiceStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[11px] w-fit"
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

/* ──────────────────────────────────────
   PDF PREVIEW PANEL
   ────────────────────────────────────── */
function PDFPreviewPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={CARD}>
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-2">
          <FileText size={16} color="#1A1A2E" />
          <span style={{ fontWeight: 600, fontSize: 14, color: "#0D0F12" }}>
            Invoice Preview
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-[28px] h-[28px] flex items-center justify-center cursor-pointer"
          style={{
            backgroundColor: "#F8F9FA",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
          }}
        >
          <X size={14} color="#6B7280" />
        </button>
      </div>

      {/* Invoice body — scrollable */}
      <div className="flex-1 overflow-y-auto p-5">
        <div
          className="relative flex flex-col"
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          {/* ── Watermark Stamp ── */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-22deg)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <div
              className="flex items-center gap-2 px-5 py-2"
              style={{
                border: "3px solid rgba(0,200,83,0.18)",
                borderRadius: 10,
              }}
            >
              <CheckCircle2
                size={18}
                color="rgba(0,200,83,0.25)"
                strokeWidth={2.5}
              />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "rgba(0,200,83,0.2)",
                  letterSpacing: "0.08em",
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: "uppercase",
                }}
              >
                Valid Invoice
              </span>
            </div>
          </div>

          {/* ── Invoice Header ── */}
          <div
            className="flex items-start justify-between p-5 pb-4"
            style={{
              borderBottom: "1px solid #E5E7EB",
              backgroundColor: "#FAFBFC",
            }}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-[24px] h-[24px] flex items-center justify-center"
                  style={{ backgroundColor: "#1A1A2E", borderRadius: 6 }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#FFFFFF",
                    }}
                  >
                    C
                  </span>
                </div>
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E" }}
                >
                  Chat2Cash
                </span>
                <Leaf size={13} color="#25D366" strokeWidth={2.5} />
              </div>
              <span
                className="text-[11px]"
                style={{ color: "#6B7280", fontWeight: 400 }}
              >
                Ravi's Kirana Store
              </span>
              <span
                className="text-[10px]"
                style={{ color: "#9E9E9E", fontWeight: 400 }}
              >
                Shop No. 12, Main Market, Lajpat Nagar
              </span>
              <span
                className="text-[10px]"
                style={{ color: "#9E9E9E", fontWeight: 400 }}
              >
                New Delhi — 110024
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#1A1A2E",
                  letterSpacing: "0.02em",
                }}
              >
                Tax Invoice
              </span>
              <span
                className="text-[11px] px-2 py-0.5 mt-0.5"
                style={{
                  fontWeight: 500,
                  color: "#00C853",
                  backgroundColor: "rgba(0,200,83,0.08)",
                  borderRadius: 4,
                }}
              >
                GST Compliant
              </span>
            </div>
          </div>

          {/* ── Invoice Meta Grid ── */}
          <div
            className="grid grid-cols-2 gap-x-5 gap-y-3 px-5 py-4"
            style={{ borderBottom: "1px solid #E5E7EB" }}
          >
            <div className="flex flex-col gap-0.5">
              <span style={{ ...LABEL, fontSize: 9 }}>INVOICE NO.</span>
              <span style={{ ...MONO, color: "#2979FF", fontSize: 12 }}>
                INV-2024-0091
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span style={{ ...LABEL, fontSize: 9 }}>DATE</span>
              <span
                className="text-[12px]"
                style={{ fontWeight: 500, color: "#0D0F12" }}
              >
                2 Mar 2026
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span style={{ ...LABEL, fontSize: 9 }}>DUE DATE</span>
              <span
                className="text-[12px]"
                style={{ fontWeight: 500, color: "#0D0F12" }}
              >
                9 Mar 2026
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span style={{ ...LABEL, fontSize: 9 }}>GSTIN</span>
              <span style={{ ...MONO, color: "#0D0F12", fontSize: 11 }}>
                07AXXPK1234R1Z5
              </span>
            </div>
          </div>

          {/* ── Bill To ── */}
          <div
            className="flex flex-col gap-1 px-5 py-3.5"
            style={{
              borderBottom: "1px solid #E5E7EB",
              backgroundColor: "#F8F9FA",
            }}
          >
            <span style={{ ...LABEL, fontSize: 9 }}>BILL TO</span>
            <RedactedPill width={160} />
            <span className="inline-block mt-0.5">
              <RedactedPill width={200} />
            </span>
          </div>

          {/* ── Line Items Table ── */}
          <div>
            {/* Table header */}
            <div
              className="grid gap-1 px-5 py-2"
              style={{
                gridTemplateColumns: "1fr 70px 50px 60px 70px",
                borderBottom: "1px solid #E5E7EB",
                backgroundColor: "#F8F9FA",
              }}
            >
              {["Item", "HSN", "Qty", "Rate", "Amount"].map((h) => (
                <span key={h} style={{ ...LABEL, fontSize: 9 }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {[
              {
                item: "Aaloo (Potato)",
                hsn: "0701",
                qty: "2 kg",
                rate: "₹20.00",
                amount: "₹40.00",
              },
              {
                item: "Pyaaz (Onion)",
                hsn: "0703",
                qty: "1 kg",
                rate: "₹30.00",
                amount: "₹30.00",
              },
              {
                item: "Namak (Salt)",
                hsn: "2501",
                qty: "1 pkt",
                rate: "₹20.00",
                amount: "₹20.00",
              },
            ].map((row, i) => (
              <div
                key={row.item}
                className="grid gap-1 px-5 py-2.5 items-center"
                style={{
                  gridTemplateColumns: "1fr 70px 50px 60px 70px",
                  backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <span
                  className="text-[12px]"
                  style={{ fontWeight: 500, color: "#0D0F12" }}
                >
                  {row.item}
                </span>
                <span style={{ ...MONO, fontSize: 10, color: "#6B7280" }}>
                  {row.hsn}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "#374151", fontWeight: 400 }}
                >
                  {row.qty}
                </span>
                <span style={{ ...MONO, fontSize: 11, color: "#0D0F12" }}>
                  {row.rate}
                </span>
                <span style={{ ...MONO, fontSize: 11, color: "#0D0F12" }}>
                  {row.amount}
                </span>
              </div>
            ))}
          </div>

          {/* ── Tax & Total Block ── */}
          <div
            className="flex flex-col gap-0 px-5 py-3"
            style={{
              borderTop: "1px solid #E5E7EB",
              backgroundColor: "#FAFBFC",
            }}
          >
            <div className="flex justify-between py-1">
              <span
                className="text-[12px]"
                style={{ color: "#6B7280", fontWeight: 400 }}
              >
                Subtotal
              </span>
              <span style={{ ...MONO, fontSize: 12, color: "#0D0F12" }}>
                ₹90.00
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span
                className="text-[12px]"
                style={{ color: "#6B7280", fontWeight: 400 }}
              >
                CGST @ 2.5%
              </span>
              <span style={{ ...MONO, fontSize: 12, color: "#0D0F12" }}>
                ₹2.25
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span
                className="text-[12px]"
                style={{ color: "#6B7280", fontWeight: 400 }}
              >
                SGST @ 2.5%
              </span>
              <span style={{ ...MONO, fontSize: 12, color: "#0D0F12" }}>
                ₹2.25
              </span>
            </div>
            <div
              className="flex justify-between pt-2.5 mt-1"
              style={{ borderTop: "2px solid #1A1A2E" }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#1A1A2E",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Grand Total
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#1A1A2E",
                }}
              >
                ₹94.50
              </span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-center px-5 py-3"
            style={{
              borderTop: "1px solid #E5E7EB",
              backgroundColor: "#F8F9FA",
            }}
          >
            <span
              className="text-[10px]"
              style={{
                color: "#9E9E9E",
                fontWeight: 400,
                fontFamily: "'DM Sans', sans-serif",
                textAlign: "center",
              }}
            >
              Generated by Chat2Cash AI &nbsp;•&nbsp; GST Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Panel footer actions */}
      <div
        className="flex items-center gap-2 px-5 py-3.5 shrink-0"
        style={{ borderTop: "1px solid #E5E7EB" }}
      >
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] cursor-pointer"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            color: "#6B7280",
            backgroundColor: "#F8F9FA",
            borderRadius: 10,
            border: "1px solid #E5E7EB",
          }}
        >
          <Download size={14} />
          Download PDF
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] cursor-pointer"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            color: "#FFFFFF",
            backgroundColor: "#25D366",
            borderRadius: 10,
            border: "none",
          }}
        >
          <MessageCircle size={14} />
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   MAIN INVOICES PAGE
   ────────────────────────────────────── */
export function InvoicesPage() {
  const [previewOpen, setPreviewOpen] = useState(true);

  return (
    <div
      className="p-6 h-full overflow-y-auto"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1
            className="m-0"
            style={{
              fontWeight: 700,
              fontSize: 24,
              color: "#0D0F12",
              lineHeight: 1.2,
            }}
          >
            Invoices
          </h1>
          <p className="m-0 text-[13px]" style={{ color: "#6B7280" }}>
            GST-compliant invoices auto-generated from confirmed orders.
          </p>
        </div>
      </div>

      {/* ── Top Metric Row (3 Bento Cards) ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Total Invoiced */}
        <div style={CARD} className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={LABEL}>TOTAL INVOICED THIS MONTH</span>
            <div
              className="w-[32px] h-[32px] flex items-center justify-center"
              style={{
                backgroundColor: "rgba(26,26,46,0.06)",
                borderRadius: 10,
              }}
            >
              <IndianRupee size={16} color="#1A1A2E" strokeWidth={2} />
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
            ₹3,24,500
          </span>
          <span className="text-[12px]" style={{ color: "#6B7280", fontWeight: 400 }}>
            from 47 invoices
          </span>
        </div>

        {/* GST Collected */}
        <div style={CARD} className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={LABEL}>GST COLLECTED</span>
            <div
              className="w-[32px] h-[32px] flex items-center justify-center"
              style={{
                backgroundColor: "rgba(0,200,83,0.08)",
                borderRadius: 10,
              }}
            >
              <Receipt size={16} color="#00C853" strokeWidth={2} />
            </div>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 28,
              color: "#00C853",
              lineHeight: 1.1,
            }}
          >
            ₹15,450
          </span>
          <span className="text-[12px]" style={{ color: "#6B7280", fontWeight: 400 }}>
            CGST + SGST combined
          </span>
        </div>

        {/* Pending Download */}
        <div style={CARD} className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={LABEL}>PENDING DOWNLOAD</span>
            <div
              className="w-[32px] h-[32px] flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255,109,0,0.08)",
                borderRadius: 10,
              }}
            >
              <Download size={16} color="#FF6D00" strokeWidth={2} />
            </div>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 28,
              color: "#FF6D00",
              lineHeight: 1.1,
            }}
          >
            12
          </span>
          <span className="text-[12px]" style={{ color: "#6B7280", fontWeight: 400 }}>
            invoices not yet downloaded
          </span>
        </div>
      </div>

      {/* ── Main Content: Table + PDF Preview ── */}
      <div className="flex gap-4 items-start">
        {/* ── Invoice List Table ── */}
        <div className={previewOpen ? "flex-1 min-w-0" : "w-full"} style={CARD}>
          {/* Table header bar */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid #E5E7EB" }}
          >
            <span style={{ fontWeight: 600, fontSize: 16, color: "#0D0F12" }}>
              All Invoices
            </span>
            <span
              className="text-[12px] px-3 py-1"
              style={{
                fontWeight: 500,
                color: "#6B7280",
                backgroundColor: "#F3F4F6",
                borderRadius: 100,
              }}
            >
              {invoices.length} invoices
            </span>
          </div>

          {/* Column headers */}
          <div
            className="grid gap-2 px-6 py-2.5"
            style={{
              gridTemplateColumns: previewOpen
                ? "120px 90px 90px 80px 60px 80px 1fr"
                : "130px 100px 100px 90px 70px 90px 1fr",
              backgroundColor: "#F8F9FA",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            {[
              "Invoice No",
              "Order Ref",
              "Date",
              "Amount",
              "GST",
              "Status",
              "Actions",
            ].map((h) => (
              <span key={h} style={LABEL}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {invoices.map((inv, i) => (
            <div
              key={inv.invoiceNo}
              className="grid gap-2 px-6 py-3 items-center"
              style={{
                gridTemplateColumns: previewOpen
                  ? "120px 90px 90px 80px 60px 80px 1fr"
                  : "130px 100px 100px 90px 70px 90px 1fr",
                borderBottom:
                  i < invoices.length - 1 ? "1px solid #F3F4F6" : "none",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#FAFBFC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <span style={{ ...MONO, color: "#2979FF", fontSize: 12 }}>
                {inv.invoiceNo}
              </span>
              <span style={{ ...MONO, color: "#0D0F12", fontSize: 12 }}>
                {inv.orderRef}
              </span>
              <span
                className="text-[12px]"
                style={{ color: "#6B7280", fontWeight: 400 }}
              >
                {inv.date}
              </span>
              <span style={{ ...MONO, color: "#0D0F12", fontSize: 12 }}>
                {inv.amount}
              </span>
              <span style={{ ...MONO, color: "#6B7280", fontSize: 11 }}>
                {inv.gst}
              </span>
              <StatusPill status={inv.status} />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] cursor-pointer"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    color: "#6B7280",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1A1A2E";
                    e.currentTarget.style.color = "#1A1A2E";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.color = "#6B7280";
                  }}
                >
                  <Eye size={12} />
                  Preview PDF
                </button>
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] cursor-pointer"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundColor: "#25D366",
                    borderRadius: 6,
                    border: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1DA851";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#25D366";
                  }}
                >
                  <MessageCircle size={12} />
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── PDF Preview Panel (45% width) ── */}
        {previewOpen && (
          <div style={{ width: "45%", flexShrink: 0, minHeight: 600 }}>
            <PDFPreviewPanel onClose={() => setPreviewOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
