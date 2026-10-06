"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export const GA4_PRESETS = [
  { label: "24H", key: "24h" },
  { label: "7D", key: "7d" },
  { label: "28D", key: "28d" },
  { label: "90D", key: "3m" },
];

export const GA4_MORE_PRESETS = [
  { label: "Today", key: "today" },
  { label: "Yesterday", key: "yesterday" },
  { label: "This week (Sun - Today)", key: "this_week" },
  { label: "Last 7 days", key: "7d" },
  { label: "Last week (Sun - Sat)", key: "last_week" },
  { label: "Last 28 days", key: "28d" },
  { label: "Last 30 days", key: "30d" },
  { label: "This month", key: "this_month" },
  { label: "Last month", key: "last_month" },
  { label: "Last 90 days", key: "90d" },
  { label: "Quarter to date", key: "quarter_to_date" },
  { label: "This year (Jan - Today)", key: "this_year" },
  { label: "Last calendar year", key: "last_year" },
];

export function getPresetLabel(key) {
  if (!key) return "LAST 28 DAYS";
  if (key === "24h") return "LAST 24 HOURS";
  if (key === "7d") return "LAST 7 DAYS";
  if (key === "28d" || key === 28) return "LAST 28 DAYS";
  if (key === "3m" || key === "90d") return "LAST 90 DAYS";
  if (key === "today") return "TODAY";
  if (key === "yesterday") return "YESTERDAY";
  if (key === "this_week") return "THIS WEEK";
  if (key === "last_week") return "LAST WEEK";
  if (key === "this_month") return "THIS MONTH";
  if (key === "last_month") return "LAST MONTH";
  if (key === "quarter_to_date") return "QUARTER TO DATE";
  if (key === "this_year") return "THIS YEAR";
  if (key === "last_year") return "LAST YEAR";
  return String(key).toUpperCase();
}

/**
 * Reusable Card Date Range Selector Pill & Dropdown Menu.
 * Operates independently for each individual card.
 */
export default function GA4CardDateSelector({ selectedRange, onRangeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLabel = getPresetLabel(selectedRange);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-56 overflow-y-auto scrollbar-light animate-in fade-in slide-in-from-bottom-1 duration-100">
          <div className="p-1 border-b border-slate-100 mb-1 grid grid-cols-4 gap-1">
            {GA4_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onRangeChange(p.key);
                  setIsOpen(false);
                }}
                className={`py-1 text-[10.5px] font-bold rounded text-center transition-colors cursor-pointer ${
                  selectedRange === p.key
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-0.5">
            {GA4_MORE_PRESETS.map((opt) => {
              const isSelected = selectedRange === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onRangeChange(opt.key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11.5px] font-medium rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
