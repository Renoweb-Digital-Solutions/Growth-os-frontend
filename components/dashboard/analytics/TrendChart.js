"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const seriesDefs = [
  { key: "page_views", label: "Page Views", color: "#6366F1" },
  { key: "ig_impressions", label: "IG Impressions", color: "#EC4899" },
];

function CustomTooltip({ active, payload, label }) {
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
            <span className="text-[11.5px] font-semibold text-slate-800">
              {typeof item.value === "number" && Number.isFinite(item.value) ? item.value.toLocaleString() : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function TrendChart({ data, capabilities, loading }) {
  const [visible, setVisible] = useState({ page_views: true, ig_impressions: true });

  const toggleSeries = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSocialAvail = capabilities?.social?.available;
  const isIgAvail = capabilities?.instagram?.available;
  const isUnavailable = isSocialAvail === false && isIgAvail === false;

  const chartData = useMemo(() => {
    if (!data) return [];
    
    const dateMap = {};

    // Helper to format date strings
    const formatDate = (isoString) => {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Process FB Page Insights
    if (data.page?.insights) {
      const pageViews = data.page.insights.find((i) => i.name === "page_views_total");
      if (pageViews && pageViews.values) {
        pageViews.values.forEach((v) => {
          const dateLabel = formatDate(v.endTime);
          if (!dateMap[dateLabel]) dateMap[dateLabel] = { dateLabel };
          dateMap[dateLabel].page_views = v.value;
        });
      }
    }

    // Process IG Insights
    if (data.instagram?.insights) {
      const igImpressions = data.instagram.insights.find((i) => i.name === "impressions");
      if (igImpressions && igImpressions.values) {
        igImpressions.values.forEach((v) => {
          const dateLabel = formatDate(v.endTime);
          if (!dateMap[dateLabel]) dateMap[dateLabel] = { dateLabel };
          dateMap[dateLabel].ig_impressions = v.value;
        });
      }
    }

    const merged = Object.values(dateMap);
    // Provide a sample label spacing logic based on array length
    return merged.map((d, i) => ({
      ...d,
      label: i % Math.max(1, Math.floor(merged.length / 5)) === 0 ? d.dateLabel : "",
    }));
  }, [data]);

  const activeSeries = seriesDefs.filter((s) => {
    if (s.key === "page_views") return isSocialAvail;
    if (s.key === "ig_impressions") return isIgAvail;
    return true;
  });

  return (
    <div className="dashboard-card p-6 relative min-h-[400px]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Growth Trends
        </h3>
        {/* Legend toggles */}
        {!isUnavailable && !loading && chartData.length > 0 && (
          <div className="flex items-center gap-4">
            {activeSeries.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className={`flex items-center gap-1.5 text-[12px] font-medium transition-opacity ${
                  visible[s.key] ? "opacity-100" : "opacity-40"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : isUnavailable ? (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
              Meta Social Disconnected or Unavailable
            </h4>
            <p className="text-[12.5px] text-slate-500">
              Connect a Facebook Page or Instagram Account to view growth trends.
            </p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
              No Meta social data available
            </h4>
            <p className="text-[12.5px] text-slate-500">
              No data was returned for the selected time period.
            </p>
          </div>
        </div>
      ) : null}

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {activeSeries.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
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
            <Tooltip content={<CustomTooltip />} />
            {activeSeries.map(
              (s) =>
                visible[s.key] && (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={`url(#grad-${s.key})`}
                    dot={false}
                    activeDot={{ r: 4, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
                  />
                )
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
