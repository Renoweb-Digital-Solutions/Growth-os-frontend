"use client";

import ObservationsPanel from "@/components/dashboard/analytics/ObservationsPanel";

export default function ReportPreviewTable({ metaData, loading, observations }) {
  const { overview, social, content, adsAccount, campaigns, adSets, adsLevel, capabilities } = metaData || {};

  const formatSafeNumber = (val) => {
    if (typeof val === "number" && Number.isFinite(val)) return val.toLocaleString();
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed.toLocaleString();
    return "Unavailable";
  };

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

      {!loading && !capabilities && (
        <div className="text-center py-8 text-[13px] text-slate-500 bg-slate-50 rounded-lg">
          No live data available.
        </div>
      )}

      {/* Meta Live Report Sections */}
      {!loading && capabilities && (
        <div className="border-t border-slate-100 pt-6">
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
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Ads Account Performance</h4>
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
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
          
          {/* Content Performance */}
          {content?.data && content.data.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Content Performance</h4>
              <div className="overflow-x-auto bg-slate-50 rounded-lg p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Platform</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Content</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Likes</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Interactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.data.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 text-[12px] text-slate-600 capitalize">{item.platform}</td>
                        <td className="py-2 pr-4 text-[12px] font-medium text-slate-800 max-w-[200px] truncate">{item.caption || item.message || "No content"}</td>
                        <td className="py-2 pr-4 text-[12px] text-slate-600">{formatSafeNumber(item.platform === "instagram" ? item.metrics?.likeCount : item.metrics?.reactionCount)}</td>
                        <td className="py-2 pr-4 text-[12px] font-semibold text-indigo-600">{formatSafeNumber(item.platform === "instagram" ? item.metrics?.igMediaInteractions : item.metrics?.fbPostInteractions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Campaigns */}
          {campaigns?.data?.campaigns && campaigns.data.campaigns.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Campaign Performance</h4>
              <div className="overflow-x-auto bg-slate-50 rounded-lg p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Campaign</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Status</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.data.campaigns.map((c, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 text-[12px] font-medium text-slate-800">{c.name}</td>
                        <td className="py-2 pr-4 text-[12px] text-slate-600 capitalize">{c.status}</td>
                        <td className="py-2 pr-4 text-[12px] text-slate-600">{c.budget?.dailyBudgetFormatted || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ad Sets */}
          {adSets?.data && adSets.data.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Ad Set Performance</h4>
              <div className="overflow-x-auto bg-slate-50 rounded-lg p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Ad Set</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Status</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Goal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adSets.data.map((a, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 text-[12px] font-medium text-slate-800">{a.name}</td>
                        <td className="py-2 pr-4 text-[12px] text-slate-600 capitalize">{a.status}</td>
                        <td className="py-2 pr-4 text-[12px] text-slate-600">{a.optimizationGoal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ads Level */}
          {adsLevel?.data && adsLevel.data.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Ad Performance</h4>
              <div className="overflow-x-auto bg-slate-50 rounded-lg p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Ad Name</th>
                      <th className="pb-2 pr-4 text-[11px] font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsLevel.data.map((a, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 text-[12px] font-medium text-slate-800">{a.name}</td>
                        <td className="py-2 pr-4 text-[12px] text-slate-600 capitalize">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
