// Helper utility for generating and downloading CSV files containing live Analytics data.
// Strictly adheres to null -> "Unavailable" and 0 -> "0" semantics.

function escapeCsv(val) {
  if (val === null || val === undefined) return '"Unavailable"';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadCsv(filename, headers, rows) {
  if (!rows || rows.length === 0) return;

  const csvLines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOverviewData(kpis, dateRangeDays) {
  const headers = ["Metric", "Value", "Absolute Change", "Percentage Change"];
  const rows = (kpis || []).map((kpi) => [
    kpi.label,
    kpi.value,
    kpi.absolute !== null && kpi.absolute !== undefined ? kpi.absolute : "Unavailable",
    kpi.percentage !== null && kpi.percentage !== undefined
      ? `${kpi.percentage >= 0 ? "+" : ""}${kpi.percentage.toFixed(2)}%`
      : kpi.message || "Unavailable",
  ]);

  downloadCsv(`GrowthOS_Analytics_Overview_${dateRangeDays}D.csv`, headers, rows);
}

export function exportContentData(contentData, platform, dateRangeDays) {
  const headers = ["ID", "Platform", "Date", "Caption/Message", "Likes", "Comments", "Shares", "Reactions", "Engagement", "URL"];
  const rows = (contentData || [])
    .filter((item) => platform === "all" || item.platform === platform)
    .map((item) => {
      const likes = item.metrics?.likeCount;
      const comments = item.metrics?.commentCount;
      const shares = item.metrics?.shareCount;
      const reactions = item.metrics?.reactionCount;
      const engagement = item.metrics?.igMediaInteractions ?? item.metrics?.fbPostInteractions;

      return [
        item.contentId || "N/A",
        item.platform || "N/A",
        item.createdTime ? new Date(item.createdTime).toLocaleDateString("en-US") : "N/A",
        item.caption || item.message || "No text",
        likes !== null && likes !== undefined ? likes : "Unavailable",
        comments !== null && comments !== undefined ? comments : "Unavailable",
        shares !== null && shares !== undefined ? shares : "Unavailable",
        reactions !== null && reactions !== undefined ? reactions : "Unavailable",
        engagement !== null && engagement !== undefined ? engagement : "Unavailable",
        item.permalinkUrl || "N/A",
      ];
    });

  downloadCsv(`GrowthOS_${platform.toUpperCase()}_Content_${dateRangeDays}D.csv`, headers, rows);
}

export function exportAdsData(adsData, level, dateRangeDays) {
  const headers = ["ID", "Name", "Status", "Spend ($)", "Impressions", "Reach", "Clicks", "CTR (%)", "CPC ($)", "CPM ($)", "Leads"];
  const rows = (adsData || []).map((item) => {
    let leads = "Unavailable";
    if (Array.isArray(item.actions)) {
      const leadAction = item.actions.find((a) => a.action_type === "lead");
      if (leadAction && Number.isFinite(parseFloat(leadAction.value))) {
        leads = parseFloat(leadAction.value);
      }
    }

    return [
      item.id || item.campaignId || item.adSetId || item.adId || "N/A",
      item.name || item.campaign_name || item.adset_name || item.ad_name || "N/A",
      item.status || "ACTIVE",
      item.spend !== null && item.spend !== undefined ? item.spend : "Unavailable",
      item.impressions !== null && item.impressions !== undefined ? item.impressions : "Unavailable",
      item.reach !== null && item.reach !== undefined ? item.reach : "Unavailable",
      item.clicks !== null && item.clicks !== undefined ? item.clicks : "Unavailable",
      item.ctr !== null && item.ctr !== undefined ? item.ctr : "Unavailable",
      item.cpc !== null && item.cpc !== undefined ? item.cpc : "Unavailable",
      item.cpm !== null && item.cpm !== undefined ? item.cpm : "Unavailable",
      leads,
    ];
  });

  downloadCsv(`GrowthOS_Ads_${level}_${dateRangeDays}D.csv`, headers, rows);
}
