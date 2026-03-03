import React from "react";
import { TrendingUp, AlertTriangle, Activity, Loader2 } from "lucide-react";
import { useStats, useQueueHealth } from "@/hooks/useApi";
import { formatINR } from "@/lib/format";

const cardBase: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
  padding: 24,
  fontFamily: "'DM Sans', sans-serif",
};

export function MetricCards({ onOpenAIHealth }: { onOpenAIHealth?: () => void }) {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: queue, loading: queueLoading } = useQueueHealth();

  return (
    <>
      {/* Revenue Recovered */}
      <div style={cardBase} className="flex flex-col gap-2">
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#6B7280" }}
        >
          Revenue Recovered
        </span>
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#9E9E9E", fontSize: 11 }}
        >
          THIS WEEK
        </span>
        <span
          style={{ fontWeight: 700, fontSize: 32, color: "#1A1A2E", lineHeight: 1.1 }}
        >
          {statsLoading ? "…" : formatINR(stats?.total_revenue ?? 0)}
        </span>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 self-start mt-1"
          style={{
            backgroundColor: "rgba(0,200,83,0.08)",
            borderRadius: 100,
          }}
        >
          <TrendingUp size={13} color="#00C853" strokeWidth={2.5} />
          <span
            className="text-[12px]"
            style={{ fontWeight: 600, color: "#00C853" }}
          >
            +12%
          </span>
        </div>
      </div>

      {/* Orders Processed */}
      <div style={cardBase} className="flex flex-col gap-2">
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#6B7280" }}
        >
          Orders Processed
        </span>
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#9E9E9E", fontSize: 11 }}
        >
          TOTAL ORDERS
        </span>
        <span
          style={{ fontWeight: 700, fontSize: 32, color: "#1A1A2E", lineHeight: 1.1 }}
        >
          {statsLoading ? "…" : (stats?.total_orders ?? 0)}
        </span>
        <span
          className="text-[13px] mt-1"
          style={{ fontWeight: 500, color: "#6B7280" }}
        >
          {statsLoading ? "" : `${stats?.confirmed_orders ?? 0} confirmed`}
        </span>
      </div>

      {/* Pending Actions */}
      <div
        style={{
          ...cardBase,
          backgroundColor: "#FFF8F0",
          border: "1px solid rgba(255,109,0,0.15)",
        }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[13px] tracking-[0.04em] uppercase"
            style={{ fontWeight: 500, color: "#6B7280" }}
          >
            Pending Actions
          </span>
          <AlertTriangle size={18} color="#FF6D00" strokeWidth={2.2} />
        </div>
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#9E9E9E", fontSize: 11 }}
        >
          NEED ATTENTION
        </span>
        <span
          style={{ fontWeight: 700, fontSize: 32, color: "#FF6D00", lineHeight: 1.1 }}
        >
          {statsLoading ? "…" : (stats?.pending_orders ?? 0)}
        </span>
      </div>

      {/* AI Queue Health */}
      <div
        style={{ ...cardBase, cursor: "pointer", transition: "all 0.2s" }}
        className="flex flex-col gap-2"
        onClick={onOpenAIHealth}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#1A1A2E";
          e.currentTarget.style.boxShadow = "0px 4px 20px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.boxShadow = "0px 2px 12px rgba(0,0,0,0.07)";
        }}
      >
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#6B7280" }}
        >
          AI Queue Health
        </span>
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{ fontWeight: 500, color: "#9E9E9E", fontSize: 11 }}
        >
          WORKER STATUS
        </span>
        <div className="flex flex-col gap-0.5 mt-1">
          <span style={{ fontWeight: 600, fontSize: 16, color: "#0D0F12" }}>
            Active: <span style={{ color: "#1A1A2E" }}>{queueLoading ? "…" : (queue?.active ?? 0)}</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#0D0F12" }}>
            Waiting: <span style={{ color: "#1A1A2E" }}>{queueLoading ? "…" : (queue?.waiting ?? 0)}</span>
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 self-start mt-1"
          style={{
            backgroundColor: "rgba(0,200,83,0.08)",
            borderRadius: 100,
          }}
        >
          <Activity size={12} color="#00C853" strokeWidth={2.5} />
          <span
            className="text-[12px]"
            style={{ fontWeight: 600, color: "#00C853" }}
          >
            Healthy
          </span>
        </div>
      </div>
    </>
  );
}