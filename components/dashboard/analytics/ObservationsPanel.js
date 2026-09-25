"use client";

import { Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ObservationsPanel({ observations, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-5/6 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!observations || observations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Key Performance Observations
      </h3>
      <div className="space-y-3">
        {observations.map((obs, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="mt-0.5">
              {obs.trend !== undefined && obs.trend !== null ? (
                obs.trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : obs.trend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )
              ) : (
                <Lightbulb className="w-4 h-4 text-indigo-500" />
              )}
            </div>
            <div>
              <p className="text-[13px] text-slate-700 leading-snug font-medium">
                {obs.description}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <span className="bg-slate-200/50 px-1.5 py-0.5 rounded">{obs.category}</span>
                <span>{obs.metric}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
