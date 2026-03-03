import React from "react";
import { Settings, Store, Bot, Bell, Shield, Palette } from "lucide-react";

const CARD: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
  fontFamily: "'DM Sans', sans-serif",
};

const LABEL: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 11,
  color: "#6B7280",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontFamily: "'DM Sans', sans-serif",
};

function RedactedPill() {
  return (
    <span
      className="inline-block px-5 py-1"
      style={{
        backgroundColor: "#E5E7EB",
        borderRadius: 100,
        fontSize: 13,
        userSelect: "none",
        minWidth: 100,
        textAlign: "center",
      }}
    >
      <span style={{ filter: "blur(4px)", display: "inline-block", color: "#E5E7EB" }}>
        Phone Number
      </span>
    </span>
  );
}

const sections = [
  {
    icon: Store,
    title: "Store Profile",
    description: "Business name, address, GSTIN, and contact info.",
    fields: [
      { label: "STORE NAME", value: "Ravi's Kirana Store" },
      { label: "PHONE", value: "redacted" },
      { label: "ADDRESS", value: "Shop No. 12, Main Market, Delhi" },
      { label: "GSTIN", value: "redacted" },
    ],
  },
  {
    icon: Bot,
    title: "AI Worker",
    description: "Configure extraction settings, language preferences, and confidence thresholds.",
    fields: [
      { label: "STATUS", value: "Online" },
      { label: "LANGUAGE", value: "Hindi + English (Hinglish)" },
      { label: "MIN CONFIDENCE", value: "80%" },
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "WhatsApp alerts, low-stock warnings, and payment reminders.",
    fields: [
      { label: "LOW STOCK ALERT", value: "Enabled" },
      { label: "PAYMENT REMINDERS", value: "Enabled" },
      { label: "DAILY SUMMARY", value: "6:00 PM" },
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "PII masking, data retention, and access controls.",
    fields: [
      { label: "PII MASKING", value: "Always On" },
      { label: "DATA RETENTION", value: "90 days" },
    ],
  },
];

export function SettingsPage() {
  return (
    <div className="p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1
            className="m-0"
            style={{ fontWeight: 700, fontSize: 24, color: "#0D0F12", lineHeight: 1.2 }}
          >
            Settings
          </h1>
          <p className="m-0 text-[13px]" style={{ color: "#6B7280" }}>
            Manage your store profile, AI configuration, and notification preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} style={CARD} className="overflow-hidden">
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ borderBottom: "1px solid #E5E7EB" }}
              >
                <div
                  className="w-[32px] h-[32px] flex items-center justify-center"
                  style={{
                    backgroundColor: "#F8F9FA",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <Icon size={16} color="#1A1A2E" />
                </div>
                <div className="flex flex-col">
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#0D0F12" }}>
                    {section.title}
                  </span>
                  <span className="text-[12px]" style={{ color: "#6B7280" }}>
                    {section.description}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between">
                    <span style={LABEL}>{field.label}</span>
                    {field.value === "redacted" ? (
                      <RedactedPill />
                    ) : (
                      <span
                        className="text-[13px]"
                        style={{ fontWeight: 500, color: "#0D0F12" }}
                      >
                        {field.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming soon */}
      <div
        className="flex items-center justify-center gap-3 mt-6 p-6"
        style={CARD}
      >
        <Palette size={20} color="#6B7280" />
        <span className="text-[14px]" style={{ color: "#6B7280" }}>
          Full settings editing and theme customization — coming soon.
        </span>
      </div>
    </div>
  );
}
