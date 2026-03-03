import React from "react";
import { FileWarning, PackageX, Clock, HelpCircle } from "lucide-react";

interface ActionItem {
  icon: React.ReactNode;
  text: string;
  cta: string;
}

const actions: ActionItem[] = [
  {
    icon: <FileWarning size={16} color="#FF6D00" />,
    text: "Invoice missing for #0090",
    cta: "Generate",
  },
  {
    icon: <PackageX size={16} color="#FF6D00" />,
    text: "Low stock: Aaloo < 5kg",
    cta: "Reorder",
  },
  {
    icon: <Clock size={16} color="#FF6D00" />,
    text: "Follow-up overdue: #0085",
    cta: "Remind",
  },
  {
    icon: <HelpCircle size={16} color="#FF6D00" />,
    text: "Unconfirmed qty: #0088",
    cta: "Confirm",
  },
];

export function ActionQueue() {
  return (
    <div
      className="flex flex-col col-span-1"
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
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <span style={{ fontWeight: 600, fontSize: 18, color: "#0D0F12" }}>
          Action Queue
        </span>
        <span
          className="flex items-center justify-center w-[24px] h-[24px] text-[12px]"
          style={{
            backgroundColor: "#FF6D00",
            color: "#FFFFFF",
            borderRadius: 100,
            fontWeight: 700,
          }}
        >
          9
        </span>
      </div>

      {/* Action Items */}
      <div className="flex flex-col gap-2 p-4">
        {actions.map((action, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3"
            style={{
              borderRadius: 12,
              backgroundColor: "#FFFAF5",
              borderLeft: "3px solid #FF6D00",
            }}
          >
            <div className="shrink-0 mt-0.5">{action.icon}</div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <span
                className="text-[13px]"
                style={{ fontWeight: 500, color: "#0D0F12", lineHeight: 1.4 }}
              >
                {action.text}
              </span>
              <button
                className="self-start px-3 py-1 text-[11px] cursor-pointer"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  color: "#FF6D00",
                  backgroundColor: "rgba(255,109,0,0.08)",
                  borderRadius: 6,
                  border: "1px solid rgba(255,109,0,0.2)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FF6D00";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,109,0,0.08)";
                  e.currentTarget.style.color = "#FF6D00";
                }}
              >
                {action.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
