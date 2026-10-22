"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import AnalyticsKPICard from "@/components/dashboard/analytics/AnalyticsKPICard";
import GA4ReportCard from "./GA4ReportCard";
import GA4SuggestedForYou from "./GA4SuggestedForYou";
import { ChevronDown, Check } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const GA4_KPI_METRICS = [
  {
    key: "activeUsers",
    label: "Active users",
    type: "count",
    aliases: ["activeUsers", "active_users"],
    color: "#6366F1",
  },
  {
    key: "averageEngagementTimePerActiveUser",
    label: "Average engagement time per active user",
    type: "duration",
    aliases: [
      "averageEngagementTimePerActiveUser",
      "averageEngagementTime",
      "userEngagementDuration",
      "average_engagement_time",
      "userEngagementDurationPerUser",
    ],
    color: "#8B5CF6",
  },
  {
    key: "engagedSessions",
    label: "Engaged sessions",
    type: "count",
    aliases: ["engagedSessions", "engaged_sessions"],
    color: "#3B82F6",
  },
  {
    key: "engagementRate",
    label: "Engagement rate",
    type: "percentage",
    aliases: ["engagementRate", "engagement_rate"],
    color: "#10B981",
  },
  {
    key: "eventCount",
    label: "Event count",
    type: "count",
    aliases: ["eventCount", "event_count", "events"],
    color: "#F59E0B",
  },
  {
    key: "keyEvents",
    label: "Key events",
    type: "count",
    aliases: ["keyEvents", "key_events", "conversions"],
    color: "#EC4899",
  },
  {
    key: "newUsers",
    label: "New users",
    type: "count",
    aliases: ["newUsers", "new_users"],
    color: "#06B6D4",
  },
  {
    key: "sessions",
    label: "Sessions",
    type: "count",
    aliases: ["sessions"],
    color: "#3B82F6",
  },
  {
    key: "screenPageViews",
    label: "Views",
    type: "count",
    aliases: ["screenPageViews", "views", "pageViews", "screen_page_views"],
    color: "#8B5CF6",
  },
  {
    key: "screenPageViewsPerUser",
    label: "Views per active user",
    type: "decimal",
    aliases: ["screenPageViewsPerUser", "viewsPerUser", "views_per_user", "screen_page_views_per_user"],
    color: "#6366F1",
  },
  {
    key: "firstVisits",
    label: "First visits",
    type: "count",
    aliases: ["firstVisits", "first_visit", "firstVisitsCount", "first_visits"],
    color: "#10B981",
  },
  {
    key: "bounceRate",
    label: "Bounce rate",
    type: "percentage",
    aliases: ["bounceRate", "bounce_rate"],
    color: "#EF4444",
  },
  {
    key: "totalUsers",
    label: "Total users",
    type: "count",
    aliases: ["totalUsers", "total_users"],
    color: "#6366F1",
  },
];

/**
 * Normalizes backend response by inspecting data.kpis first, falling back to data.metrics,
 * and mapping all 13 canonical metric keys into consistent objects.
 */
