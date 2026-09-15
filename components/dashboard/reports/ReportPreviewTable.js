"use client";

import { previewData } from "@/app/dashboard/reports/mockReports";

// Reason: Live preview table showing report data matching selected filters.
// How: Renders a clean table with columns: Date, Channel, Reach, Engagement,
//      Clicks, Conversions, Spend. Striped rows for readability.
// Receives: nothing (reads previewData from mockReports)
// Passes: nothing

const columns = ["Date", "Channel", "Reach", "Engagement", "Clicks", "Conversions", "Spend"];

export default function ReportPreviewTable({ data, loading }) {
  return (
    <div className="dashboard-card p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Report Preview
        </h3>
        {loading && (
          <div className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5">
            <div className="animate-spin w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full" />
            Syncing Live Data...
          </div>
        )}
      </div>

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
            {!loading && data?.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-[13px] text-slate-500">
                  No data to preview for selected channels.
                </td>
              </tr>
            )}
            
            {data?.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b transition-colors ${
                  row.isLiveData 
                    ? "bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/60" 
                    : `border-slate-50 hover:bg-slate-50/50 ${idx % 2 === 1 ? "bg-slate-50/30" : ""}`
                }`}
              >
                <td className="py-3 pr-4 text-[13px] text-slate-600">{row.date}</td>
                <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 flex items-center gap-2">
                  {row.channel}
                  {row.isLiveData && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      LIVE
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-[13px] text-slate-800">{row.reach?.toLocaleString()}</td>
                <td className="py-3 pr-4 text-[13px] text-slate-800">{row.engagement?.toLocaleString()}</td>
                <td className="py-3 pr-4 text-[13px] text-slate-800">{row.clicks?.toLocaleString()}</td>
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
