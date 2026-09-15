"use client";

import { FileDown, FileText } from "lucide-react";
import { reportTypes, granularities, datePresets, channels } from "@/app/dashboard/reports/mockReports";

export default function ReportBuilder({
  reportType,
  setReportType,
  granularity,
  setGranularity,
  datePreset,
  setDatePreset,
  selectedChannels,
  setSelectedChannels,
  tableData
}) {
  const handleGenerateCSV = () => {
    const headers = ["Date", "Channel", "Reach", "Engagement", "Clicks", "Conversions", "Spend"];
    
    // tableData is already filtered by selectedChannels from the parent component
    const rows = tableData.map((row) => [
      row.date,
      row.channel,
      row.reach,
      row.engagement,
      row.clicks,
      row.conversions,
      row.spend,
    ]);

    const csvContent = [headers, ...rows]
      .map((rowArr) => rowArr.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `growthOS_${reportType.toLowerCase().replace(/\s+/g, "_")}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleChannel = (ch) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-5">
        Report Builder
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Report Type */}
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          >
            {reportTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Granularity */}
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Granularity
          </label>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          >
            {granularities.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Date Range
          </label>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          >
            {datePresets.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Channels
          </label>
          <div className="flex flex-wrap gap-1.5">
            {channels.map((ch) => (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`px-2.5 py-1 text-[10.5px] font-medium rounded-lg border transition-colors ${
                  selectedChannels.includes(ch)
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {ch.split(" / ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerateCSV}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
        >
          <FileDown className="w-4 h-4" />
          Generate CSV
        </button>
        <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-xl hover:border-slate-300 transition-colors">
          <FileText className="w-4 h-4" />
          Generate PDF
        </button>
      </div>
    </div>
  );
}
