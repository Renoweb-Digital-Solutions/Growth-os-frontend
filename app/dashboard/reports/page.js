"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import ReportBuilder from "@/components/dashboard/reports/ReportBuilder";
import RecentReportsTable from "@/components/dashboard/reports/RecentReportsTable";
import { useMetaReports } from "@/hooks/useMetaReports";
import { connectMeta } from "@/lib/metaApi";
import { generateContentObservations, generateCampaignObservations } from "@/lib/analyticsInsights";
import { reportTypes, granularities, datePresets, channels, previewData } from "@/app/dashboard/reports/mockReports";

export default function ReportsPage() {
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [granularity, setGranularity] = useState(granularities[2]);
  const [datePreset, setDatePreset] = useState(datePresets[0].value);
  const [selectedChannels, setSelectedChannels] = useState([...channels]);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const metaData = useMetaReports({ datePreset });

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

  // Filter mock rows based on selected channels
  const tableData = useMemo(() => {
    const remainingChannels = selectedChannels.filter(c => c !== "Meta / Instagram");
    if (remainingChannels.length > 0) {
      return previewData.filter(row => remainingChannels.includes(row.channel));
    }
    return [];
  }, [selectedChannels]);

  // Phase 4: Deterministic Analytics Intelligence for Reports
  const contentObs = generateContentObservations(metaData.content, metaData.capabilities);
  const campaignObs = generateCampaignObservations(metaData.campaigns, metaData.capabilities);
  const allObservations = [...contentObs, ...campaignObs];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate and download performance reports"
      />

      {metaData.error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center justify-between">
          <span>Failed to load Meta insights: {metaData.error}</span>
          {metaData.errorType === "auth" ? (
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isReconnecting ? "Connecting..." : "Reconnect Meta"}
            </button>
          ) : (
            <button
              onClick={metaData.retry}
              className="px-4 py-2 bg-white text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50"
            >
              Retry
            </button>
          )}
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
          metaData={metaData}
          observations={allObservations}
        />
      </div>

      {/* Preview table */}
      <div className="mb-6">
        <ReportPreviewTable data={tableData} metaData={metaData} loading={metaData.loading} observations={allObservations} />
      </div>

      {/* Recent reports */}
      <RecentReportsTable />
    </>
  );
}
