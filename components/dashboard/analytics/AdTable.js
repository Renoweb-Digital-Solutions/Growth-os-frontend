"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const columnDefs = [
  { key: "name", label: "Ad Name", sortable: true },
  { key: "spend", label: "Spend", sortable: true },
  { key: "impressions", label: "Impressions", sortable: true },
  { key: "reach", label: "Reach", sortable: true },
  { key: "clicks", label: "Clicks", sortable: true },
  { key: "ctr", label: "CTR", sortable: true },
  { key: "cpc", label: "CPC", sortable: true },
  { key: "cpm", label: "CPM", sortable: true },
  { key: "conversions", label: "Leads", sortable: true },
];

export default function AdTable({ data, meta, capabilities, loading }) {
  const [sortKey, setSortKey] = useState("spend");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const isUnavailable = capabilities?.ads?.available === false;

  const mappedData = (data || []).map((item) => {
    let leads = 0;
    if (Array.isArray(item.actions)) {
      const leadAction = item.actions.find(a => a.action_type === "lead");
      if (leadAction && Number.isFinite(parseFloat(leadAction.value))) {
        leads = parseFloat(leadAction.value);
      }
    }

    const normalizeNumber = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return {
      id: item.ad_id || item.name,
      name: item.ad_name || item.name || "Unknown Ad",
      spend: normalizeNumber(item.spend),
      impressions: normalizeNumber(item.impressions),
      reach: normalizeNumber(item.reach),
      clicks: normalizeNumber(item.clicks),
      ctr: normalizeNumber(item.ctr),
      cpc: normalizeNumber(item.cpc),
      cpm: normalizeNumber(item.cpm),
      conversions: leads === 0 && !item.actions ? null : leads,
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

  const formatCurrency = (val) => val === null ? "Unavailable" : `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (val) => val === null ? "Unavailable" : Number(val).toLocaleString();
  const formatPercent = (val) => val === null ? "Unavailable" : `${Number(val).toFixed(2)}%`;

  const isTruncated = meta?.paginationTruncated === true || meta?.complete === false;

  return (
    <div className="dashboard-card p-6 overflow-hidden relative min-h-[300px]">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">
        Ad Performance
      </h3>

      {isTruncated && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] rounded-lg">
          Showing partial results. The selected date range contains more data than could be retrieved.
        </div>
      )}

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : isUnavailable ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
            Meta Ads Disconnected
          </h4>
          <p className="text-[12.5px] text-slate-500">
            Connect a Meta Ad Account to view Ad insights.
          </p>
        </div>
      ) : mappedData.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
            No Ad Data Available
          </h4>
          <p className="text-[12.5px] text-slate-500">
            No Ads were active in the selected time range.
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
                    {item.name}
                  </td>
                  <td className="py-3 pr-4 text-[13px] font-semibold text-slate-800">{formatCurrency(item.spend)}</td>
                  <td className="py-3 pr-4 text-[13px] text-slate-600">{formatNumber(item.impressions)}</td>
                  <td className="py-3 pr-4 text-[13px] text-slate-600">{formatNumber(item.reach)}</td>
                  <td className="py-3 pr-4 text-[13px] text-slate-600">{formatNumber(item.clicks)}</td>
                  <td className="py-3 pr-4 text-[13px] text-slate-600">{formatPercent(item.ctr)}</td>
                  <td className="py-3 pr-4 text-[13px] text-slate-600">{formatCurrency(item.cpc)}</td>
                  <td className="py-3 pr-4 text-[13px] text-slate-600">{formatCurrency(item.cpm)}</td>
                  <td className="py-3 pr-4 text-[13px] font-semibold text-indigo-600">{formatNumber(item.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
