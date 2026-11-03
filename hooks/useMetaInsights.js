"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMetaOverview,
  getMetaSocialInsights,
  getMetaFacebookAnalytics,
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
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }
}

export function useMetaInsights(dateRangeInput, activeTab = "overview", selectedAssets = {}, adsDrillState = {}) {
  const [data, setData] = useState({
    overview: null,
    social: null,
    fbAnalytics: null,
    fbContent: null,
    igContent: null,
    ads: null,
    campaigns: null,
    adSets: null,
    adsLevel: null,
    prevOverview: null,
    prevSocial: null,
    prevAds: null,
    capabilities: null,
    dateRange: null,
  });

  const [errors, setErrors] = useState({
    overview: null,
    social: null,
    fbAnalytics: null,
    fbContent: null,
    igContent: null,
    ads: null,
    campaigns: null,
    adSets: null,
    adsLevel: null,
  });

  const META_TABS = ["overview", "facebook", "instagram", "ads"];
  const isMetaTab = META_TABS.includes(activeTab);

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((c) => c + 1);

  const abortControllerRef = useRef(null);
  const cacheRef = useRef({});

  // Extract selected asset IDs for explicit API parameter targeting
  const pageId = selectedAssets?.pageId || null;
  const instagramAccountId = selectedAssets?.instagramId || selectedAssets?.instagramAccountId || null;
  const adAccountId = selectedAssets?.adAccountId || null;

  // Determine whether custom or preset date range is requested
  const isCustomRange = Boolean(
    typeof dateRangeInput === "object" &&
    dateRangeInput !== null &&
    dateRangeInput.isCustom &&
    dateRangeInput.startDate &&
    dateRangeInput.endDate
  );

  const customStartDate = isCustomRange ? dateRangeInput.startDate : null;
  const customEndDate = isCustomRange ? dateRangeInput.endDate : null;

  const presetDays = isCustomRange
    ? null
    : typeof dateRangeInput === "number"
    ? dateRangeInput
    : typeof dateRangeInput === "object" && dateRangeInput !== null && dateRangeInput.days
    ? Number(dateRangeInput.days)
    : dateRangeInput === "7d" || dateRangeInput === "7D" || dateRangeInput === 7
    ? 7
    : dateRangeInput === "28d" || dateRangeInput === "28D" || dateRangeInput === 28
    ? 28
    : dateRangeInput === "90d" || dateRangeInput === "90D" || dateRangeInput === "3m" || dateRangeInput === "3M" || dateRangeInput === 90
    ? 90
    : dateRangeInput === "24h" || dateRangeInput === "24H" || dateRangeInput === "today" || dateRangeInput === "yesterday" || dateRangeInput === 1
    ? 1
    : 30; // 30D is the default Meta preset, aligned with 30-day UI button

  const dateRangeKey = isCustomRange
    ? `custom_${customStartDate}_${customEndDate}`
    : `preset_${presetDays}`;

  // Reset cache on dateRangeKey, selected assets, or retryCount change
  useEffect(() => {
    cacheRef.current = {};
  }, [dateRangeKey, pageId, instagramAccountId, adAccountId, retryCount]);

  useEffect(() => {
    let isMounted = true;

    if (!isMetaTab) {
      return;
    }

    async function fetchTabData() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const options = { signal: abortControllerRef.current.signal };

      setLoading(true);
      setGlobalError(null);

      const safeFetch = async (promiseFn) => {
        try {
          const res = await promiseFn();
          return { success: true, data: res?.data, meta: res?.meta, error: null };
        } catch (err) {
          if (err.name === "AbortError") throw err;
          
          let is429 = false;
          if (err.status === 429 || err.message?.includes("429") || err.message?.toLowerCase().includes("rate limit")) {
            is429 = true;
          }

          return { 
            success: false, 
            data: null, 
            meta: null, 
            error: is429 ? "Meta is temporarily rate-limiting requests. Please try again shortly." : (err.message || "Request failed"),
            is429
          };
        }
      };

      try {
        // Build endpoint-specific asset query parameter sets
        const overviewAssetParams = {};
        if (pageId) overviewAssetParams.pageId = pageId;
        if (instagramAccountId) overviewAssetParams.instagramAccountId = instagramAccountId;
        if (adAccountId) overviewAssetParams.adAccountId = adAccountId;

        const socialAssetParams = {};
        if (pageId) socialAssetParams.pageId = pageId;
        if (instagramAccountId) socialAssetParams.instagramAccountId = instagramAccountId;

        const fbContentAssetParams = { platform: "facebook", limit: 50 };
        if (pageId) fbContentAssetParams.pageId = pageId;

        const igContentAssetParams = { platform: "instagram", limit: 50 };
        if (instagramAccountId) igContentAssetParams.instagramAccountId = instagramAccountId;

        const adsAssetParams = {};
        if (adAccountId) adsAssetParams.adAccountId = adAccountId;

        const campaignAssetParams = { limit: 50 };
        if (adAccountId) campaignAssetParams.adAccountId = adAccountId;

        const adSetAssetParams = { limit: 50 };
        if (adAccountId) adSetAssetParams.adAccountId = adAccountId;

        const adsLevelAssetParams = { limit: 50 };
        if (adAccountId) adsLevelAssetParams.adAccountId = adAccountId;

        // Step 1: Compute reporting window date parameters
        const timezone = cacheRef.current.timezone || "UTC";

        let since;
        let until;
        let prevSince;
        let prevUntil;

        if (isCustomRange) {
          since = customStartDate;
          until = customEndDate;

          const startMs = new Date(customStartDate).getTime();
          const endMs = new Date(customEndDate).getTime();
          const diffMs = Math.max(0, endMs - startMs);
          const durationDays = Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1;

          const prevUntilDate = new Date(startMs - 24 * 60 * 60 * 1000);
          const prevSinceDate = new Date(prevUntilDate.getTime() - (durationDays - 1) * 24 * 60 * 60 * 1000);
          prevUntil = prevUntilDate.toISOString().split("T")[0];
          prevSince = prevSinceDate.toISOString().split("T")[0];
        } else {
          const days = presetDays;
          const now = new Date();
          until = formatTimezoneDate(now, timezone);
          const sinceDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          since = formatTimezoneDate(sinceDate, timezone);

          const prevUntilDate = new Date(sinceDate.getTime() - 24 * 60 * 60 * 1000);
          const prevSinceDate = new Date(prevUntilDate.getTime() - days * 24 * 60 * 60 * 1000);
          prevUntil = formatTimezoneDate(prevUntilDate, timezone);
          prevSince = formatTimezoneDate(prevSinceDate, timezone);
        }

        const dateParams = { since, until };
        const prevDateParams = { since: prevSince, until: prevUntil };

        // Step 2: Ensure Overview & Capabilities are known for the active reporting window
        let overviewRes = cacheRef.current.overview;
        if (!overviewRes) {
          overviewRes = await safeFetch(() => getMetaOverview({ ...dateParams, ...overviewAssetParams }, options));
          if (!overviewRes.success) {
            if (overviewRes.is429) {
              setErrorType("rate_limit");
              throw new Error("Meta is temporarily rate-limiting requests. Please try again shortly.");
            }
            throw new Error(overviewRes.error || "Failed to load Meta overview data");
          }
          cacheRef.current.overview = overviewRes;
        }

        const capabilities = overviewRes.meta?.capabilities || {};
        const returnedTimezone = overviewRes.meta?.dateRange?.timezone;
        if (returnedTimezone && returnedTimezone !== timezone && !isCustomRange) {
          cacheRef.current.timezone = returnedTimezone;
          const now = new Date();
          dateParams.until = formatTimezoneDate(now, returnedTimezone);
          const sinceDate = new Date(now.getTime() - presetDays * 24 * 60 * 60 * 1000);
          dateParams.since = formatTimezoneDate(sinceDate, returnedTimezone);
          since = dateParams.since;
          until = dateParams.until;
        }

        let prevOverviewRes = cacheRef.current.prevOverview;
        let socialRes = cacheRef.current.social;
        let fbAnalyticsRes = cacheRef.current.fbAnalytics;
        let fbContentRes = cacheRef.current.fbContent;
        let igContentRes = cacheRef.current.igContent;
        let adsRes = cacheRef.current.ads;
        let campaignsRes = cacheRef.current.campaigns;
        let adSetsRes = cacheRef.current.adSets;
        let adsLevelRes = cacheRef.current.adsLevel;
        let prevSocialRes = cacheRef.current.prevSocial;
        let prevAdsRes = cacheRef.current.prevAds;

        // Step 3: Tab-specific demand-driven dataset fetching
        if (activeTab === "overview") {
          if (!prevOverviewRes) {
            prevOverviewRes = await safeFetch(() => getMetaOverview({ ...prevDateParams, ...overviewAssetParams }, options));
            cacheRef.current.prevOverview = prevOverviewRes;
          }
          if (capabilities.social?.available || capabilities.instagram?.available) {
            if (!socialRes) {
              socialRes = await safeFetch(() => getMetaSocialInsights({ ...dateParams, ...socialAssetParams }, options));
              cacheRef.current.social = socialRes;
            }
            if (!prevSocialRes) {
              prevSocialRes = await safeFetch(() => getMetaSocialInsights({ ...prevDateParams, ...socialAssetParams }, options));
              cacheRef.current.prevSocial = prevSocialRes;
            }
          }
          if (capabilities.ads?.available) {
            if (!adsRes) {
              adsRes = await safeFetch(() => getMetaAdsInsights({ ...dateParams, ...adsAssetParams }, options));
              cacheRef.current.ads = adsRes;
            }
            if (!prevAdsRes) {
              prevAdsRes = await safeFetch(() => getMetaAdsInsights({ ...prevDateParams, ...adsAssetParams }, options));
              cacheRef.current.prevAds = prevAdsRes;
            }
          }
        } else if (activeTab === "facebook") {
          if (capabilities.social?.available) {
            if (!fbAnalyticsRes) {
              const fbParams = { ...dateParams };
              if (pageId) fbParams.pageId = pageId;
              if (!isCustomRange && presetDays) fbParams.datePreset = `${presetDays}d`;
              fbAnalyticsRes = await safeFetch(() => getMetaFacebookAnalytics(fbParams, options));
              cacheRef.current.fbAnalytics = fbAnalyticsRes;
            }
            if (!socialRes) {
              socialRes = await safeFetch(() => getMetaSocialInsights({ ...dateParams, ...socialAssetParams }, options));
              cacheRef.current.social = socialRes;
            }
            if (!prevSocialRes) {
              prevSocialRes = await safeFetch(() => getMetaSocialInsights({ ...prevDateParams, ...socialAssetParams }, options));
              cacheRef.current.prevSocial = prevSocialRes;
            }
            if (!fbContentRes) {
              fbContentRes = await safeFetch(() => getMetaContentInsights({ ...dateParams, ...fbContentAssetParams }, options));
              cacheRef.current.fbContent = fbContentRes;
            }
          }
        } else if (activeTab === "instagram") {
          // Strictly check capability first
          if (capabilities.instagram?.available) {
            if (!socialRes) {
              socialRes = await safeFetch(() => getMetaSocialInsights({ ...dateParams, ...socialAssetParams }, options));
              cacheRef.current.social = socialRes;
            }
            if (!igContentRes) {
              igContentRes = await safeFetch(() => getMetaContentInsights({ ...dateParams, ...igContentAssetParams }, options));
              cacheRef.current.igContent = igContentRes;
            }
          }
        } else if (activeTab === "ads") {
          if (capabilities.ads?.available) {
            if (!adsRes) {
              adsRes = await safeFetch(() => getMetaAdsInsights({ ...dateParams, ...adsAssetParams }, options));
              cacheRef.current.ads = adsRes;
            }
            if (!campaignsRes) {
              campaignsRes = await safeFetch(() => getMetaCampaignInsights({ ...dateParams, ...campaignAssetParams }, options));
              cacheRef.current.campaigns = campaignsRes;
            }
            if (!adSetsRes) {
              adSetsRes = await safeFetch(() => getMetaAdSetInsights({ ...dateParams, ...adSetAssetParams }, options));
              cacheRef.current.adSets = adSetsRes;
            }
            if (!adsLevelRes) {
              adsLevelRes = await safeFetch(() => getMetaAdsLevelInsights({ ...dateParams, ...adsLevelAssetParams }, options));
              cacheRef.current.adsLevel = adsLevelRes;
            }
          }
        }

        if (isMounted) {
          const fbArray = fbContentRes?.success ? (fbContentRes.data?.posts || fbContentRes.data || []) : [];
          const igArray = igContentRes?.success ? (igContentRes.data?.media || igContentRes.data || []) : [];

          setData({
            overview: overviewRes,
            social: socialRes?.success ? { data: socialRes.data, meta: socialRes.meta } : null,
            fbAnalytics: fbAnalyticsRes?.success ? { data: fbAnalyticsRes.data, meta: fbAnalyticsRes.meta } : null,
            fbContent: { data: fbArray, meta: fbContentRes?.meta },
            igContent: { data: igArray, meta: igContentRes?.meta },
            ads: adsRes?.success ? { data: adsRes.data, meta: adsRes.meta } : null,
            campaigns: campaignsRes?.success ? (campaignsRes.data?.campaigns || campaignsRes.data || []) : [],
            campaignsMeta: campaignsRes?.meta,
            adSets: adSetsRes?.success ? (adSetsRes.data?.adSets || adSetsRes.data || []) : [],
            adSetsMeta: adSetsRes?.meta,
            adsLevel: adsLevelRes?.success ? (adsLevelRes.data?.ads || adsLevelRes.data || []) : [],
            adsLevelMeta: adsLevelRes?.meta,
            prevOverview: prevOverviewRes?.success ? { data: prevOverviewRes.data } : null,
            prevSocial: prevSocialRes?.success ? { data: prevSocialRes.data } : null,
            prevAds: prevAdsRes?.success ? { data: prevAdsRes.data } : null,
            capabilities,
            dateRange: {
              since,
              until,
              prevSince,
              prevUntil,
              timezone: returnedTimezone || timezone,
              isCustom: isCustomRange,
              days: presetDays,
            },
          });

          setErrors({
            social: socialRes?.error,
            fbAnalytics: fbAnalyticsRes?.error,
            fbContent: fbContentRes?.error,
            igContent: igContentRes?.error,
            ads: adsRes?.error,
            campaigns: campaignsRes?.error,
            adSets: adSetsRes?.error,
            adsLevel: adsLevelRes?.error,
          });
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        
        console.error("Meta insights fetch error:", err);
        if (isMounted) {
          setGlobalError(err.message || "Failed to load Meta insights");
          if (err.message?.includes("429") || err.message?.toLowerCase().includes("rate limit")) {
            setErrorType("rate_limit");
          } else if (err.message?.toLowerCase().includes("auth") || err.message?.toLowerCase().includes("token") || err.message?.toLowerCase().includes("expired")) {
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

    fetchTabData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dateRangeKey, isMetaTab, activeTab, pageId, instagramAccountId, adAccountId, retryCount, isCustomRange, customStartDate, customEndDate, presetDays]);

  return {
    ...data,
    dateRange: data.dateRange || {
      since: isCustomRange ? customStartDate : null,
      until: isCustomRange ? customEndDate : null,
      isCustom: isCustomRange,
      days: presetDays,
    },
    datasetErrors: errors,
    loading: isMetaTab ? loading : false,
    error: globalError,
    errorType,
    retry,
  };
}

export function useMetaCampaigns(selectedAssets = {}) {
  const [campaigns, setCampaigns] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const adAccountId = selectedAssets?.adAccountId || null;

  useEffect(() => {
    let isMounted = true;

    async function fetchCampaigns() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const options = { signal: abortControllerRef.current.signal };

      setLoading(true);
      setError(null);
      
      try {
        const campaignParams = { limit: 10 };
        if (adAccountId) campaignParams.adAccountId = adAccountId;

        const res = await getMetaCampaignInsights(campaignParams, options);
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
        if (err.name === "AbortError") return;
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [adAccountId]);

  return { campaigns, meta, capabilities, loading, error };
}
