"use client";

import { useState, useEffect } from "react";
import AnalyticsHeader from "@/components/dashboard/analytics/AnalyticsHeader";
import AnalyticsTabsNav from "@/components/dashboard/analytics/AnalyticsTabsNav";
import OverviewTab from "@/components/dashboard/analytics/OverviewTab";
import FacebookTab from "@/components/dashboard/analytics/FacebookTab";
import InstagramTab from "@/components/dashboard/analytics/InstagramTab";
import AdsTab from "@/components/dashboard/analytics/AdsTab";
import SearchConsoleTab from "@/components/dashboard/analytics/SearchConsoleTab";
import { useMetaInsights } from "@/hooks/useMetaInsights";
import { useMetaAssetSelection } from "@/hooks/useMetaAssetSelection";
import { useGoogleSearchConsole } from "@/hooks/useGoogleSearchConsole";
import { connectMeta } from "@/lib/metaApi";
import { exportOverviewData, exportContentData, exportAdsData } from "@/lib/exportUtils";

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Consume persisted user asset selections
  const { selectedAssets } = useMetaAssetSelection();

  // Ensure Meta insights hook receives a numeric day count even when custom range is active
  const metaRangeDays = typeof selectedRange === "number" ? selectedRange : 30;

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
  } = useMetaInsights(metaRangeDays, activeTab, selectedAssets);

  // Google Search Console hook & date range synchronization
  const gsc = useGoogleSearchConsole(selectedRange);
  const { setDateRange: setGscDateRange } = gsc;

  useEffect(() => {
    setGscDateRange(selectedRange);
  }, [selectedRange, setGscDateRange]);

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
    const exportRangeLabel = typeof selectedRange === "object" && selectedRange?.isCustom
      ? `${selectedRange.startDate}_to_${selectedRange.endDate}`
      : selectedRange;

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
      exportOverviewData(kpiData, exportRangeLabel);
    } else if (activeTab === "facebook") {
      exportContentData(fbContent?.data || [], "facebook", exportRangeLabel);
    } else if (activeTab === "instagram") {
      exportContentData(igContent?.data || [], "instagram", exportRangeLabel);
    } else if (activeTab === "ads") {
      exportAdsData(campaigns || [], "Campaigns", exportRangeLabel);
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
        activeTab={activeTab}
      />

      {/* Primary Tab Navigation */}
      <AnalyticsTabsNav
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        capabilities={capabilities}
        gscConnected={gsc.isConnected}
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

      {activeTab === "gsc" && (
        <SearchConsoleTab
          isConnected={gsc.isConnected}
          properties={gsc.properties}
          selectedProperty={gsc.selectedProperty}
          setSelectedProperty={gsc.setSelectedProperty}
          analyticsData={gsc.analyticsData}
          datasetErrors={gsc.datasetErrors}
          isLoadingAnalytics={gsc.isLoadingAnalytics}
          isLoading={gsc.isLoading}
          error={gsc.error}
          refresh={gsc.refresh}
          comparisonEnabled={gsc.comparisonEnabled}
          comparisonType={gsc.comparisonType}
          granularity={gsc.granularity}
          rangeLabel={gsc.rangeLabel}
          currentLabel={gsc.currentLabel}
          comparisonLabel={gsc.comparisonLabel}
        />
      )}
    </>
  );
}

