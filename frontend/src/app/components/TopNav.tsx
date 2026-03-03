import React from "react";
import { useLocation } from "react-router";
import { Bell, Leaf } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Command Center",
  "/orders": "Orders",
  "/extraction": "Extraction",
  "/invoices": "Invoices",
  "/inventory": "Inventory",
  "/settings": "Settings",
  "/mobile": "Mobile Screens",
};

export function TopNav() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || "Chat2Cash";

  return (
    <header
      className="h-[60px] flex items-center justify-between px-6 shrink-0"
      style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-[34px] h-[34px] flex items-center justify-center"
          style={{ backgroundColor: "#1A1A2E", borderRadius: 9 }}
        >
          <span style={{ fontWeight: 700, fontSize: 17, color: "#FFFFFF" }}>C</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#1A1A2E" }}>
          Chat2Cash
        </span>
        <Leaf size={18} color="#25D366" strokeWidth={2.5} />
      </div>

      {/* Center: Dynamic page title */}
      <span
        className="hidden sm:block"
        style={{ fontWeight: 600, fontSize: 16, color: "#0D0F12" }}
      >
        {title}
      </span>

      {/* Right: Avatar + Bell */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell size={20} color="#6B7280" />
          <span
            className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] flex items-center justify-center text-[10px]"
            style={{
              backgroundColor: "#D32F2F",
              color: "#FFFFFF",
              borderRadius: 100,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              border: "2px solid #FFFFFF",
            }}
          >
            3
          </span>
        </div>
        <div
          className="flex items-center gap-2.5 px-3 py-1.5"
          style={{
            backgroundColor: "#F8F9FA",
            borderRadius: 100,
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            className="w-[28px] h-[28px] flex items-center justify-center"
            style={{
              backgroundColor: "#1A1A2E",
              borderRadius: 100,
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            RK
          </div>
          <span
            className="hidden md:block text-[13px]"
            style={{ fontWeight: 500, color: "#0D0F12" }}
          >
            Ravi's Kirana Store
          </span>
        </div>
      </div>
    </header>
  );
}