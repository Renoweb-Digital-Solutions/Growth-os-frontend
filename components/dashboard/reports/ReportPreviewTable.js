"use client";

import { previewData } from "@/app/dashboard/reports/mockReports";
import ObservationsPanel from "@/components/dashboard/analytics/ObservationsPanel";

// Reason: Live preview table showing report data matching selected filters.
// How: Renders a clean table with columns: Date, Channel, Reach, Engagement,
//      Clicks, Conversions, Spend. Striped rows for readability.
// Receives: nothing (reads previewData from mockReports)
// Passes: nothing

// Passes: nothing

export default function ReportPreviewTable({ data, metaData, loading, observations }) {
  const { overview, social, content, adsAccount, campaigns, adSets, adsLevel, capabilities } = metaData || {};
  const isMetaSelected = true; // For now assume always shown if capabilities exist

  const formatSafeNumber = (val) => {
    if (typeof val === "number" && Number.isFinite(val)) return val.toLocaleString();
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed.toLocaleString();
    return "Unavailable";
  };

  const columns = ["Date", "Channel", "Reach", "Engagement", "Clicks", "Conversions", "Spend"];

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
                  No mock data to preview for selected channels.
                </td>
              </tr>
            )}
            
            {data?.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b transition-colors border-slate-50 hover:bg-slate-50/50 ${idx % 2 === 1 ? "bg-slate-50/30" : ""}`}
              >
                <td className="py-3 pr-4 text-[13px] text-slate-600">{row.date}</td>
                <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 flex items-center gap-2">
                  {row.channel}
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

      {/* Meta Live Report Sections */}
      {!loading && capabilities && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-[14px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
            Meta Performance Data
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">LIVE</span>
          </h3>

          {/* Facebook Overview */}
          {capabilities.social?.available && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Facebook Summary</h4>
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Fan Count</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.socialOverview?.fanCount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instagram Overview */}
          {capabilities.instagram?.available && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Instagram Summary</h4>
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Followers</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.instagramOverview?.followersCount)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Media Count</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.instagramOverview?.lifetimeMediaCatalogCount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ads Overview */}
          {capabilities.ads?.available && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Ads Performance</h4>
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Spend</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.adsOverview?.spend)} {overview?.data?.adsOverview?.currency}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Impressions</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.adsOverview?.impressions)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Clicks</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.adsOverview?.clicks)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Reach</p>
                  <p className="text-[14px] font-semibold text-slate-800">{formatSafeNumber(overview?.data?.adsOverview?.reach)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intelligence Observations inside Report Preview */}
      {!loading && capabilities && observations && observations.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <ObservationsPanel observations={observations} loading={loading} />
        </div>
      )}
    </div>
  );
}
