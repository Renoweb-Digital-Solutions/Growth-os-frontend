"use client";

import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Activity } from "lucide-react";
import { healthScoreData } from "@/app/dashboard/mockData";

// Reason: Displays an at-a-glance health score for active marketing campaigns.
// How: Shows a large percentage with trend arrow, a tiny sparkline bar chart,
//      and a count of active campaigns. Data sourced from healthScoreData mock.
// Receives: nothing (reads healthScoreData from mockData)
// Passes: nothing

export default function HealthScoreCard() {
  const { score, trend, trendUp, activeCampaigns, sparkline } = healthScoreData;

  // Transform sparkline data for Recharts
  const sparklineChartData = sparkline.map((val, idx) => ({
    value: val,
    idx,
  }));

  // Color bars based on value thresholds
  const getBarColor = (value) => {
    if (value >= 80) return "#8B5CF6";
    if (value >= 60) return "#A78BFA";
    return "#C4B5FD";
  };

  return (
    <div className="dashboard-card p-6 col-span-full lg:col-span-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Growth Health
        </h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Large score */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[42px] font-bold text-slate-900 leading-none">
              {score}%
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${
                trendUp ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[12.5px] text-slate-500">
            <Activity className="w-3.5 h-3.5" />
            <span>{activeCampaigns} active campaigns</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex-1 h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sparklineChartData} barCategoryGap="20%">
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {sparklineChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.value)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
