"use client";

import React from "react";

/**
 * GA4ComparisonBarCard renders GA4-style horizontal comparison bars for channel group distributions.
 * Supports current-period (solid) + previous-period (hatched/striped) comparison bars.
 */
export default function GA4ComparisonBarCard({
  rows = [],
  showComparison = false,
  legend = { current: "Last 7 days", previous: "Previous period" },
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <p className="text-[12px] font-medium text-slate-500">No data available</p>
      </div>
    );
  }

  const hasPrevData = showComparison || rows.some((r) => r.prevVal !== undefined);
  const allVals = rows.flatMap((r) => [r.val || 0, r.prevVal || 0]);
  const maxVal = Math.max(...allVals, 1);

  return (
    <div className="flex flex-col justify-between h-44 pt-1 pb-0.5">
      <div className="space-y-2.5 overflow-hidden">
        {rows.slice(0, 4).map((row, idx) => {
          const widthPct = Math.max(6, Math.round(((row.val || 0) / maxVal) * 100));
          const prevWidthPct =
            row.prevVal !== undefined
              ? Math.max(6, Math.round((row.prevVal / maxVal) * 100))
              : 0;
          const colorClass =
            row.color ||
            (idx === 0
              ? "bg-blue-600"
              : idx === 1
              ? "bg-indigo-600"
              : idx === 2
              ? "bg-sky-500"
              : "bg-emerald-500");

          return (
            <div key={`comp-${idx}`} className="space-y-1">
              <div className="flex items-center justify-between text-[11.5px]">
                <span
                  className="text-slate-700 font-semibold truncate max-w-[190px]"
                  title={row.name}
                >
                  {row.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 font-mono">
                    {row.displayVal || (row.val !== undefined ? row.val.toLocaleString() : "0")}
                  </span>
                  {row.prevVal !== undefined && (
                    <span className="text-[10px] font-medium text-slate-400 font-mono">
                      vs {row.prevVal.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Bars Container */}
              <div className="space-y-1">
                {/* Current Period - Solid Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>

                {/* Previous Period - Hatched/Striped Bar */}
                {row.prevVal !== undefined && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${prevWidthPct}%`,
                        backgroundColor: "#94a3b8",
                        backgroundImage: `repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 3px, #94a3b8 3px, #94a3b8 6px)`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GA4-style Legend at Bottom */}
      {hasPrevData && legend && (
        <div className="flex items-center gap-4 text-[10.5px] pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" />
            <span>{legend.current || "Last 7 days"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-xs border border-slate-400 shrink-0"
              style={{
                backgroundColor: "#94a3b8",
                backgroundImage: `repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 2px, #94a3b8 2px, #94a3b8 4px)`,
              }}
            />
            <span>{legend.previous || "Previous period"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
