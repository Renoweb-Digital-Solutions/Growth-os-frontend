"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Reason: Reusable small KPI stat card with big number, trend, and tiny sparkline.
// How: Receives a KPI data object and renders the value, label, trend arrow,
//      and a micro sparkline using Recharts AreaChart. Used 5 times on the Analytics page.
// Receives: `kpi` object { label, value, trend, trendUp, sparkline[], color }
//           from analytics/page.js
// Passes: nothing

export default function AnalyticsKPICard({ kpi }) {
  const sparkData = kpi.sparkline.map((v, i) => ({ v, i }));

  return (
    <div className="dashboard-card p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            {kpi.label}
          </p>
          <p className="text-[22px] font-bold text-slate-900">{kpi.value}</p>
        </div>
        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            kpi.trendUp
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {kpi.trendUp ? "↑" : "↓"} {kpi.trend}
        </span>
      </div>

      {/* Tiny sparkline */}
      <div className="h-[40px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`spark-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={kpi.color}
              strokeWidth={1.5}
              fill={`url(#spark-${kpi.label})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
