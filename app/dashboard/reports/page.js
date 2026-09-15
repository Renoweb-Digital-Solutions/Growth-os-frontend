"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import ReportBuilder from "@/components/dashboard/reports/ReportBuilder";
import ReportPreviewTable from "@/components/dashboard/reports/ReportPreviewTable";
import RecentReportsTable from "@/components/dashboard/reports/RecentReportsTable";
import { useMetaReports } from "@/hooks/useMetaReports";
import { reportTypes, granularities, datePresets, channels, previewData } from "@/app/dashboard/reports/mockReports";

export default function ReportsPage() {
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [granularity, setGranularity] = useState(granularities[2]);
  const [datePreset, setDatePreset] = useState(datePresets[0].value);
  const [selectedChannels, setSelectedChannels] = useState([...channels]);

  const { metaRow, loading, error } = useMetaReports({ datePreset });

  // Merge the real Meta row with the mock rows based on selected channels
  const tableData = useMemo(() => {
    let merged = [];
    if (selectedChannels.includes("Meta / Instagram") && metaRow) {
      merged.push(metaRow);
    }
    
    const remainingChannels = selectedChannels.filter(c => c !== "Meta / Instagram");
    if (remainingChannels.length > 0) {
      const mockRows = previewData.filter(row => remainingChannels.includes(row.channel));
      merged = [...merged, ...mockRows];
    }
    return merged;
  }, [metaRow, selectedChannels, previewData]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate and download performance reports"
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          Failed to load Meta insights: {error}
        </div>
      )}

      {/* Report builder */}
      <div className="mb-6">
        <ReportBuilder 
          reportType={reportType}
          setReportType={setReportType}
          granularity={granularity}
          setGranularity={setGranularity}
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          selectedChannels={selectedChannels}
          setSelectedChannels={setSelectedChannels}
          tableData={tableData}
        />
      </div>

      {/* Preview table */}
      <div className="mb-6">
        <ReportPreviewTable data={tableData} loading={loading} />
      </div>

      {/* Recent reports */}
      <RecentReportsTable />
    </>
  );
}
