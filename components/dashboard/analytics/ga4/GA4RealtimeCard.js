"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { getGA4Realtime } from "@/lib/googleAnalyticsApi";

const METRIC_OPTIONS = [
  { id: "activeUsers", label: "Active users", supported: true, subtitle: "Active users per minute" },
  { id: "eventCount", label: "Event count", supported: true, subtitle: "Events per minute" },
  { id: "keyEvents", label: "Key events", supported: true, subtitle: "Key events per minute" },
  { id: "screenPageViews", label: "Views", supported: true, subtitle: "Views per minute" },
  { id: "newUsers", label: "New users", supported: false, subtitle: "Not available in Realtime API" },
];

const DIMENSION_OPTIONS = [
  { id: "country", label: "Country", supported: true },
  { id: "city", label: "Town/City", supported: true },
  { id: "audience", label: "Audience", supported: true },
  { id: "firstUserCampaign", label: "First user campaign", supported: false },
  { id: "firstUserMedium", label: "First user medium", supported: false },
  { id: "firstUserSource", label: "First user source", supported: false },
  { id: "firstUserSourcePlatform", label: "First user source platform", supported: false },
];

/**
 * GA4RealtimeCard renders the GA4 Realtime Home Widget connected directly to:
 * GET /api/google/analytics/insights/realtime
 *
 * Rules:
 * - NO mock data or fallback sample values anywhere.
 * - Handles 0 active users & empty breakdown rows naturally from the backend API.
 * - Auto-refreshes (polls) every 20 seconds.
 * - Disables unsupported metrics (newUsers) & unsupported dimensions (firstUserCampaign/Medium/Source/Platform).
 * - No date range dropdown in footer.
 */
