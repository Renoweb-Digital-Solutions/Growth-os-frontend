"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, ArrowRight, AlertCircle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { getGA4TrafficAcquisition } from "@/lib/googleAnalyticsApi";
import GA4CardDateSelector from "./GA4CardDateSelector";

const METRIC_OPTIONS = [
  { id: "sessions", label: "Sessions", unit: "SESSIONS" },
  { id: "engagedSessions", label: "Engaged sessions", unit: "ENGAGED SESSIONS" },
];

const DIMENSION_OPTIONS = [
  {
    id: "sessionPrimaryChannelGroup",
    apiKey: "sessionPrimaryChannelGroup",
    label: "Session primary channel group (Default channel group)",
  },
  {
    id: "sessionDefaultChannelGroup",
    apiKey: "sessionDefaultChannelGroup",
    label: "Session default channel group",
  },
  {
    id: "sessionMedium",
    apiKey: "sessionMedium",
    label: "Session medium",
  },
  {
    id: "sessionCampaignName",
    apiKey: "sessionCampaignName",
    label: "Session campaign",
  },
  {
    id: "sessionSource",
    apiKey: "sessionSource",
    label: "Session source",
  },
];

/**
 * Helper to parse numerical value from row value field (string or number)
 */
function parseRowVal(row) {
  if (!row) return 0;
  if (typeof row.current === "number" && !isNaN(row.current)) return row.current;
  if (typeof row.value === "number" && !isNaN(row.value)) return row.value;
  if (typeof row.value === "string") {
    const parsed = parseFloat(row.value.replace(/,/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * GA4TrafficAcquisitionCard renders the GA4 "Sessions by [dimension]" Home Widget.
 * Header layout:
 * ROW 1: [ Metric Dropdown ▼ ] by
 * ROW 2: [ Dimension Dropdown ▼ ]
 *
 * Connected directly to: GET /api/google/analytics/insights/acquisition
 */
export default function GA4TrafficAcquisitionCard({ card }) {
  const [selectedMetric, setSelectedMetric] = useState("sessions");
  const [selectedDimension, setSelectedDimension] = useState("sessionPrimaryChannelGroup");
  const [selectedRange, setSelectedRange] = useState(card?.defaultRange || "28d");

  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [isDimOpen, setIsDimOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalVal, setTotalVal] = useState("0");
  const [rows, setRows] = useState([]);

  const metricRef = useRef(null);
  const dimRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (metricRef.current && !metricRef.current.contains(e.target)) {
        setIsMetricOpen(false);
      }
      if (dimRef.current && !dimRef.current.contains(e.target)) {
        setIsDimOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeMetricObj =
    METRIC_OPTIONS.find((m) => m.id === selectedMetric) || METRIC_OPTIONS[0];
  const activeDimObj =
    DIMENSION_OPTIONS.find((d) => d.id === selectedDimension) || DIMENSION_OPTIONS[0];

  // Primary API fetcher
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await getGA4TrafficAcquisition({
        metric: selectedMetric,
        dimension: activeDimObj.apiKey,
        rangePreset: selectedRange,
        limit: 5,
      });

      if (res?.data) {
        setTotalVal(res.data.total !== undefined ? res.data.total : "0");
        setRows(Array.isArray(res.data.rows) ? res.data.rows : []);
      } else {
        setTotalVal("0");
        setRows([]);
      }
    } catch (err) {
      console.error("Traffic Acquisition API fetch error:", err);
      setError(err.message || "Unable to load traffic acquisition data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMetric, activeDimObj.apiKey, selectedRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle card date selector change
  const handleRangeChange = (newRange) => {
    if (newRange === selectedRange) return;
    setSelectedRange(newRange);
  };

  // Calculate max row value for proportional progress bar rendering
  const maxVal = Math.max(...rows.map((r) => parseRowVal(r)), 1);

  return (
    <div className="w-[320px] sm:w-[340px] shrink-0 h-[400px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow select-none relative">
      {/* Top Header Section — GA4 Structure */}
      <div>
        <div className="mb-2">
          {/* ROW 1: [ METRIC DROPDOWN ▼ ] by */}
          <div className="flex items-center gap-1.5 mb-1">
            <div className="relative shrink-0" ref={metricRef}>
              <button
                type="button"
                onClick={() => setIsMetricOpen(!isMetricOpen)}
                className="inline-flex items-center gap-1 text-[13.5px] sm:text-[14px] font-bold text-slate-800 hover:text-indigo-600 bg-slate-100/80 hover:bg-slate-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
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
            <span className="text-[13.5px] sm:text-[14px] font-bold text-slate-800">by</span>
          </div>

          {/* ROW 2: [ DIMENSION DROPDOWN ▼ ] */}
          <div className="relative w-full" ref={dimRef}>
            <button
              type="button"
              onClick={() => setIsDimOpen(!isDimOpen)}
              className="w-full inline-flex items-center justify-between text-left gap-1 text-[12px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-100/60 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
              title={activeDimObj.label}
            >
              <span className="truncate">{activeDimObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isDimOpen && (
              <div className="absolute left-0 top-full mt-1 w-full max-w-[290px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Dimension
                </div>
                {DIMENSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedDimension(opt.id);
                      setIsDimOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left cursor-pointer leading-snug"
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {selectedDimension === opt.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary Metric Value & Unit Label */}
        {isLoading ? (
          <div className="h-8 flex items-center gap-2 mb-2">
            <div className="w-20 h-6 bg-slate-100 animate-pulse rounded-md" />
            <div className="w-20 h-4 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[22px] font-extrabold text-slate-900 font-mono tracking-tight">
              {typeof totalVal === "number" ? totalVal.toLocaleString() : totalVal}
            </span>
            <span className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wider">
              {activeMetricObj.unit}
            </span>
          </div>
        )}

        {/* Visualization Area: Breakdown List & Relative Progress Bars */}
        <div className="mt-1">
          {isLoading ? (
            <div className="h-44 flex flex-col justify-center space-y-3 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="w-full h-3.5 bg-slate-200/70 animate-pulse rounded-md" />
              <div className="w-4/5 h-3.5 bg-slate-200/70 animate-pulse rounded-md" />
              <div className="w-3/5 h-3.5 bg-slate-200/70 animate-pulse rounded-md" />
              <div className="w-2/5 h-3.5 bg-slate-200/70 animate-pulse rounded-md" />
            </div>
          ) : error ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-red-50/50 rounded-xl border border-red-100 text-red-600">
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
          ) : rows.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {rows.slice(0, 4).map((row, idx) => {
                const dimName = row.dimension || row.label || row.dimensionValue || "(not set)";
                const valNum = parseRowVal(row);
                const valDisplay = row.value !== undefined ? String(row.value) : valNum.toLocaleString();
                const widthPct = Math.max(6, Math.round((valNum / maxVal) * 100));

                const colorClass =
                  idx === 0
                    ? "bg-indigo-600"
                    : idx === 1
                    ? "bg-blue-500"
                    : idx === 2
                    ? "bg-sky-500"
                    : "bg-emerald-500";

                // Parse comparison pct change safely
                const changePct =
                  row.changePct !== undefined && row.changePct !== null
                    ? Number(row.changePct)
                    : null;
                const hasChange = changePct !== null && !isNaN(changePct) && isFinite(changePct);

                return (
                  <div key={`acq-row-${idx}`} className="space-y-1">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span
                        className="text-slate-700 font-semibold truncate max-w-[170px]"
                        title={dimName}
                      >
                        {dimName}
                      </span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="font-bold text-slate-900 font-mono">
                          {valDisplay}
                        </span>
                        {hasChange && (
                          changePct > 0 ? (
                            <span className="inline-flex items-center text-emerald-600 font-semibold text-[10px]">
                              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                              {changePct.toFixed(1)}%
                            </span>
                          ) : changePct < 0 ? (
                            <span className="inline-flex items-center text-rose-600 font-semibold text-[10px]">
                              <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                              {Math.abs(changePct).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[10px]">0%</span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Proportional Relative Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-[12px] font-semibold text-slate-400">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Area with Independent Date Selector */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {/* Independent Card Date Selector */}
        <GA4CardDateSelector
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />

        {/* Action Link */}
        <button
          type="button"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
        >
          <span>View traffic acquisition</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
