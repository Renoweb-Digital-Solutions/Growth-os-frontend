"use client";

import { useState, useEffect, useCallback } from "react";
import AnalyticsHeader, { AnalyticsDateSelector } from "@/components/dashboard/analytics/AnalyticsHeader";
import AnalyticsTabsNav from "@/components/dashboard/analytics/AnalyticsTabsNav";
import OverviewTab from "@/components/dashboard/analytics/OverviewTab";
import FacebookTab from "@/components/dashboard/analytics/FacebookTab";
import InstagramTab from "@/components/dashboard/analytics/InstagramTab";
import AdsTab from "@/components/dashboard/analytics/AdsTab";
import SearchConsoleTab from "@/components/dashboard/analytics/SearchConsoleTab";
import GoogleAnalyticsTab from "@/components/dashboard/analytics/ga4/GoogleAnalyticsTab";
import { useMetaInsights } from "@/hooks/useMetaInsights";
import { useMetaAssetSelection } from "@/hooks/useMetaAssetSelection";
import { useGoogleSearchConsole } from "@/hooks/useGoogleSearchConsole";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { connectMeta } from "@/lib/metaApi";
import { exportOverviewData, exportContentData, exportAdsData } from "@/lib/exportUtils";

const VALID_ANALYTICS_TABS = ["overview", "facebook", "instagram", "ads", "gsc", "ga4"];

const TAB_ALIASES = {
  "google-analytics": "ga4",
  "google_analytics": "ga4",
  "ga": "ga4",
  "search-console": "gsc",
  "search_console": "gsc",
  "searchconsole": "gsc",
  "fb": "facebook",
  "ig": "instagram",
};

/**
 * Synchronously calculates the initial active tab on page mount/instantiation.
 * Inspects URL search params first (?tab=ga4), falls back to localStorage, then "overview".
 */
function getInitialAnalyticsTab() {
  if (typeof window === "undefined") return "overview";

  try {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab) {
      const cleanUrlTab = urlTab.toLowerCase().trim();
      const resolved = TAB_ALIASES[cleanUrlTab] || cleanUrlTab;
      if (VALID_ANALYTICS_TABS.includes(resolved)) {
        return resolved;
      }
    }

    const storedTab = localStorage.getItem("growthos_active_analytics_tab");
    if (storedTab && VALID_ANALYTICS_TABS.includes(storedTab)) {
      return storedTab;
    }
  } catch (e) {
    console.error("Error reading initial analytics tab:", e);
  }

  return "overview";
}

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState("28d");
  const [activeTab, setActiveTab] = useState(getInitialAnalyticsTab);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Sync active tab state changes to URL search params and localStorage
  const handleTabChange = useCallback((newTab) => {
    if (!VALID_ANALYTICS_TABS.includes(newTab)) return;
    setActiveTab(newTab);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("growthos_active_analytics_tab", newTab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", newTab);
        window.history.replaceState(null, "", url.toString());
      } catch (e) {
        console.error("Failed to persist active analytics tab:", e);
      }
    }
  }, []);

  // Listen to browser Back/Forward navigation events
  useEffect(() => {
    const handlePopState = () => {
      const currentTab = getInitialAnalyticsTab();
      setActiveTab(currentTab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync initial URL search param if initial tab originated from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        if (!params.get("tab")) {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", activeTab);
          window.history.replaceState(null, "", url.toString());
        }
      } catch (e) {
        console.error("Failed to sync initial URL search param:", e);
      }
    }
  }, [activeTab]);

  // Consume persisted user asset selections
  const { selectedAssets } = useMetaAssetSelection();

  // Ensure Meta insights hook receives a numeric day count even when custom range or string preset is active
  const metaRangeDays = typeof selectedRange === "number"
    ? selectedRange
    : selectedRange === "28d" || selectedRange === "28D"
    ? 28
    : selectedRange === "7d" || selectedRange === "7D"
    ? 7
    : selectedRange === "90d" || selectedRange === "3m" || selectedRange === "3M"
    ? 90
    : selectedRange === "24h" || selectedRange === "24H" || selectedRange === "today" || selectedRange === "yesterday"
    ? 1
    : selectedRange === "30d" || selectedRange === "30D"
    ? 30
    : 28;

  // Demand-driven Meta insights hook receiving activeTab
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

  // Google Search Console hook receiving activeTab
  const gsc = useGoogleSearchConsole(selectedRange, activeTab);
  const { setDateRange: setGscDateRange } = gsc;

  // Google Analytics 4 hook receiving activeTab
  const ga4 = useGoogleAnalytics(selectedRange, activeTab);
  const { setDateRange: setGa4DateRange } = ga4;

  useEffect(() => {
    setGscDateRange(selectedRange);
    setGa4DateRange(selectedRange);
  }, [selectedRange, setGscDateRange, setGa4DateRange]);

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
        onRefresh={() => {
          retry();
          if (activeTab === "gsc") gsc.refresh();
          if (activeTab === "ga4") ga4.refresh();
        }}
        onExport={handleExport}
        isRefreshing={loading || (activeTab === "gsc" && gsc.isLoadingAnalytics) || (activeTab === "ga4" && ga4.isLoadingAnalytics)}
      />

      {/* Primary Tab Navigation */}
      <AnalyticsTabsNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        capabilities={capabilities}
        gscConnected={gsc.isConnected}
        ga4Connected={ga4.isConnected}
      />

      {/* Date Range Selector */}
      <AnalyticsDateSelector
        selectedRange={selectedRange}
        onRangeChange={(range) => setSelectedRange(range)}
        activeTab={activeTab}
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
          onSwitchTab={handleTabChange}
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

      {activeTab === "ga4" && <GoogleAnalyticsTab gaState={ga4} />}
    </>
  );
}

