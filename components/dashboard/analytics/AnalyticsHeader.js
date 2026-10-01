"use client";

import { useState, useRef, useEffect } from "react";
import { Download, RefreshCw, Calendar, CalendarDays, X, ChevronDown, Check, SlidersHorizontal, ArrowLeftRight } from "lucide-react";

// Standard Meta analytics presets
const metaTimeRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

// Google Search Console main header presets
const gscMainRanges = [
  { label: "24 hours", key: "24h" },
  { label: "7 days", key: 7 },
  { label: "28 days", key: 28 },
  { label: "3 months", key: "3m" },
];

// Google Search Console "More" dropdown items (Filter tab)
const gscMoreFilterRanges = [
  { label: "Last 6 months", key: "6m" },
  { label: "Last 12 months", key: "12m" },
  { label: "Last 16 months", key: "16m" },
  { label: "Custom", key: "custom" },
];

// Google Search Console "More" comparison options (Compare tab)
const gscCompareRanges = [
  { label: "Compare last 24 hours to previous period", key: "24h_prev" },
  { label: "Compare last 24 hours week over week", key: "24h_wow" },
  { label: "Compare last 7 days to previous period", key: "7d_prev" },
  { label: "Compare last 7 days year over year", key: "7d_yoy" },
  { label: "Compare last 28 days to previous period", key: "28d_prev" },
  { label: "Compare last 28 days year over year", key: "28d_yoy" },
  { label: "Compare last 3 months to previous period", key: "3m_prev" },
  { label: "Compare last 3 months year over year", key: "3m_yoy" },
  { label: "Compare last 6 months to previous period", key: "6m_prev" },
  { label: "Custom comparison", key: "custom_compare" },
];

