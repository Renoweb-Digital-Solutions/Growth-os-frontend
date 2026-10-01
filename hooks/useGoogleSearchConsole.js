"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getGoogleStatus,
  getGoogleProperties,
  getGoogleOverview,
  getGooglePerformance,
  getGoogleQueries,
  getGooglePages,
  getGoogleCountries,
  getGoogleDevices,
} from "@/lib/googleSearchConsoleApi";

/**
 * Extracts current user identity key to scope localStorage persistence
 */
function getCurrentUserId() {
  if (typeof window === "undefined") return "default_user";
  const token = localStorage.getItem("token");
  if (!token) return "guest_user";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user?.id || payload.user?.email || payload.id || payload.sub || "authenticated_user";
  } catch (e) {
    return "authenticated_user";
  }
}

/**
 * Calculates start and end YYYY-MM-DD dates for a given day range
 */
function calculateDates(days = 30) {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const startDate = pastDate.toISOString().split("T")[0];
  return { startDate, endDate };
}

/**
 * React Hook for orchestrating Google Search Console connection status,
 * verified property selection, user persistence, and insights data fetching.
 */
export function useGoogleSearchConsole(initialConfig = 30) {
  // Parse initial date range config
  const initialDays = typeof initialConfig === "number" ? initialConfig : initialConfig?.dateRangeDays || 30;
  const initialDates = calculateDates(initialDays);

  const [dateRangeDays, setDateRangeDaysState] = useState(initialDays);
  const [startDate, setStartDate] = useState(typeof initialConfig === "object" && initialConfig?.startDate ? initialConfig.startDate : initialDates.startDate);
  const [endDate, setEndDate] = useState(typeof initialConfig === "object" && initialConfig?.endDate ? initialConfig.endDate : initialDates.endDate);

  // Connection & Status State
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Properties State
  const [properties, setProperties] = useState([]);
  const [propertiesError, setPropertiesError] = useState(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedPropertyState] = useState(null);

  // Analytics Datasets & Errors State
  const [analyticsData, setAnalyticsData] = useState({
    overview: null,
    performance: null,
    queries: null,
    pages: null,
    countries: null,
    devices: null,
  });

  const [datasetErrors, setDatasetErrors] = useState({
    overview: null,
    performance: null,
    queries: null,
    pages: null,
    countries: null,
    devices: null,
  });

  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

  // Storage key helper for user-scoped property persistence
  const getStorageKey = useCallback(() => {
    const userId = getCurrentUserId();
    return `growthos_selected_gsc_property_${userId}`;
  }, []);

  // Update selected property state and persist to localStorage
  const setSelectedProperty = useCallback((siteUrl) => {
    const targetUrl = siteUrl ? String(siteUrl) : null;
    setSelectedPropertyState(targetUrl);
    if (typeof window !== "undefined") {
      try {
        const storageKey = getStorageKey();
        if (targetUrl) {
          localStorage.setItem(storageKey, targetUrl);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.error("Failed to save GSC property selection to localStorage:", e);
      }
    }
  }, [getStorageKey]);

  // Handler to update date ranges flexibly
  const setDateRange = useCallback((config) => {
    if (typeof config === "number") {
      const dates = calculateDates(config);
      setDateRangeDaysState(config);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    } else if (typeof config === "object" && config !== null) {
      if (config.days) {
        setDateRangeDaysState(config.days);
        const dates = calculateDates(config.days);
        setStartDate(config.startDate || dates.startDate);
        setEndDate(config.endDate || dates.endDate);
      } else {
        if (config.startDate) setStartDate(config.startDate);
        if (config.endDate) setEndDate(config.endDate);
      }
    }
  }, []);

  // Manual refresh trigger
  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // Main orchestration effect
  useEffect(() => {
    let isMounted = true;

    async function fetchGscFlow() {
      // Abort previous in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const options = { signal: abortControllerRef.current.signal };

      setIsLoadingStatus(true);
      setStatusError(null);

      try {
        // Step 1: Fetch Connection Status
        const statusRes = await getGoogleStatus(options);
        if (!isMounted) return;

        // Sanitize status response (ensure no credentials/tokens exposed)
        const sanitizedStatus = {
          connected: statusRes?.connected === true,
          status: statusRes?.status || (statusRes?.connected ? "connected" : "disconnected"),
          connectedAt: statusRes?.connectedAt || null,
          userEmail: statusRes?.userEmail || statusRes?.googleEmail || null,
        };

        setStatus(sanitizedStatus);
        setIsLoadingStatus(false);

        if (!sanitizedStatus.connected) {
          setProperties([]);
          setSelectedPropertyState(null);
          setIsLoadingProperties(false);
          setIsLoadingAnalytics(false);
          return;
        }

        // Step 2: Fetch Verified Properties (only when connected)
        setIsLoadingProperties(true);
        setPropertiesError(null);

        let propertiesList = [];
        try {
          const propsRes = await getGoogleProperties(options);
          if (!isMounted) return;

          propertiesList = Array.isArray(propsRes)
            ? propsRes
            : Array.isArray(propsRes?.data)
            ? propsRes.data
            : Array.isArray(propsRes?.properties)
            ? propsRes.properties
            : [];

          setProperties(propertiesList);
        } catch (propErr) {
          if (propErr.name === "AbortError") return;
          console.error("Failed to fetch Google Search Console properties:", propErr);
          if (isMounted) setPropertiesError(propErr.message || "Failed to load Search Console properties");
        } finally {
          if (isMounted) setIsLoadingProperties(false);
        }

        // Validate stored property against fetched properties list
        let validProperty = null;
        if (typeof window !== "undefined") {
          try {
            const storageKey = getStorageKey();
            const storedProperty = localStorage.getItem(storageKey);
            if (storedProperty && propertiesList.length > 0) {
              const matched = propertiesList.find(
                (p) => String(p.siteUrl || p.site_url || p) === String(storedProperty)
              );
              if (matched) {
                validProperty = String(matched.siteUrl || matched.site_url || matched);
              }
            }
          } catch (e) {
            console.error("Failed to read GSC property from localStorage:", e);
          }
        }

        setSelectedPropertyState(validProperty);

        // Step 3: Fetch Analytics Datasets (ONLY if valid selected property exists)
        if (!validProperty) {
          setIsLoadingAnalytics(false);
          setAnalyticsData({
            overview: null,
            performance: null,
            queries: null,
            pages: null,
            countries: null,
            devices: null,
          });
          return;
        }

        setIsLoadingAnalytics(true);
        setAnalyticsError(null);

        const dateOptions = { siteUrl: validProperty, startDate, endDate, signal: options.signal };

        const safeFetch = async (fetchFn) => {
          try {
            const res = await fetchFn();
            return { success: true, data: res?.data ?? res, error: null };
          } catch (err) {
            if (err.name === "AbortError") throw err;
            return { success: false, data: null, error: err.message || "Request failed" };
          }
        };

        const [
          overviewRes,
          performanceRes,
          queriesRes,
          pagesRes,
          countriesRes,
          devicesRes,
        ] = await Promise.all([
          safeFetch(() => getGoogleOverview(validProperty, dateOptions)),
          safeFetch(() => getGooglePerformance(validProperty, dateOptions)),
          safeFetch(() => getGoogleQueries(validProperty, dateOptions)),
          safeFetch(() => getGooglePages(validProperty, dateOptions)),
          safeFetch(() => getGoogleCountries(validProperty, dateOptions)),
          safeFetch(() => getGoogleDevices(validProperty, dateOptions)),
        ]);

        if (!isMounted) return;

        setAnalyticsData({
          overview: overviewRes.success ? overviewRes.data : null,
          performance: performanceRes.success ? performanceRes.data : null,
          queries: queriesRes.success ? queriesRes.data : null,
          pages: pagesRes.success ? pagesRes.data : null,
          countries: countriesRes.success ? countriesRes.data : null,
          devices: devicesRes.success ? devicesRes.data : null,
        });

        setDatasetErrors({
          overview: overviewRes.error,
          performance: performanceRes.error,
          queries: queriesRes.error,
          pages: pagesRes.error,
          countries: countriesRes.error,
          devices: devicesRes.error,
        });

      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Google Search Console hook fetch error:", err);
        if (isMounted) {
          setStatusError(err.message || "Failed to load Google Search Console status");
        }
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
          setIsLoadingAnalytics(false);
        }
      }
    }

    fetchGscFlow();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dateRangeDays, startDate, endDate, retryCount, getStorageKey]);

  const isConnected = status?.connected === true;
  const isLoading = isLoadingStatus || isLoadingProperties || isLoadingAnalytics;
  const globalError = statusError || propertiesError || analyticsError;

  return {
    // Status
    status,
    isConnected,
    isLoadingStatus,
    statusError,

    // Properties & Selection
    properties,
    selectedProperty,
    setSelectedProperty,
    isLoadingProperties,
    propertiesError,

    // Date Range
    dateRangeDays,
    startDate,
    endDate,
    setDateRange,

    // Analytics Data & Dataset Errors
    analyticsData,
    datasetErrors,
    isLoadingAnalytics,
    analyticsError,

    // Overall State & Methods
    isLoading,
    error: globalError,
    refresh,
  };
}

export default useGoogleSearchConsole;
