"use client";

import { MoreHorizontal } from "lucide-react";
import { leadSourceData } from "@/app/dashboard/mockData";

// Reason: Shows marketing channel breakdown as horizontal progress bars.
// How: Iterates over leadSourceData to render each channel with a colored bar
//      proportional to its percentage, a channel icon, and percentage label.
// Receives: nothing (reads leadSourceData from mockData)
// Passes: nothing

// Simple icon components for each channel
const channelIcons = {
  google: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  meta: (
    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
      <span className="text-[8px] text-white font-bold">M</span>
    </div>
  ),
  linkedin: (
    <div className="w-4 h-4 rounded-sm bg-[#0A66C2] flex items-center justify-center">
      <span className="text-[9px] text-white font-bold">in</span>
    </div>
  ),
  organic: (
    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
      <span className="text-[9px] text-white font-bold">◎</span>
    </div>
  ),
  email: (
    <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
      <span className="text-[9px] text-white font-bold">✉</span>
    </div>
  ),
};

export default function LeadSourceCard() {
  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Lead Source
        </h3>
        <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        {leadSourceData.map((source) => (
          <div key={source.name} className="flex items-center gap-3">
            {/* Channel icon */}
            <div className="flex-shrink-0">
              {channelIcons[source.icon]}
            </div>

            {/* Channel name */}
            <span className="text-[12.5px] font-medium text-slate-700 w-[100px] truncate">
              {source.name}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${source.percentage}%`,
                  backgroundColor: source.color,
                }}
              />
            </div>

            {/* Percentage */}
            <span className="text-[12.5px] font-semibold text-slate-600 w-[50px] text-right">
              {source.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