function formatDateDisplay(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const dateObj = new Date(year, month, day);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getDefaultStartDateString(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function AnalyticsHeader({
  selectedRange,
  onRangeChange,
  onRefresh,
  onExport,
  isRefreshing,
  activeTab = "overview",
}) {
  const isCustomActive = typeof selectedRange === "object" && selectedRange !== null && selectedRange.isCustom && !selectedRange.isCompare;
  const isCompareActive = typeof selectedRange === "object" && selectedRange !== null && selectedRange.isCompare;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCustomCompareOpen, setIsCustomCompareOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [moreTab, setMoreTab] = useState("filter");

  // Single Custom Range State
  const [tempStartDate, setTempStartDate] = useState(() =>
    isCustomActive ? selectedRange.startDate : getDefaultStartDateString(30)
  );
  const [tempEndDate, setTempEndDate] = useState(() =>
    isCustomActive ? selectedRange.endDate : getTodayString()
  );
  const [validationError, setValidationError] = useState("");

  // Custom Compare Range State
  const [customCompCurrentStart, setCustomCompCurrentStart] = useState(() => getDefaultStartDateString(7));
  const [customCompCurrentEnd, setCustomCompCurrentEnd] = useState(() => getTodayString());
  const [customCompPrevStart, setCustomCompPrevStart] = useState(() => getDefaultStartDateString(14));
  const [customCompPrevEnd, setCustomCompPrevEnd] = useState(() => getDefaultStartDateString(8));
  const [customCompError, setCustomCompError] = useState("");

  const containerRef = useRef(null);
  const moreRef = useRef(null);

  const isGscTab = activeTab === "gsc";

  // Synchronize internal inputs when selectedRange prop changes externally
  useEffect(() => {
    if (isCustomActive && selectedRange.startDate && selectedRange.endDate) {
      setTempStartDate(selectedRange.startDate);
      setTempEndDate(selectedRange.endDate);
    }
  }, [selectedRange, isCustomActive]);

  // Click-outside listener to close popover & dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsPickerOpen(false);
        setValidationError("");
      }
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    }

    if (isPickerOpen || isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPickerOpen, isMoreMenuOpen]);

  const handleTogglePicker = () => {
    if (!isPickerOpen) {
      if (isCustomActive && selectedRange.startDate && selectedRange.endDate) {
        setTempStartDate(selectedRange.startDate);
        setTempEndDate(selectedRange.endDate);
      } else {
        setTempStartDate(getDefaultStartDateString(30));
        setTempEndDate(getTodayString());
      }
      setValidationError("");
    }
    setIsPickerOpen((prev) => !prev);
  };

  const handleSelectPreset = (rangeKey) => {
    setIsPickerOpen(false);
    setIsMoreMenuOpen(false);
    setValidationError("");
    onRangeChange(rangeKey);
  };

  const handleSelectComparePreset = (compareKey) => {
    setIsMoreMenuOpen(false);
    onRangeChange({
      isCompare: true,
      compareKey,
    });
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!tempStartDate || !tempEndDate) {
      setValidationError("Please select both From and To dates.");
      return;
    }
    if (tempStartDate > tempEndDate) {
      setValidationError("From date cannot be after To date.");
      return;
    }
    setValidationError("");
    onRangeChange({
      isCustom: true,
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    setIsPickerOpen(false);
  };

  const handleApplyCustomCompare = (e) => {
    e.preventDefault();
    if (!customCompCurrentStart || !customCompCurrentEnd || !customCompPrevStart || !customCompPrevEnd) {
      setCustomCompError("Please select all start and end dates.");
      return;
    }
    if (customCompCurrentStart > customCompCurrentEnd) {
      setCustomCompError("Current period start date cannot be after end date.");
      return;
    }
    if (customCompPrevStart > customCompPrevEnd) {
      setCustomCompError("Comparison period start date cannot be after end date.");
      return;
    }
    setCustomCompError("");
    onRangeChange({
      isCompare: true,
      isCustomCompare: true,
      startDate: customCompCurrentStart,
      endDate: customCompCurrentEnd,
      comparisonStartDate: customCompPrevStart,
      comparisonEndDate: customCompPrevEnd,
    });
    setIsCustomCompareOpen(false);
  };

  const handleCancelCustom = () => {
    setIsPickerOpen(false);
    setValidationError("");
  };

  const activeRangeText = isCustomActive
    ? `${formatDateDisplay(selectedRange.startDate)} – ${formatDateDisplay(selectedRange.endDate)}`
    : null;

  const isMoreOptionActive = isGscTab && (
    selectedRange === "6m" ||
    selectedRange === "12m" ||
    selectedRange === "16m" ||
    isCustomActive ||
    isCompareActive
  );

  const getMoreButtonLabel = () => {
    if (selectedRange === "6m") return "Last 6 months";
    if (selectedRange === "12m") return "Last 12 months";
    if (selectedRange === "16m") return "Last 16 months";
    if (isCustomActive) return "Custom";
    if (isCompareActive) return "Compare Mode";
    return "More";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Meta growth and organic search performance analytics
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Date Selector Container */}
        <div className="relative" ref={containerRef}>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {isGscTab ? (
              /* Google Search Console Range Selector */
              <>
                {gscMainRanges.map((range) => {
                  const isSelected = !isCompareActive && (selectedRange === range.key || (range.key === 28 && selectedRange === 30));
                  return (
                    <button
                      key={range.key}
                      type="button"
                      onClick={() => handleSelectPreset(range.key)}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}

                {/* More Dropdown Trigger Button */}
                <div className="relative" ref={moreRef}>
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                      isMoreOptionActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : isMoreMenuOpen
                        ? "bg-slate-100 text-slate-800"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{getMoreButtonLabel()}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* More Dropdown Menu Panel (Filter | Compare Tabs) */}
                  {isMoreMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl text-[12.5px] animate-in fade-in slide-in-from-top-1 duration-100">
                      {/* Filter / Compare Tab Headers */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl mb-2">
                        <button
                          type="button"
                          onClick={() => setMoreTab("filter")}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                            moreTab === "filter"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Filter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMoreTab("compare")}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                            moreTab === "compare"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Compare</span>
                        </button>
                      </div>

                      {/* Tab Body: Filter */}
                      {moreTab === "filter" && (
                        <div className="space-y-0.5">
                          {gscMoreFilterRanges.map((opt) => {
                            const isSelected = opt.key === "custom" ? isCustomActive : selectedRange === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setIsMoreMenuOpen(false);
                                  if (opt.key === "custom") {
                                    handleTogglePicker();
                                  } else {
                                    handleSelectPreset(opt.key);
                                  }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                                  isSelected
                                    ? "bg-slate-100 text-slate-900 font-semibold"
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

                      {/* Tab Body: Compare */}
                      {moreTab === "compare" && (
                        <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-light">
                          {gscCompareRanges.map((opt) => {
                            const isSelected = isCompareActive && (
                              (opt.key === "custom_compare" && selectedRange.isCustomCompare) ||
                              selectedRange.compareKey === opt.key
                            );
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  if (opt.key === "custom_compare") {
                                    setIsMoreMenuOpen(false);
                                    setIsCustomCompareOpen(true);
                                    setCustomCompError("");
                                  } else {
                                    handleSelectComparePreset(opt.key);
                                  }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-[12px] ${
                                  isSelected
                                    ? "bg-indigo-50 text-indigo-900 font-semibold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <span className="leading-snug">{opt.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Meta Analytics Standard Selector */
              <>
                {metaTimeRanges.map((range) => (
                  <button
                    key={range.days}
                    type="button"
                    onClick={() => handleSelectPreset(range.days)}
                    className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                      selectedRange === range.days
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}

                {/* Meta Custom Range Trigger Button */}
                <button
                  type="button"
                  onClick={handleTogglePicker}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                    isCustomActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isPickerOpen
                      ? "bg-slate-100 text-slate-800"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Select custom date range"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isCustomActive && activeRangeText ? activeRangeText : "Custom"}</span>
                </button>
              </>
            )}
          </div>

          {/* Custom Date Range Picker Popover Modal */}
          {isPickerOpen && (
            <div className="absolute right-0 top-full mt-2.5 z-50 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl w-72 sm:w-80 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-[13.5px] font-bold text-slate-800">Select Custom Date Range</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCancelCustom}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApplyCustom} className="space-y-3.5">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    max={tempEndDate || getTodayString()}
                    onChange={(e) => {
                      setTempStartDate(e.target.value);
                      setValidationError("");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    min={tempStartDate}
                    max={getTodayString()}
                    onChange={(e) => {
                      setTempEndDate(e.target.value);
                      setValidationError("");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {validationError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11.5px] font-medium text-red-600">
                    {validationError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancelCustom}
                    className="px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-xs"
                  >
                    Apply Range
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Custom Comparison Range Modal */}
          {isCustomCompareOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-[14px] font-bold text-slate-800">Custom Comparison Range</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomCompareOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleApplyCustomCompare} className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="text-[12px] font-bold text-indigo-600 uppercase tracking-wider">Current Period</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customCompCurrentStart}
                          max={customCompCurrentEnd}
                          onChange={(e) => setCustomCompCurrentStart(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customCompCurrentEnd}
                          min={customCompCurrentStart}
                          onChange={(e) => setCustomCompCurrentEnd(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h5 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Comparison Period</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customCompPrevStart}
                          max={customCompPrevEnd}
                          onChange={(e) => setCustomCompPrevStart(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customCompPrevEnd}
                          min={customCompPrevStart}
                          onChange={(e) => setCustomCompPrevEnd(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {customCompError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11.5px] font-medium text-red-600">
                      {customCompError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCustomCompareOpen(false)}
                      className="px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-xs"
                    >
                      Apply Comparison
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Action: Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          title="Refresh Insights Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
          <span>Refresh</span>
        </button>

        {/* Action: Export */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 border border-indigo-600 text-white text-[13px] font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          title="Export current view to CSV"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}


