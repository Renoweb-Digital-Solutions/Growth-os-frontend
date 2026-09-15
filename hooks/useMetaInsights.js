"use client";

import { useState, useEffect } from "react";
import {
  getMetaOverview,
  getMetaSocialInsights,
  getMetaContentInsights,
  getMetaAdsInsights,
  getMetaCampaignInsights,
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

export function useMetaAnalytics(dateRangeDays) {
  const [data, setData] = useState({
    overview: null,
    social: null,
    content: null,
    ads: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const [socialRes, contentRes, adsRes] = await Promise.all(requests);

        if (isMounted) {
          setData({
            overview: overviewRes,
            social: socialRes,
            content: contentRes,
            ads: adsRes,
            capabilities,
          });
        }
      } catch (err) {
        console.error("Meta fetch error:", err);
        if (isMounted) setError(err.message || "Failed to load Meta insights");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [dateRangeDays]);

  return { ...data, loading, error };
}

export function useMetaCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
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

  return { campaigns, capabilities, loading, error };
}
