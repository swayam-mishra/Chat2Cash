import React from "react";
import { X, Cpu } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

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
  fontSize: 11,
  color: "#9E9E9E",
};

const throughputData = [
  { hour: "9am", jobs: 28 },
  { hour: "10am", jobs: 42 },
  { hour: "11am", jobs: 55 },
  { hour: "12pm", jobs: 38 },
  { hour: "1pm", jobs: 47 },
  { hour: "2pm", jobs: 37 },
];

export function AIWorkerHealthModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 flex flex-col"
        style={{
          ...CARD,
          width: 400,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow:
            "0px 24px 64px rgba(0,0,0,0.18), 0px 2px 12px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #E5E7EB" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-[32px] h-[32px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(26,26,46,0.06)", borderRadius: 9 }}
            >
              <Cpu size={17} color="#1A1A2E" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span style={{ fontWeight: 700, fontSize: 18, color: "#0D0F12" }}>
                AI Worker Health
              </span>
              <span style={{ ...MONO, fontSize: 11 }}>
                BullMQ + Redis • Last refreshed 4s ago
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-[7px] h-[7px]"
                style={{
                  backgroundColor: "#00C853",
                  borderRadius: 100,
                  boxShadow: "0 0 6px rgba(0,200,83,0.55)",
                  animation: "livePulse 2s ease-in-out infinite",
                }}
              />
              <span
                className="text-[12px] tracking-[0.06em] uppercase"
                style={{ fontWeight: 600, color: "#00C853" }}
              >
                Live
              </span>
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                backgroundColor: "#FFFFFF",
              }}
            >
              <X size={14} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* ── Metrics Grid 2×2 ── */}
        <div
          className="grid grid-cols-2 gap-3 px-6 py-5"
        >
          {/* Active Jobs */}
          <div
            className="flex flex-col gap-1 p-4"
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
            }}
          >
            <span
              className="text-[11px] tracking-[0.04em] uppercase"
              style={{ fontWeight: 500, color: "#6B7280" }}
            >
              Active Jobs
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 36,
                color: "#2979FF",
                lineHeight: 1.1,
              }}
            >
              2
            </span>
            <span className="text-[11px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
              Processing now
            </span>
          </div>

          {/* Waiting */}
          <div
            className="flex flex-col gap-1 p-4"
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
            }}
          >
            <span
              className="text-[11px] tracking-[0.04em] uppercase"
              style={{ fontWeight: 500, color: "#6B7280" }}
            >
              Waiting
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 36,
                color: "#00C853",
                lineHeight: 1.1,
              }}
            >
              0
            </span>
            <span className="text-[11px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
              Queue clear ✓
            </span>
          </div>

          {/* Completed Today */}
          <div
            className="flex flex-col gap-1 p-4"
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
            }}
          >
            <span
              className="text-[11px] tracking-[0.04em] uppercase"
              style={{ fontWeight: 500, color: "#6B7280" }}
            >
              Completed Today
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 36,
                color: "#1A1A2E",
                lineHeight: 1.1,
              }}
            >
              247
            </span>
            <span className="text-[11px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
              ↑ 18% vs yesterday
            </span>
          </div>

          {/* Failed */}
          <div
            className="flex flex-col gap-1 p-4"
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
            }}
          >
            <span
              className="text-[11px] tracking-[0.04em] uppercase"
              style={{ fontWeight: 500, color: "#6B7280" }}
            >
              Failed
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 36,
                color: "#D32F2F",
                lineHeight: 1.1,
              }}
            >
              1
            </span>
            <span className="text-[11px]" style={{ color: "#9E9E9E", fontWeight: 400 }}>
              1 retry pending
            </span>
          </div>
        </div>

        {/* ── Mini Bar Chart ── */}
        <div className="px-6 pb-4">
          <span
            className="text-[11px] tracking-[0.04em] uppercase"
            style={{
              fontWeight: 500,
              color: "#6B7280",
              display: "block",
              marginBottom: 8,
            }}
          >
            Job throughput — last 6 hours
          </span>
          <div style={{ width: "100%", height: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={throughputData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  tick={{
                    fontSize: 10,
                    fill: "#9E9E9E",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar dataKey="jobs" radius={[4, 4, 0, 0]}>
                  {throughputData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        idx === throughputData.length - 1
                          ? "#2979FF"
                          : "#1A1A2E"
                      }
                      fillOpacity={
                        idx === throughputData.length - 1 ? 1 : 0.7
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Footer Strip ── */}
        <div
          className="mx-6 mb-5 flex items-center justify-center py-2.5 px-3"
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 8,
          }}
        >
          <span style={{ ...MONO, fontSize: 11 }}>
            Worker Uptime: 99.8% • Avg Extract Time: 1.1s • Model: Claude 3.5
            Sonnet
          </span>
        </div>

        {/* Keyframe animation */}
        <style>{`
          @keyframes livePulse {
            0%, 100% { box-shadow: 0 0 4px rgba(0,200,83,0.4); }
            50% { box-shadow: 0 0 10px rgba(0,200,83,0.7); }
          }
        `}</style>
      </div>
    </>
  );
}
