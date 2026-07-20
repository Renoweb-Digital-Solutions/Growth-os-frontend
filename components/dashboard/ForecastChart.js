"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, MoreHorizontal } from "lucide-react";
import { forecastData } from "@/app/dashboard/mockData";

// Reason: Primary chart widget showing organic vs paid growth forecast over 12 months.
// How: Uses Recharts AreaChart with two gradient-filled series. Includes a headline
//      stat ($124,500 pipeline value) and a custom tooltip with marketing KPIs.
// Receives: nothing (reads forecastData from mockData)
// Passes: nothing

// Custom tooltip component for the chart
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const organic = payload[0]?.value || 0;
    const paid = payload[1]?.value || 0;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-xl min-w-[180px]">
        <p className="text-sm font-semibold text-slate-800 mb-2.5">{label} 2026</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Organic Growth
            </span>
            <span className="text-[12.5px] font-semibold text-slate-800">
              ${organic.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Paid Growth
            </span>
            <span className="text-[12.5px] font-semibold text-slate-800">
              ${paid.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-400">ROAS</span>
              <span className="text-emerald-600 font-semibold">+62%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function ForecastChart() {
  return (
    <div className="dashboard-card p-6 col-span-full lg:col-span-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-slate-800">
              Growth Forecast
            </h3>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Organic Growth
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Paid Growth
            </span>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Headline stat */}
      <div className="flex items-baseline gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold text-slate-900">$124,500.00</span>
          <span className="text-[13px] text-slate-500 ml-2">Annual Projection</span>
        </div>
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[12px] font-semibold rounded-full">
          ↑ 14.6%
        </span>
      </div>

      {/* Chart */}
      <div className="h-[280px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={forecastData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradientOrganic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EC4899" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
              }
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="organic"
              stroke="#6366F1"
              strokeWidth={2.5}
              fill="url(#gradientOrganic)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#6366F1",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Area
              type="monotone"
              dataKey="paid"
              stroke="#EC4899"
              strokeWidth={2.5}
              fill="url(#gradientPaid)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#EC4899",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
