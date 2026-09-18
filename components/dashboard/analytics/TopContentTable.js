"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const platformColors = {
  instagram: "bg-pink-50 text-pink-700",
  facebook: "bg-blue-50 text-blue-600",
};

const columnDefs = [
  { key: "title", label: "Post Content", sortable: true },
  { key: "platform", label: "Platform", sortable: true },
  { key: "date", label: "Date", sortable: false },
  { key: "likes", label: "Likes", sortable: true },
  { key: "comments", label: "Comments", sortable: true },
  { key: "engagement", label: "Engagement", sortable: true },
];

export default function TopContentTable({ data, meta, capabilities, loading, error }) {
  const [sortKey, setSortKey] = useState("engagement");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const isUnavailable = capabilities?.social?.available === false && capabilities?.instagram?.available === false;

  const mappedData = (data || []).map((item) => {
    const normalizeNumber = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return {
      id: item.contentId,
      title: item.caption || item.message || "No content",
      platform: item.platform,
      date: new Date(item.createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      likes: normalizeNumber(item.metrics?.likeCount),
      comments: normalizeNumber(item.metrics?.commentCount),
      engagement: normalizeNumber(item.metrics?.igMediaInteractions ?? item.metrics?.fbPostInteractions),
      url: item.permalinkUrl,
    };
  });

  const sorted = [...mappedData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const isTruncated = meta?.paginationTruncated === true || meta?.complete === false;

  return (
    <div className="dashboard-card p-6 overflow-hidden relative min-h-[300px]">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">
        Top Performing Content
      </h3>

      {isTruncated && !error && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] rounded-lg">
          Showing partial results. The selected date range contains more data than could be retrieved.
        </div>
      )}

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-red-700 mb-1">
            Failed to load Content Data
          </h4>
          <p className="text-[12.5px] text-red-500">
            {error}
          </p>
        </div>
      ) : isUnavailable ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
            No Meta Content Data Available
          </h4>
          <p className="text-[12.5px] text-slate-500">
            Connect a Facebook Page or Instagram Account to view content insights.
          </p>
        </div>
      ) : mappedData.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
            No recent content found
          </h4>
          <p className="text-[12.5px] text-slate-500">
            No posts were published in the selected time range.
          </p>
        </div>
      ) : (
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
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                      {item.title}
                    </a>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold capitalize ${
                        platformColors[item.platform.toLowerCase()] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.platform}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[12.5px] text-slate-500">{item.date}</td>
                  <td className="py-3 pr-4 text-[13px] font-semibold text-slate-800">
                    {item.likes !== null ? item.likes.toLocaleString() : "Unavailable"}
                  </td>
                  <td className="py-3 pr-4 text-[13px] font-semibold text-slate-800">
                    {item.comments !== null ? item.comments.toLocaleString() : "Unavailable"}
                  </td>
                  <td className="py-3 pr-4 text-[13px] font-semibold text-indigo-600">
                    {item.engagement !== null ? item.engagement.toLocaleString() : "Unavailable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
