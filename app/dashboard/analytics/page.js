"use client";

import { useState } from "react";
import AnalyticsHeader from "@/components/dashboard/analytics/AnalyticsHeader";
import AnalyticsTabsNav from "@/components/dashboard/analytics/AnalyticsTabsNav";
import OverviewTab from "@/components/dashboard/analytics/OverviewTab";
import FacebookTab from "@/components/dashboard/analytics/FacebookTab";
import InstagramTab from "@/components/dashboard/analytics/InstagramTab";
import AdsTab from "@/components/dashboard/analytics/AdsTab";
import { useMetaInsights } from "@/hooks/useMetaInsights";
import { useMetaAssetSelection } from "@/hooks/useMetaAssetSelection";
import { connectMeta } from "@/lib/metaApi";
import { exportOverviewData, exportContentData, exportAdsData } from "@/lib/exportUtils";

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Consume persisted user asset selections
  const { selectedAssets } = useMetaAssetSelection();

  // Demand-driven Meta insights hook receiving selectedAssets
  const {
    overview,
    social,
    fbContent,
    igContent,
    ads,
    campaigns,
    adSets,
    adsLevel,
    prevOverview,
    prevSocial,
    prevAds,
    capabilities,
    datasetErrors,
    loading,
    error,
    errorType,
    retry,
  } = useMetaInsights(selectedRange, activeTab, selectedAssets);

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

  const handleExport = () => {
    if (activeTab === "overview") {
      const formatSafeNumber = (val, isAvailable) => {
        if (!isAvailable) return "Not Connected";
        return (val !== null && val !== undefined && Number.isFinite(Number(val))) ? Number(val).toLocaleString() : "Unavailable";
      };
      
      const adsAvail = capabilities?.ads?.available === true;
      const socialAvail = capabilities?.social?.available === true;
      const igAvail = capabilities?.instagram?.available === true;

      const kpiData = [
        { label: "Total Reach", value: formatSafeNumber(overview?.data?.adsOverview?.reach, adsAvail) },
        { label: "Facebook Page Followers", value: formatSafeNumber(overview?.data?.socialOverview?.followersCount, socialAvail) },
        { label: "Instagram Followers", value: formatSafeNumber(overview?.data?.instagramOverview?.followersCount, igAvail) },
        { label: "Ads Spend ($)", value: adsAvail ? (overview?.data?.adsOverview?.spend !== undefined ? `$${overview.data.adsOverview.spend}` : "Unavailable") : "Not Connected" },
        { label: "Ads Clicks", value: formatSafeNumber(overview?.data?.adsOverview?.clicks, adsAvail) },
      ];
      exportOverviewData(kpiData, selectedRange);
    } else if (activeTab === "facebook") {
      exportContentData(fbContent?.data || [], "facebook", selectedRange);
    } else if (activeTab === "instagram") {
      exportContentData(igContent?.data || [], "instagram", selectedRange);
    } else if (activeTab === "ads") {
      exportAdsData(campaigns || [], "Campaigns", selectedRange);
    }
  };

  return (
    <>
      {/* Global Analytics Header */}
      <AnalyticsHeader
        selectedRange={selectedRange}
        onRangeChange={(range) => setSelectedRange(range)}
        onRefresh={retry}
        onExport={handleExport}
        isRefreshing={loading}
      />

      {/* Primary Tab Navigation */}
      <AnalyticsTabsNav
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        capabilities={capabilities}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{error}</span>
          </div>

          {errorType === "auth" ? (
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isReconnecting ? "Connecting..." : "Reconnect Meta"}
            </button>
          ) : errorType === "rate_limit" ? (
            <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-3 py-1 rounded-lg">
              Rate Limit Active
            </span>
          ) : (
            <button
              onClick={retry}
              className="px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Active Tab View Rendering */}
      {activeTab === "overview" && (
        <OverviewTab
          overview={overview}
          social={social}
          fbContent={fbContent}
          igContent={igContent}
          ads={ads}
          prevOverview={prevOverview}
          prevSocial={prevSocial}
          prevAds={prevAds}
          capabilities={capabilities}
          loading={loading}
          onSwitchTab={(tabId) => setActiveTab(tabId)}
        />
      )}

      {activeTab === "facebook" && (
        <FacebookTab
          social={social}
          fbContent={fbContent}
          capabilities={capabilities}
          loading={loading}
          error={datasetErrors?.fbContent || datasetErrors?.social}
        />
      )}

      {activeTab === "instagram" && (
        <InstagramTab
          social={social}
          igContent={igContent}
          capabilities={capabilities}
          loading={loading}
          error={datasetErrors?.igContent || datasetErrors?.social}
        />
      )}

      {activeTab === "ads" && (
        <AdsTab
          ads={ads}
          campaigns={campaigns}
          adSets={adSets}
          adsLevel={adsLevel}
          capabilities={capabilities}
          loading={loading}
          error={error}
          datasetErrors={datasetErrors}
        />
      )}
    </>
  );
}
