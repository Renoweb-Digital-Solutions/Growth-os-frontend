"use client";

// Reason: This is the main dashboard HOME page that assembles all widget components
//         into a responsive grid layout. The Sidebar is now provided by layout.js.
// How: Renders the Header (greeting + filters) and all dashboard widgets in a
//      CSS Grid layout (12-column on desktop).

// Central State: No central state management yet — each component reads from mockData.js.
// Data Flow: All data flows from mockData.js → individual components. No inter-component
//            data passing in this initial build.

// Component imports from frontend/components/dashboard/
import Header from "@/components/dashboard/Header";
import ForecastChart from "@/components/dashboard/ForecastChart";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import LeadSourceCard from "@/components/dashboard/LeadSourceCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import PipelineStrip from "@/components/dashboard/PipelineStrip";
import CampaignCards from "@/components/dashboard/CampaignCards";

export default function DashboardPage() {
  return (
    <>
      {/* Header with search, greeting, filters */}
      {/* Receives: nothing. Internally reads userProfile from JWT. */}
      <Header />

      {/* Dashboard widget grid — 12-column layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Row 1: Forecast chart (8 cols) + AI Insight (4 cols) */}
        <ForecastChart />
        <AIInsightCard />

        {/* Row 2: Lead Source (4 cols) + Activity Feed (4 cols) + Performance (4 cols) */}
        <div className="col-span-full lg:col-span-4">
          <LeadSourceCard />
        </div>
        <div className="col-span-full lg:col-span-4">
          <ActivityFeed />
        </div>
        <div className="col-span-full lg:col-span-4">
          <PerformanceCard />
        </div>

        {/* Row 3: Health Score */}
        <HealthScoreCard />

        {/* Row 4: Pipeline funnel strip */}
        <PipelineStrip />

        {/* Row 5: Campaign cards */}
        <CampaignCards />
      </div>
    </>
  );
}
