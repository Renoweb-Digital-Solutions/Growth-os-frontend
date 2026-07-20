"use client";

import { Download } from "lucide-react";
import { recentReports } from "@/app/dashboard/reports/mockReports";

// Reason: Table of previously generated reports with download actions.
// How: Renders each recent report with name, date range, type, generated date,
//      file size, status pill (Ready/Processing), and download icon button.
// Receives: nothing (reads recentReports from mockReports)
// Passes: nothing

export default function RecentReportsTable() {
  return (
    <div className="dashboard-card p-6 overflow-hidden">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">
        Recent Reports
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Report Name
              </th>
              <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Date Range
              </th>
              <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Type
              </th>
              <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Generated
              </th>
              <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Size
              </th>
              <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="pb-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {recentReports.map((report, idx) => (
              <tr
                key={report.id}
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                  idx % 2 === 1 ? "bg-slate-50/30" : ""
                }`}
              >
                <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-800 max-w-[220px] truncate">
                  {report.name}
                </td>
                <td className="py-3.5 pr-4 text-[12.5px] text-slate-500">
                  {report.dateRange}
                </td>
                <td className="py-3.5 pr-4">
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600">
                    {report.type}
                  </span>
                </td>
                <td className="py-3.5 pr-4 text-[12.5px] text-slate-500">
                  {report.generatedDate}
                </td>
                <td className="py-3.5 pr-4 text-[12.5px] text-slate-500">
                  {report.fileSize}
                </td>
                <td className="py-3.5 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                      report.status === "Ready"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="py-3.5">
                  <button
                    disabled={report.status !== "Ready"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      report.status === "Ready"
                        ? "hover:bg-indigo-50 text-indigo-600"
                        : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
