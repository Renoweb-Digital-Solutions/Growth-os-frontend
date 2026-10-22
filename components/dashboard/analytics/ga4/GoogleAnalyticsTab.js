"use client";

import React, { useState } from "react";
import GA4PropertySelector from "./GA4PropertySelector";
import GA4SubNav from "./GA4SubNav";
import GA4OverviewSubTab from "./GA4OverviewSubTab";
import GA4AcquisitionSubTab from "./GA4AcquisitionSubTab";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import { AlertCircle, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function GoogleAnalyticsTab({ gaState }) {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const {
    status,
    isConnected,
    hasAnalyticsScope,
    isLoadingStatus,
    statusError,

    properties,
    selectedProperty,
    selectedPropertyObj,
    selectProperty,
    isLoadingProperties,
    isSwitchingProperty,

    startDate,
    endDate,
    comparisonEnabled,
    comparisonType,

    selectedTrendMetric,
    setSelectedTrendMetric,

    analyticsData,
    datasetErrors,
    isLoadingAnalytics,
    analyticsError,

    isLoading,
    error,
    refresh,
  } = gaState;

  // 1. Loading state (Initial connection/status check in progress)
  if (isLoadingStatus) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl animate-pulse">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[14px] font-semibold text-slate-700">Loading Google Analytics 4 status...</p>
      </div>
    );
  }

  // 2. Global Error / Disconnected state
  if (!isConnected || !hasAnalyticsScope) {
    return (
      <CapabilityState
        title="Google Analytics 4 Disconnected"
        description="Connect Google Analytics from Settings to view site traffic, sessions, and user acquisition insights."
        actionText="Manage Integration Settings"
        actionHref="/dashboard/settings?tab=integrations"
      />
    );
  }

  // 3. Connected but Zero Properties available
  if (properties.length === 0 && !isLoadingProperties) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">No Accessible GA4 Properties Found</h3>
        <p className="text-[13.5px] text-slate-500 max-w-md mb-6 leading-relaxed">
          No Google Analytics 4 properties were discovered for this connected Google account.
        </p>
        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <span>Check Integration Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Selector Status Bar */}
      <GA4PropertySelector
        properties={properties}
        selectedProperty={selectedProperty}
        selectedPropertyObj={selectedPropertyObj}
        onSelectProperty={selectProperty}
        isSwitching={isSwitchingProperty}
        isConnected={isConnected}
        hasAnalyticsScope={hasAnalyticsScope}
      />

      {/* Unified Main Analytics Dashboard */}
      <GA4OverviewSubTab
        overviewData={analyticsData?.overview}
        trafficData={analyticsData?.trafficAcquisition}
        userData={analyticsData?.userAcquisition}
        isLoading={isLoadingAnalytics}
        error={analyticsError}
        datasetErrors={datasetErrors}
        comparisonEnabled={comparisonEnabled}
        startDate={startDate}
        endDate={endDate}
        selectedTrendMetric={selectedTrendMetric}
        onSelectTrendMetric={setSelectedTrendMetric}
        selectedProperty={selectedProperty}
        selectedPropertyObj={selectedPropertyObj}
      />
    </div>
  );
}
