"use client";

import React from "react";
import GA4InsightsCarousel from "./GA4InsightsCarousel";

/**
 * Initial 8 representative placeholder cards based on official GA4 "Suggested for you" widgets.
 */
const SUGGESTED_CARDS = [
  {
    id: "sugg-1",
    vizType: "realtime",
    title: "Active users in last 30 minutes",
    footerRight: "View Realtime",
  },
  {
    id: "sugg-2",
    vizType: "trafficAcquisition",
    title: "Sessions by Session primary channel group",
    defaultRange: "28d",
    footerRight: "View traffic acquisition",
  },
  {
    id: "sugg-3",
    vizType: "country",
    title: "Active users by Country",
    defaultRange: "28d",
    footerRight: "USERS",
  },
  {
    id: "sugg-4",
    vizType: "sourceMedium",
    title: "Active users by First user source / medium",
    defaultRange: "28d",
    footerRight: "USERS",
  },
  {
    id: "sugg-5",
    vizType: "pageTitle",
    title: "Views by Page title and screen class",
    defaultRange: "28d",
    footerRight: "VIEWS",
  },
  {
    id: "sugg-6",
    vizType: "city",
    title: "Active users by Town/City",
    defaultRange: "28d",
    footerRight: "USERS",
  },
  {
    id: "sugg-7",
    vizType: "platform",
    title: "Key events by Platform",
    defaultRange: "28d",
    footerRight: "KEY EVENTS",
  },
  {
    id: "sugg-8",
    vizType: "firstUserChannel",
    title: "New users by First user primary channel group (Default channel group)",
    defaultRange: "28d",
    footerRight: "VIEW USER ACQUISITION",
  },
];

export default function GA4SuggestedForYou({
  isLoading = false,
  dateRangeLabel = "",
  selectedProperty,
  selectedPropertyObj,
}) {
  return (
    <div className="pt-4 space-y-4">
      {/* Section Heading with GA4 Dashed Divider */}
      <div className="border-b border-dashed border-slate-300/80 pb-2.5">
        <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">
          Suggested for you
        </h3>
      </div>

      {/* Horizontal Carousel */}
      {isLoading ? (
        <div className="h-[390px] flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <GA4InsightsCarousel
          cards={SUGGESTED_CARDS}
          selectedProperty={selectedProperty}
          selectedPropertyObj={selectedPropertyObj}
        />
      )}
    </div>
  );
}
