"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Reason: Grouped bar chart comparing Posts Published vs Engagement per week.
// How: Recharts BarChart with two Bar series side-by-side for each week.
// Receives: `data` (weeklyComparison array) from analytics/page.js
// Passes: nothing

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-lg">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">{label}</p>
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
            <span className="text-[11px] text-slate-500">{item.name}</span>
            <span className="text-[11px] font-semibold text-slate-800">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function WeeklyBarChart({ data }) {
  return (
    <div className="dashboard-card p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-5">
        Weekly Performance
      </h3>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="posts"
              name="Posts Published"
              fill="#6366F1"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
            <Bar
              dataKey="engagement"
              name="Engagement"
              fill="#EC4899"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
