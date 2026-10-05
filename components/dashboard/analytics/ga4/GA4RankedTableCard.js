"use client";

import React from "react";

/**
 * GA4RankedTableCard renders clean ranked list/table rows for pages, cities, countries, or source/medium.
 */
export default function GA4RankedTableCard({ rows = [] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <p className="text-[12px] font-medium text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pt-1">
      {rows.slice(0, 5).map((row, idx) => (
        <div
          key={`table-row-${idx}`}
          className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-[11.5px]"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="w-4 h-4 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <span className="text-slate-700 font-medium truncate" title={row.name}>
              {row.flag && <span className="mr-1.5">{row.flag}</span>}
              {row.name}
            </span>
          </div>
          <span className="font-semibold text-slate-900 font-mono shrink-0">
            {row.displayVal || (row.val !== undefined ? row.val.toLocaleString() : "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
