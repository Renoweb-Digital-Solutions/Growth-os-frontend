"use client";

import React from "react";

/**
 * GA4RankedBarCard renders a ranked horizontal list with progress bars matching GA4 design.
 */
export default function GA4RankedBarCard({ rows = [] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <p className="text-[12px] font-medium text-slate-500">No data available</p>
      </div>
    );
  }

  const maxVal = Math.max(...rows.map((r) => r.val || 1), 1);

  return (
    <div className="space-y-2.5 pt-1">
      {rows.slice(0, 5).map((row, idx) => {
        const widthPct = Math.max(6, Math.round(((row.val || 0) / maxVal) * 100));
        const barColor = row.color || (idx === 0 ? "bg-indigo-500" : idx === 1 ? "bg-indigo-400" : idx === 2 ? "bg-indigo-300" : "bg-slate-300");

        return (
          <div key={`ranked-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-slate-700 font-medium truncate max-w-[200px]" title={row.name}>
                {row.name}
              </span>
              <span className="font-semibold text-slate-900 font-mono ml-2">
                {row.displayVal || (row.val !== undefined ? row.val.toLocaleString() : "0")}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
