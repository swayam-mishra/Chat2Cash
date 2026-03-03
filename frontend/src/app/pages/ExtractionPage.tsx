import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Zap,
  AlertTriangle,
  Info,
  FileText,
  PenLine,
  Lock,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useApiClient } from "@/app/ApiClientContext";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/format";

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

/* ─── PII Redacted Pill ─── */
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

/* ─── WhatsApp Chat Bubble ─── */
function ChatBubble({
  text,
  time,
}: {
  text: string;
  time: string;
}) {
  return (
    <div className="flex justify-end">
      <div
        className="relative max-w-[85%] px-3 py-2"
        style={{
          backgroundColor: "#DCF8C6",
          borderRadius: "10px 10px 2px 10px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <p
          className="m-0"
          style={{
            fontSize: 14,
            color: "#111318",
            lineHeight: 1.55,
            fontWeight: 400,
          }}
        >
          {text}
        </p>
        <div className="flex justify-end mt-0.5">
          <span
            style={{
              fontSize: 10,
              color: "rgba(0,0,0,0.4)",
              fontWeight: 400,
            }}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Center Arrow ─── */
function TransformArrow() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-3 shrink-0 self-center">
      <div
        className="w-[48px] h-[48px] flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(26,26,46,0.08) 0%, rgba(41,121,255,0.12) 100%)",
          borderRadius: 14,
          animation: "glowPulse 2.4s ease-in-out infinite",
        }}
      >
        <Zap
          size={22}
          color="#1A1A2E"
          strokeWidth={2.2}
          style={{ animation: "boltFlash 2.4s ease-in-out infinite" }}
        />
      </div>
      <span
        className="text-[10px] tracking-[0.08em] uppercase"
        style={{
          fontWeight: 600,
          color: "#6B7280",
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        AI Magic
      </span>
    </div>
  );
}

/* ─── Flag Chip ─── */
function FlagChip({
  color,
  bgColor,
  icon,
  text,
}: {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={{
        backgroundColor: bgColor,
        borderRadius: 10,
        border: `1px solid ${color}20`,
      }}
    >
      {icon}
      <span
        className="text-[12px]"
        style={{
          fontWeight: 500,
          color,
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ─── Line Items Table ─── */
function LineItemsTable({ lineItems }: { lineItems: { item: string; qty: string; unit: string; price: string }[] }) {
  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Table header */}
      <div
        className="grid gap-2 px-4 py-2.5"
        style={{
          gridTemplateColumns: "1fr 56px 56px 72px",
          backgroundColor: "#F8F9FA",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {["Item", "Qty", "Unit", "Price"].map((h) => (
          <span key={h} style={LABEL}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {lineItems.map((row, i) => (
        <div
          key={row.item}
          className="grid gap-2 px-4 py-3 items-center"
          style={{
            gridTemplateColumns: "1fr 56px 56px 72px",
            backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
            borderBottom: "1px solid #F3F4F6",
          }}
        >
          <span
            className="text-[13px]"
            style={{ fontWeight: 500, color: "#0D0F12" }}
          >
            {row.item}
          </span>
          <span style={{ ...MONO, color: "#0D0F12" }}>{row.qty}</span>
          <span
            className="text-[13px]"
            style={{ color: "#6B7280", fontWeight: 400 }}
          >
            {row.unit}
          </span>
          <span style={{ ...MONO, color: "#0D0F12" }}>{row.price}</span>
        </div>
      ))}

      {/* Total row */}
      <div
        className="grid gap-2 px-4 py-3 items-center"
        style={{
          gridTemplateColumns: "1fr 56px 56px 72px",
          borderTop: "2px solid #1A1A2E",
          backgroundColor: "#FAFBFC",
        }}
      >
        <span
          className="text-[13px]"
          style={{ fontWeight: 700, color: "#1A1A2E" }}
        >
          TOTAL
        </span>
        <span />
        <span />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 14,
            color: "#1A1A2E",
          }}
        >
          {lineItems.reduce((sum, item) => {
            const price = parseFloat(item.price.replace(/[₹,]/g, "")) || 0;
            return sum + price;
          }, 0).toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN PAGE COMPONENT
   ───────────────────────────────────── */
export function ExtractionPage() {
  const client = useApiClient();
  const [extractedOrder, setExtractedOrder] = useState<Order | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionTime, setExtractionTime] = useState<number | null>(null);

  const EXAMPLE_MSG =
    "ram bhai kal 5 kilo chawal aur 2 litre tel dena, evening time mein";

  const handleExtract = async () => {
    if (!chatInput.trim() || extracting) return;
    setExtracting(true);
    setExtractError(null);
    const start = Date.now();
    try {
      const order = await client.extractMessage(chatInput.trim());
      setExtractionTime(Date.now() - start);
      setExtractedOrder(order);
    } catch (err: any) {
      setExtractError(err.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  // Dynamic line items from the extracted order
  const lineItems = extractedOrder
    ? extractedOrder.items.map((i) => ({
        item: i.product_name,
        qty: String(i.quantity),
        unit: "",
        price: formatINR(i.price),
      }))
    : [
        { item: "Aaloo", qty: "2", unit: "kg", price: "₹40" },
        { item: "Pyaaz", qty: "1", unit: "kg", price: "₹30" },
        { item: "Namak", qty: "1", unit: "pkt", price: "₹20" },
      ];

  if (!extractedOrder) {
    return (
      <div
        className="h-full overflow-y-auto flex flex-col"
        style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F9FA" }}
      >
        {/* ── Navy → White gradient strip ── */}
        <div
          className="shrink-0"
          style={{
            height: 160,
            background:
              "linear-gradient(180deg, rgba(26,26,46,0.06) 0%, rgba(26,26,46,0.01) 60%, transparent 100%)",
          }}
        />

        {/* ── Centered content ── */}
        <div
          className="flex flex-col items-center px-6 -mt-[100px]"
          style={{ maxWidth: 560, margin: "0 auto", marginTop: -100, width: "100%" }}
        >
          {/* ── Illustration: Chat → ⚡ → Invoice ── */}
          <div className="flex items-center gap-4 mb-10">
            {/* WhatsApp chat bubble */}
            <div
              className="relative px-4 py-3"
              style={{
                backgroundColor: "#DCF8C6",
                borderRadius: "14px 14px 4px 14px",
                maxWidth: 160,
                boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p
                className="m-0 text-[13px]"
                style={{
                  color: "#111318",
                  lineHeight: 1.5,
                  fontWeight: 400,
                  fontStyle: "italic",
                }}
              >
                "2 kilo aaloo"
              </p>
              <div
                className="absolute -bottom-[3px] left-[14px] w-[10px] h-[10px]"
                style={{
                  backgroundColor: "#DCF8C6",
                  transform: "rotate(45deg)",
                }}
              />
            </div>

            {/* Lightning bolt connector */}
            <div
              className="w-[44px] h-[44px] flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(26,26,46,0.08), rgba(255,109,0,0.12))",
                borderRadius: 12,
                animation: "glowPulse 2.4s ease-in-out infinite",
              }}
            >
              <Zap
                size={22}
                color="#FF6D00"
                strokeWidth={2.5}
                style={{ animation: "boltFlash 2.4s ease-in-out infinite" }}
              />
            </div>

            {/* Invoice document */}
            <div
              className="relative flex flex-col gap-1.5 px-4 py-3"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
                minWidth: 130,
              }}
            >
              <div className="flex items-center gap-1.5">
                <FileText size={13} color="#1A1A2E" strokeWidth={2} />
                <span
                  style={{ fontWeight: 700, fontSize: 11, color: "#1A1A2E" }}
                >
                  Tax Invoice
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div
                  style={{
                    width: 80,
                    height: 4,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 60,
                    height: 4,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 90,
                    height: 4,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 2,
                  }}
                />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={10} color="#00C853" strokeWidth={2.5} />
                <span
                  className="text-[9px]"
                  style={{ fontWeight: 600, color: "#00C853" }}
                >
                  GST Ready
                </span>
              </div>
            </div>
          </div>

          {/* ── Headline ── */}
          <h1
            className="m-0 text-center"
            style={{
              fontWeight: 700,
              fontSize: 24,
              color: "#1A1A2E",
              lineHeight: 1.35,
              maxWidth: 420,
              marginBottom: 12,
            }}
          >
            Turn your WhatsApp orders into invoices — in seconds.
          </h1>

          {/* ── Subtext ── */}
          <p
            className="m-0 text-center"
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "#6B7280",
              lineHeight: 1.6,
              maxWidth: 440,
              marginBottom: 32,
            }}
          >
            Paste a customer message below. Our AI reads Hinglish, extracts the
            order, and builds a GST invoice automatically.
          </p>

          {/* ── Example Message Preview ── */}
          <div
            className="w-full mb-6 cursor-pointer"
            style={{
              ...CARD,
              backgroundColor: "#FFFBEB",
              border: "1px solid #F5E6C8",
              padding: "16px 20px",
              transition: "all 0.2s",
            }}
            onClick={() => setChatInput(EXAMPLE_MSG)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0px 4px 20px rgba(255,109,0,0.1)";
              e.currentTarget.style.borderColor = "#F0C87A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0px 2px 12px rgba(0,0,0,0.07)";
              e.currentTarget.style.borderColor = "#F5E6C8";
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="text-[12px]"
                style={{ fontWeight: 600, color: "#FF6D00" }}
              >
                Try this example →
              </span>
            </div>
            {/* Chat bubble style */}
            <div
              className="px-3.5 py-2.5"
              style={{
                backgroundColor: "#DCF8C6",
                borderRadius: "12px 12px 4px 12px",
                display: "inline-block",
                maxWidth: "100%",
              }}
            >
              <p
                className="m-0 text-[14px]"
                style={{
                  color: "#111318",
                  fontWeight: 400,
                  lineHeight: 1.55,
                  fontStyle: "italic",
                }}
              >
                "{EXAMPLE_MSG}"
              </p>
            </div>
            <p
              className="m-0 mt-2 text-[11px]"
              style={{ color: "#9E9E9E", fontWeight: 400 }}
            >
              Tap to load this example
            </p>
          </div>

          {/* ── CTA Input Area ── */}
          <div className="w-full flex flex-col gap-3 mb-8">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Paste your WhatsApp order here..."
              rows={4}
              style={{
                width: "100%",
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                border: "1px solid #E5E7EB",
                padding: "14px 16px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#0D0F12",
                resize: "none",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1A1A2E";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(26,26,46,0.06)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleExtract}
              disabled={extracting || !chatInput.trim()}
              className="flex items-center justify-center gap-2.5 w-full cursor-pointer"
              style={{
                height: 56,
                backgroundColor: extracting ? "#6B7280" : "#1A1A2E",
                borderRadius: 14,
                border: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#FFFFFF",
                boxShadow: "0px 4px 20px rgba(26,26,46,0.18)",
                transition: "all 0.2s",
                opacity: (!chatInput.trim() && !extracting) ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!extracting) {
                  e.currentTarget.style.backgroundColor = "#2a2a44";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0px 6px 28px rgba(26,26,46,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if (!extracting) {
                  e.currentTarget.style.backgroundColor = "#1A1A2E";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0px 4px 20px rgba(26,26,46,0.18)";
                }
              }}
            >
              {extracting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {extracting ? "Extracting…" : "Extract Order with AI"}
            </button>
            {extractError && (
              <div className="flex items-center gap-2 text-[13px] mt-1" style={{ color: "#D32F2F" }}>
                <AlertCircle size={14} /> {extractError}
              </div>
            )}
          </div>

          {/* ── Trust Strip ── */}
          <div
            className="w-full flex items-center justify-center gap-6 py-4 mb-6"
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 14,
            }}
          >
            {[
              { icon: <Lock size={14} color="#9E9E9E" strokeWidth={2} />, label: "PII PROTECTED" },
              { icon: <Zap size={14} color="#9E9E9E" strokeWidth={2} />, label: "~1 SEC EXTRACT" },
              { icon: <FileText size={14} color="#9E9E9E" strokeWidth={2} />, label: "GST READY" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                {item.icon}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#9E9E9E",
                    letterSpacing: "0.04em",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Keyframe Animations ── */}
        <style>{`
          @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(26,26,46,0.08); }
            50% { box-shadow: 0 0 20px 6px rgba(41,121,255,0.15); }
          }
          @keyframes boltFlash {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.12); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="p-6 h-full overflow-y-auto"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Breadcrumb + Status ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
            Dashboard
          </span>
          <span className="text-[13px]" style={{ color: "#D1D5DB" }}>
            /
          </span>
          <span className="text-[13px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
            Extraction
          </span>
          <span className="text-[13px]" style={{ color: "#D1D5DB" }}>
            /
          </span>
          <span
            className="text-[13px]"
            style={{
              ...MONO,
              color: "#0D0F12",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            #EXT-{extractedOrder?.id?.slice(-4) ?? "0000"}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5"
          style={{
            backgroundColor: "rgba(0,200,83,0.08)",
            borderRadius: 100,
            border: "1px solid rgba(0,200,83,0.2)",
          }}
        >
          <CheckCircle2 size={13} color="#00C853" strokeWidth={2.5} />
          <span
            className="text-[12px]"
            style={{ fontWeight: 600, color: "#00C853" }}
          >
            Completed
          </span>
        </div>
      </div>

      {/* ── Two-Card Layout with Center Arrow ── */}
      <div className="flex gap-4 items-stretch" style={{ minHeight: 520 }}>
        {/* ───── LEFT CARD: Raw WhatsApp Chat ───── */}
        <div className="flex-1 flex flex-col" style={CARD}>
          {/* Yellow-tint header strip */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              backgroundColor: "#FFFBEB",
              borderBottom: "1px solid #F5E6C8",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-[30px] h-[30px] flex items-center justify-center"
                style={{ backgroundColor: "#25D366", borderRadius: 8 }}
              >
                <MessageCircle size={16} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#0D0F12",
                  }}
                >
                  Original Message
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "#6B7280", fontWeight: 400 }}
                >
                  Raw WhatsApp Chat
                </span>
              </div>
            </div>
            <span
              className="text-[12px]"
              style={{ color: "#6B7280", fontWeight: 500 }}
            >
              Today, 11:32 AM
            </span>
          </div>

          {/* Chat bubbles area */}
          <div
            className="flex-1 flex flex-col gap-2.5 p-6"
            style={{
              backgroundColor: "#F8F9FA",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          >
            <ChatBubble
              text="bhai kal ke liye order confirm karo"
              time="11:32 AM"
            />
            <ChatBubble
              text="2 kilo aaloo, 1 kilo pyaaz, aur ek packet namak wala"
              time="11:32 AM"
            />
            <ChatBubble
              text="total kitna hoga? jaldi batao delivery bhi chahiye"
              time="11:33 AM"
            />
          </div>

          {/* Metadata bar */}
          <div
            className="flex items-center gap-4 px-6 py-3"
            style={{
              backgroundColor: "#F3F4F6",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            {[
              "Language: Hinglish",
              "PII Redacted ✓",
              `Extracted: ${extractionTime ? (extractionTime / 1000).toFixed(1) + "s" : "—"}`,
            ].map((item, i) => (
              <span key={item} className="flex items-center gap-4">
                {i > 0 && (
                  <span
                    className="w-[3px] h-[3px]"
                    style={{
                      backgroundColor: "#9E9E9E",
                      borderRadius: 100,
                      display: "inline-block",
                    }}
                  />
                )}
                <span
                  className="text-[11px]"
                  style={{ color: "#6B7280", fontWeight: 500 }}
                >
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ───── CENTER: Animated Arrow ───── */}
        <TransformArrow />

        {/* ───── RIGHT CARD: Structured Order ───── */}
        <div className="flex-1 flex flex-col" style={CARD}>
          {/* Green-tint header strip */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              backgroundColor: "#F0FDF4",
              borderBottom: "1px solid #C6F6D5",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-[30px] h-[30px] flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1A1A2E 0%, #2979FF 100%)",
                  borderRadius: 8,
                }}
              >
                <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#0D0F12",
                  }}
                >
                  AI Extracted Order
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "#6B7280", fontWeight: 400 }}
                >
                  Structured Data Output
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1"
              style={{
                backgroundColor: "rgba(0,200,83,0.1)",
                borderRadius: 100,
                border: "1px solid rgba(0,200,83,0.2)",
              }}
            >
              <CheckCircle2 size={12} color="#00C853" strokeWidth={2.5} />
              <span
                className="text-[12px]"
                style={{
                  fontWeight: 600,
                  color: "#00C853",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {extractedOrder?.confidence === "high" ? "97%" : extractedOrder?.confidence === "medium" ? "75%" : "50%"}
              </span>
              <span
                className="text-[11px]"
                style={{ fontWeight: 500, color: "#00C853" }}
              >
                Confidence
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
            {/* ── Order Details ── */}
            <div className="flex flex-col gap-0">
              <span
                style={{
                  ...LABEL,
                  fontSize: 10,
                  marginBottom: 10,
                  color: "#9E9E9E",
                }}
              >
                ORDER DETAILS
              </span>
              <div
                className="grid grid-cols-2 gap-x-6 gap-y-3 p-4"
                style={{
                  backgroundColor: "#F8F9FA",
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span style={{ ...LABEL, fontSize: 10 }}>ORDER ID</span>
                  <span style={{ ...MONO, color: "#2979FF" }}>#{extractedOrder?.id ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ ...LABEL, fontSize: 10 }}>CUSTOMER</span>
                  <RedactedPill width={130} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ ...LABEL, fontSize: 10 }}>DELIVERY</span>
                  <span
                    className="text-[13px]"
                    style={{ fontWeight: 500, color: "#0D0F12" }}
                  >
                    Tomorrow
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ ...LABEL, fontSize: 10 }}>INTENT</span>
                  <span
                    className="text-[13px]"
                    style={{ fontWeight: 500, color: "#0D0F12" }}
                  >
                    Order Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* ── Line Items ── */}
            <div className="flex flex-col gap-0">
              <span
                style={{
                  ...LABEL,
                  fontSize: 10,
                  marginBottom: 10,
                  color: "#9E9E9E",
                }}
              >
                LINE ITEMS
              </span>
              <LineItemsTable lineItems={lineItems} />
            </div>

            {/* ── Flags ── */}
            <div className="flex flex-col gap-0">
              <span
                style={{
                  ...LABEL,
                  fontSize: 10,
                  marginBottom: 10,
                  color: "#9E9E9E",
                }}
              >
                FLAGS
              </span>
              <div className="flex flex-col gap-2">
                <FlagChip
                  color="#FF6D00"
                  bgColor="rgba(255,109,0,0.06)"
                  icon={
                    <AlertTriangle
                      size={14}
                      color="#FF6D00"
                      strokeWidth={2.2}
                    />
                  }
                  text="Delivery requested — confirm slot"
                />
                <FlagChip
                  color="#2979FF"
                  bgColor="rgba(41,121,255,0.06)"
                  icon={
                    <Info size={14} color="#2979FF" strokeWidth={2.2} />
                  }
                  text="Price auto-estimated — verify with catalog"
                />
              </div>
            </div>
          </div>

          {/* ── Bottom Action Row ── */}
          <div
            className="flex items-center gap-3 px-6 py-4"
            style={{ borderTop: "1px solid #E5E7EB" }}
          >
            <button
              className="flex-[2] flex items-center justify-center gap-2 py-3 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#1A1A2E",
                borderRadius: 10,
                border: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a44";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0px 4px 16px rgba(26,26,46,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1A1A2E";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <FileText size={16} />
              Generate GST Invoice
            </button>
            <button
              className="flex-[1] flex items-center justify-center gap-2 py-3 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "#6B7280",
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                transition: "all 0.2s",
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
              <PenLine size={15} />
              Edit & Confirm
            </button>
          </div>
        </div>
      </div>

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(26,26,46,0.08);
          }
          50% {
            box-shadow: 0 0 20px 6px rgba(41,121,255,0.15);
          }
        }
        @keyframes boltFlash {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.12); }
        }
      `}</style>
    </div>
  );
}