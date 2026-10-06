"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { getGA4SuggestedCard } from "@/lib/googleAnalyticsApi";
import GA4CardDateSelector from "./GA4CardDateSelector";

const METRIC_OPTIONS = [
  { id: "keyEvents", label: "Key events", unit: "KEY EVENTS" },
  { id: "totalRevenue", label: "Total revenue", unit: "USD" },
  { id: "eventCount", label: "Event count", unit: "EVENTS" },
];

const PLATFORM_COLORS = {
  web: "#6366F1",
  ios: "#3B82F6",
  android: "#10B981",
  desktop: "#8B5CF6",
  mobile: "#F59E0B",
  other: "#94A3B8",
};

const PALETTE = ["#6366F1", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#64748B"];

/**
 * GA4KeyEventsPlatformCard renders the GA4 "Key events by Platform" Suggested Card.
 * Header layout:
 * [ Key events ▼ ] by Platform
 */
export default function GA4KeyEventsPlatformCard({ card }) {
  const [selectedMetric, setSelectedMetric] = useState("keyEvents");
  const [selectedRange, setSelectedRange] = useState(card?.defaultRange || "28d");
  const [isMetricOpen, setIsMetricOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalVal, setTotalVal] = useState(0);
  const [rows, setRows] = useState([]);

  const metricRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (metricRef.current && !metricRef.current.contains(e.target)) {
        setIsMetricOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeMetricObj =
    METRIC_OPTIONS.find((m) => m.id === selectedMetric) || METRIC_OPTIONS[0];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setTotalVal(0);
    setRows([]);

    try {
      const res = await getGA4SuggestedCard("key-events-by-platform", {
        metric: selectedMetric,
        rangePreset: selectedRange,
        limit: 10,
      });

      if (res?.data) {
        setTotalVal(
          typeof res.data.total === "number"
            ? res.data.total
            : Number(res.data.total) || 0
        );
        setRows(Array.isArray(res.data.rows) ? res.data.rows : []);
      } else {
        setTotalVal(0);
        setRows([]);
      }
    } catch (err) {
      console.error("Key events by Platform API fetch error:", err);
      setError(err.message || "Unable to load platform data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMetric, selectedRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRangeChange = (newRange) => {
    if (newRange === selectedRange) return;
    setSelectedRange(newRange);
  };

  // Filter out blank/(not set) rows
  const validRows = rows.filter((r) => {
    const label = r.platform || r.dimensionValue || r.dimensionLabel || "";
    const clean = String(label).trim();
    return clean.length > 0 && clean.toLowerCase() !== "(not set)";
  });

  const formattedTotal =
    selectedMetric === "totalRevenue"
      ? `$${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : totalVal.toLocaleString();

  // Donut chart segment calculation
  const donutTotal = validRows.reduce(
    (acc, curr) => acc + (typeof curr.current === "number" ? curr.current : Number(curr.current) || 0),
    0
  );

  const segments = validRows.map((r, idx) => {
    const rawName = r.platform || r.dimensionValue || r.dimensionLabel || "Other";
    const val = typeof r.current === "number" ? r.current : Number(r.current) || 0;
    const colorKey = String(rawName).toLowerCase();
    const hexColor = PLATFORM_COLORS[colorKey] || PALETTE[idx % PALETTE.length];
    return { name: rawName, val, hexColor };
  });

  return (
    <div className="w-[320px] sm:w-[340px] shrink-0 h-[410px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow select-none relative">
      {/* Top Header Section — [Metric ▼] by Platform */}
      <div>
        <div className="flex items-center flex-wrap gap-1 mb-2">
          {/* METRIC DROPDOWN */}
          <div className="relative inline-block" ref={metricRef}>
            <button
              type="button"
              onClick={() => setIsMetricOpen(!isMetricOpen)}
              className="inline-flex items-center gap-1 text-[13px] sm:text-[13.5px] font-bold text-slate-800 hover:text-indigo-600 bg-slate-100/80 hover:bg-slate-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              title="Select metric"
            >
              <span>{activeMetricObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isMetricOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                {METRIC_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedMetric(opt.id);
                      setIsMetricOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {selectedMetric === opt.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[13px] sm:text-[13.5px] font-bold text-slate-800">
            by Platform
          </span>
        </div>

        {/* Primary Metric Number & Unit */}
        {isLoading ? (
          <div className="h-7 flex items-center gap-2 mb-2">
            <div className="w-20 h-6 bg-slate-100 animate-pulse rounded-md" />
            <div className="w-16 h-4 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[22px] font-extrabold text-slate-900 font-mono tracking-tight">
              {formattedTotal}
            </span>
            <span className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wider">
              {activeMetricObj.unit}
            </span>
          </div>
        )}

        {/* Donut Chart Visualization */}
        <div className="mt-1">
          {isLoading ? (
            <div className="h-[230px] flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="animate-spin w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="h-[230px] flex flex-col items-center justify-center text-center p-4 bg-red-50/50 rounded-xl border border-red-100 text-red-600">
              <AlertCircle className="w-5 h-5 mb-1.5 text-red-500" />
              <p className="text-[12px] font-semibold">{error}</p>
              <button
                type="button"
                onClick={fetchData}
                className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : segments.length > 0 && donutTotal > 0 ? (
            <div className="flex items-center justify-between gap-4 py-3 h-[230px]">
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
                    const pct = (seg.val / donutTotal) * 100;
                    const strokeDash = `${pct} ${100 - pct}`;
                    const offset = segments
                      .slice(0, idx)
                      .reduce((acc, curr) => acc + (curr.val / donutTotal) * 100, 0);

                    return (
                      <circle
                        key={`donut-seg-${idx}`}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={seg.hexColor}
                        strokeWidth="3.8"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={-offset}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[13px] font-extrabold text-slate-900 font-mono">
                    {selectedMetric === "totalRevenue"
                      ? `$${donutTotal.toLocaleString()}`
                      : donutTotal.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
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
                        style={{ backgroundColor: seg.hexColor }}
                      />
                      <span className="truncate" title={seg.name}>{seg.name}</span>
                    </span>
                    <span className="font-bold text-slate-800 font-mono ml-1">
                      {selectedMetric === "totalRevenue"
                        ? `$${seg.val.toLocaleString()}`
                        : seg.val.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[230px] flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <svg className="w-20 h-20 transform -rotate-90 mb-2" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <p className="text-[12px] font-semibold text-slate-400">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Area with Independent Date Selector */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <GA4CardDateSelector
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />

        <button
          type="button"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer uppercase"
        >
          <span>{activeMetricObj.unit}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
