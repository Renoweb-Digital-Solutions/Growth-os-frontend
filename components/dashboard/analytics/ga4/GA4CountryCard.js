"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, ArrowRight, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { getGA4SuggestedCard, getGA4ReportUrl } from "@/lib/googleAnalyticsApi";
import GA4CardDateSelector from "./GA4CardDateSelector";

const METRIC_OPTIONS = [
  { id: "activeUsers", label: "Active users", unit: "USERS" },
  { id: "newUsers", label: "New users", unit: "USERS" },
  { id: "returningUsers", label: "Returning users", unit: "USERS" },
];

const DIMENSION_OPTIONS = [
  { id: "country", label: "Country", shortLabel: "Country" },
  { id: "countryId", label: "Country ID", shortLabel: "Country ID" },
];

/**
 * Extracts clean display string from row object returned by backend.
 * Uses dimensionLabel if present, falling back to dimensionValue or dimension.
 */
function getCountryDisplayName(row) {
  if (!row) return "";
  const label = row.dimensionLabel || row.dimensionValue || row.dimension || "";
  return String(label).trim();
}

/**
 * GA4CountryCard renders the GA4 "Active users by Country" Suggested Card.
 * Header layout:
 * [ Active users ▼ ] by [ Country ▼ ]
 *
 * Connected directly to: GET /api/google/analytics/insights/suggested-cards/active-users-by-country
 */
export default function GA4CountryCard({ card, selectedProperty, selectedPropertyObj }) {
  const [selectedMetric, setSelectedMetric] = useState("activeUsers");
  const [selectedDimension, setSelectedDimension] = useState("country");
  const [selectedRange, setSelectedRange] = useState(card?.defaultRange || "28d");

  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [isDimOpen, setIsDimOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalVal, setTotalVal] = useState(0);
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

  // Primary data-fetching hook with AbortController for race-condition prevention
  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await getGA4SuggestedCard(
        "active-users-by-country",
        {
          metric: selectedMetric,
          dimension: selectedDimension,
          rangePreset: selectedRange,
          limit: 7,
        },
        signal ? { signal } : {}
      );

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
      if (err.name === "AbortError") return;
      console.error("Country Card API fetch error:", err);
      setError(err.message || "Unable to load country data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMetric, selectedDimension, selectedRange]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleRangeChange = (newRange) => {
    if (newRange === selectedRange) return;
    setSelectedRange(newRange);
  };

  return (
    <div className="w-[320px] sm:w-[340px] shrink-0 h-[410px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow select-none relative">
      {/* Top Header Section — [Metric ▼] by [Dimension ▼] */}
      <div>
        <div className="flex items-center flex-wrap gap-1 mb-2">
          {/* FIRST DROPDOWN — METRIC */}
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

          <span className="text-[13px] sm:text-[13.5px] font-bold text-slate-800">by</span>

          {/* SECOND DROPDOWN — DIMENSION */}
          <div className="relative inline-block" ref={dimRef}>
            <button
              type="button"
              onClick={() => setIsDimOpen(!isDimOpen)}
              className="inline-flex items-center gap-1 text-[13px] sm:text-[13.5px] font-bold text-slate-800 hover:text-indigo-600 bg-slate-100/80 hover:bg-slate-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              title="Select dimension"
            >
              <span>{activeDimObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isDimOpen && (
              <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                {DIMENSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedDimension(opt.id);
                      setIsDimOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {selectedDimension === opt.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary Metric Value & Unit Label (unaltered backend total) */}
        {isLoading ? (
          <div className="h-7 flex items-center gap-2 mb-1.5">
            <div className="w-20 h-6 bg-slate-100 animate-pulse rounded-md" />
            <div className="w-16 h-4 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-[22px] font-extrabold text-slate-900 font-mono tracking-tight">
              {totalVal.toLocaleString()}
            </span>
            <span className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wider">
              {activeMetricObj.unit}
            </span>
          </div>
        )}

        {/* Ranked Country Rows (Max 7 Rows returned directly by Backend) */}
        <div className="mt-0.5">
          {isLoading ? (
            <div className="h-[230px] flex flex-col justify-center space-y-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`skel-${i}`} className="w-full h-4 bg-slate-200/70 animate-pulse rounded-md" />
              ))}
            </div>
          ) : error ? (
            <div className="h-[230px] flex flex-col items-center justify-center text-center p-4 bg-red-50/50 rounded-xl border border-red-100 text-red-600">
              <AlertCircle className="w-5 h-5 mb-1.5 text-red-500" />
              <p className="text-[12px] font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchData()}
                className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : rows.length > 0 ? (
            <div className="space-y-1 overflow-hidden">
              {rows.map((row, idx) => {
                const countryDisplayName = getCountryDisplayName(row);
                const currentCount =
                  typeof row.current === "number"
                    ? row.current
                    : Number(row.current) || 0;
                const changePct =
                  row.changePct !== undefined && row.changePct !== null
                    ? Number(row.changePct)
                    : null;
                const hasChange =
                  changePct !== null && !isNaN(changePct) && isFinite(changePct);

                return (
                  <div
                    key={`country-row-${row.dimensionValue || idx}`}
                    className="flex items-center justify-between p-1 px-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {/* Rank Circle Badge */}
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200/80 text-slate-600 text-[9.5px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Display Label (Full Country Name when Country selected, Country Code when Country ID selected) */}
                      <span className="text-slate-700 font-semibold truncate" title={countryDisplayName}>
                        {countryDisplayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Metric Count */}
                      <span className="font-bold text-slate-900 font-mono">
                        {currentCount.toLocaleString()}
                      </span>

                      {/* Period-over-period percentage change */}
                      {hasChange && (
                        changePct > 0 ? (
                          <span className="inline-flex items-center text-emerald-600 font-semibold text-[9.5px]">
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                            {changePct.toFixed(1)}%
                          </span>
                        ) : changePct < 0 ? (
                          <span className="inline-flex items-center text-rose-600 font-semibold text-[9.5px]">
                            <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                            {Math.abs(changePct).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[9.5px]">0%</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[230px] flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-[12px] font-semibold text-slate-400">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Area with Independent Date Selector */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {/* Independent Card Date Selector */}
        <GA4CardDateSelector
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />

        {/* Action Link */}
        <a
          href={getGA4ReportUrl("country", selectedPropertyObj || selectedProperty, selectedRange, selectedMetric, selectedDimension)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View insights for Active users by Country in Google Analytics"
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
        >
          <span>View insights</span>
          <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
