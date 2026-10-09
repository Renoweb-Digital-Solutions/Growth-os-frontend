"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { getGA4SuggestedCard, getGA4ReportUrl } from "@/lib/googleAnalyticsApi";
import GA4CardDateSelector from "./GA4CardDateSelector";

/**
 * GA4SimpleFixedCard renders fixed (no dropdowns) Suggested-for-You cards connected directly to live GA4 Data API endpoints.
 * Used for:
 * 1. Active users by First user source / medium (active-users-by-source-medium)
 * 2. Views by Page title and screen class (views-by-page-title)
 * 3. Active users by Town/City (active-users-by-city)
 */
export default function GA4SimpleFixedCard({
  cardKey,
  defaultTitle,
  unitLabel = "USERS",
  footerCta = "USERS",
  card,
  selectedProperty,
  selectedPropertyObj,
}) {
  const [selectedRange, setSelectedRange] = useState(card?.defaultRange || "28d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalVal, setTotalVal] = useState(0);
  const [rows, setRows] = useState([]);

  const title = card?.title || defaultTitle;

  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await getGA4SuggestedCard(
        cardKey,
        {
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
      console.error(`GA4 Card '${cardKey}' API fetch error:`, err);
      setError(err.message || "Unable to load card data");
    } finally {
      setIsLoading(false);
    }
  }, [cardKey, selectedRange]);

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
      {/* Top Section */}
      <div>
        {/* Plain Text Title Header — NO Dropdowns */}
        <div className="mb-2">
          <h4
            className="text-[13.5px] font-bold text-slate-800 leading-snug line-clamp-2"
            title={title}
          >
            {title}
          </h4>
        </div>

        {/* Primary Total Value & Unit Label */}
        {isLoading ? (
          <div className="h-7 flex items-center gap-2 mb-2">
            <div className="w-20 h-6 bg-slate-100 animate-pulse rounded-md" />
            <div className="w-16 h-4 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[22px] font-extrabold text-slate-900 font-mono tracking-tight">
              {totalVal.toLocaleString()}
            </span>
            <span className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wider">
              {unitLabel}
            </span>
          </div>
        )}

        {/* Ranked Top Rows */}
        <div className="mt-1">
          {isLoading ? (
            <div className="h-[230px] flex flex-col justify-center space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skel-${i}`}
                  className="w-full h-3.5 bg-slate-200/70 animate-pulse rounded-md"
                />
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
            <div className="space-y-1 pt-0.5">
              {rows.map((row, idx) => {
                const dimLabel =
                  row.dimensionLabel || row.dimensionValue || row.dimension || "(not set)";
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
                    key={`row-${row.dimensionValue || idx}`}
                    className="flex items-center justify-between p-1 px-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {/* Rank Badge Circle */}
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200/80 text-slate-600 text-[9.5px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Dimension Value Label */}
                      <span
                        className="text-slate-700 font-medium truncate"
                        title={dimLabel}
                      >
                        {dimLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Metric Count */}
                      <span className="font-bold text-slate-900 font-mono">
                        {currentCount.toLocaleString()}
                      </span>

                      {/* Period-over-period percentage change */}
                      {hasChange &&
                        (changePct > 0 ? (
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
                        ))}
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
          href={getGA4ReportUrl(cardKey || card?.vizType || card?.id, selectedPropertyObj || selectedProperty, selectedRange)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View insights for ${title} in Google Analytics`}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
        >
          <span>View insights</span>
          <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
