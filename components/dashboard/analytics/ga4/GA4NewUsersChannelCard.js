"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { getGA4SuggestedCard, getGA4ReportUrl } from "@/lib/googleAnalyticsApi";
import GA4CardDateSelector, { getPresetLabel } from "./GA4CardDateSelector";

const DIMENSION_OPTIONS = [
  {
    id: "firstUserPrimaryChannelGroup",
    label: "First user primary channel group (Default channel group)",
    shortLabel: "First user primary channel group (Default channel group)",
  },
  {
    id: "firstUserDefaultChannelGroup",
    label: "First user default channel group",
    shortLabel: "First user default channel group",
  },
  {
    id: "firstUserMedium",
    label: "First user medium",
    shortLabel: "First user medium",
  },
  {
    id: "firstUserCampaign",
    label: "First user campaign",
    shortLabel: "First user campaign",
  },
  {
    id: "firstUserSource",
    label: "First user source",
    shortLabel: "First user source",
  },
];

const ROW_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-600",
  "bg-teal-600",
  "bg-amber-500",
  "bg-rose-500",
];

/**
 * GA4NewUsersChannelCard renders the GA4 "New users by First user primary channel group" Suggested Card.
 * Header layout (2 lines):
 * Line 1: New users by
 * Line 2: [ First user primary channel group (Default channel group) ▼ ]
 */
export default function GA4NewUsersChannelCard({ card, selectedProperty, selectedPropertyObj }) {
  const [selectedDimension, setSelectedDimension] = useState("firstUserPrimaryChannelGroup");
  const [selectedRange, setSelectedRange] = useState(card?.defaultRange || "28d");
  const [isDimOpen, setIsDimOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalVal, setTotalVal] = useState(0);
  const [rows, setRows] = useState([]);

  const dimRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dimRef.current && !dimRef.current.contains(e.target)) {
        setIsDimOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeDimObj =
    DIMENSION_OPTIONS.find((d) => d.id === selectedDimension) || DIMENSION_OPTIONS[0];

  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await getGA4SuggestedCard(
        "new-users-by-channel",
        {
          dimension: selectedDimension,
          rangePreset: selectedRange,
          limit: 8,
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
      console.error("New users by Channel API fetch error:", err);
      setError(err.message || "Unable to load channel data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDimension, selectedRange]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleRangeChange = (newRange) => {
    if (newRange === selectedRange) return;
    setSelectedRange(newRange);
  };

  const allVals = rows.flatMap((r) => [
    typeof r.current === "number" ? r.current : Number(r.current) || 0,
    typeof r.previous === "number" ? r.previous : Number(r.previous) || 0,
  ]);
  const maxVal = Math.max(...allVals, 1);

  return (
    <div className="w-[320px] sm:w-[340px] shrink-0 h-[410px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow select-none relative">
      {/* Top Section */}
      <div>
        {/* TWO-LINE HEADER STRUCTURE */}
        {/* Line 1: Fixed Text (NO metric dropdown) */}
        <div className="text-[13px] sm:text-[13.5px] font-bold text-slate-800 mb-0.5">
          New users by
        </div>

        {/* Line 2: DIMENSION DROPDOWN */}
        <div className="relative mb-2" ref={dimRef}>
          <button
            type="button"
            onClick={() => setIsDimOpen(!isDimOpen)}
            className="w-full inline-flex items-center justify-between gap-1 text-[12.5px] sm:text-[13px] font-bold text-slate-800 hover:text-indigo-600 bg-slate-100/80 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer text-left"
            title="Select dimension"
          >
            <span className="truncate">{activeDimObj.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
          </button>

          {isDimOpen && (
            <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 max-h-56 overflow-y-auto">
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
                  <span className="truncate pr-2">{opt.label}</span>
                  {selectedDimension === opt.id && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Metric Number & Unit */}
        {isLoading ? (
          <div className="h-6 flex items-center gap-2 mb-1.5">
            <div className="w-20 h-5 bg-slate-100 animate-pulse rounded-md" />
            <div className="w-16 h-4 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-[20px] font-extrabold text-slate-900 font-mono tracking-tight">
              {totalVal.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              NEW USERS
            </span>
          </div>
        )}

        {/* Horizontal Comparison Bar Chart Rows */}
        <div className="mt-0.5">
          {isLoading ? (
            <div className="h-[210px] flex flex-col justify-center space-y-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skel-${i}`} className="w-full h-5 bg-slate-200/70 animate-pulse rounded-md" />
              ))}
            </div>
          ) : error ? (
            <div className="h-[210px] flex flex-col items-center justify-center text-center p-4 bg-red-50/50 rounded-xl border border-red-100 text-red-600">
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
            <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-0.5 scrollbar-light">
              {rows.map((row, idx) => {
                const label = row.dimensionValue || row.dimensionLabel || row.dimension || "(not set)";
                const currentVal = typeof row.current === "number" ? row.current : Number(row.current) || 0;
                const prevVal = typeof row.previous === "number" ? row.previous : Number(row.previous) || 0;

                const widthPct = Math.max(4, Math.round((currentVal / maxVal) * 100));
                const prevWidthPct = Math.max(4, Math.round((prevVal / maxVal) * 100));
                const barColor = ROW_COLORS[idx % ROW_COLORS.length];

                return (
                  <div key={`row-${row.dimensionValue || idx}`} className="space-y-0.5 text-[10.5px]">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span className="truncate max-w-[190px]" title={label}>
                        {label}
                      </span>
                      <div className="flex items-center gap-1 font-mono shrink-0">
                        <span className="font-bold text-slate-900">{currentVal.toLocaleString()}</span>
                        {prevVal > 0 && (
                          <span className="text-slate-400 text-[9.5px]">vs {prevVal.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Dual Horizontal Bars */}
                    <div className="space-y-0.5">
                      {/* Current Period - Solid Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>

                      {/* Previous Period - Hatched/Striped Bar */}
                      {prevVal > 0 && (
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${prevWidthPct}%`,
                              backgroundColor: "#94a3b8",
                              backgroundImage: `repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 3px, #94a3b8 3px, #94a3b8 6px)`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[210px] flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
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

        <a
          href={getGA4ReportUrl("firstUserChannel", selectedPropertyObj || selectedProperty, selectedRange, "newUsers", selectedDimension)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View insights for New users by First user primary channel group in Google Analytics"
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer text-[11px]"
        >
          <span>View insights</span>
          <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
