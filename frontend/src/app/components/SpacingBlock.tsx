import React from "react";

interface SpacingBlockProps {
  label: string;
  value: string;
  size: number;
}

export function SpacingBlock({ label, value, size }: SpacingBlockProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-[4px] shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: "#1A1A2E",
          opacity: 0.15 + (size / 100) * 0.6,
        }}
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
