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

import {
  dailyMetrics,
  kpiData,
  channelBreakdown,
  topContent,
  audienceAge,
  audienceGender,
  funnelData,
  weeklyComparison,
} from "@/app/dashboard/analytics/mockAnalytics";

// Reason: Analytics page — data-dense dashboard of growth metrics, charts, and tables.
// How: Assembles KPI cards, trend chart, channel donut, bar chart, content table,
//      audience demographics, and funnel chart in a responsive grid.
// Data Flow: mockAnalytics.js → this page → individual chart/table components.

const timeRanges = [
  { label: "Today", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(30);

  // Filter daily metrics based on selected time range
  const filteredMetrics = dailyMetrics.slice(-selectedRange);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your growth metrics"
      >
        {/* Time range selector */}
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

      {/* KPI cards row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {kpiData.map((kpi) => (
          <AnalyticsKPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Main trend chart */}
      <div className="mb-6">
        <TrendChart data={filteredMetrics} />
      </div>

      {/* Channel donut + Weekly bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChannelDonut data={channelBreakdown} />
        <WeeklyBarChart data={weeklyComparison} />
      </div>

      {/* Top content table */}
      <div className="mb-6">
        <TopContentTable data={topContent} />
      </div>

      {/* Audience demographics + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AudienceDemographics ageData={audienceAge} genderData={audienceGender} />
        <FunnelChart data={funnelData} />
      </div>
    </>
  );
}