export default function GA4RealtimeCard() {
  const [selectedMetric, setSelectedMetric] = useState("activeUsers");
  const [selectedDimension, setSelectedDimension] = useState("country");

  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [isDimOpen, setIsDimOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [totalCount, setTotalCount] = useState(0);
  const [minuteRows, setMinuteRows] = useState([]);
  const [breakdownRows, setBreakdownRows] = useState([]);

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

  // Realtime Data Fetcher
  const fetchData = useCallback(
    async (isInitial = false) => {
      if (!activeMetricObj.supported || !activeDimObj.supported) {
        return;
      }

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const [resMinutes, resBreakdown] = await Promise.all([
          getGA4Realtime({ metric: selectedMetric, dimension: "minutesAgo" }),
          getGA4Realtime({ metric: selectedMetric, dimension: selectedDimension }),
        ]);

        if (resMinutes?.success && resMinutes?.data) {
          const tot =
            typeof resMinutes.data.total === "number"
              ? resMinutes.data.total
              : Number(resMinutes.data.total) || 0;
          setTotalCount(tot);
          setMinuteRows(Array.isArray(resMinutes.data.rows) ? resMinutes.data.rows : []);
        } else {
          setTotalCount(0);
          setMinuteRows([]);
        }

        if (resBreakdown?.success && resBreakdown?.data) {
          setBreakdownRows(Array.isArray(resBreakdown.data.rows) ? resBreakdown.data.rows : []);
        } else {
          setBreakdownRows([]);
        }
      } catch (err) {
        console.error("Failed to fetch GA4 Realtime data:", err);
        setError(err.message || "Unable to load realtime data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedMetric, selectedDimension, activeMetricObj.supported, activeDimObj.supported]
  );

  // Initial load + 20s polling interval
  useEffect(() => {
    fetchData(true);

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const maxSparkVal = Math.max(...minuteRows.map((r) => r.value || 0), 1);

  return (
    <div className="w-[320px] sm:w-[340px] shrink-0 h-[400px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow select-none relative">
      {/* Header & Main Metric Section */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-[13px] font-bold text-slate-800 leading-tight uppercase tracking-tight">
            Active users in last 30 minutes
          </h4>

          {/* Top-Right Metric Dropdown */}
          <div className="relative shrink-0" ref={metricRef}>
            <button
              type="button"
              onClick={() => setIsMetricOpen(!isMetricOpen)}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100/80 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <span>{activeMetricObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMetricOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                {METRIC_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!opt.supported}
                    onClick={() => {
                      if (!opt.supported) return;
                      setSelectedMetric(opt.id);
                      setIsMetricOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[11.5px] font-medium text-left transition-colors ${
                      opt.supported
                        ? "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                        : "text-slate-400 bg-slate-50/50 cursor-not-allowed opacity-75"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      {!opt.supported && (
                        <div className="text-[9.5px] text-slate-400 font-normal">
                          Not available in Realtime API
                        </div>
                      )}
                    </div>
                    {opt.supported && selectedMetric === opt.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary Metric Value & Subtitle */}
        {isLoading ? (
          <div className="h-9 flex items-center gap-2 mb-2">
            <div className="w-16 h-7 bg-slate-100 animate-pulse rounded-md" />
            <div className="w-24 h-4 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[24px] font-extrabold text-slate-900 font-mono tracking-tight">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {activeMetricObj.subtitle}
            </span>
            {isRefreshing && (
              <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin ml-auto" />
            )}
          </div>
        )}

        {/* 30-Minute Realtime Sparkline */}
        <div className="space-y-1 mb-3">
          <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
            {activeMetricObj.subtitle}
          </span>
          {isLoading ? (
            <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 animate-pulse flex items-center justify-center">
              <span className="text-[11px] text-slate-400">Loading realtime graph...</span>
            </div>
          ) : (
            <div className="flex items-end gap-0.5 h-12 bg-slate-50 p-2 rounded-xl border border-slate-100">
              {minuteRows.length > 0 ? (
                minuteRows.map((item, idx) => {
                  const val = item.value || 0;
                  const heightPct =
                    maxSparkVal > 0 && val > 0
                      ? Math.max(12, Math.round((val / maxSparkVal) * 100))
                      : 6;
                  const isZero = val === 0;

                  return (
                    <div
                      key={`spark-${idx}`}
                      className={`flex-1 rounded-xs transition-all ${
                        isZero
                          ? "bg-slate-200/60"
                          : "bg-indigo-500/80 hover:bg-indigo-600 cursor-pointer"
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`Minute ${item.minute}: ${val}`}
                    />
                  );
                })
              ) : (
                Array.from({ length: 30 }).map((_, idx) => (
                  <div
                    key={`spark-empty-${idx}`}
                    className="flex-1 rounded-xs bg-slate-200/50 h-[6%]"
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Dimension Breakdown Section */}
        <div className="space-y-1.5">
          {/* Dimension Dropdown Trigger */}
          <div className="relative inline-block" ref={dimRef}>
            <button
              type="button"
              onClick={() => setIsDimOpen(!isDimOpen)}
              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-500 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              <span>{activeDimObj.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDimOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                {DIMENSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!opt.supported}
                    onClick={() => {
                      if (!opt.supported) return;
                      setSelectedDimension(opt.id);
                      setIsDimOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-left transition-colors ${
                      opt.supported
                        ? "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                        : "text-slate-400 bg-slate-50/50 cursor-not-allowed opacity-75"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      {!opt.supported && (
                        <div className="text-[9.5px] text-slate-400 font-normal">
                          Not available in Realtime API
                        </div>
                      )}
                    </div>
                    {opt.supported && selectedDimension === opt.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown Rows */}
          {isLoading ? (
            <div className="space-y-1 py-1">
              <div className="w-full h-4 bg-slate-100 animate-pulse rounded-md" />
              <div className="w-3/4 h-4 bg-slate-100 animate-pulse rounded-md" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-1.5 text-amber-600 text-[11px] py-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : breakdownRows.length > 0 ? (
            <div className="space-y-1">
              {breakdownRows.slice(0, 3).map((row, i) => {
                const name = row.dimension || row.name || "(not set)";
                const count = typeof row.value === "number" ? row.value : row.count || 0;
                return (
                  <div
                    key={`dim-row-${i}`}
                    className="flex items-center justify-between text-[11.5px] py-0.5"
                  >
                    <span className="text-slate-700 font-medium truncate max-w-[200px]" title={name}>
                      {name}
                    </span>
                    <span className="font-semibold text-slate-900 font-mono ml-2">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11.5px] font-semibold text-slate-400 py-1">No data available</p>
          )}
        </div>
      </div>

      {/* Card Footer — NO Date Range Selector, Only Action Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-[11px]">
        <button
          type="button"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
        >
          <span>View Realtime</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
