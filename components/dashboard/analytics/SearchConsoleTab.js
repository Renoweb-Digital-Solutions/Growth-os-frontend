"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import AnalyticsKPICard from "@/components/dashboard/analytics/AnalyticsKPICard";
import {
  Globe,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Search,
  FileText,
  MapPin,
  Smartphone,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/**
 * Custom tooltip for GSC Performance Trend Chart
 */
function CustomGscTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3.5 shadow-xl min-w-[160px]">
        <p className="text-[12px] font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="text-[11.5px] font-bold text-slate-800">
              {typeof item.value === "number" ? item.value.toLocaleString("en-US") : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Local helper functions for formatting GSC overview & table metrics safely.
 * Strictly preserves 0 as "0" and converts null/undefined/NaN to "Unavailable".
 */
function formatClicks(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  return num.toLocaleString("en-US");
}

function formatImpressions(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  return num.toLocaleString("en-US");
}

function formatCtr(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  // GSC CTR is returned as a decimal from backend API (e.g., 0.0425). Multiply by 100 for display (4.25%).
  const pct = num * 100;
  return `${pct.toFixed(2)}%`;
}

function formatPosition(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  return num.toFixed(1);
}

const DEVICE_LABEL_MAP = {
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  TABLET: "Tablet",
};

function formatDeviceLabel(val) {
  if (val === null || val === undefined || val === "") return "Unknown Device";
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (DEVICE_LABEL_MAP[upper]) return DEVICE_LABEL_MAP[upper];
  return str;
}

function formatCountryLabel(val) {
  if (val === null || val === undefined || val === "") return "Unknown Country";
  return String(val);
}

/**
 * Phase 4E — Google Search Console Analytics Tab
 * Integrates Geographic Breakdown and Device Breakdown data tables,
 * completing Phase 4 while preserving Overview KPIs, Performance Trend Chart, and Search Tables.
 */
export default function SearchConsoleTab({
  isConnected,
  properties = [],
  selectedProperty,
  setSelectedProperty,
  analyticsData,
  datasetErrors,
  isLoadingAnalytics,
  isLoading,
  error,
  refresh,
}) {
  const [visibleSeries, setVisibleSeries] = useState({
    clicks: true,
    impressions: true,
  });

  const toggleSeries = (seriesKey) => {
    setVisibleSeries((prev) => ({ ...prev, [seriesKey]: !prev[seriesKey] }));
  };

  // Extract raw trend series (Primary: overview.trend, Fallback: performance.items)
  const rawTrendData = useMemo(() => {
    if (Array.isArray(analyticsData?.overview?.trend) && analyticsData.overview.trend.length > 0) {
      return analyticsData.overview.trend;
    }
    if (Array.isArray(analyticsData?.performance?.items) && analyticsData.performance.items.length > 0) {
      return analyticsData.performance.items;
    }
    return [];
  }, [analyticsData]);

  // Pure transformation into sorted Recharts time-series data
  const chartData = useMemo(() => {
    if (!rawTrendData || rawTrendData.length === 0) return [];

    const mapped = rawTrendData
      .map((item) => {
        const rawDate = String(item.date || item.keys?.[0] || "");
        let dateLabel = rawDate;
        if (rawDate && rawDate.includes("-")) {
          const parts = rawDate.split("-");
          if (parts.length === 3) {
            const year = Number(parts[0]);
            const month = Number(parts[1]) - 1;
            const day = Number(parts[2]);
            const dateObj = new Date(year, month, day);
            if (!isNaN(dateObj.getTime())) {
              dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
          }
        }

        const clicks = Number(item.clicks);
        const impressions = Number(item.impressions);

        return {
          rawDate,
          dateLabel,
          clicks: Number.isFinite(clicks) ? Math.max(0, clicks) : 0,
          impressions: Number.isFinite(impressions) ? Math.max(0, impressions) : 0,
        };
      })
      .filter((item) => Boolean(item.rawDate));

    const sorted = mapped.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    return sorted.map((d, i) => ({
      ...d,
      label: i % Math.max(1, Math.floor(sorted.length / 5)) === 0 ? d.dateLabel : "",
    }));
  }, [rawTrendData]);

  // Transform Search Queries Dataset safely (preserving backend array order)
  const queryItems = useMemo(() => {
    const items = analyticsData?.queries?.items;
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const query = item.keys?.[0] || item.query || "Unknown Query";
      return {
        id: query,
        query,
        clicks: formatClicks(item.clicks),
        impressions: formatImpressions(item.impressions),
        ctr: formatCtr(item.ctr),
        position: formatPosition(item.position),
      };
    });
  }, [analyticsData]);

  // Transform Landing Pages Dataset safely (preserving backend array order)
  const pageItems = useMemo(() => {
    const items = analyticsData?.pages?.items;
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const pageUrl = item.keys?.[0] || item.page || "Unknown Page";
      return {
        id: pageUrl,
        pageUrl,
        clicks: formatClicks(item.clicks),
        impressions: formatImpressions(item.impressions),
        ctr: formatCtr(item.ctr),
        position: formatPosition(item.position),
      };
    });
  }, [analyticsData]);

  // Transform Country Breakdown Dataset safely (preserving backend array order)
  const countryItems = useMemo(() => {
    const items = analyticsData?.countries?.items;
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const country = formatCountryLabel(item.keys?.[0]);
      return {
        id: country,
        country,
        clicks: formatClicks(item.clicks),
        impressions: formatImpressions(item.impressions),
        ctr: formatCtr(item.ctr),
        position: formatPosition(item.position),
      };
    });
  }, [analyticsData]);

  // Transform Device Breakdown Dataset safely (preserving backend array order)
  const deviceItems = useMemo(() => {
    const items = analyticsData?.devices?.items;
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const device = formatDeviceLabel(item.keys?.[0]);
      return {
        id: device,
        device,
        clicks: formatClicks(item.clicks),
        impressions: formatImpressions(item.impressions),
        ctr: formatCtr(item.ctr),
        position: formatPosition(item.position),
      };
    });
  }, [analyticsData]);

  // 1. Loading state (Initial GSC connection status or properties check in progress)
  if (isLoading && !isConnected && properties.length === 0) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl animate-pulse">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[14px] font-semibold text-slate-700">Loading Search Console status...</p>
      </div>
    );
  }

  // 2. Global Error state
  if (error && !isConnected) {
    return (
      <div className="dashboard-card p-8 flex flex-col items-center justify-center text-center my-6 bg-red-50/40 border border-red-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1">Failed to load Search Console integration</h3>
        <p className="text-[13px] text-red-600 max-w-md mb-5">{error}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // 3. State A — Not connected
  if (isConnected === false) {
    return (
      <CapabilityState
        title="Google Search Console Disconnected"
        description="Connect Google Search Console from Settings to view Search Console analytics."
        actionText="Manage Integration Settings"
        actionHref="/dashboard/settings?tab=integrations"
      />
    );
  }

  // 4. State B — Connected but zero properties available
  if (isConnected === true && properties.length === 0) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">No Verified Properties Available</h3>
        <p className="text-[13.5px] text-slate-500 max-w-md mb-6 leading-relaxed">
          No Google Search Console properties are available for this account.
        </p>
        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <span>Check Integration Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // 5. State C — Connected + properties exist but no selected property
  if (isConnected === true && properties.length > 0 && !selectedProperty) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">Select a Search Console Property</h3>
        <p className="text-[13.5px] text-slate-500 max-w-md mb-6 leading-relaxed">
          Select a Google Search Console property to view analytics.
        </p>
        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <span>Select Property in Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Extract overview dataset and errors
  const overviewData = analyticsData?.overview;
  const hasOverviewError = !!datasetErrors?.overview;
  const hasQueriesError = !!datasetErrors?.queries;
  const hasPagesError = !!datasetErrors?.pages;
  const hasCountriesError = !!datasetErrors?.countries;
  const hasDevicesError = !!datasetErrors?.devices;

  const kpis = [
    {
      label: "Total Clicks",
      value: hasOverviewError ? "Unavailable" : formatClicks(overviewData?.clicks),
      color: "#10B981",
    },
    {
      label: "Total Impressions",
      value: hasOverviewError ? "Unavailable" : formatImpressions(overviewData?.impressions),
      color: "#3B82F6",
    },
    {
      label: "Average CTR",
      value: hasOverviewError ? "Unavailable" : formatCtr(overviewData?.ctr),
      color: "#EC4899",
    },
    {
      label: "Average Position",
      value: hasOverviewError ? "Unavailable" : formatPosition(overviewData?.position),
      color: "#8B5CF6",
    },
  ];

  const seriesList = [
    { key: "clicks", label: "Clicks", color: "#10B981" },
    { key: "impressions", label: "Impressions", color: "#3B82F6" },
  ];

  // 6. State D — Connected + selected property
  return (
    <div className="space-y-6">
      {/* Active Property Status Header Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900">Google Search Console Analytics</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Connected
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500 truncate max-w-md" title={selectedProperty}>
              Active Property: <span className="font-semibold text-slate-800">{selectedProperty}</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs self-start sm:self-auto"
        >
          <span>Change Property</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Overview Dataset Error Callout */}
      {hasOverviewError && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span>Failed to load Overview metrics: {datasetErrors.overview}</span>
        </div>
      )}

      {/* 4 Overview KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <AnalyticsKPICard
            key={kpi.label}
            kpi={kpi}
            loading={isLoadingAnalytics}
          />
        ))}
      </div>

      {/* Organic Search Performance Trend Chart Card */}
      <div className="dashboard-card p-6 relative min-h-[400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Organic Search Performance</h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">Clicks and impressions over time</p>
          </div>

          {/* Legend toggles */}
          {!isLoadingAnalytics && chartData.length > 0 && (
            <div className="flex items-center gap-4">
              {seriesList.map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  className={`flex items-center gap-1.5 text-[12px] font-semibold transition-opacity ${
                    visibleSeries[s.key] ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoadingAnalytics ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xs z-10 rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
              <span className="text-[12.5px] font-semibold text-slate-500">Loading growth trends...</span>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl max-w-md">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                {datasetErrors?.overview || datasetErrors?.performance
                  ? "Failed to load performance trend data"
                  : "No Search Console performance data is available for this period."}
              </h4>
              <p className="text-[12.5px] text-slate-500">
                {datasetErrors?.overview || datasetErrors?.performance
                  ? datasetErrors.overview || datasetErrors.performance
                  : "No trend data was returned for the selected time period."}
              </p>
            </div>
          </div>
        ) : null}

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="grad-gsc-clicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-gsc-impressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                interval={0}
                tickFormatter={(v, i) => chartData[i]?.label || ""}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                dx={-10}
              />
              <Tooltip content={<CustomGscTooltip />} />
              {visibleSeries.clicks && (
                <Area
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#grad-gsc-clicks)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                />
              )}
              {visibleSeries.impressions && (
                <Area
                  type="monotone"
                  dataKey="impressions"
                  name="Impressions"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#grad-gsc-impressions)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Search Queries & Top Landing Pages Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Queries Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Top Search Queries</h3>
            </div>
            {queryItems.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                {queryItems.length}
              </span>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasQueriesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Search Queries
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.queries}
              </p>
            </div>
          ) : queryItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console query data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No organic search keywords were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Query</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                    <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {queryItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] sm:max-w-[280px] truncate" title={item.query}>
                        {item.query}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.clicks}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.impressions}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                        {item.ctr}
                      </td>
                      <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                        {item.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Landing Pages Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Top Landing Pages</h3>
            </div>
            {pageItems.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                {pageItems.length}
              </span>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasPagesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Landing Pages
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.pages}
              </p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console landing page data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No landing page performance metrics were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Landing Page</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                    <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[220px] sm:max-w-[300px] truncate" title={item.pageUrl}>
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {item.pageUrl}
                        </a>
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.clicks}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.impressions}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                        {item.ctr}
                      </td>
                      <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                        {item.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Geographic Breakdown & Device Breakdown Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Breakdown Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Geographic Breakdown</h3>
            </div>
            {countryItems.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                {countryItems.length}
              </span>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasCountriesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Geographic Breakdown
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.countries}
              </p>
            </div>
          ) : countryItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console country data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No country-level search performance metrics were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Country</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                    <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {countryItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] truncate" title={item.country}>
                        {item.country}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.clicks}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.impressions}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                        {item.ctr}
                      </td>
                      <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                        {item.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device Breakdown Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Device Breakdown</h3>
            </div>
            {deviceItems.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                {deviceItems.length}
              </span>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasDevicesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Device Breakdown
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.devices}
              </p>
            </div>
          ) : deviceItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console device data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No device category search performance metrics were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Device</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                    <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] truncate" title={item.device}>
                        {item.device}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.clicks}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                        {item.impressions}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                        {item.ctr}
                      </td>
                      <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                        {item.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
