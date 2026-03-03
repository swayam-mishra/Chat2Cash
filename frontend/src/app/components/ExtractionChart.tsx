import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

const data = [
  { time: "9AM", volume: 4 },
  { time: "10AM", volume: 12 },
  { time: "11AM", volume: 18 },
  { time: "12PM", volume: 22 },
  { time: "1PM", volume: 19 },
  { time: "2PM", volume: 35 },
  { time: "3PM", volume: 38 },
  { time: "4PM", volume: 28 },
  { time: "5PM", volume: 15 },
  { time: "6PM", volume: 8 },
];

const peakIndex = data.findIndex((d) => d.volume === 38);

export function ExtractionChart() {
  return (
    <div
      className="flex flex-col col-span-2"
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
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontWeight: 600, fontSize: 18, color: "#0D0F12" }}>
            Today's Extraction Activity
          </span>
          <span className="text-[12px]" style={{ color: "#6B7280" }}>
            Messages processed per hour
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1"
          style={{
            backgroundColor: "rgba(41,121,255,0.06)",
            borderRadius: 100,
          }}
        >
          <span
            className="text-[11px]"
            style={{ fontWeight: 600, color: "#2979FF" }}
          >
            Peak: 2–3 PM
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-4 flex-1" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2979FF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2979FF" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
              }}
              labelStyle={{ fontWeight: 600, color: "#0D0F12" }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#2979FF"
              strokeWidth={2.5}
              fill="url(#chartGrad)"
            />
            <ReferenceDot
              x={data[peakIndex].time}
              y={data[peakIndex].volume}
              r={5}
              fill="#2979FF"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
