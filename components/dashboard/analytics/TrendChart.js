"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Reason: Main analytics trend chart — multi-line area chart with toggleable series.
// How: Renders Recharts AreaChart with Reach, Engagement, and Clicks series.
//      Users can toggle series visibility via legend checkboxes. Gradient fills,
//      smooth curves, and custom tooltip.
// Receives: `data` (array of daily metric objects) from analytics/page.js
// Passes: nothing

const series = [
  { key: "reach", label: "Reach", color: "#6366F1" },
  { key: "engagement", label: "Engagement", color: "#EC4899" },
  { key: "clicks", label: "Clicks", color: "#3B82F6" },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3.5 shadow-xl min-w-[160px]">
        <p className="text-[12px] font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="text-[11.5px] font-semibold text-slate-800">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function TrendChart({ data }) {
  const [visible, setVisible] = useState({ reach: true, engagement: true, clicks: true });

  const toggleSeries = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sample every 3rd point for readability on XAxis
  const chartData = data.map((d, i) => ({
    ...d,
    label: i % 7 === 0 ? d.dateLabel : "",
  }));

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Growth Trends
        </h3>
        {/* Legend toggles */}
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-1.5 text-[12px] font-medium transition-opacity ${
                visible[s.key] ? "opacity-100" : "opacity-40"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              interval={6}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            {series.map(
              (s) =>
                visible[s.key] && (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={`url(#grad-${s.key})`}
                    dot={false}
                    activeDot={{ r: 4, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
                  />
                )
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
