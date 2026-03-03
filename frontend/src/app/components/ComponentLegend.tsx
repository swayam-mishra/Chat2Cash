import React from "react";

const components = [
  {
    name: "Status Badge",
    description: "Pill-shaped indicators for invoice states",
    tokens: ["Status/*", "radius: 100px"],
    preview: (
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Paid", bg: "#00C853", color: "#fff" },
          { label: "Pending", bg: "#FF6D00", color: "#fff" },
          { label: "Processing", bg: "#2979FF", color: "#fff" },
          { label: "Failed", bg: "#D32F2F", color: "#fff" },
          { label: "Draft", bg: "#9E9E9E", color: "#fff" },
        ].map((b) => (
          <span
            key={b.label}
            className="inline-flex items-center px-3 py-1 text-[12px]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              borderRadius: 100,
              backgroundColor: b.bg,
              color: b.color,
            }}
          >
            {b.label}
          </span>
        ))}
      </div>
    ),
  },
  {
    name: "Metric Card",
    description: "Dashboard KPI cards with shadow elevation",
    tokens: ["Background/Card", "Shadow/Card", "radius: 16px"],
    preview: (
      <div
        className="p-4 flex flex-col gap-1"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
          border: "1px solid #E5E7EB",
        }}
      >
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          Total Revenue
        </span>
        <span
          className="text-[24px]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            color: "#0D0F12",
          }}
        >
          ₹12,45,000
        </span>
        <span
          className="text-[13px]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "#00C853",
          }}
        >
          +12.4% ↑
        </span>
      </div>
    ),
  },
  {
    name: "Chat Bubble",
    description: "Hinglish message bubbles for WhatsApp-style chat",
    tokens: ["Body/Chat", "radius: 16px"],
    preview: (
      <div className="flex flex-col gap-2">
        <div
          className="p-3 max-w-[220px] self-start"
          style={{
            backgroundColor: "#F8F9FA",
            borderRadius: "16px 16px 16px 4px",
            border: "1px solid #E5E7EB",
          }}
        >
          <span
            className="text-[14px]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            Bhai, invoice #4521 ka payment aaya kya?
          </span>
        </div>
        <div
          className="p-3 max-w-[220px] self-end"
          style={{
            backgroundColor: "#1A1A2E",
            borderRadius: "16px 16px 4px 16px",
          }}
        >
          <span
            className="text-[14px]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              color: "#FFFFFF",
              lineHeight: 1.6,
            }}
          >
            Haan! ₹25,000 received ✅
          </span>
        </div>
      </div>
    ),
  },
  {
    name: "Input Field",
    description: "Form inputs with subtle border and focus states",
    tokens: ["Border/Default", "radius: 10px"],
    preview: (
      <div className="flex flex-col gap-2">
        <label
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          Order ID
        </label>
        <div
          className="px-3 py-2.5 flex items-center"
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            backgroundColor: "#FFFFFF",
          }}
        >
          <span
            className="text-[13px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#2979FF",
            }}
          >
            ORD-2026-04521
          </span>
        </div>
      </div>
    ),
  },
  {
    name: "Sidebar Nav Item",
    description: "Dark sidebar navigation links",
    tokens: ["Background/Sidebar", "Text/Inverse"],
    preview: (
      <div
        className="p-3 flex flex-col gap-1"
        style={{ backgroundColor: "#111318", borderRadius: 12 }}
      >
        {["Dashboard", "Invoices", "Chat", "Settings"].map((item, i) => (
          <div
            key={item}
            className="px-3 py-2 flex items-center gap-2 cursor-pointer"
            style={{
              borderRadius: 8,
              backgroundColor: i === 0 ? "rgba(255,255,255,0.08)" : "transparent",
            }}
          >
            <span
              className="text-[14px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? "#FFFFFF" : "rgba(255,255,255,0.5)",
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: "Amount Display",
    description: "Monospace currency formatting for financial data",
    tokens: ["Mono/Code", "Status/Paid"],
    preview: (
      <div className="flex flex-col gap-2">
        {[
          { label: "Invoice Total", amount: "₹1,25,000.00", color: "#0D0F12" },
          { label: "Amount Paid", amount: "₹1,00,000.00", color: "#00C853" },
          { label: "Balance Due", amount: "₹25,000.00", color: "#FF6D00" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span
              className="text-[13px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                color: "#6B7280",
              }}
            >
              {row.label}
            </span>
            <span
              className="text-[14px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                color: row.color,
              }}
            >
              {row.amount}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: "Table Row",
    description: "Data table rows for invoice lists",
    tokens: ["Border/Default", "Body/Default"],
    preview: (
      <div
        className="overflow-hidden"
        style={{ border: "1px solid #E5E7EB", borderRadius: 12 }}
      >
        <div
          className="grid grid-cols-4 gap-2 px-3 py-2"
          style={{ backgroundColor: "#F8F9FA", borderBottom: "1px solid #E5E7EB" }}
        >
          {["Invoice", "Client", "Amount", "Status"].map((h) => (
            <span
              key={h}
              className="text-[12px] tracking-[0.04em] uppercase"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                color: "#6B7280",
              }}
            >
              {h}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 px-3 py-2.5 items-center">
          <span
            className="text-[13px]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#2979FF" }}
          >
            #4521
          </span>
          <span
            className="text-[13px]"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0F12" }}
          >
            Sharma Ji
          </span>
          <span
            className="text-[13px]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#0D0F12" }}
          >
            ₹25,000
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 text-[11px] w-fit"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              borderRadius: 100,
              backgroundColor: "#00C853",
              color: "#fff",
            }}
          >
            Paid
          </span>
        </div>
      </div>
    ),
  },
  {
    name: "Brand Mark",
    description: "Logo lockup with deep navy accent",
    tokens: ["Accent/Brand", "Display/Hero"],
    preview: (
      <div className="flex items-center gap-2">
        <div
          className="w-[36px] h-[36px] flex items-center justify-center"
          style={{ backgroundColor: "#1A1A2E", borderRadius: 10 }}
        >
          <span
            className="text-[18px]"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#FFFFFF" }}
          >
            C
          </span>
        </div>
        <span
          className="text-[20px]"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#0D0F12" }}
        >
          Chat2Cash
        </span>
      </div>
    ),
  },
];

export function ComponentLegend() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {components.map((comp) => (
        <div
          key={comp.name}
          className="flex flex-col gap-4 p-5"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          <div className="flex flex-col gap-1">
            <span
              className="text-[16px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                color: "#0D0F12",
              }}
            >
              {comp.name}
            </span>
            <span
              className="text-[13px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                color: "#6B7280",
              }}
            >
              {comp.description}
            </span>
          </div>
          <div className="flex-1">{comp.preview}</div>
          <div className="flex flex-wrap gap-1.5">
            {comp.tokens.map((t) => (
              <span
                key={t}
                className="inline-flex px-2 py-0.5 text-[11px]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#1A1A2E",
                  backgroundColor: "#F8F9FA",
                  borderRadius: 6,
                  border: "1px solid #E5E7EB",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
