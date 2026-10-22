"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import GA4CardDateSelector from "./GA4CardDateSelector";
import GA4RankedBarCard from "./GA4RankedBarCard";
import GA4ComparisonBarCard from "./GA4ComparisonBarCard";
import GA4DonutCard from "./GA4DonutCard";
import GA4RankedTableCard from "./GA4RankedTableCard";
import GA4RealtimeCard from "./GA4RealtimeCard";
import GA4TrafficAcquisitionCard from "./GA4TrafficAcquisitionCard";
import GA4CountryCard from "./GA4CountryCard";
import GA4SimpleFixedCard from "./GA4SimpleFixedCard";
import GA4KeyEventsPlatformCard from "./GA4KeyEventsPlatformCard";
import GA4NewUsersChannelCard from "./GA4NewUsersChannelCard";

import { getGA4ReportUrl } from "@/lib/googleAnalyticsApi";

/**
 * GA4InsightCard is the master card wrapper.
 * Manages its own independent local date-range state, independent loading state,
 * and renders the matching visualization component.
 */
export default function GA4InsightCard({ card, selectedProperty, selectedPropertyObj }) {
  const {
    id,
    vizType = "rankedBar",
    title,
    metricValue,
    metricUnit,
    subtitle,
    defaultRange = "28d",
    footerRight = "View details",
    rows = [],
    segments = [],
    sparklineData = [],
    realtimeStats = [],
    showComparison,
    legend,
    hasError = false,
  } = card || {};

  // Independent local date range state per card
  const [selectedRange, setSelectedRange] = useState(defaultRange);

  // Independent local loading state per card
  const [isLoading, setIsLoading] = useState(false);

  // Simulate local data refresh when card's local date range is changed
  const handleRangeChange = (newRange) => {
    if (newRange === selectedRange) return;
    setSelectedRange(newRange);
    setIsLoading(true);

    // Brief simulated fetch delay for only this card
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const propTarget = selectedPropertyObj || selectedProperty;

  if (card?.vizType === "realtime") {
    return <GA4RealtimeCard card={card} selectedProperty={selectedProperty} selectedPropertyObj={selectedPropertyObj} />;
  }

  if (card?.vizType === "trafficAcquisition") {
    return <GA4TrafficAcquisitionCard card={card} selectedProperty={selectedProperty} selectedPropertyObj={selectedPropertyObj} />;
  }

  if (card?.vizType === "country" || card?.id === "sugg-3") {
    return <GA4CountryCard card={card} selectedProperty={selectedProperty} selectedPropertyObj={selectedPropertyObj} />;
  }

  if (card?.vizType === "sourceMedium" || card?.id === "sugg-4") {
    return (
      <GA4SimpleFixedCard
        cardKey="active-users-by-source-medium"
        defaultTitle="Active users by First user source / medium"
        unitLabel="USERS"
        footerCta="USERS"
        card={card}
        selectedProperty={selectedProperty}
        selectedPropertyObj={selectedPropertyObj}
      />
    );
  }

  if (card?.vizType === "pageTitle" || card?.id === "sugg-5") {
    return (
      <GA4SimpleFixedCard
        cardKey="views-by-page-title"
        defaultTitle="Views by Page title and screen class"
        unitLabel="VIEWS"
        footerCta="VIEWS"
        card={card}
        selectedProperty={selectedProperty}
        selectedPropertyObj={selectedPropertyObj}
      />
    );
  }

  if (card?.vizType === "city" || card?.id === "sugg-6") {
    return (
      <GA4SimpleFixedCard
        cardKey="active-users-by-city"
        defaultTitle="Active users by Town/City"
        unitLabel="USERS"
        footerCta="USERS"
        card={card}
        selectedProperty={selectedProperty}
        selectedPropertyObj={selectedPropertyObj}
      />
    );
  }

  if (card?.vizType === "platform" || card?.id === "sugg-7") {
    return <GA4KeyEventsPlatformCard card={card} selectedProperty={selectedProperty} selectedPropertyObj={selectedPropertyObj} />;
  }

  if (card?.vizType === "firstUserChannel" || card?.id === "sugg-8") {
    return <GA4NewUsersChannelCard card={card} selectedProperty={selectedProperty} selectedPropertyObj={selectedPropertyObj} />;
  }

  const reportUrl = getGA4ReportUrl(vizType || id, propTarget, selectedRange);

  return (
    <div className="w-[320px] sm:w-[340px] shrink-0 h-[400px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow select-none">
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-[13.5px] font-bold text-slate-800 leading-snug line-clamp-2" title={title}>
            {title}
          </h4>
        </div>

        {/* Primary Metric Number & Unit */}
        {metricValue && (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[22px] font-extrabold text-slate-900 font-mono tracking-tight">
              {metricValue}
            </span>
            {metricUnit && (
              <span className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wider">
                {metricUnit}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] font-medium text-slate-400">
                {subtitle}
              </span>
            )}
          </div>
        )}

        {/* Card Visualization Area with Independent Loading/Error States */}
        <div className="mt-1">
          {isLoading ? (
            <div className="h-44 flex items-center justify-center bg-slate-50/60 rounded-xl border border-slate-100">
              <div className="animate-spin w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : hasError ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-red-50/50 rounded-xl border border-red-100 text-red-600">
              <AlertCircle className="w-5 h-5 mb-1 text-red-500" />
              <p className="text-[12px] font-medium">Failed to load card data</p>
            </div>
          ) : vizType === "realtime" ? (
            <GA4RealtimeCard sparklineData={sparklineData} realtimeStats={realtimeStats} selectedProperty={selectedProperty} />
          ) : vizType === "rankedBar" ? (
            <GA4RankedBarCard rows={rows} />
          ) : vizType === "comparisonBar" ? (
            <GA4ComparisonBarCard rows={rows} showComparison={showComparison} legend={legend} />
          ) : vizType === "donut" ? (
            <GA4DonutCard segments={segments} />
          ) : vizType === "table" ? (
            <GA4RankedTableCard rows={rows} />
          ) : (
            <GA4RankedBarCard rows={rows} />
          )}
        </div>
      </div>

      {/* Card Footer Area with Independent Date Selector */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {/* Independent Card Date Selector */}
        <GA4CardDateSelector
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />

        {/* Card Action Link */}
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View insights for ${title || 'this card'} in Google Analytics`}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer text-[11px]"
        >
          <span>View insights</span>
          <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