export function normalizeGA4OverviewResponse(overviewData) {
  if (!overviewData) return {};

  const raw = overviewData.data || overviewData;
  const kpisSource = raw.kpis || raw.summary || null;
  const metricsSource = raw.metrics || null;

  const normalized = {};

  GA4_KPI_METRICS.forEach((metricConfig) => {
    const canonicalKey = metricConfig.key;
    let foundMetricObj = null;

    const findInSource = (source) => {
      if (!source) return null;

      if (Array.isArray(source)) {
        for (const alias of metricConfig.aliases) {
          const match = source.find(
            (item) =>
              item &&
              (item.metric === alias ||
                item.key === alias ||
                item.name === alias ||
                item.id === alias)
          );
          if (match !== undefined && match !== null) return match;
        }
        return null;
      }

      if (typeof source === "object") {
        for (const alias of metricConfig.aliases) {
          if (source[alias] !== undefined && source[alias] !== null) {
            return source[alias];
          }
        }
      }

      return null;
    };

    // Priority 1: Check data.kpis
    foundMetricObj = findInSource(kpisSource);

    // Priority 2: Fallback to data.metrics if not in data.kpis
    if (foundMetricObj === null || foundMetricObj === undefined) {
      foundMetricObj = findInSource(metricsSource);
    }

    // Priority 3: Fallback to top-level raw object if directly on raw
    if (foundMetricObj === null || foundMetricObj === undefined) {
      foundMetricObj = findInSource(raw);
    }

    if (foundMetricObj === null || foundMetricObj === undefined) {
      normalized[canonicalKey] = {
        key: canonicalKey,
        value: null,
        previous: null,
        changePct: null,
        changeDiff: null,
        comparisonStatus: null,
      };
      return;
    }

    if (typeof foundMetricObj === "object" && foundMetricObj !== null) {
      const comp =
        foundMetricObj.comparison && typeof foundMetricObj.comparison === "object"
          ? foundMetricObj.comparison
          : null;

      const val =
        foundMetricObj.value !== undefined && foundMetricObj.value !== null
          ? foundMetricObj.value
          : comp && comp.value !== undefined && comp.value !== null
          ? comp.value
          : foundMetricObj.current !== undefined && foundMetricObj.current !== null
          ? foundMetricObj.current
          : null;

      const prev =
        comp && comp.previous !== undefined && comp.previous !== null
          ? comp.previous
          : foundMetricObj.previous !== undefined && foundMetricObj.previous !== null
          ? foundMetricObj.previous
          : foundMetricObj.comparisonValue !== undefined && foundMetricObj.comparisonValue !== null
          ? foundMetricObj.comparisonValue
          : foundMetricObj.prev !== undefined && foundMetricObj.prev !== null
          ? foundMetricObj.prev
          : null;

      const pct =
        comp && comp.changePct !== undefined && comp.changePct !== null
          ? comp.changePct
          : foundMetricObj.changePct !== undefined && foundMetricObj.changePct !== null
          ? foundMetricObj.changePct
          : foundMetricObj.changePercent !== undefined && foundMetricObj.changePercent !== null
          ? foundMetricObj.changePercent
          : foundMetricObj.change !== undefined && foundMetricObj.change !== null
          ? foundMetricObj.change
          : null;

      const diff =
        comp && comp.changeDiff !== undefined && comp.changeDiff !== null
          ? comp.changeDiff
          : foundMetricObj.changeDiff !== undefined && foundMetricObj.changeDiff !== null
          ? foundMetricObj.changeDiff
          : null;

      const status =
        comp && comp.comparisonStatus !== undefined
          ? comp.comparisonStatus
          : foundMetricObj.comparisonStatus !== undefined
          ? foundMetricObj.comparisonStatus
          : null;

      normalized[canonicalKey] = {
        key: canonicalKey,
        value: val,
        previous: prev,
        changePct: pct,
        changeDiff: diff,
        comparisonStatus: status,
      };
    } else if (typeof foundMetricObj === "number" || typeof foundMetricObj === "string") {
      const num = Number(foundMetricObj);
      normalized[canonicalKey] = {
        key: canonicalKey,
        value: !isNaN(num) ? num : null,
        previous: null,
        changePct: null,
        changeDiff: null,
        comparisonStatus: null,
      };
    } else {
      normalized[canonicalKey] = {
        key: canonicalKey,
        value: null,
        previous: null,
        changePct: null,
        changeDiff: null,
        comparisonStatus: null,
      };
    }
  });

  return normalized;
}

