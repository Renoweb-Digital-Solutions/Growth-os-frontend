"use client";

import { useState, useEffect } from "react";
import {
  getMetaOverview,
  getMetaAdsInsights,
} from "@/lib/metaApi";

// Utility to format date for a specific timezone as YYYY-MM-DD
function formatTimezoneDate(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch (e) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }
}

// Map the report presets to exact date boundaries
function calculateDateRange(preset, timeZone) {
  const now = new Date();
  
  // Format the dates right at the end to ensure they respect the timezone,
  // but we must do math on local/UTC dates. For perfect timezone safety, 
  // you'd use a library, but basic Date math suffices for this demo constraint.
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
  const tzDateStr = formatter.format(now); // MM/DD/YYYY in target TZ
  const [tzMonth, tzDay, tzYear] = tzDateStr.split('/').map(Number);
  
  const tzNow = new Date(tzYear, tzMonth - 1, tzDay);

  let sinceDate, untilDate;

  switch (preset) {
    case "this-month":
      sinceDate = new Date(tzYear, tzMonth - 1, 1);
      untilDate = tzNow;
      break;
    case "last-month":
      sinceDate = new Date(tzYear, tzMonth - 2, 1);
      untilDate = new Date(tzYear, tzMonth - 1, 0); // Last day of previous month
      break;
    case "last-quarter":
      const currentQuarter = Math.floor((tzMonth - 1) / 3);
      sinceDate = new Date(tzYear, (currentQuarter - 1) * 3, 1);
      untilDate = new Date(tzYear, currentQuarter * 3, 0);
      break;
    case "ytd":
      sinceDate = new Date(tzYear, 0, 1);
      untilDate = tzNow;
      break;
    default:
      // Default to last 30 days if custom or unknown
      sinceDate = new Date(tzNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      untilDate = tzNow;
      break;
  }

  return {
    since: formatTimezoneDate(sinceDate, timeZone),
    until: formatTimezoneDate(untilDate, timeZone),
    dateLabel: `${formatTimezoneDate(sinceDate, timeZone)} - ${formatTimezoneDate(untilDate, timeZone)}`
  };
}

const formatCurrency = (val) => {
  if (typeof val === "number" && Number.isFinite(val)) {
    return "$" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const parsed = parseFloat(val);
  if (Number.isFinite(parsed)) {
    return "$" + parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "Unavailable";
};

const formatNumber = (val) => {
  if (typeof val === "number" && Number.isFinite(val)) {
    return val;
  }
  const parsed = parseFloat(val);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return "Unavailable";
};

export function useMetaReports(filters) {
  const [metaRow, setMetaRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReportData() {
      setLoading(true);
      setError(null);
      
      let dateLabelFallback = "";
      try {
        const fallbackRange = calculateDateRange(filters.datePreset, "UTC");
        dateLabelFallback = fallbackRange.dateLabel;
      } catch (e) {
        // Ignore fallback calculation errors
      }
      
      try {
        // 1. Fetch Overview to get Timezone and Reach
        const overviewRes = await getMetaOverview();
        if (!overviewRes.success) {
          throw new Error("Failed to load Meta overview data");
        }
        
        const overviewData = overviewRes.data;
        const capabilities = overviewRes.meta?.capabilities || {};
        const timezone = overviewRes.meta?.dateRange?.timezone || "UTC";

        // 2. Calculate explicit since/until
        const { since, until, dateLabel } = calculateDateRange(filters.datePreset, timezone);
        dateLabelFallback = dateLabel; // Update fallback with accurate TZ

        // 3. Fetch Ads data if capabilities allow
        let adsRes = { success: true, data: null };
        if (capabilities.ads?.available) {
          adsRes = await getMetaAdsInsights({ since, until });
        }

        if (isMounted) {
          // 4. Construct the Meta / Instagram row
          const isAdsEmpty = !adsRes.data || !Array.isArray(adsRes.data) || adsRes.data.length === 0;
          const rawReach = overviewData?.adsOverview?.reach;
          
          let clicks = "Unavailable";
          let conversions = "Unavailable";
          let spend = "Unavailable";

          if (capabilities.ads?.available && !isAdsEmpty) {
            const insight = adsRes.data[0];
            clicks = formatNumber(insight.clicks);
            spend = formatCurrency(insight.spend);
            
            // Extract conversions (action_type: 'lead')
            if (insight.actions && Array.isArray(insight.actions)) {
              const leadAction = insight.actions.find(a => a.action_type === "lead");
              if (leadAction) {
                conversions = formatNumber(leadAction.value);
              } else {
                conversions = 0; // If there are active ads but no leads, it's 0 leads.
              }
            } else {
              conversions = 0;
            }
          }

          let reach = "Unavailable";
          if (capabilities.ads?.available && !isAdsEmpty) {
             reach = formatNumber(rawReach);
          } else if (capabilities.ads?.available) {
             reach = formatNumber(rawReach);
          }

          // Construct the strict table structure
          setMetaRow({
            date: dateLabel,
            channel: "Meta / Instagram",
            reach,
            engagement: "Unavailable", // No direct mapped metric in Phase 3 Ads
            clicks,
            conversions,
            spend,
            isLiveData: true // Flag to distinguish in UI
          });
        }
      } catch (err) {
        console.error("Meta report fetch error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load Meta report data");
          
          // Guarantee the Meta row is displayed with unavailable states 
          // even if the API throws a 401 Unauthorized or other error.
          setMetaRow({
            date: dateLabelFallback,
            channel: "Meta / Instagram",
            reach: "Unavailable",
            engagement: "Unavailable",
            clicks: "Unavailable",
            conversions: "Unavailable",
            spend: "Unavailable",
            isLiveData: true
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
    };
  }, [filters.datePreset]); // Refetch if date preset changes

  return { metaRow, loading, error };
}
