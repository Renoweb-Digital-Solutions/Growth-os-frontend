"use client";

import AnalyticsKPICard from "@/components/dashboard/analytics/AnalyticsKPICard";
import TrendChart from "@/components/dashboard/analytics/TrendChart";
import ObservationsPanel from "@/components/dashboard/analytics/ObservationsPanel";
import { generatePerformanceObservations, generateContentObservations } from "@/lib/analyticsInsights";
import { Megaphone, ArrowRight } from "lucide-react";
import FacebookIcon from "@/components/icons/FacebookIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";

export default function OverviewTab({
  overview,
  social,
  fbContent,
  igContent,
  ads,
  prevOverview,
  prevSocial,
  prevAds,
  capabilities,
  loading,
  onSwitchTab,
}) {
  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  const calculateTrend = (current, previous) => {
    if (current === null || current === undefined || previous === null || previous === undefined) {
      return { absolute: null, percentage: null, trendAvailable: false };
    }
    const currNum = Number(current);
    const prevNum = Number(previous);
    if (!Number.isFinite(currNum) || !Number.isFinite(prevNum)) {
      return { absolute: null, percentage: null, trendAvailable: false };
    }
    const absolute = currNum - prevNum;
    if (prevNum === 0) {
      return { absolute, percentage: null, trendAvailable: true, message: currNum > 0 ? "Increased from 0" : "No previous activity" };
    }
    const percentage = ((currNum - prevNum) / prevNum) * 100;
    return { absolute, percentage, trendAvailable: true };
  };

  const sumInsightValues = (insightArray, metricName) => {
    if (!insightArray) return null;
    const insight = insightArray.find((i) => i.name === metricName);
    if (insight && Array.isArray(insight.values)) {
      const validValues = insight.values.filter((item) => item.value !== null && item.value !== undefined);
      if (validValues.length > 0) {
        return validValues.reduce((sum, item) => sum + Number(item.value), 0);
      }
    }
    return null;
  };

  // 1. Total Reach (Meta Ads)
  const adsAvail = capabilities?.ads?.available === true;
  const adsDisabled = capabilities?.ads?.available === false && capabilities?.ads?.code === "REQUIREMENT_DISABLED";
  const adsText = adsAvail ? "Unavailable" : (adsDisabled ? "Not enabled" : "Not Connected");

  const rawReach = overview?.data?.adsOverview?.reach;
  const reachValue = adsAvail && rawReach !== undefined && rawReach !== null ? formatSafeNumber(rawReach) : adsText;
  const prevRawReach = adsAvail && prevOverview?.data?.adsOverview?.reach !== undefined ? Number(prevOverview.data.adsOverview.reach) : null;
  const reachTrend = calculateTrend(rawReach !== undefined ? Number(rawReach) : null, prevRawReach);

  // 2. FB Page Views
  const socialAvail = capabilities?.social?.available === true;
  const fbText = socialAvail ? "Unavailable" : "Not Connected";
  const fbPageViews = socialAvail ? sumInsightValues(social?.data?.page?.insights, "page_views_total") : null;
  const fbViewsValue = socialAvail ? (fbPageViews !== null ? formatSafeNumber(fbPageViews) : fbText) : fbText;
  const prevFbPageViews = socialAvail ? sumInsightValues(prevSocial?.data?.page?.insights, "page_views_total") : null;
  const fbViewsTrend = calculateTrend(fbPageViews, prevFbPageViews);

  // 3. IG Impressions
  const igAvail = capabilities?.instagram?.available === true;
  const igText = igAvail ? "Unavailable" : "Not Connected";
  const igImpressions = igAvail ? sumInsightValues(social?.data?.instagram?.insights, "impressions") : null;
  const igImpsValue = igAvail ? (igImpressions !== null ? formatSafeNumber(igImpressions) : igText) : igText;
  const prevIgImpressions = igAvail ? sumInsightValues(prevSocial?.data?.instagram?.insights, "impressions") : null;
  const igImpsTrend = calculateTrend(igImpressions, prevIgImpressions);

  // 4. Meta Ads Clicks
  const rawClicks = ads?.data?.insights?.[0]?.clicks ?? overview?.data?.adsOverview?.clicks;
  const clicksValue = adsAvail && rawClicks !== undefined && rawClicks !== null ? formatSafeNumber(rawClicks) : adsText;
  const prevRawClicks = adsAvail && prevAds?.data?.insights?.[0]?.clicks !== undefined ? Number(prevAds.data.insights[0].clicks) : null;
  const clicksTrend = calculateTrend(rawClicks !== undefined ? Number(rawClicks) : null, prevRawClicks);

  // 5. Ads Spend
  const rawSpend = overview?.data?.adsOverview?.spend ?? ads?.data?.insights?.[0]?.spend;
  const spendValue = adsAvail && rawSpend !== undefined && rawSpend !== null ? `$${Number(rawSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : adsText;
  const prevRawSpend = adsAvail && prevOverview?.data?.adsOverview?.spend !== undefined ? Number(prevOverview.data.adsOverview.spend) : null;
  const spendTrend = calculateTrend(rawSpend !== undefined ? Number(rawSpend) : null, prevRawSpend);

  const kpis = [
    { label: "Meta Ads Reach", value: reachValue, ...reachTrend, sparkline: [], color: "#6366F1" },
    { label: "FB Page Views", value: fbViewsValue, ...fbViewsTrend, sparkline: [], color: "#EC4899" },
    { label: "IG Impressions", value: igImpsValue, ...igImpsTrend, sparkline: [], color: "#10B981" },
    { label: "Meta Ads Clicks", value: clicksValue, ...clicksTrend, sparkline: [], color: "#3B82F6" },
    { label: "Meta Ads Spend", value: spendValue, ...spendTrend, sparkline: [], color: "#F59E0B" },
  ];

  // Observations
  const perfObs = generatePerformanceObservations(overview, prevOverview, capabilities, ads);
  const contentObs = generateContentObservations(fbContent, capabilities);
  const allObservations = [...perfObs, ...contentObs];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Overall KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <AnalyticsKPICard key={idx} kpi={kpi} loading={loading} />
        ))}
      </div>

      {/* Growth Trend Chart */}
      <div>
        <TrendChart data={social?.data} adsData={ads?.data} capabilities={capabilities} loading={loading} activeTab="overview" />
      </div>

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Facebook Summary */}
        <div className="dashboard-card p-5 border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-[14px]">
                <FacebookIcon className="w-4 h-4" />
                <span>Facebook</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${socialAvail ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {socialAvail ? "Connected" : "Not Connected"}
              </span>
            </div>

            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Page Followers</span>
                <span className="font-semibold text-slate-800">
                  {overview?.data?.socialOverview?.followersCount !== undefined && overview?.data?.socialOverview?.followersCount !== null
                    ? overview.data.socialOverview.followersCount.toLocaleString()
                    : fbText}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Total Page Views</span>
                <span className="font-semibold text-slate-800">{fbViewsValue}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchTab("facebook")}
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-[12.5px] font-semibold rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            <span>View Facebook Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Instagram Summary */}
        <div className="dashboard-card p-5 border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-pink-600 font-semibold text-[14px]">
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${igAvail ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {igAvail ? "Connected" : "Not Connected"}
              </span>
            </div>

            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Profile Followers</span>
                <span className="font-semibold text-slate-800">
                  {overview?.data?.instagramOverview?.followersCount !== undefined && overview?.data?.instagramOverview?.followersCount !== null
                    ? overview.data.instagramOverview.followersCount.toLocaleString()
                    : igText}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Total Impressions</span>
                <span className="font-semibold text-slate-800">{igImpsValue}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchTab("instagram")}
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-[12.5px] font-semibold rounded-xl hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors"
          >
            <span>View Instagram Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Meta Ads Summary */}
        <div className="dashboard-card p-5 border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[14px]">
                <Megaphone className="w-4 h-4" />
                <span>Meta Ads</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${adsAvail ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {adsAvail ? "Connected" : adsDisabled ? "Not enabled" : "Not Connected"}
              </span>
            </div>

            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Total Spend</span>
                <span className="font-semibold text-slate-800">{spendValue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Total Clicks</span>
                <span className="font-semibold text-slate-800">{clicksValue}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchTab("ads")}
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-[12.5px] font-semibold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
          >
            <span>View Ads Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Intelligence Observations Panel */}
      <ObservationsPanel observations={allObservations} loading={loading} />
    </div>
  );
}
