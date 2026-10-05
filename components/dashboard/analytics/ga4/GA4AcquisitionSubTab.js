"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Compass, Users } from "lucide-react";
import { getGA4TrafficAcquisition, getGA4UserAcquisition } from "@/lib/googleAnalyticsApi";

const DIMENSION_OPTIONS = [
  { key: "channel", label: "Default Channel Group" },
  { key: "source", label: "Source" },
  { key: "medium", label: "Medium" },
  { key: "source_medium", label: "Source / Medium" },
  { key: "campaign", label: "Campaign Name" },
];

function formatMetricCell(val, isRate = false) {
  if (val === null || val === undefined) return "0";
  if (typeof val === "object") {
    const rawNum = Number(val.value);
    if (!Number.isFinite(rawNum)) return "0";
    if (isRate) return `${(rawNum * 100).toFixed(1)}%`;
    return Number.isInteger(rawNum) ? rawNum.toLocaleString("en-US") : rawNum.toFixed(2);
  }
  const rawNum = Number(val);
  if (!Number.isFinite(rawNum)) return "0";
  if (isRate) return `${(rawNum * 100).toFixed(1)}%`;
  return Number.isInteger(rawNum) ? rawNum.toLocaleString("en-US") : rawNum.toFixed(2);
}

function formatPrevMetricCell(val, isRate = false) {
  if (!val || typeof val !== "object" || val.previous === undefined) return "0";
  const rawNum = Number(val.previous);
  if (!Number.isFinite(rawNum)) return "0";
  if (isRate) return `${(rawNum * 100).toFixed(1)}%`;
  return Number.isInteger(rawNum) ? rawNum.toLocaleString("en-US") : rawNum.toFixed(2);
}

function renderDiffCell(val, isRate = false) {
  if (!val || typeof val !== "object") return <span className="text-slate-400 font-mono">0</span>;
  
  if (isRate) {
    const diff = Number(val.changeDiff || 0) * 100;
    if (diff > 0) return <span className="text-emerald-600 font-semibold font-mono">+{diff.toFixed(1)} pp</span>;
    if (diff < 0) return <span className="text-red-600 font-semibold font-mono">{diff.toFixed(1)} pp</span>;
    return <span className="text-slate-400 font-mono">0.0 pp</span>;
  }

  const pct = Number(val.changePct || 0);
  if (pct > 0) return <span className="text-emerald-600 font-semibold font-mono">+{pct.toFixed(1)}%</span>;
  if (pct < 0) return <span className="text-red-600 font-semibold font-mono">{pct.toFixed(1)}%</span>;
  return <span className="text-slate-400 font-mono">0.0%</span>;
}

