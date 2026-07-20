"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import ReportBuilder from "@/components/dashboard/reports/ReportBuilder";
import ReportPreviewTable from "@/components/dashboard/reports/ReportPreviewTable";
import RecentReportsTable from "@/components/dashboard/reports/RecentReportsTable";

// Reason: Reports page — generate and download performance reports.
// How: Assembles ReportBuilder (filters + CSV/PDF generation), ReportPreviewTable
//      (live data preview), and RecentReportsTable (past report history).
// Data Flow: mockReports.js → ReportBuilder/ReportPreviewTable/RecentReportsTable

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate and download performance reports"
      />

      {/* Report builder */}
      <div className="mb-6">
        <ReportBuilder />
      </div>

      {/* Preview table */}
      <div className="mb-6">
        <ReportPreviewTable />
      </div>

      {/* Recent reports */}
      <RecentReportsTable />
    </>
  );
}
