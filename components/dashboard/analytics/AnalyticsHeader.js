"use client";

import { Download, RefreshCw } from "lucide-react";

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function AnalyticsHeader({
  selectedRange,
  onRangeChange,
  onRefresh,
  onExport,
  isRefreshing,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Meta growth and performance analytics across social & advertising channels
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Date Selector */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {timeRanges.map((range) => (
            <button
              key={range.days}
              onClick={() => onRangeChange(range.days)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                selectedRange === range.days
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Action: Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          title="Refresh Meta Insights Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
          <span>Refresh</span>
        </button>

        {/* Action: Export */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 border border-indigo-600 text-white text-[13px] font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          title="Export current view to CSV"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
