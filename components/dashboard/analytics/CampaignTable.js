"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronRight, Megaphone } from "lucide-react";

const columnDefs = [
  { key: "name", label: "Campaign Name", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "budget", label: "Daily Budget", sortable: true },
  { key: "spend", label: "Spend", sortable: true },
  { key: "impressions", label: "Impressions", sortable: true },
  { key: "clicks", label: "Clicks", sortable: true },
  { key: "ctr", label: "CTR", sortable: true },
  { key: "conversions", label: "Leads", sortable: true },
];

export default function CampaignTable({ campaigns = [], capabilities, loading, error, onSelectCampaign }) {
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

  const mappedData = (campaigns || []).map((c) => {
    let leads = 0;
    if (Array.isArray(c.actions)) {
      const leadAction = c.actions.find((a) => a.action_type === "lead");
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
      id: c.campaignId || c.id || c.name,
      name: c.name || "Unknown Campaign",
      status: c.status || c.effectiveStatus || "ACTIVE",
      budget: c.budget?.dailyBudgetFormatted ?? normalizeNumber(c.dailyBudget),
      spend: normalizeNumber(c.spend),
      impressions: normalizeNumber(c.impressions),
      clicks: normalizeNumber(c.clicks),
      ctr: normalizeNumber(c.ctr),
      conversions: leads === 0 && !c.actions ? null : leads,
      raw: c,
    };
  });

  const sorted = [...mappedData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const formatCurrency = (val) => (val === null || val === undefined ? "Unavailable" : `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const formatNumber = (val) => (val === null || val === undefined ? "Unavailable" : Number(val).toLocaleString());
  const formatPercent = (val) => (val === null || val === undefined ? "Unavailable" : `${Number(val).toFixed(2)}%`);

  return (
    <div className="dashboard-card p-6 overflow-hidden relative min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-500" />
          <span>Active Campaigns</span>
        </h3>
        <span className="text-[12px] text-slate-400 font-medium">Click campaign row to view Ad Sets</span>
      </div>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-red-700 mb-1">Failed to load Campaigns</h4>
          <p className="text-[12.5px] text-red-500">{error}</p>
        </div>
      ) : isUnavailable ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-slate-700 mb-1">Meta Ads Disconnected</h4>
          <p className="text-[12.5px] text-slate-500">Connect a Meta Ad Account to view active campaigns.</p>
        </div>
      ) : mappedData.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-[14px] font-semibold text-slate-700 mb-1">No Active Campaigns Found</h4>
          <p className="text-[12.5px] text-slate-500">No campaigns were returned for this account in the selected period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                      {col.sortable && sortKey === col.key && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                ))}
                <th className="pb-3 text-[11.5px] uppercase font-semibold text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectCampaign && onSelectCampaign(item)}
                  className={`border-b border-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-colors group ${
                    idx % 2 === 1 ? "bg-slate-50/30" : ""
                  }`}
                >
                  <td className="py-3.5 pr-4 text-[13px] font-semibold text-slate-800 max-w-[220px] truncate group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-medium text-emerald-700 bg-emerald-50 capitalize border border-emerald-200/60">
                      {item.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-700">{formatCurrency(item.budget)}</td>
                  <td className="py-3.5 pr-4 text-[13px] font-semibold text-slate-800">{formatCurrency(item.spend)}</td>
                  <td className="py-3.5 pr-4 text-[13px] text-slate-600">{formatNumber(item.impressions)}</td>
                  <td className="py-3.5 pr-4 text-[13px] text-slate-600">{formatNumber(item.clicks)}</td>
                  <td className="py-3.5 pr-4 text-[13px] text-slate-600">{formatPercent(item.ctr)}</td>
                  <td className="py-3.5 pr-4 text-[13px] font-semibold text-indigo-600">{formatNumber(item.conversions)}</td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      <span>View Ad Sets</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
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