export default function GA4AcquisitionSubTab({
  selectedProperty,
  startDate,
  endDate,
  comparisonEnabled = false,
  comparisonType = "none",
}) {
  const [acquisitionType, setAcquisitionType] = useState("traffic"); // 'traffic' | 'user'
  const [selectedDimension, setSelectedDimension] = useState("channel");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowLimit, setRowLimit] = useState(10);

  const [dataRows, setDataRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isDimDropdownOpen, setIsDimDropdownOpen] = useState(false);
  const dimDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dimDropdownRef.current && !dimDropdownRef.current.contains(event.target)) {
        setIsDimDropdownOpen(false);
      }
    }
    if (isDimDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDimDropdownOpen]);

  // Fetch acquisition data when mode, dimension, date range or property changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedProperty) return;

    async function fetchAcquisitionData() {
      setIsLoading(true);
      setError(null);

      const params = {
        propertyId: selectedProperty,
        startDate,
        endDate,
        dimension: selectedDimension,
        comparisonType: comparisonEnabled ? comparisonType : "none",
        limit: 100,
      };

      try {
        const fetchFn = acquisitionType === "traffic" ? getGA4TrafficAcquisition : getGA4UserAcquisition;
        const res = await fetchFn(params);
        if (!isMounted) return;

        if (res?.data?.rows) {
          setDataRows(res.data.rows);
        } else {
          setDataRows([]);
        }
      } catch (err) {
        console.error("Failed to fetch acquisition data:", err);
        if (isMounted) setError(err.message || "Failed to load acquisition report");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAcquisitionData();

    return () => {
      isMounted = false;
    };
  }, [selectedProperty, startDate, endDate, acquisitionType, selectedDimension, comparisonEnabled, comparisonType]);

  // Client-side search filtering
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return dataRows;
    const q = searchQuery.toLowerCase().trim();
    return dataRows.filter((row) => String(row.label || "").toLowerCase().includes(q));
  }, [dataRows, searchQuery]);

  // Slice displayed rows based on limit
  const displayedRows = useMemo(() => {
    if (rowLimit === "all") return filteredRows;
    const limitNum = Number(rowLimit) || 10;
    return filteredRows.slice(0, limitNum);
  }, [filteredRows, rowLimit]);

  const activeDimLabel = DIMENSION_OPTIONS.find((d) => d.key === selectedDimension)?.label || "Channel";

  return (
    <div className="space-y-6">
      {/* Top Header Controls Card */}
      <div className="dashboard-card p-5 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Mode Toggle (Traffic vs User Acquisition) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setAcquisitionType("traffic")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-[12.5px] font-bold rounded-lg transition-all ${
              acquisitionType === "traffic"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Traffic Acquisition</span>
          </button>
          <button
            type="button"
            onClick={() => setAcquisitionType("user")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-[12.5px] font-bold rounded-lg transition-all ${
              acquisitionType === "user"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Acquisition</span>
          </button>
        </div>

        {/* Right Controls: Dimension Dropdown & Search Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Dimension Selector */}
          <div className="relative" ref={dimDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDimDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <span className="text-slate-400 font-normal text-[11px]">Primary Dimension:</span>
              <span>{activeDimLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDimDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-white border border-slate-200 rounded-2xl p-1 shadow-xl text-[12.5px] animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Select Dimension
                </div>
                {DIMENSION_OPTIONS.map((opt) => {
                  const isSelected = selectedDimension === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedDimension(opt.key);
                        setIsDimDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-left ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter dimensions..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors w-40 sm:w-48"
            />
          </div>

          {/* Row Limit Selector */}
          <select
            value={rowLimit}
            onChange={(e) => setRowLimit(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 focus:outline-none"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value="all">All rows</option>
          </select>
        </div>
      </div>

      {/* Main Analytical Data Table Card */}
      <div className="dashboard-card p-6 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-[420px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">
              {acquisitionType === "traffic" ? "Traffic Acquisition Report" : "User Acquisition Report"}
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Breakdown by {activeDimLabel} ({filteredRows.length} total entries)
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 space-y-3 py-6 animate-pulse">
            <div className="h-8 bg-slate-100 rounded-lg" />
            <div className="h-6 bg-slate-50 rounded-lg" />
            <div className="h-6 bg-slate-50 rounded-lg" />
            <div className="h-6 bg-slate-50 rounded-lg" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-red-700 mb-1">Failed to load Acquisition Report</h4>
            <p className="text-[12.5px] text-red-500 max-w-xs">{error}</p>
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">No acquisition data available</h4>
            <p className="text-[12.5px] text-slate-500 max-w-xs">
              No traffic was recorded for the selected property and date range.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto scrollbar-light">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100 bg-white">
                  <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white text-center w-12">#</th>
                  <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">
                    {activeDimLabel}
                  </th>
                  {comparisonEnabled ? (
                    <>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Sessions Curr.</th>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Sessions Prev.</th>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Diff</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Users</th>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Sessions</th>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Engaged Sessions</th>
                      <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Engagement Rate</th>
                      <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Key Events</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, idx) => (
                  <tr
                    key={row.label + idx}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                      idx % 2 === 1 ? "bg-slate-50/30" : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-[12.5px] font-semibold text-slate-400 text-center font-mono w-12">
                      {idx + 1}
                    </td>
                    <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[240px] truncate" title={row.label}>
                      {row.label}
                    </td>
                    {comparisonEnabled ? (
                      <>
                        <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                          {formatMetricCell(row.metrics?.sessions)}
                        </td>
                        <td className="py-3 px-3 text-[13px] font-semibold text-slate-500 text-right font-mono">
                          {formatPrevMetricCell(row.metrics?.sessions)}
                        </td>
                        <td className="py-3 px-3 text-[13px] text-right font-mono">
                          {renderDiffCell(row.metrics?.sessions)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                          {formatMetricCell(row.metrics?.totalUsers || row.metrics?.activeUsers)}
                        </td>
                        <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                          {formatMetricCell(row.metrics?.sessions)}
                        </td>
                        <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                          {formatMetricCell(row.metrics?.engagedSessions)}
                        </td>
                        <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                          {formatMetricCell(row.metrics?.engagementRate, true)}
                        </td>
                        <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                          {formatMetricCell(row.metrics?.keyEvents)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
