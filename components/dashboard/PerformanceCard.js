"use client";

import { Target, Star } from "lucide-react";
import { performanceData } from "@/app/dashboard/mockData";

// Reason: Compact performance overview showing monthly goal progress and key KPIs.
// How: Renders a progress bar for the monthly goal, plus stat rows for
//      average conversion rate and rating. Data from performanceData mock.
// Receives: nothing (reads performanceData from mockData)
// Passes: nothing

export default function PerformanceCard() {
  const { monthlyGoal, avgConversionRate, rating } = performanceData;

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Performance
        </h3>
      </div>

      {/* Monthly goal */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <Target className="w-4 h-4 text-slate-400" />
            Monthly Goal
          </div>
          <span className="text-[13px] font-bold text-indigo-600">
            {monthlyGoal}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
            style={{ width: `${monthlyGoal}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-500">Avg. Deal</span>
          <span className="text-[14px] font-bold text-slate-800">
            {avgConversionRate}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-500">Rating</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-[14px] font-bold text-slate-800">
              {rating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
