"use client";

import { previewData } from "@/app/dashboard/reports/mockReports";

// Reason: Live preview table showing report data matching selected filters.
// How: Renders a clean table with columns: Date, Channel, Reach, Engagement,
//      Clicks, Conversions, Spend. Striped rows for readability.
// Receives: nothing (reads previewData from mockReports)
// Passes: nothing

const columns = ["Date", "Channel", "Reach", "Engagement", "Clicks", "Conversions", "Spend"];

export default function ReportPreviewTable() {
  return (
    <div className="dashboard-card p-6 overflow-hidden">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">
        Report Preview
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col}
                  className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                  idx % 2 === 1 ? "bg-slate-50/30" : ""
                }`}
              >
                <td className="py-3 pr-4 text-[13px] text-slate-600">{row.date}</td>
                <td className="py-3 pr-4 text-[13px] font-medium text-slate-800">{row.channel}</td>
                <td className="py-3 pr-4 text-[13px] text-slate-800">{row.reach.toLocaleString()}</td>
                <td className="py-3 pr-4 text-[13px] text-slate-800">{row.engagement.toLocaleString()}</td>
                <td className="py-3 pr-4 text-[13px] text-slate-800">{row.clicks.toLocaleString()}</td>
                <td className="py-3 pr-4 text-[13px] font-semibold text-indigo-600">{row.conversions}</td>
                <td className="py-3 pr-4 text-[13px] text-slate-600">{row.spend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