export function formatMetricValue(val, type) {
  if (val === null || val === undefined) {
    return "Unavailable";
  }
  const num = Number(val);
  if (isNaN(num)) {
    return "Unavailable";
  }

  if (type === "percentage") {
    const pct = Math.abs(num) <= 1 ? num * 100 : num;
    return `${pct.toFixed(1)}%`;
  }

  if (type === "decimal") {
    return num.toFixed(2);
  }

  if (type === "duration") {
    const totalSec = Math.round(num);
    if (Math.abs(totalSec) < 60) return `${totalSec}s`;
    const mins = Math.floor(Math.abs(totalSec) / 60);
    const secs = Math.abs(totalSec) % 60;
    const prefix = totalSec < 0 ? "-" : "";
    return `${prefix}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }

  // Count
  return Math.round(num).toLocaleString("en-US");
}

function getMetricCardData(normalizedKpis, metricKey, comparisonEnabled) {
  const metricConfig = GA4_KPI_METRICS.find((m) => m.key === metricKey) || GA4_KPI_METRICS[0];
  const canonicalKey = metricConfig.key;
  const metricObj = normalizedKpis?.[canonicalKey];

  if (!metricObj || metricObj.value === null || metricObj.value === undefined) {
    return {
      label: metricConfig.label,
      value: "Unavailable",
      isComparison: comparisonEnabled,
      currentValue: "Unavailable",
      comparisonValue: "Unavailable",
      changePct: null,
      changeText: null,
      changeDirection: "neutral",
      trendAvailable: false,
      color: metricConfig.color,
    };
  }

  const val = metricObj.value;
  const prevVal = metricObj.previous;
  const changePct = metricObj.changePct;
  const compStatus = metricObj.comparisonStatus;

  const displayVal = formatMetricValue(val, metricConfig.type);
  const displayPrev = prevVal !== null && prevVal !== undefined ? formatMetricValue(prevVal, metricConfig.type) : "Unavailable";

  let changeText = null;
  let changeDirection = "neutral";

  if (compStatus === "NO_PREVIOUS_BASE" && (changePct === null || changePct === undefined)) {
    changeText = "— No previous data";
    changeDirection = "neutral";
  } else if ((prevVal === 0 || prevVal === null || prevVal === undefined) && (changePct === null || changePct === undefined)) {
    changeText = "— No previous data";
    changeDirection = "neutral";
  } else if (changePct === null || changePct === undefined) {
    changeText = "— No previous data";
    changeDirection = "neutral";
  } else {
    const numPct = Number(changePct);
    if (isNaN(numPct)) {
      changeText = "— No previous data";
      changeDirection = "neutral";
    } else if (numPct === 0) {
      changeText = "0%";
      changeDirection = "neutral";
    } else {
      const formatted = Math.abs(numPct).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      if (numPct > 0) {
        changeText = `↑ ${formatted}%`;
        changeDirection = "up";
      } else {
        changeText = `↓ ${formatted}%`;
        changeDirection = "down";
      }
    }
  }

  return {
    label: metricConfig.label,
    value: displayVal,
    isComparison: comparisonEnabled,
    currentValue: displayVal,
    comparisonValue: displayPrev,
    changePct: changePct,
    changeText: changeText,
    changeDirection: changeDirection,
    trendAvailable: changeText !== null,
    color: metricConfig.color,
  };
}

/**
 * Helper to format date/bucket labels cleanly for current/previous points.
 */
function formatBucketLabel(item, granularity, fallbackDateStr) {
  if (!item && !fallbackDateStr) return "";

  const rawDate = item?.date || item?.hour || fallbackDateStr || "";

  if (granularity === "hour") {
    if (item?.label) return item.label;

    if (rawDate) {
      if (rawDate.includes(" ") || rawDate.includes("T")) {
        const cleanIso = rawDate.includes("T") ? rawDate : rawDate.replace(" ", "T");
        const dObj = new Date(cleanIso);
        if (!isNaN(dObj.getTime())) {
          return dObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        }
      }
      const hourNum = parseInt(rawDate.split(" ")[1] || rawDate.split(":")[0] || rawDate, 10);
      if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
        const ampm = hourNum >= 12 ? "PM" : "AM";
        const h12 = hourNum % 12 || 12;
        return `${h12}:00 ${ampm}`;
      }
    }
    return rawDate;
  }

  if (granularity === "week") {
    if (item?.label) return item.label;

    const startDateStr = item?.date || rawDate;
    const endDateStr = item?.endDate;

    const parseYMD = (s) => {
      if (!s) return null;
      const parts = s.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      }
      return null;
    };

    const sObj = parseYMD(startDateStr);
    if (sObj) {
      let eObj = parseYMD(endDateStr);
      if (!eObj) {
        eObj = new Date(sObj);
        eObj.setUTCDate(eObj.getUTCDate() + 6);
      }

      const startMonth = sObj.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      const endMonth = eObj.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      const startDay = sObj.getUTCDate();
      const endDay = eObj.getUTCDate();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} – ${endDay}`;
      } else {
        return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
      }
    }
    return rawDate;
  }

  if (granularity === "month") {
    if (item?.label) return item.label;

    if (rawDate && rawDate.includes("-")) {
      const parts = rawDate.split("-").map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const dObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] || 1));
        if (!isNaN(dObj.getTime())) {
          return dObj.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
        }
      }
    }
    return rawDate;
  }

  // Default / Daily
  if (item?.label) return item.label;

  if (rawDate && rawDate.includes("-")) {
    const parts = rawDate.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const dObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      if (!isNaN(dObj.getTime())) {
        return dObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      }
    }
  }

  return rawDate;
}

