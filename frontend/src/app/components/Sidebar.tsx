import React from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  ScanText,
  FileText,
  Package,
  Settings,
  Bot,
  Smartphone,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: ShoppingCart, label: "Orders", to: "/orders" },
  { icon: ScanText, label: "Extraction", to: "/extraction" },
  { icon: FileText, label: "Invoices", to: "/invoices" },
  { icon: Package, label: "Inventory", to: "/inventory" },
  { icon: Smartphone, label: "Mobile", to: "/mobile" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

export function Sidebar() {
  return (
    <aside
      className="w-[220px] flex flex-col justify-between shrink-0"
      style={{
        backgroundColor: "#111318",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className="no-underline"
              style={{ textDecoration: "none" }}
            >
              {({ isActive }) => (
                <div
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer relative"
                  style={{
                    borderRadius: 10,
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.07)"
                      : "transparent",
                    transition: "background-color 0.15s",
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px]"
                      style={{ backgroundColor: "#2979FF", borderRadius: 4 }}
                    />
                  )}
                  <Icon
                    size={18}
                    color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.45)"}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span
                    className="text-[14px]"
                    style={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: AI Worker Status */}
      <div
        className="p-4 mx-3 mb-4"
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 12,
        }}
      >
        <div className="flex items-center gap-2.5">
          <Bot size={18} color="rgba(255,255,255,0.7)" />
          <div className="flex flex-col">
            <span
              className="text-[12px]"
              style={{
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              AI Worker
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-[7px] h-[7px] block"
                style={{
                  backgroundColor: "#00C853",
                  borderRadius: 100,
                  boxShadow: "0 0 6px rgba(0,200,83,0.6)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                className="text-[12px]"
                style={{ fontWeight: 600, color: "#00C853" }}
              >
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </aside>
  );
}