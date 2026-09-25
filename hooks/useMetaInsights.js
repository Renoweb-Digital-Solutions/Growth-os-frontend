"use client";

import { useState, useEffect, useRef } from "react";
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
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }
}

export function useMetaInsights(dateRangeDays, activeTab = "overview", selectedAssets = {}, adsDrillState = {}) {
  const [data, setData] = useState({
    overview: null,
    social: null,
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
  });

  const [errors, setErrors] = useState({
    overview: null,
    social: null,
    fbContent: null,
    igContent: null,
    ads: null,
    campaigns: null,
    adSets: null,
    adsLevel: null,
  });

  const [loading, setLoading] = useState(true);
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

  // Reset cache on dateRangeDays, selected assets, or retryCount change
  useEffect(() => {
    cacheRef.current = {};
  }, [dateRangeDays, pageId, instagramAccountId, adAccountId, retryCount]);

  useEffect(() => {
    let isMounted = true;

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

        // Step 1: Ensure Overview & Capabilities are known
        let overviewRes = cacheRef.current.overview;
        if (!overviewRes) {
          overviewRes = await safeFetch(() => getMetaOverview(overviewAssetParams, options));
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
        const timezone = overviewRes.meta?.dateRange?.timezone || "UTC";

        // Calculate since and until based on Ad Account Timezone
        const now = new Date();
        const until = formatTimezoneDate(now, timezone);
        const sinceDate = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
        const since = formatTimezoneDate(sinceDate, timezone);
        const dateParams = { since, until };

        // Previous period calculation for comparison
        const prevUntilDate = new Date(sinceDate.getTime() - 24 * 60 * 60 * 1000);
        const prevSinceDate = new Date(prevUntilDate.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
        const prevUntil = formatTimezoneDate(prevUntilDate, timezone);
        const prevSince = formatTimezoneDate(prevSinceDate, timezone);
        const prevDateParams = { since: prevSince, until: prevUntil };

        let prevOverviewRes = cacheRef.current.prevOverview;
        let socialRes = cacheRef.current.social;
        let fbContentRes = cacheRef.current.fbContent;
        let igContentRes = cacheRef.current.igContent;
        let adsRes = cacheRef.current.ads;
        let campaignsRes = cacheRef.current.campaigns;
        let adSetsRes = cacheRef.current.adSets;
        let adsLevelRes = cacheRef.current.adsLevel;
        let prevSocialRes = cacheRef.current.prevSocial;
        let prevAdsRes = cacheRef.current.prevAds;

        // Step 2: Tab-specific demand-driven dataset fetching
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
            if (!socialRes) {
              socialRes = await safeFetch(() => getMetaSocialInsights({ ...dateParams, ...socialAssetParams }, options));
              cacheRef.current.social = socialRes;
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
          });

          setErrors({
            social: socialRes?.error,
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
  }, [dateRangeDays, activeTab, pageId, instagramAccountId, adAccountId, retryCount]);

  return { ...data, datasetErrors: errors, loading, error: globalError, errorType, retry };
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