/**
 * Axis tick formatter label (shorter format for X axis ticks)
 */
function formatAxisTickLabel(item, granularity, fallbackDateStr) {
  const fullLabel = formatBucketLabel(item, granularity, fallbackDateStr);
  if (granularity === "hour") {
    return fullLabel.replace(":00 ", " ");
  }
  if (granularity === "month") {
    if (fullLabel.includes(" ")) {
      const parts = fullLabel.split(" ");
      return parts[0].substring(0, 3);
    }
    return fullLabel;
  }
  return fullLabel;
}

function formatTrendDateLabel(rawDateStr) {
  if (!rawDateStr) return "";
  if (rawDateStr.includes(" ") && rawDateStr.includes(":")) {
    const parts = rawDateStr.split(" ");
    return parts[1] || rawDateStr;
  }
  if (rawDateStr.includes("-")) {
    const parts = rawDateStr.split("-");
    if (parts.length === 3) {
      const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(dObj.getTime())) {
        return dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    }
  }
  return rawDateStr;
}

/**
 * Custom Tooltip for GA4 Overview Trend Chart
 */
function GA4TrendTooltip({ active, payload, label, metricConfig }) {
  if (active && payload && payload.length) {
    const payloadData = payload[0]?.payload;
    const prevDateLabel = payloadData?.prevDateLabel;
    const currentDateLabel = payloadData?.dateLabel || label;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl text-[12px] min-w-[200px]">
        <p className="font-bold text-slate-800 mb-1.5">{currentDateLabel}</p>
        {payload.map((item) => {
          if (item.value === undefined || item.value === null) return null;
          const isPrev = item.dataKey === "previous" || item.name === "Previous period";
          const displayName = isPrev
            ? (prevDateLabel ? `Previous period (${prevDateLabel})` : "Previous period")
            : (metricConfig?.label || item.name);

          return (
            <div key={item.dataKey || item.name} className="flex items-center justify-between gap-3 text-[11.5px] my-1">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                {displayName}
              </span>
              <span className="font-semibold text-slate-900 font-mono">
                {formatMetricValue(item.value, metricConfig?.type || "count")}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function GA4OverviewSubTab({
  overviewData,
  trafficData,
  userData,
  isLoading = false,
  error = null,
  datasetErrors = {},
  comparisonEnabled = false,
  startDate,
  endDate,
  selectedTrendMetric = "activeUsers",
  onSelectTrendMetric,
  selectedProperty,
  selectedPropertyObj,
}) {
  const [selectedMetricKeys, setSelectedMetricKeys] = useState([
    "activeUsers",
    "sessions",
    "engagementRate",
    "screenPageViews",
  ]);

  const [isGraphDropdownOpen, setIsGraphDropdownOpen] = useState(false);
  const graphDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (graphDropdownRef.current && !graphDropdownRef.current.contains(event.target)) {
        setIsGraphDropdownOpen(false);
      }
    }
    if (isGraphDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isGraphDropdownOpen]);

  const handleSelectMetric = (cardIndex, metricKey) => {
    setSelectedMetricKeys((prev) => {
      const next = [...prev];
      next[cardIndex] = metricKey;
      return next;
    });
  };

  // Normalize backend KPI response and log debug info
  const normalizedKpis = useMemo(() => {
    const map = normalizeGA4OverviewResponse(overviewData);
    if (overviewData) {
      const rawData = overviewData.data || overviewData;
      console.log("[GA4 FRONTEND DEBUG] KPI response:", rawData?.kpis);
      console.log("[GA4 FRONTEND DEBUG] Trend response:", rawData?.trend);
      console.log("[GA4 FRONTEND DEBUG] Normalized KPI:", map);
    }
    return map;
  }, [overviewData]);

  // 1. Format Executive KPIs dynamically from selected metrics
  const kpiCards = useMemo(() => {
    return selectedMetricKeys.map((key) =>
      getMetricCardData(normalizedKpis, key, comparisonEnabled)
    );
  }, [normalizedKpis, selectedMetricKeys, comparisonEnabled]);

  const activeTrendMetricKey = selectedTrendMetric || "activeUsers";
  const selectedMetricConfig = useMemo(() => {
    return GA4_KPI_METRICS.find((m) => m.key === activeTrendMetricKey) || GA4_KPI_METRICS[0];
  }, [activeTrendMetricKey]);

  // 2. Format Trend Data for Recharts
  const { chartData, hasPreviousTrendData } = useMemo(() => {
    const rawTrend = overviewData?.trend;
    if (!rawTrend) return { chartData: [], hasPreviousTrendData: false };

    let currentList = [];
    let previousList = [];
    let granularity = "day";

    if (typeof rawTrend === "object" && !Array.isArray(rawTrend)) {
      currentList = Array.isArray(rawTrend.current) ? rawTrend.current : [];
      previousList = Array.isArray(rawTrend.previous) ? rawTrend.previous : [];
      if (rawTrend.granularity && typeof rawTrend.granularity === "string") {
        granularity = rawTrend.granularity.toLowerCase();
      }
    } else if (Array.isArray(rawTrend)) {
      currentList = rawTrend;
    }

    const hasPrev = previousList.length > 0;
    const count = currentList.length;

    // Determine axis tick sampling step based on granularity and point count
    let step = 1;
    if (granularity === "hour") {
      if (count > 24) step = Math.ceil(count / 6);
      else if (count > 12) step = 6;
      else if (count > 6) step = 3;
      else step = 1;
    } else if (granularity === "week") {
      if (count > 16) step = 3;
      else if (count > 8) step = 2;
      else step = 1;
    } else if (granularity === "month") {
      if (count > 18) step = 3;
      else if (count > 12) step = 2;
      else step = 1;
    } else {
      // day
      if (count > 60) step = Math.ceil(count / 6);
      else if (count > 30) step = 6;
      else if (count > 14) step = 5;
      else if (count > 7) step = 2;
      else step = 1;
    }

    const dataPoints = currentList.map((item, idx) => {
      const rawDate = item.date || item.hour || "";
      const dateLabel = formatBucketLabel(item, granularity, rawDate);

      const currVal =
        typeof item.value === "number"
          ? item.value
          : typeof item[activeTrendMetricKey] === "number"
          ? item[activeTrendMetricKey]
          : 0;

      const prevItem = previousList[idx];
      let prevVal = null;
      let prevDateLabel = null;
      if (prevItem !== undefined && prevItem !== null) {
        prevVal =
          typeof prevItem.value === "number"
            ? prevItem.value
            : typeof prevItem[activeTrendMetricKey] === "number"
            ? prevItem[activeTrendMetricKey]
            : 0;
        const rawPrevDate = prevItem.date || prevItem.hour || "";
        prevDateLabel = formatBucketLabel(prevItem, granularity, rawPrevDate);
      }

      const axisTickLabel = formatAxisTickLabel(item, granularity, rawDate);

      return {
        dateLabel,
        rawDate,
        prevDateLabel,
        current: currVal,
        previous: prevVal,
        label: idx % Math.max(1, step) === 0 ? axisTickLabel : "",
      };
    });

    if (overviewData) {
      console.log("[GA4 FRONTEND DEBUG] Granularity:", granularity, "Chart data:", dataPoints);
    }

    return { chartData: dataPoints, hasPreviousTrendData: hasPrev };
  }, [overviewData, activeTrendMetricKey]);

  const dateRangeLabelText = startDate && endDate ? `${startDate} to ${endDate}` : "";

  return (
    <div className="space-y-6">
      {/* Overview Error Callout */}
      {datasetErrors.overview && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span>Failed to load GA4 overview metrics: {datasetErrors.overview}</span>
        </div>
      )}

      {/* Executive 4 KPI Cards Grid with Dropdown Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedMetricKeys.map((metricKey, idx) => (
          <AnalyticsKPICard
            key={`ga4-kpi-card-${idx}`}
            kpi={kpiCards[idx]}
            loading={isLoading}
            selectedMetricKey={metricKey}
            onSelectMetric={(newKey) => handleSelectMetric(idx, newKey)}
            metricOptions={GA4_KPI_METRICS}
          />
        ))}
      </div>

      {/* Main Performance Trend Chart Card */}
      <div className="dashboard-card p-6 relative min-h-[380px] bg-white border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative" ref={graphDropdownRef}>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-slate-800">Performance Trend:</h3>
              <button
                type="button"
                onClick={() => setIsGraphDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-indigo-600 hover:text-indigo-800 py-1 px-2.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <span>{selectedMetricConfig.label}</span>
                <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform ${isGraphDropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {isGraphDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-64 overflow-y-auto scrollbar-light animate-in fade-in slide-in-from-top-1 duration-100">
                {GA4_KPI_METRICS.map((option) => (
                  <button
                    key={`trend-option-${option.key}`}
                    type="button"
                    onClick={() => {
                      if (onSelectTrendMetric) onSelectTrendMetric(option.key);
                      setIsGraphDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] font-medium rounded-lg text-left transition-colors ${
                      activeTrendMetricKey === option.key
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {activeTrendMetricKey === option.key && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[12px] font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              {selectedMetricConfig.label}
            </span>
            {(comparisonEnabled || hasPreviousTrendData) && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-400" />
                Previous period
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center bg-slate-50/50 rounded-xl">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
              No trend data available for this period
            </h4>
            <p className="text-[12px] text-slate-500 max-w-xs">
              Select a different date range or property to view performance trends.
            </p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  interval={0}
                  tickFormatter={(v, i) => chartData[i]?.label || ""}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val)}
                  dx={-10}
                />
                <Tooltip content={<GA4TrendTooltip metricConfig={selectedMetricConfig} />} />
                <Line
                  type="monotone"
                  dataKey="current"
                  name={selectedMetricConfig.label}
                  stroke={selectedMetricConfig.color || "#6366F1"}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: selectedMetricConfig.color || "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                />
                {(comparisonEnabled || hasPreviousTrendData) && (
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Previous period"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4, fill: "#94A3B8", stroke: "#fff", strokeWidth: 1.5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* GA4 "Suggested for You" Horizontal Carousel Section */}
      <GA4SuggestedForYou
        isLoading={isLoading}
        dateRangeLabel={dateRangeLabelText}
        selectedProperty={selectedProperty}
        selectedPropertyObj={selectedPropertyObj}
      />
    </div>
  );
}
