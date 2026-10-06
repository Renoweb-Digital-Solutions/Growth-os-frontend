"use client";

import React, { useState, useRef, useEffect } from "react";
import { BarChart3, ChevronDown, Check, Globe, RefreshCw } from "lucide-react";

export default function GA4PropertySelector({
  properties = [],
  selectedProperty,
  selectedPropertyObj,
  onSelectProperty,
  isSwitching = false,
  isConnected = true,
  hasAnalyticsScope = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const activeDisplay =
    selectedPropertyObj?.displayName ||
    selectedPropertyObj?.propertyName ||
    selectedProperty ||
    "Select GA4 Property";

  const activeId = selectedPropertyObj?.propertyId || selectedProperty;

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] font-bold text-slate-900">Google Analytics 4</h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${
                isConnected && hasAnalyticsScope
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isConnected && hasAnalyticsScope ? "Connected" : "Scope Required"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[12.5px] text-slate-500 mt-0.5">
            <span>Property:</span>
            <span className="font-semibold text-slate-800">{activeDisplay}</span>
            {activeId && <span className="text-[11px] font-mono text-slate-400">({activeId})</span>}
          </div>
        </div>
      </div>

      {/* Property Switcher Dropdown */}
      <div className="relative self-start sm:self-auto" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isSwitching || properties.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
        >
          {isSwitching ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="max-w-[160px] truncate">{activeDisplay}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isOpen && properties.length > 0 && (
          <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl text-[12.5px] animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 overflow-y-auto scrollbar-light">
            <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              Select GA4 Property ({properties.length})
            </div>

            {properties.map((prop) => {
              const propId = String(prop.propertyId || prop.id || prop).replace("properties/", "");
              const isSelected = String(activeId) === propId;
              const displayName = prop.displayName || prop.propertyName || propId;

              return (
                <button
                  key={propId}
                  type="button"
                  onClick={() => {
                    onSelectProperty(propId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate font-medium">{displayName}</div>
                    <div className="text-[10.5px] font-mono text-slate-400">{propId}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
