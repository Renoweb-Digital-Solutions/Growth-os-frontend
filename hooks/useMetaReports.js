"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMetaOverview,
} from "@/lib/metaApi";
import apiClient from "@/lib/apiClient";

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
  const [data, setData] = useState({
    overview: null,
    social: null,
    content: null,
    adsAccount: null,
    campaigns: null,
    adSets: null,
    adsLevel: null,
    capabilities: null,
  });
  const [errors, setErrors] = useState({
    overview: null,
    social: null,
    content: null,
    adsAccount: null,
    campaigns: null,
    adSets: null,
    adsLevel: null,
  });
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount(c => c + 1);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReportData() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const options = { signal: abortControllerRef.current.signal };

      setLoading(true);
      setGlobalError(null);
      setErrors({});
      
      try {
        // Fetch Overview to get capabilities
        const overviewRes = await getMetaOverview({ datePreset: filters.datePreset }, options);
        if (!overviewRes.success) {
          throw new Error("Failed to load Meta overview data");
        }
        
        const capabilities = overviewRes.meta?.capabilities || {};

        const safeFetch = async (promiseFn) => {
          try {
            const res = await promiseFn();
            return { success: true, data: res?.data, meta: res?.meta, error: null };
          } catch (err) {
            if (err.name === "AbortError") {
              throw err;
            }
            return { success: false, data: null, meta: null, error: err.message || "Request failed" };
          }
        };

        // Stagger requests into small batches
        // Batch 1: Social & Content
        const [socialRes, contentRes] = await Promise.all([
          safeFetch(() => capabilities.social?.available || capabilities.instagram?.available ? apiClient.get("/api/meta/insights/social", { datePreset: filters.datePreset }, options) : Promise.resolve({ success: true, data: null })),
          safeFetch(() => capabilities.social?.available || capabilities.instagram?.available ? apiClient.get("/api/meta/insights/content", { datePreset: filters.datePreset, limit: 100 }, options) : Promise.resolve({ success: true, data: null }))
        ]);

        // Batch 2: Ads Account & Campaigns
        const [adsRes, campRes] = await Promise.all([
          safeFetch(() => capabilities.ads?.available ? apiClient.get("/api/meta/insights/ads", { datePreset: filters.datePreset }, options) : Promise.resolve({ success: true, data: null })),
          safeFetch(() => capabilities.ads?.available ? apiClient.get("/api/meta/insights/campaigns", { limit: 100 }, options) : Promise.resolve({ success: true, data: null }))
        ]);

        // Batch 3: Ad Sets & Ads Level
        const [adSetRes, adRes] = await Promise.all([
          safeFetch(() => capabilities.ads?.available ? apiClient.get("/api/meta/insights/adsets", { datePreset: filters.datePreset, limit: 100 }, options) : Promise.resolve({ success: true, data: null })),
          safeFetch(() => capabilities.ads?.available ? apiClient.get("/api/meta/insights/ads-level", { datePreset: filters.datePreset, limit: 100 }, options) : Promise.resolve({ success: true, data: null }))
        ]);

        if (isMounted) {
          setData({
            overview: overviewRes,
            social: socialRes.success ? { data: socialRes.data } : null,
            content: { data: contentRes.success ? (contentRes.data?.posts || contentRes.data || []) : [] }, // normalized content schema
            adsAccount: adsRes.success ? { data: adsRes.data } : null,
            campaigns: campRes.success ? { data: campRes.data } : null,
            adSets: adSetRes.success ? { data: adSetRes.data } : null,
            adsLevel: adRes.success ? { data: adRes.data } : null,
            capabilities,
          });

          setErrors({
            social: socialRes.error,
            content: contentRes.error,
            adsAccount: adsRes.error,
            campaigns: campRes.error,
            adSets: adSetRes.error,
            adsLevel: adRes.error,
          });
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("Meta report fetch error:", err);
        if (isMounted) {
          setGlobalError(err.message || "Failed to load Meta report data");
          
          if (err.message?.toLowerCase().includes("auth") || err.message?.toLowerCase().includes("token") || err.message?.toLowerCase().includes("expired")) {
            setErrorType("auth");
          } else if (err.message?.toLowerCase().includes("permission") || err.message?.toLowerCase().includes("access")) {
            setErrorType("permission");
          } else {
            setErrorType("network");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters.datePreset, retryCount]);

  return { ...data, datasetErrors: errors, loading, error: globalError, errorType, retry };
}
