import React, { useState } from "react";
import { Sparkles } from "lucide-react";

export function QuickExtract() {
  const [text, setText] = useState("");

  return (
    <div
      className="flex flex-col col-span-2"
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
        <div className="flex items-center gap-2">
          <Sparkles size={18} color="#1A1A2E" />
          <span style={{ fontWeight: 600, fontSize: 18, color: "#0D0F12" }}>
            Quick Extract
          </span>
        </div>
        <span
          className="text-[11px] px-2.5 py-1"
          style={{
            fontWeight: 500,
            color: "#00C853",
            backgroundColor: "rgba(0,200,83,0.08)",
            borderRadius: 100,
          }}
        >
          AI Ready
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-6 flex-1">
        <label
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#6B7280" }}
        >
          New Extraction
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste WhatsApp chat here... e.g. bhai 2 kilo aaloo aur 1 pyaaz dena"
          className="flex-1 resize-none outline-none"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: "#374151",
            lineHeight: 1.6,
            backgroundColor: "#F8F9FA",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            padding: 16,
            minHeight: 100,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "#1A1A2E")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "#E5E7EB")
          }
        />
        <button
          className="self-stretch flex items-center justify-center gap-2 py-3 cursor-pointer"
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
          <Sparkles size={16} />
          Extract with AI →
        </button>
      </div>
    </div>
  );
}
