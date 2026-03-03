import React from "react";

interface TypographySampleProps {
  name: string;
  token: string;
  sampleText: string;
  style: React.CSSProperties;
  meta: string;
}

export function TypographySample({
  name,
  token,
  sampleText,
  style,
  meta,
}: TypographySampleProps) {
  return (
    <div className="flex flex-col gap-3 py-5 border-b border-[#E5E7EB]">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[13px] tracking-[0.04em] uppercase"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: "#6B7280",
            }}
          >
            {token}
          </span>
          <span
            className="text-[14px]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              color: "#0D0F12",
            }}
          >
            {name}
          </span>
        </div>
        <span
          className="text-[12px] whitespace-nowrap shrink-0"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "#2979FF",
          }}
        >
          {meta}
        </span>
      </div>
      <p style={style} className="m-0">
        {sampleText}
      </p>
    </div>
  );
}
