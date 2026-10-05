"use client";

import React from "react";
import { ChevronRight, ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from "lucide-react";

/**
 * Reusable Information-Dense GA4 Analytical Report Card
 * Used across GA4 Overview dashboard for snapshot cards (Top Channels, Users by Source, etc.)
 */
export default function GA4ReportCard({
  title,
  subtitle,
  metricLabel = "Sessions",
  dimensionLabel = "Channel",
  rows = [],
  maxRows = 5,
  isLoading = false,
  error = null,
  dateRangeLabel = "",
  onViewReport = null,
  valueKey = "sessions",
  comparisonEnabled = false,
  formatMetricValue = (val) => (typeof val === "number" ? val.toLocaleString("en-US") : String(val ?? "0")),
}) {
  const displayedRows = Array.isArray(rows) ? rows.slice(0, maxRows) : [];

  // Compute maximum value for relative visual bar percentage
  const maxVal = displayedRows.reduce((max, row) => {
    let val = 0;
    if (typeof row.metrics?.[valueKey] === "object") {
      val = Number(row.metrics[valueKey]?.value) || 0;
    } else if (row.metrics?.[valueKey] !== undefined) {
      val = Number(row.metrics[valueKey]) || 0;
    } else if (row[valueKey] !== undefined) {
      val = Number(row[valueKey]) || 0;
    }
    return Math.max(max, val);
  }, 0) || 1;

  return (
    <div className="dashboard-card p-5 flex flex-col justify-between h-[360px] relative transition-shadow hover:shadow-md border border-slate-200/80 rounded-2xl bg-white">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h4 className="text-[14px] font-bold text-slate-800 tracking-tight">{title}</h4>
            {subtitle && <p className="text-[11.5px] text-slate-500">{subtitle}</p>}
          </div>
          {onViewReport && (
            <button
              type="button"
              onClick={onViewReport}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors shrink-0"
            >
              <span>View report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sub-header labels */}
        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
          <span>{dimensionLabel}</span>
          <span>{metricLabel}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 my-2 overflow-hidden flex flex-col justify-center">
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            <div className="h-5 bg-slate-100 rounded-lg w-full" />
            <div className="h-5 bg-slate-50 rounded-lg w-full" />
            <div className="h-5 bg-slate-50 rounded-lg w-4/5" />
            <div className="h-5 bg-slate-50 rounded-lg w-3/5" />
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-center">
            <AlertCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-[11.5px] font-medium text-red-600">{error}</p>
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-slate-100">
            <p className="text-[12px] font-semibold text-slate-600">No data available</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No metrics recorded for this period</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedRows.map((row, idx) => {
              const label = row.label || row.dimension || `Item ${idx + 1}`;
              
              let currentVal = 0;
              let prevVal = null;
              let changePct = null;

              if (typeof row.metrics?.[valueKey] === "object") {
                const metricObj = row.metrics[valueKey];
                currentVal = Number(metricObj.value) || 0;
                prevVal = metricObj.previous !== undefined ? Number(metricObj.previous) : null;
                changePct = metricObj.changePct !== undefined ? metricObj.changePct : null;
              } else if (row.metrics?.[valueKey] !== undefined) {
                currentVal = Number(row.metrics[valueKey]) || 0;
              } else if (row[valueKey] !== undefined) {
                currentVal = Number(row[valueKey]) || 0;
              }

              const pctWidth = Math.min(100, Math.max(8, (currentVal / maxVal) * 100));

              return (
                <div key={label + idx} className="group">
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                      <span className="text-[10.5px] font-mono font-bold text-slate-400 w-4">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors" title={label}>
                        {label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {comparisonEnabled && changePct !== null && changePct !== undefined && !isNaN(Number(changePct)) && (
                        <span
                          className={`inline-flex items-center text-[10.5px] font-mono font-semibold ${
                            changePct > 0
                              ? "text-emerald-600"
                              : changePct < 0
                              ? "text-red-600"
                              : "text-slate-400"
                          }`}
                        >
                          {changePct > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : changePct < 0 ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span>{Math.abs(Number(changePct)).toFixed(1)}%</span>
                        </span>
                      )}

                      <span className="font-semibold font-mono text-slate-800">
                        {formatMetricValue(currentVal)}
                      </span>
                    </div>
                  </div>

                  {/* Relative metric visual progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300 group-hover:bg-indigo-600"
                      style={{ width: `${pctWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>{dateRangeLabel || "Selected date range"}</span>
        {onViewReport && (
          <span className="font-medium text-slate-500 group-hover:text-indigo-600">
            {rows.length} total
          </span>
        )}
      </div>
    </div>
  );
}
