"use client";

import { MoreHorizontal, Megaphone } from "lucide-react";

export default function CampaignCards({ campaigns = [], meta, capabilities, loading, error }) {
  const isAdsDisabled = capabilities?.ads?.available === false && capabilities?.ads?.code === "REQUIREMENT_DISABLED";
  const isUnavailable = capabilities?.ads?.available === false;
  const isTruncated = meta?.paginationTruncated === true || meta?.complete === false;

  if (loading) {
    return (
      <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dashboard-card p-5 animate-pulse min-h-[160px]">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-slate-200" />
            </div>
            <div className="flex gap-1.5 mb-2.5">
              <div className="w-12 h-4 rounded-md bg-slate-200" />
              <div className="w-16 h-4 rounded-md bg-slate-200" />
            </div>
            <div className="w-3/4 h-5 rounded bg-slate-200 mb-2" />
            <div className="w-1/2 h-4 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error || isUnavailable || campaigns.length === 0) {
    return (
      <div className="col-span-full dashboard-card p-8 flex flex-col items-center justify-center text-center">
        <Megaphone className="w-8 h-8 text-slate-300 mb-3" />
        <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
          {error
            ? "Failed to load Campaigns"
            : isAdsDisabled
            ? "Meta Ads Not Enabled"
            : isUnavailable
            ? "Meta Ads Disconnected"
            : "No Active Campaigns"}
        </h4>
        <p className="text-[12.5px] text-slate-500 max-w-sm">
          {error
            ? error
            : isAdsDisabled
            ? "Meta Ads capability is currently disabled."
            : isUnavailable
            ? "Connect a Meta Ad Account to view and track your active marketing campaigns."
            : "There are no active Meta Ad campaigns found for this account."}
        </p>
      </div>
    );
  }

  const normalizeNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return (
    <div className="col-span-full">
      {isTruncated && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] rounded-lg">
          Showing partial results. The selected date range contains more data than could be retrieved.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {campaigns.map((campaign) => {
          const spend = normalizeNumber(campaign.spend);
          const clicks = normalizeNumber(campaign.clicks);
          return (
            <div
              key={campaign.id || campaign.name}
              className="dashboard-card p-5 hover:shadow-lg transition-shadow duration-300 group"
            >
          {/* Top row: icon + menu */}
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-indigo-50 text-indigo-500">
              <Megaphone className="w-5 h-5" />
            </div>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            <span className="px-2 py-0.5 text-[10.5px] font-medium text-indigo-700 bg-indigo-50 rounded-md capitalize">
              {campaign.status?.toLowerCase() || "ACTIVE"}
            </span>
            {campaign.budget?.dailyBudgetFormatted && (
              <span className="px-2 py-0.5 text-[10.5px] font-medium text-slate-500 bg-slate-100 rounded-md">
                {campaign.budget.dailyBudgetFormatted}/day
              </span>
            )}
          </div>

          {/* Campaign name */}
          <h4 className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug truncate" title={campaign.name}>
            {campaign.name}
          </h4>

          {spend !== null ? (
             <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
               <div>
                 <p className="text-[10.5px] text-slate-400 uppercase font-semibold">Spend</p>
                 <p className="text-[13px] font-semibold text-slate-700">${spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
               </div>
               <div>
                 <p className="text-[10.5px] text-slate-400 uppercase font-semibold">Clicks</p>
                 <p className="text-[13px] font-semibold text-slate-700">{clicks !== null ? clicks.toLocaleString() : "Unavailable"}</p>
               </div>
             </div>
          ) : (
            <p className="text-[12px] text-slate-400">Meta Ads</p>
          )}
        </div>
      );
      })}
    </div>
    </div>
  );
}
