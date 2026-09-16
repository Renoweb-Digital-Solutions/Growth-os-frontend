"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import AnalyticsKPICard from "@/components/dashboard/analytics/AnalyticsKPICard";
import TrendChart from "@/components/dashboard/analytics/TrendChart";
import ChannelDonut from "@/components/dashboard/analytics/ChannelDonut";
import AdSetTable from "@/components/dashboard/analytics/AdSetTable";
import AdTable from "@/components/dashboard/analytics/AdTable";
import ObservationsPanel from "@/components/dashboard/analytics/ObservationsPanel";
import { useMetaInsights } from "@/hooks/useMetaInsights";
import { connectMeta } from "@/lib/metaApi";
import { generatePerformanceObservations, generateContentObservations, generateCampaignObservations } from "@/lib/analyticsInsights";

import {
  channelBreakdown,
} from "@/app/dashboard/analytics/mockAnalytics";

const timeRanges = [
  { label: "Today", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(30);

  // Fetch real Meta data using unified hook
  const { overview, social, content, ads, adSets, adsLevel, adSetsMeta, adsLevelMeta, prevOverview, prevSocial, prevAds, capabilities, loading, error, errorType, retry } = useMetaInsights(selectedRange);

  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const res = await connectMeta();
      if (res?.url) window.location.href = res.url;
    } catch (err) {
      console.error(err);
      setIsReconnecting(false);
    }
  };

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

    // Safe Trend Calculation
    const calculateTrend = (current, previous) => {
      if (current === null || current === undefined || previous === null || previous === undefined) {
        return { absolute: null, percentage: null, trendAvailable: false };
      }
      const absolute = current - previous;
      if (previous === 0) {
        return { absolute, percentage: null, trendAvailable: true };
      }
      const percentage = ((current - previous) / previous) * 100;
      return { absolute, percentage, trendAvailable: true };
    };

    // Helper for summing specific metric values across periods
    const sumInsightValues = (insightArray, metricName) => {
      if (!insightArray) return null;
      const insight = insightArray.find(i => i.name === metricName);
      if (insight && Array.isArray(insight.values)) {
        const validValues = insight.values.filter(item => item.value !== null && item.value !== undefined);
        if (validValues.length > 0) {
          return validValues.reduce((sum, item) => sum + Number(item.value), 0);
        }
      }
      return null;
    };

    // 1. Total Reach (Meta Ads)
    const reachAvailable = capabilities?.ads?.available;
    const isAdsEmpty = !ads?.data?.insights || ads.data.insights.length === 0;
    const rawReach = overview?.data?.adsOverview?.reach;
    const reachValue = reachAvailable && !isAdsEmpty && rawReach !== undefined && rawReach !== null ? formatSafeNumber(rawReach) : "Unavailable";
    
    let prevRawReach = null;
    if (reachAvailable && prevOverview?.data?.adsOverview?.reach !== undefined) {
      prevRawReach = Number(prevOverview.data.adsOverview.reach);
    }
    const reachTrend = calculateTrend(rawReach !== undefined ? Number(rawReach) : null, prevRawReach);
    
    // 2. FB Page Views
    const socialAvail = capabilities?.social?.available;
    const fbPageViews = socialAvail ? sumInsightValues(social?.data?.page?.insights, "page_views_total") : null;
    const fbViewsValue = socialAvail ? (fbPageViews !== null ? formatSafeNumber(fbPageViews) : "0") : "Unavailable";
    
    const prevFbPageViews = socialAvail ? sumInsightValues(prevSocial?.data?.page?.insights, "page_views_total") : null;
    const fbViewsTrend = calculateTrend(fbPageViews, prevFbPageViews);
    
    // 3. IG Impressions
    const igAvail = capabilities?.instagram?.available;
    const igImpressions = igAvail ? sumInsightValues(social?.data?.instagram?.insights, "impressions") : null;
    const igImpsValue = igAvail ? (igImpressions !== null ? formatSafeNumber(igImpressions) : "0") : "Unavailable";
    
    const prevIgImpressions = igAvail ? sumInsightValues(prevSocial?.data?.instagram?.insights, "impressions") : null;
    const igImpsTrend = calculateTrend(igImpressions, prevIgImpressions);
    
    // 4. Website Clicks (Meta Ads)
    const clicksAvailable = capabilities?.ads?.available;
    const rawClicks = ads?.data?.insights?.[0]?.clicks;
    const clicksValue = clicksAvailable && !isAdsEmpty && rawClicks !== undefined && rawClicks !== null ? formatSafeNumber(rawClicks) : "Unavailable";
    
    let prevRawClicks = null;
    if (clicksAvailable && prevAds?.data?.insights?.[0]?.clicks !== undefined) {
      prevRawClicks = Number(prevAds.data.insights[0].clicks);
    }
    const clicksTrend = calculateTrend(rawClicks !== undefined ? Number(rawClicks) : null, prevRawClicks);
    
    // 5. Conversion Rate (Meta Ads)
    let convRateValue = "Unavailable";
    let convRateNum = null;
    if (clicksAvailable && !isAdsEmpty && ads?.data?.insights?.[0]) {
      const insight = ads.data.insights[0];
      const clicks = parseFloat(insight.clicks);
      let leads = null;
      if (Array.isArray(insight.actions)) {
        leads = 0;
        const leadAction = insight.actions.find(a => a.action_type === "lead");
        if (leadAction && Number.isFinite(parseFloat(leadAction.value))) {
          leads = parseFloat(leadAction.value);
        }
      }
      if (Number.isFinite(clicks) && clicks > 0 && leads !== null) {
        convRateNum = (leads / clicks) * 100;
        convRateValue = convRateNum.toFixed(1) + "%";
      } else if (Number.isFinite(clicks) && clicks === 0) {
        convRateNum = 0;
        convRateValue = "0.0%";
      }
    }

    let prevConvRateNum = null;
    if (clicksAvailable && prevAds?.data?.insights?.[0]) {
      const prevInsight = prevAds.data.insights[0];
      const prevClicks = parseFloat(prevInsight.clicks);
      let prevLeads = null;
      if (Array.isArray(prevInsight.actions)) {
        prevLeads = 0;
        const leadAction = prevInsight.actions.find(a => a.action_type === "lead");
        if (leadAction && Number.isFinite(parseFloat(leadAction.value))) {
          prevLeads = parseFloat(leadAction.value);
        }
      }
      if (Number.isFinite(prevClicks) && prevClicks > 0 && prevLeads !== null) {
        prevConvRateNum = (prevLeads / prevClicks) * 100;
      } else if (Number.isFinite(prevClicks) && prevClicks === 0) {
        prevConvRateNum = 0;
      }
    }
    const convRateTrend = calculateTrend(convRateNum, prevConvRateNum);

    return [
      {
        label: "Meta Ads Reach",
        value: reachValue,
        ...reachTrend,
        sparkline: [],
        color: "#6366F1",
      },
      {
        label: "FB Page Views",
        value: fbViewsValue,
        ...fbViewsTrend,
        sparkline: [],
        color: "#EC4899",
      },
      {
        label: "IG Impressions",
        value: igImpsValue,
        ...igImpsTrend,
        sparkline: [],
        color: "#10B981",
      },
      {
        label: "Meta Ads Clicks",
        value: clicksValue,
        ...clicksTrend,
        sparkline: [],
        color: "#3B82F6",
      },
      {
        label: "Ads Conv. Rate",
        value: convRateValue,
        ...convRateTrend,
        sparkline: [],
        color: "#F59E0B",
      },
    ];
  };

  const kpiData = buildKpis();

  // Phase 4: Deterministic Analytics Intelligence
  const perfObs = generatePerformanceObservations(overview, prevOverview, capabilities);
  const contentObs = generateContentObservations(content, capabilities);
  
  // Note: Campaign data is fetched elsewhere via useMetaCampaigns in CampaignCards,
  // but for the Analytics page, let's just pass what we have if available.
  // Actually, we don't have campaigns at this level (only overview, adsLevel, etc), 
  // so we'll just merge perfObs and contentObs here.
  const allObservations = [...perfObs, ...contentObs];

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
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center justify-between">
          <span>Failed to load Meta insights: {error}</span>
          {errorType === "auth" ? (
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isReconnecting ? "Connecting..." : "Reconnect Meta"}
            </button>
          ) : (
            <button
              onClick={retry}
              className="px-4 py-2 bg-white text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Platform Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {capabilities?.social?.available ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Facebook Page Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Fan Count</p>
                <p className="font-semibold text-slate-800">
                  {overview?.data?.socialOverview?.fanCount !== undefined && overview?.data?.socialOverview?.fanCount !== null
                    ? overview.data.socialOverview.fanCount.toLocaleString()
                    : "Unavailable"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Page Views</p>
                <p className="font-semibold text-slate-800">{kpiData[1].value}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-center text-slate-400 text-sm">
            Facebook Page Capability Unavailable
          </div>
        )}

        {capabilities?.instagram?.available ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Instagram Profile Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Followers</p>
                <p className="font-semibold text-slate-800">
                  {overview?.data?.instagramOverview?.followersCount !== undefined && overview?.data?.instagramOverview?.followersCount !== null
                    ? overview.data.instagramOverview.followersCount.toLocaleString()
                    : "Unavailable"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Impressions</p>
                <p className="font-semibold text-slate-800">{kpiData[2].value}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-center text-slate-400 text-sm">
            Instagram Profile Capability Unavailable
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {kpiData.map((kpi, idx) => (
          <AnalyticsKPICard key={idx} kpi={kpi} loading={loading} />
        ))}
      </div>

      <div className="mb-6 bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center justify-center text-indigo-700 text-xs font-medium">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Live Meta data
        </span>
      </div>

      {/* Intelligence Observations */}
      <ObservationsPanel observations={allObservations} loading={loading} />

      {/* Main trend chart */}
      <div className="mb-6">
        <TrendChart 
          data={social?.data} 
          capabilities={capabilities} 
          loading={loading} 
        />
      </div>

      {/* Channel donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChannelDonut data={channelBreakdown} />
      </div>

      {/* Top content table */}
      <div className="mb-6">
        <TopContentTable 
          data={content?.data} 
          meta={content?.meta}
          capabilities={capabilities} 
          loading={loading} 
        />
      </div>

      {/* Ad Set Table */}
      <div className="mb-6">
        <AdSetTable
          data={adSets}
          meta={adSetsMeta}
          capabilities={capabilities}
          loading={loading}
        />
      </div>

      {/* Individual Ad Table */}
      <div className="mb-6">
        <AdTable
          data={adsLevel}
          meta={adsLevelMeta}
          capabilities={capabilities}
          loading={loading}
        />
      </div>
    </>
  );
}
