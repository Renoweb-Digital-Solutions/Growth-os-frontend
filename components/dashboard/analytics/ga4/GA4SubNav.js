"use client";

import React from "react";
import { LayoutDashboard, Compass, Activity, Laptop, Zap } from "lucide-react";

const subTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, isAvailable: true },
  { id: "acquisition", label: "Acquisition", icon: Compass, isAvailable: true },
  { id: "engagement", label: "Engagement", icon: Activity, isAvailable: false },
  { id: "tech", label: "Tech & Geo", icon: Laptop, isAvailable: false },
  { id: "realtime", label: "Realtime", icon: Zap, isAvailable: false },
];

export default function GA4SubNav({ activeSubTab, onSubTabChange }) {
  return (
    <div className="bg-slate-100/70 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none border border-slate-200/60">
      {subTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSubTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSubTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[12.5px] font-semibold rounded-xl transition-all shrink-0 ${
              isActive
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
            <span>{tab.label}</span>

            {!tab.isAvailable && (
              <span className="px-1.5 py-0.2 text-[9.5px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 rounded-md">
                Roadmap
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
