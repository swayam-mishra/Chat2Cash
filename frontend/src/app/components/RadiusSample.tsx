import React from "react";

interface RadiusSampleProps {
  label: string;
  value: string;
  radius: number;
}

export function RadiusSample({ label, value, radius }: RadiusSampleProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-[48px] h-[48px] border-2 border-[#1A1A2E] shrink-0"
        style={{ borderRadius: radius }}
      />
      <div className="flex flex-col">
        <span
          className="text-[13px] tracking-[0.04em] uppercase"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          {label}
        </span>
        <span
          className="text-[13px]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "#2979FF",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
