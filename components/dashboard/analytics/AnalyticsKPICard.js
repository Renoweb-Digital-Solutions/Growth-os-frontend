"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function AnalyticsKPICard({
  kpi,
  loading,
  selectedMetricKey,
  onSelectMetric,
  metricOptions,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!kpi) return null;

  const isComparison = Boolean(kpi.isComparison);
  const isUnavailable = kpi.value === "Unavailable" || kpi.currentValue === "Unavailable";
  const hasSparkline = !isComparison && !isUnavailable && Array.isArray(kpi.sparkline) && kpi.sparkline.length > 0;
  const sparkData = hasSparkline ? kpi.sparkline.map((v, i) => ({ v: typeof v === "number" ? v : 0, i })) : [];

  // Helper to format absolute metric changes safely
  const formatAbsolute = (val) => {
    if (val === null || val === undefined) return "—";
    const num = Number(val);
    if (isNaN(num)) return "—";
    const prefix = num > 0 ? "+" : "";
    return `${prefix}${num.toLocaleString("en-US")}`;
  };

  // Helper to format percentage metric changes safely
  const formatPercentage = (val) => {
    if (val === null || val === undefined) return "N/A";
    const num = Number(val);
    if (isNaN(num)) return "N/A";
    const prefix = num > 0 ? "+" : "";
    return `${prefix}${num.toFixed(1)}%`;
  };

  const hasDropdown = Array.isArray(metricOptions) && metricOptions.length > 0 && typeof onSelectMetric === "function";

  if (isComparison) {
    return (
      <div className="dashboard-card p-5 flex flex-col justify-between min-h-[140px] relative border border-slate-200/80 rounded-2xl bg-white shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-2.5" ref={dropdownRef}>
            {hasDropdown ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-wider py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="truncate max-w-[180px] sm:max-w-[200px]">{kpi.label || "Metric"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180 text-slate-700" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto scrollbar-light animate-in fade-in slide-in-from-top-1 duration-100">
                    {metricOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          onSelectMetric(option.key);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] font-medium rounded-lg text-left transition-colors ${
                          selectedMetricKey === option.key
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {selectedMetricKey === option.key && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">
                {kpi.label || "Metric"}
              </p>
            )}
          </div>

          {loading ? (
            <div className="space-y-3 py-1">
              <div className="h-6 w-24 bg-slate-200 animate-pulse rounded" />
              <div className="h-5 w-24 bg-slate-200 animate-pulse rounded" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-[20px] font-bold text-slate-900 leading-none">
                    {kpi.currentValue ?? "—"}
                  </p>
                  {kpi.changeText && (
                    <span className={`text-[11px] font-medium ${
                      kpi.changeDirection === "up"
                        ? "text-emerald-600 font-semibold"
                        : kpi.changeDirection === "down"
                        ? "text-rose-600 font-semibold"
                        : "text-slate-500"
                    }`}>
                      {kpi.changeText}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  {kpi.currentLabel || "Current period"}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[17px] font-bold text-slate-500 leading-none">
                  {kpi.comparisonValue ?? "—"}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  {kpi.comparisonLabel || "Previous period"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-5 flex flex-col justify-between min-h-[140px] relative border border-slate-200/80 rounded-2xl bg-white shadow-xs">
      <div className="flex items-start justify-between mb-3" ref={dropdownRef}>
        <div>
          {hasDropdown ? (
            <div className="relative mb-1">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-wider py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="truncate max-w-[160px] sm:max-w-[180px]">{kpi.label || "Metric"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180 text-slate-700" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto scrollbar-light animate-in fade-in slide-in-from-top-1 duration-100">
                  {metricOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        onSelectMetric(option.key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] font-medium rounded-lg text-left transition-colors ${
                        selectedMetricKey === option.key
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {selectedMetricKey === option.key && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              {kpi.label || "Metric"}
            </p>
          )}

          {loading ? (
            <div className="h-7 w-20 bg-slate-200 animate-pulse rounded mt-1" />
          ) : (
            <div>
              <p className={`text-[22px] font-bold ${isUnavailable ? "text-slate-400 text-[16px] mt-1" : "text-slate-900"}`}>
                {kpi.value ?? "—"}
              </p>
              {!isUnavailable && kpi.changeText && (
                <p className={`text-[12px] font-medium mt-1 ${
                  kpi.changeDirection === "up"
                    ? "text-emerald-600 font-semibold"
                    : kpi.changeDirection === "down"
                    ? "text-rose-600 font-semibold"
                    : "text-slate-500"
                }`}>
                  {kpi.changeText}
                </p>
              )}
            </div>
          )}
        </div>
        {!loading && !isUnavailable && !kpi.changeText && kpi.trendAvailable && (
          <div className="flex flex-col items-end shrink-0 ml-2">
            <span
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600"
            >
              {formatPercentage(kpi.percentage)}
            </span>
            {kpi.absolute !== undefined && kpi.absolute !== null && (
              <span className="text-[10px] text-slate-400 mt-1 font-medium">
                {formatAbsolute(kpi.absolute)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tiny sparkline */}
      {!loading && !isUnavailable && hasSparkline && (
        <div className="h-[40px] -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={kpi.color || "#6366f1"} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={kpi.color || "#6366f1"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={kpi.color || "#6366f1"}
                strokeWidth={1.5}
                fill={`url(#spark-${kpi.label})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Spacer if no sparkline to maintain card height */}
      {(!hasSparkline || isUnavailable || loading) && (
        <div className="h-[40px]" />
      )}
    </div>
  );
}


