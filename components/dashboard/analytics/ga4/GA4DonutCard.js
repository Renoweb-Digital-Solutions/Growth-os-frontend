"use client";

import React from "react";

/**
 * GA4DonutCard renders a GA4-style SVG Donut Ring chart with legend breakdown.
 * Reproduces GA4 empty-state style (neutral ring + "No data available") when data is empty.
 */
export default function GA4DonutCard({ segments = [] }) {
  const hasData = Array.isArray(segments) && segments.length > 0 && segments.some((s) => (s.val || 0) > 0);

  if (!hasData) {
    return (
      <div className="h-44 flex flex-col items-center justify-center relative py-2">
        {/* GA4 Empty-State Neutral SVG Ring */}
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100 stroke-current"
            strokeWidth="3.5"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 max-w-[90px] text-center leading-tight">
            No data available
          </span>
        </div>
      </div>
    );
  }

  const total = segments.reduce((acc, curr) => acc + (curr.val || 0), 0);

  return (
    <div className="flex items-center justify-between gap-4 pt-1 h-44">
      {/* SVG Donut Ring */}
      <div className="relative shrink-0 w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="3.8"
          />
          {segments.map((seg, idx) => {
            const pct = (seg.val / total) * 100;
            const strokeDash = `${pct} ${100 - pct}`;
            const offset = segments
              .slice(0, idx)
              .reduce((acc, curr) => acc + (curr.val / total) * 100, 0);

            return (
              <circle
                key={`donut-seg-${idx}`}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={seg.hexColor || "#6366F1"}
                strokeWidth="3.8"
                strokeDasharray={strokeDash}
                strokeDashoffset={-offset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[14px] font-extrabold text-slate-900 font-mono">
            {total.toLocaleString()}
          </span>
          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
            TOTAL
          </span>
        </div>
      </div>

      {/* Legend Breakdown */}
      <div className="space-y-2 flex-1 min-w-0">
        {segments.map((seg, idx) => (
          <div key={`legend-${idx}`} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.hexColor || "#6366F1" }}
              />
              <span className="truncate" title={seg.name}>{seg.name}</span>
            </span>
            <span className="font-bold text-slate-800 font-mono ml-1">
              {seg.val.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
