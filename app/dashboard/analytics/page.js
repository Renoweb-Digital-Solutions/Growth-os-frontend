"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import AnalyticsKPICard from "@/components/dashboard/analytics/AnalyticsKPICard";
import TrendChart from "@/components/dashboard/analytics/TrendChart";
import ChannelDonut from "@/components/dashboard/analytics/ChannelDonut";
import WeeklyBarChart from "@/components/dashboard/analytics/WeeklyBarChart";
import TopContentTable from "@/components/dashboard/analytics/TopContentTable";
import AudienceDemographics from "@/components/dashboard/analytics/AudienceDemographics";
import FunnelChart from "@/components/dashboard/analytics/FunnelChart";

import { useMetaAnalytics } from "@/hooks/useMetaInsights";

import {
  channelBreakdown,
  audienceAge,
  audienceGender,
  funnelData,
  weeklyComparison,
} from "@/app/dashboard/analytics/mockAnalytics";

const timeRanges = [
  { label: "Today", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(30);

  // Fetch real Meta data
  const { overview, social, content, ads, capabilities, loading, error } = useMetaAnalytics(selectedRange);

  // Map to KPI Cards
  const buildKpis = () => {
    // Safe formatter
    const formatSafeNumber = (val) => {
      if (typeof val === "number" && Number.isFinite(val)) {
        return val.toLocaleString();
      }
      const parsed = parseFloat(val);
      if (Number.isFinite(parsed)) {
        return parsed.toLocaleString();
      }
      return "Unavailable";
    };

    // 1. Total Reach (Meta Ads)
    const reachAvailable = capabilities?.ads?.available;
    const isAdsEmpty = !ads?.data?.insights || ads.data.insights.length === 0;
    
    // If the Ads insight row itself is empty, treat all Ads metrics as Unavailable rather than 0
    // If the backend returned an actual row with `reach: 0`, then we will show 0.
    const rawReach = overview?.data?.adsOverview?.reach;
    const reachValue = reachAvailable && !isAdsEmpty ? formatSafeNumber(rawReach) : "Unavailable";
    
    // 2. Engagement Rate
    const engRateValue = "Unavailable";
    
    // 3. New Followers
    const newFollowersValue = "Unavailable";
    
    // 4. Website Clicks (Meta Ads)
    const clicksAvailable = capabilities?.ads?.available;
    const rawClicks = ads?.data?.insights?.[0]?.clicks;
    const clicksValue = clicksAvailable && !isAdsEmpty ? formatSafeNumber(rawClicks) : "Unavailable";
    
    // 5. Conversion Rate (Meta Ads)
    let convRateValue = "Unavailable";
    if (clicksAvailable && !isAdsEmpty && ads?.data?.insights?.[0]) {
      const insight = ads.data.insights[0];
      const clicks = parseFloat(insight.clicks);
      let leads = 0;
      if (Array.isArray(insight.actions)) {
        const leadAction = insight.actions.find(a => a.action_type === "lead");
        if (leadAction && Number.isFinite(parseFloat(leadAction.value))) {
          leads = parseFloat(leadAction.value);
        }
      }
      if (Number.isFinite(clicks) && clicks > 0) {
        convRateValue = ((leads / clicks) * 100).toFixed(1) + "%";
      } else if (Number.isFinite(clicks) && clicks === 0) {
        convRateValue = "0.0%";
      } else {
        convRateValue = "Unavailable";
      }
    }

    return [
      {
        label: "Meta Ads Reach",
        value: reachValue,
        trend: null,
        trendUp: null,
        sparkline: [],
        color: "#6366F1",
      },
      {
        label: "Engagement Rate",
        value: engRateValue,
        trend: null,
        trendUp: null,
        sparkline: [],
        color: "#EC4899",
      },
      {
        label: "New Followers",
        value: newFollowersValue,
        trend: null,
        trendUp: null,
        sparkline: [],
        color: "#10B981",
      },
      {
        label: "Meta Ads Clicks",
        value: clicksValue,
        trend: null,
        trendUp: null,
        sparkline: [],
        color: "#3B82F6",
      },
      {
        label: "Ads Conv. Rate",
        value: convRateValue,
        trend: null,
        trendUp: null,
        sparkline: [],
        color: "#F59E0B",
      },
    ];
  };

  const kpiData = buildKpis();

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your growth metrics"
      >
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
          {timeRanges.map((range) => (
            <button
              key={range.days}
              onClick={() => setSelectedRange(range.days)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                selectedRange === range.days
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-xl hover:border-slate-300 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </PageHeader>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          Failed to load Meta insights: {error}
        </div>
      )}

      {/* KPI cards row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {kpiData.map((kpi) => (
          <AnalyticsKPICard key={kpi.label} kpi={kpi} loading={loading} />
        ))}
      </div>

      {/* Main trend chart */}
      <div className="mb-6">
        <TrendChart 
          data={social?.data} 
          capabilities={capabilities} 
          loading={loading} 
        />
      </div>

      {/* Channel donut + Weekly bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChannelDonut data={channelBreakdown} />
        <WeeklyBarChart data={weeklyComparison} />
      </div>

      {/* Top content table */}
      <div className="mb-6">
        <TopContentTable 
          data={content?.data} 
          capabilities={capabilities} 
          loading={loading} 
        />
      </div>

      {/* Audience demographics + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AudienceDemographics ageData={audienceAge} genderData={audienceGender} />
        <FunnelChart data={funnelData} />
      </div>
    </>
  );
}
