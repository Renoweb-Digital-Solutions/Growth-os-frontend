"use client";

import { useState, useEffect } from "react";
import {
  getMetaOverview,
  getMetaSocialInsights,
  getMetaContentInsights,
  getMetaAdsInsights,
  getMetaCampaignInsights,
  getMetaAdSetInsights,
  getMetaAdsLevelInsights,
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
    // Fallback if timezone is invalid
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }
}

export function useMetaInsights(dateRangeDays) {
  const [data, setData] = useState({
    overview: null,
    social: null,
    content: null,
    ads: null,
    adSets: null,
    adsLevel: null,
    prevOverview: null,
    prevSocial: null,
    prevAds: null,
    adSetsMeta: null,
    adsLevelMeta: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount(c => c + 1);

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Fetch Overview first to discover Timezone and capabilities
        const overviewRes = await getMetaOverview();
        if (!overviewRes.success) {
          throw new Error("Failed to load Meta overview data");
        }
        
        const overviewData = overviewRes.data;
        const capabilities = overviewRes.meta?.capabilities || {};
        const timezone = overviewRes.meta?.dateRange?.timezone || "UTC";

        // Calculate since and until based on Ad Account Timezone
        const now = new Date();
        const until = formatTimezoneDate(now, timezone);
        
        const sinceDate = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
        const since = formatTimezoneDate(sinceDate, timezone);

        const dateParams = { since, until };

        // Previous period calculation
        const prevUntilDate = new Date(sinceDate.getTime() - 24 * 60 * 60 * 1000);
        const prevSinceDate = new Date(prevUntilDate.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
        
        const prevUntil = formatTimezoneDate(prevUntilDate, timezone);
        const prevSince = formatTimezoneDate(prevSinceDate, timezone);
        const prevDateParams = { since: prevSince, until: prevUntil };

        // 2. Fetch the rest in parallel using calculated dates
        const requests = [];
        
        // Social insights
        requests.push(
          capabilities.social?.available || capabilities.instagram?.available
            ? getMetaSocialInsights(dateParams)
            : Promise.resolve({ success: true, data: null })
        );

        // Content insights
        requests.push(
          capabilities.social?.available || capabilities.instagram?.available
            ? getMetaContentInsights({ ...dateParams, limit: 50 })
            : Promise.resolve({ success: true, data: [] })
        );

        // Ads insights
        requests.push(
          capabilities.ads?.available
            ? getMetaAdsInsights(dateParams)
            : Promise.resolve({ success: true, data: null })
        );

        // Ad Sets detailed
        requests.push(
          capabilities.ads?.available
            ? getMetaAdSetInsights({ ...dateParams, limit: 50 })
            : Promise.resolve({ success: true, data: null })
        );

        // Ads Level detailed
        requests.push(
          capabilities.ads?.available
            ? getMetaAdsLevelInsights({ ...dateParams, limit: 50 })
            : Promise.resolve({ success: true, data: null })
        );

        // Previous period requests
        requests.push(getMetaOverview(prevDateParams));
        
        requests.push(
          capabilities.social?.available || capabilities.instagram?.available
            ? getMetaSocialInsights(prevDateParams)
            : Promise.resolve({ success: true, data: null })
        );

        requests.push(
          capabilities.ads?.available
            ? getMetaAdsInsights(prevDateParams)
            : Promise.resolve({ success: true, data: null })
        );

        const [socialRes, contentRes, adsRes, adSetsRes, adsLevelRes, prevOverviewRes, prevSocialRes, prevAdsRes] = await Promise.all(requests);

        if (isMounted) {
          setData({
            overview: overviewRes,
            social: socialRes,
            content: contentRes,
            ads: adsRes,
            adSets: adSetsRes?.success ? (adSetsRes.data?.adSets || []) : [],
            adsLevel: adsLevelRes?.success ? (adsLevelRes.data?.ads || []) : [],
            adSetsMeta: adSetsRes?.meta || null,
            adsLevelMeta: adsLevelRes?.meta || null,
            prevOverview: prevOverviewRes,
            prevSocial: prevSocialRes,
            prevAds: prevAdsRes,
            capabilities,
          });
        }
      } catch (err) {
        console.error("Meta fetch error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load Meta insights");
          
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

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [dateRangeDays, retryCount]);

  return { ...data, loading, error, errorType, retry };
}

export function useMetaCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCampaigns() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await getMetaCampaignInsights({ limit: 10 });
        if (isMounted) {
          if (res.success) {
            setCampaigns(res.data?.campaigns || []);
            setCapabilities(res.meta?.capabilities || {});
            setMeta(res.meta || null);
          } else {
            setError("Failed to load campaigns");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Error fetching campaigns");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCampaigns();

    return () => {
      isMounted = false;
    };
  }, []);

  return { campaigns, meta, capabilities, loading, error };
}

// useMetaAdsDetailed has been removed and consolidated into useMetaInsights to prevent duplicate requests.
