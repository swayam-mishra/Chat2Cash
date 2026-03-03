import React from "react";
import { Package, ArrowRight } from "lucide-react";

const CARD: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
  fontFamily: "'DM Sans', sans-serif",
};

const sampleItems = [
  { name: "Aaloo (Potato)", stock: "12 kg", status: "In Stock", color: "#00C853" },
  { name: "Pyaaz (Onion)", stock: "8 kg", status: "In Stock", color: "#00C853" },
  { name: "Chai Patti", stock: "3 kg", status: "Low Stock", color: "#FF6D00" },
  { name: "Full Cream Milk", stock: "20 L", status: "In Stock", color: "#00C853" },
  { name: "Bread", stock: "6 pcs", status: "In Stock", color: "#00C853" },
  { name: "Amul Butter", stock: "2 pcs", status: "Low Stock", color: "#FF6D00" },
  { name: "Basmati Rice", stock: "0 kg", status: "Out of Stock", color: "#D32F2F" },
  { name: "Toor Dal", stock: "4 kg", status: "Low Stock", color: "#FF6D00" },
];

export function InventoryPage() {
  return (
    <div className="p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1
            className="m-0"
            style={{ fontWeight: 700, fontSize: 24, color: "#0D0F12", lineHeight: 1.2 }}
          >
            Inventory
          </h1>
          <p className="m-0 text-[13px]" style={{ color: "#6B7280" }}>
            Track stock levels, set reorder alerts, and manage your catalog.
          </p>
        </div>
        <span
          className="text-[12px] px-3 py-1.5"
          style={{
            fontWeight: 500,
            color: "#FF6D00",
            backgroundColor: "rgba(255,109,0,0.08)",
            borderRadius: 100,
          }}
        >
          3 items low stock
        </span>
      </div>

      {/* Placeholder stock list */}
      <div style={CARD} className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #E5E7EB" }}
        >
          <span style={{ fontWeight: 600, fontSize: 16, color: "#0D0F12" }}>
            Stock Overview
          </span>
          <span className="text-[12px]" style={{ color: "#6B7280" }}>
            {sampleItems.length} items
          </span>
        </div>
        <div
          className="grid px-6 py-3 gap-3"
          style={{
            gridTemplateColumns: "1fr 100px 120px",
            backgroundColor: "#F8F9FA",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          {["Item Name", "Stock", "Status"].map((h) => (
            <span
              key={h}
              className="text-[11px] tracking-[0.06em] uppercase"
              style={{ fontWeight: 600, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}
            >
              {h}
            </span>
          ))}
        </div>
        {sampleItems.map((item, i) => (
          <div
            key={item.name}
            className="grid px-6 py-3.5 gap-3 items-center"
            style={{
              gridTemplateColumns: "1fr 100px 120px",
              borderBottom: i < sampleItems.length - 1 ? "1px solid #F3F4F6" : "none",
            }}
          >
            <span className="text-[13px]" style={{ fontWeight: 500, color: "#0D0F12" }}>
              {item.name}
            </span>
            <span
              className="text-[13px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                color: "#0D0F12",
              }}
            >
              {item.stock}
            </span>
            <span
              className="text-[11px] px-2.5 py-1 w-fit"
              style={{
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: item.color,
                borderRadius: 100,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div
        className="flex items-center justify-center gap-3 mt-6 p-6"
        style={CARD}
      >
        <Package size={20} color="#6B7280" />
        <span className="text-[14px]" style={{ color: "#6B7280" }}>
          Full inventory management — catalog, reorder points, supplier links — coming soon.
        </span>
      </div>
    </div>
  );
}
