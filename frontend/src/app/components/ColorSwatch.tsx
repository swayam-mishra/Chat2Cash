import React from "react";

interface ColorSwatchProps {
  name: string;
  token: string;
  hex: string;
  shadow?: string;
}

export function ColorSwatch({ name, token, hex, shadow }: ColorSwatchProps) {
  const isDark = ["#111318", "#1A1A2E", "#0D0F12"].includes(hex);
  const isShadow = !!shadow;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full aspect-square rounded-[16px] border border-[#E5E7EB] flex items-end p-3"
        style={{
          backgroundColor: isShadow ? "#FFFFFF" : hex,
          boxShadow: isShadow ? shadow : undefined,
        }}
      >
        <span
          className="font-mono text-[11px]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: isDark ? "#FFFFFF" : "#0D0F12",
          }}
        >
          {isShadow ? "shadow" : hex}
        </span>
      </div>
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
    </div>
  );
}
