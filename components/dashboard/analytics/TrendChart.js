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
  { key: "fb_engagements", label: "FB Engagements", color: "#6366F1", platform: "facebook" },
  { key: "fb_follows", label: "FB Daily Follows", color: "#3B82F6", platform: "facebook" },
  { key: "ig_reach", label: "IG Reach", color: "#EC4899", platform: "instagram" },
  { key: "ads_spend", label: "Ads Spend ($)", color: "#F59E0B", platform: "ads" },
  { key: "ads_clicks", label: "Ads Clicks", color: "#10B981", platform: "ads" },
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

export default function TrendChart({ data, adsData, capabilities, loading, activeTab = "overview" }) {
  const [visible, setVisible] = useState({
    fb_engagements: true,
    fb_follows: true,
    ig_reach: true,
    ads_spend: true,
    ads_clicks: true,
  });

  const toggleSeries = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSocialAvail = capabilities?.social?.available === true;
  const isIgAvail = capabilities?.instagram?.available === true;
  const isAdsAvail = capabilities?.ads?.available === true;
  const isAdsDisabled = capabilities?.ads?.available === false && capabilities?.ads?.code === "REQUIREMENT_DISABLED";

  // Tab-specific availability check
  const isTabUnavailable =
    activeTab === "facebook"
      ? !isSocialAvail
      : activeTab === "instagram"
      ? !isIgAvail
      : activeTab === "ads"
      ? !isAdsAvail
      : !isSocialAvail && !isIgAvail && !isAdsAvail;

  // Allowed platforms for current tab
  const allowedPlatforms =
    activeTab === "facebook"
      ? ["facebook"]
      : activeTab === "instagram"
      ? ["instagram"]
      : activeTab === "ads"
      ? ["ads"]
      : ["facebook", "instagram", "ads"];

  const chartData = useMemo(() => {
    const dateMap = {};

    const formatDate = (isoString) => {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Extract FB metrics (only if facebook platform is allowed & available)
    if (allowedPlatforms.includes("facebook") && isSocialAvail && data?.page?.insights) {
      const fbEngagements = data.page.insights.find((i) => i.name === "page_post_engagements");
      if (fbEngagements && Array.isArray(fbEngagements.values)) {
        fbEngagements.values.forEach((v) => {
          if (v.endTime && v.value !== null && v.value !== undefined) {
            const dateLabel = formatDate(v.endTime);
            if (!dateMap[dateLabel]) dateMap[dateLabel] = { dateLabel, dateMs: new Date(v.endTime).getTime() };
            dateMap[dateLabel].fb_engagements = v.value;
          }
        });
      }

      const fbFollows = data.page.insights.find((i) => i.name === "page_daily_follows");
      if (fbFollows && Array.isArray(fbFollows.values)) {
        fbFollows.values.forEach((v) => {
          if (v.endTime && v.value !== null && v.value !== undefined) {
            const dateLabel = formatDate(v.endTime);
            if (!dateMap[dateLabel]) dateMap[dateLabel] = { dateLabel, dateMs: new Date(v.endTime).getTime() };
            dateMap[dateLabel].fb_follows = v.value;
          }
        });
      }
    }

    // Extract IG Reach (only if instagram platform is allowed & available)
    if (allowedPlatforms.includes("instagram") && isIgAvail && data?.instagram?.insights) {
      const igReach = data.instagram.insights.find((i) => i.name === "reach");
      if (igReach && Array.isArray(igReach.values)) {
        igReach.values.forEach((v) => {
          if (v.endTime && v.value !== null && v.value !== undefined) {
            const dateLabel = formatDate(v.endTime);
            if (!dateMap[dateLabel]) dateMap[dateLabel] = { dateLabel, dateMs: new Date(v.endTime).getTime() };
            dateMap[dateLabel].ig_reach = v.value;
          }
        });
      }
    }

    // Extract Ads metrics (only if ads platform is allowed & available)
    if (allowedPlatforms.includes("ads") && isAdsAvail && adsData?.insights && Array.isArray(adsData.insights)) {
      adsData.insights.forEach((item) => {
        const endTime = item.date_stop || item.date_start;
        if (endTime) {
          const dateLabel = formatDate(endTime);
          if (!dateMap[dateLabel]) dateMap[dateLabel] = { dateLabel, dateMs: new Date(endTime).getTime() };
          if (item.spend !== undefined && item.spend !== null) dateMap[dateLabel].ads_spend = Number(item.spend);
          if (item.clicks !== undefined && item.clicks !== null) dateMap[dateLabel].ads_clicks = Number(item.clicks);
        }
      });
    }

    const merged = Object.values(dateMap).sort((a, b) => (a.dateMs || 0) - (b.dateMs || 0));
    return merged.map((d, i) => ({
      ...d,
      label: i % Math.max(1, Math.floor(merged.length / 5)) === 0 ? d.dateLabel : "",
    }));
  }, [data, adsData, activeTab, isSocialAvail, isIgAvail, isAdsAvail]);

  // Series candidates allowed for this tab & capability
  const candidateSeries = seriesDefs.filter((s) => {
    if (!allowedPlatforms.includes(s.platform)) return false;
    if (s.platform === "facebook") return isSocialAvail;
    if (s.platform === "instagram") return isIgAvail;
    if (s.platform === "ads") return isAdsAvail;
    return true;
  });

  // Only show series in legend/chart if they actually have plottable numeric data in chartData
  const activeSeries = candidateSeries.filter((s) =>
    chartData.some((d) => d[s.key] !== undefined && d[s.key] !== null)
  );

  // Tab-specific empty state title & description
  const getEmptyStateText = () => {
    if (activeTab === "facebook") {
      return {
        title: isTabUnavailable ? "Facebook Page Disconnected or Unavailable" : "No Facebook trend data available",
        desc: isTabUnavailable ? "Connect a Facebook Page to view trends." : "No engagement or follower data was returned for the selected period.",
      };
    }
    if (activeTab === "instagram") {
      return {
        title: isTabUnavailable ? "Instagram Account Disconnected or Unavailable" : "No Instagram reach trend data available",
        desc: isTabUnavailable ? "Connect an Instagram Professional account to view trends." : "No reach data was returned for the selected period.",
      };
    }
    if (activeTab === "ads") {
      return {
        title: isAdsDisabled ? "Meta Ads Not Enabled" : isTabUnavailable ? "Meta Ads Disconnected" : "No Ads trend data available",
        desc: isAdsDisabled ? "Meta Ads capability is currently disabled." : "No ad spend or click data was returned for the selected period.",
      };
    }
    return {
      title: isTabUnavailable ? "Meta Social & Ads Disconnected" : "No social or ads trend data available",
      desc: "No trend data was returned for the selected time period.",
    };
  };

  const emptyState = getEmptyStateText();

  return (
    <div className="dashboard-card p-6 relative min-h-[400px]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Growth Trends
        </h3>
        {/* Legend toggles */}
        {!isTabUnavailable && !loading && activeSeries.length > 0 && (
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
      ) : isTabUnavailable || activeSeries.length === 0 || chartData.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
              {emptyState.title}
            </h4>
            <p className="text-[12.5px] text-slate-500 max-w-sm">
              {emptyState.desc}
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
