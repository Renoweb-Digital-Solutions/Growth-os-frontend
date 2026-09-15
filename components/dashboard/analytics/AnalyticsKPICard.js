"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function AnalyticsKPICard({ kpi, loading }) {
  const isUnavailable = kpi.value === "Unavailable";
  const hasSparkline = !isUnavailable && kpi.sparkline && kpi.sparkline.length > 0;
  const sparkData = hasSparkline ? kpi.sparkline.map((v, i) => ({ v, i })) : [];

  return (
    <div className="dashboard-card p-5 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            {kpi.label}
          </p>
          {loading ? (
            <div className="h-7 w-20 bg-slate-200 animate-pulse rounded mt-1" />
          ) : (
            <p className={`text-[22px] font-bold ${isUnavailable ? "text-slate-400 text-[16px] mt-1" : "text-slate-900"}`}>
              {kpi.value}
            </p>
          )}
        </div>
        {!loading && !isUnavailable && kpi.trend && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              kpi.trendUp
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {kpi.trendUp ? "↑" : "↓"} {kpi.trend}
          </span>
        )}
      </div>

      {/* Tiny sparkline */}
      {!loading && !isUnavailable && hasSparkline && (
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
      )}
      
      {/* Spacer if no sparkline to maintain card height */}
      {(!hasSparkline || isUnavailable || loading) && (
        <div className="h-[40px]" />
      )}
    </div>
  );
}
