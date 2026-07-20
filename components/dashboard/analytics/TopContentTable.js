"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

// Reason: Sortable table of top performing content with platform badges and metrics.
// How: Renders a table with sortable column headers. Clicking a header toggles
//      sort direction. Platform names shown as colored pills.
// Receives: `data` (topContent array) from analytics/page.js
// Passes: nothing

const platformColors = {
  Instagram: "bg-pink-50 text-pink-700",
  LinkedIn: "bg-blue-50 text-blue-700",
  Facebook: "bg-blue-50 text-blue-600",
  YouTube: "bg-red-50 text-red-700",
  TikTok: "bg-slate-100 text-slate-800",
};

const columnDefs = [
  { key: "title", label: "Post Title", sortable: true },
  { key: "platform", label: "Platform", sortable: true },
  { key: "date", label: "Date", sortable: false },
  { key: "reach", label: "Reach", sortable: true },
  { key: "engRate", label: "Eng. Rate", sortable: false },
  { key: "clicks", label: "Clicks", sortable: true },
];

export default function TopContentTable({ data }) {
  const [sortKey, setSortKey] = useState("reach");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  return (
    <div className="dashboard-card p-6 overflow-hidden">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">
        Top Performing Content
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {columnDefs.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 ${
                    col.sortable ? "cursor-pointer select-none hover:text-slate-600" : ""
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortAsc ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                  idx % 2 === 1 ? "bg-slate-50/30" : ""
                }`}
              >
                <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] truncate">
                  {item.title}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                      platformColors[item.platform] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.platform}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[12.5px] text-slate-500">{item.date}</td>
                <td className="py-3 pr-4 text-[13px] font-semibold text-slate-800">
                  {item.reach.toLocaleString()}
                </td>
                <td className="py-3 pr-4 text-[13px] font-semibold text-indigo-600">
                  {item.engRate}
                </td>
                <td className="py-3 pr-4 text-[13px] font-semibold text-slate-800">
                  {item.clicks.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
