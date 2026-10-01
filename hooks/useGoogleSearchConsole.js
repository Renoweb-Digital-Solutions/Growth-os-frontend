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
  getGoogleComparison,
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
 * Formats a Date object to YYYY-MM-DD string using local calendar date
 */
function formatDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates start and end YYYY-MM-DD dates for a given day/range configuration in Google Search Console.
 * Predefined Search Console date ranges use endDate = today - 3 calendar days due to GSC data delay.
 */
function calculateDates(config = 28) {
  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() - 3);
  const endDate = formatDateString(endDateObj);

  let startDateObj = new Date(endDateObj.getTime());

  if (config === "24h" || config === 1) {
    // 24 hours = 1 day (same start and end date: today - 3 days)
    startDateObj = new Date(endDateObj.getTime());
  } else if (config === 7 || config === "7d") {
    startDateObj.setDate(startDateObj.getDate() - 6);
  } else if (config === 28 || config === "28d" || config === 30) {
    startDateObj.setDate(startDateObj.getDate() - 27);
  } else if (config === "3m" || config === "3months" || config === 90) {
    startDateObj.setMonth(startDateObj.getMonth() - 3);
    startDateObj.setDate(startDateObj.getDate() + 1);
  } else if (config === "6m" || config === "6months") {
    startDateObj.setMonth(startDateObj.getMonth() - 6);
  } else if (config === "12m" || config === "12months") {
    startDateObj.setFullYear(startDateObj.getFullYear() - 1);
  } else if (config === "16m" || config === "16months") {
    startDateObj.setMonth(startDateObj.getMonth() - 16);
  } else if (typeof config === "number") {
    startDateObj.setDate(startDateObj.getDate() - (config - 1));
  }

  const startDate = formatDateString(startDateObj);
  return { startDate, endDate };
}

/**
 * Calculates current and comparison YYYY-MM-DD dates for Google Search Console comparison modes.
 */
export function calculateComparisonDates(modeKey) {
  if (typeof modeKey === "object" && modeKey !== null && modeKey.isCustomCompare) {
    return {
      comparisonEnabled: true,
      comparisonType: "custom",
      granularity: "date",
      startDate: modeKey.startDate,
      endDate: modeKey.endDate,
      comparisonStartDate: modeKey.comparisonStartDate,
      comparisonEndDate: modeKey.comparisonEndDate,
      rangeLabel: `Custom (${modeKey.startDate} – ${modeKey.endDate}) vs Custom (${modeKey.comparisonStartDate} – ${modeKey.comparisonEndDate})`,
      currentLabel: `Custom (${modeKey.startDate} – ${modeKey.endDate})`,
      comparisonLabel: `Custom (${modeKey.comparisonStartDate} – ${modeKey.comparisonEndDate})`,
    };
  }

  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() - 3); // GSC 3-day reporting delay
  const endDate = formatDateString(endDateObj);

  let startDateObj = new Date(endDateObj.getTime());
  let compEndDateObj = new Date();
  let compStartDateObj = new Date();
  let comparisonType = "previous_period";
  let granularity = "date";
  let rangeLabel = "";
  let currentLabel = "";
  let comparisonLabel = "";

  if (modeKey === "24h_prev") {
    granularity = "hour";
    comparisonType = "previous_period";
    startDateObj = new Date(endDateObj.getTime());
    compEndDateObj = new Date(endDateObj.getTime());
    compEndDateObj.setDate(compEndDateObj.getDate() - 1);
    compStartDateObj = new Date(compEndDateObj.getTime());
    rangeLabel = "Last 24 hours vs Previous period";
    currentLabel = "Last 24 hours";
    comparisonLabel = "Previous period";
  } else if (modeKey === "24h_wow") {
    granularity = "hour";
    comparisonType = "year_over_year";
    startDateObj = new Date(endDateObj.getTime());
    compEndDateObj = new Date(endDateObj.getTime());
    compEndDateObj.setDate(compEndDateObj.getDate() - 7);
    compStartDateObj = new Date(compEndDateObj.getTime());
    rangeLabel = "Last 24 hours vs 7 days prior";
    currentLabel = "Last 24 hours";
    comparisonLabel = "7 days prior";
  } else if (modeKey === "7d_prev") {
    startDateObj.setDate(startDateObj.getDate() - 6);
    compEndDateObj = new Date(startDateObj.getTime());
    compEndDateObj.setDate(compEndDateObj.getDate() - 1);
    compStartDateObj = new Date(compEndDateObj.getTime());
    compStartDateObj.setDate(compStartDateObj.getDate() - 6);
    comparisonType = "previous_period";
    rangeLabel = "Last 7 days vs Previous 7 days";
    currentLabel = "Last 7 days";
    comparisonLabel = "Previous 7 days";
  } else if (modeKey === "7d_yoy") {
    startDateObj.setDate(startDateObj.getDate() - 6);
    compEndDateObj = new Date(endDateObj.getTime());
    compEndDateObj.setFullYear(compEndDateObj.getFullYear() - 1);
    compStartDateObj = new Date(startDateObj.getTime());
    compStartDateObj.setFullYear(compStartDateObj.getFullYear() - 1);
    comparisonType = "year_over_year";
    rangeLabel = "Last 7 days vs Same period last year";
    currentLabel = "Last 7 days";
    comparisonLabel = "Same period last year";
  } else if (modeKey === "28d_prev") {
    startDateObj.setDate(startDateObj.getDate() - 27);
    compEndDateObj = new Date(startDateObj.getTime());
    compEndDateObj.setDate(compEndDateObj.getDate() - 1);
    compStartDateObj = new Date(compEndDateObj.getTime());
    compStartDateObj.setDate(compStartDateObj.getDate() - 27);
    comparisonType = "previous_period";
    rangeLabel = "Last 28 days vs Previous 28 days";
    currentLabel = "Last 28 days";
    comparisonLabel = "Previous 28 days";
  } else if (modeKey === "28d_yoy") {
    startDateObj.setDate(startDateObj.getDate() - 27);
    compEndDateObj = new Date(endDateObj.getTime());
    compEndDateObj.setFullYear(compEndDateObj.getFullYear() - 1);
    compStartDateObj = new Date(startDateObj.getTime());
    compStartDateObj.setFullYear(compStartDateObj.getFullYear() - 1);
    comparisonType = "year_over_year";
    rangeLabel = "Last 28 days vs Same period last year";
    currentLabel = "Last 28 days";
    comparisonLabel = "Same period last year";
  } else if (modeKey === "3m_prev") {
    startDateObj.setMonth(startDateObj.getMonth() - 3);
    startDateObj.setDate(startDateObj.getDate() + 1);
    compEndDateObj = new Date(startDateObj.getTime());
    compEndDateObj.setDate(compEndDateObj.getDate() - 1);
    compStartDateObj = new Date(compEndDateObj.getTime());
    compStartDateObj.setMonth(compStartDateObj.getMonth() - 3);
    compStartDateObj.setDate(compStartDateObj.getDate() + 1);
    comparisonType = "previous_period";
    rangeLabel = "Last 3 months vs Previous 3 months";
    currentLabel = "Last 3 months";
    comparisonLabel = "Previous 3 months";
  } else if (modeKey === "3m_yoy") {
    startDateObj.setMonth(startDateObj.getMonth() - 3);
    startDateObj.setDate(startDateObj.getDate() + 1);
    compEndDateObj = new Date(endDateObj.getTime());
    compEndDateObj.setFullYear(compEndDateObj.getFullYear() - 1);
    compStartDateObj = new Date(startDateObj.getTime());
    compStartDateObj.setFullYear(compStartDateObj.getFullYear() - 1);
    comparisonType = "year_over_year";
    rangeLabel = "Last 3 months vs Same period last year";
    currentLabel = "Last 3 months";
    comparisonLabel = "Same period last year";
  } else if (modeKey === "6m_prev") {
    startDateObj.setMonth(startDateObj.getMonth() - 6);
    startDateObj.setDate(startDateObj.getDate() + 1);
    compEndDateObj = new Date(startDateObj.getTime());
    compEndDateObj.setDate(compEndDateObj.getDate() - 1);
    compStartDateObj = new Date(compEndDateObj.getTime());
    compStartDateObj.setMonth(compStartDateObj.getMonth() - 6);
    compStartDateObj.setDate(compStartDateObj.getDate() + 1);
    comparisonType = "previous_period";
    rangeLabel = "Last 6 months vs Previous 6 months";
    currentLabel = "Last 6 months";
    comparisonLabel = "Previous 6 months";
  }

  return {
    comparisonEnabled: true,
    comparisonType,
    granularity,
    startDate: formatDateString(startDateObj),
    endDate: formatDateString(endDateObj),
    comparisonStartDate: formatDateString(compStartDateObj),
    comparisonEndDate: formatDateString(compEndDateObj),
    rangeLabel,
    currentLabel,
    comparisonLabel,
  };
}

/**
 * React Hook for orchestrating Google Search Console connection status,
 * verified property selection, user persistence, and insights data fetching.
 */
export function useGoogleSearchConsole(initialConfig = 28) {
  // Parse initial date range config
  const isInitialCompare = typeof initialConfig === "object" && initialConfig !== null && (initialConfig.isCompare || initialConfig.isCustomCompare);

  const initialCompDates = isInitialCompare
    ? calculateComparisonDates(initialConfig.isCustomCompare ? initialConfig : initialConfig.compareKey)
    : null;

  const initialDays = typeof initialConfig === "number" || typeof initialConfig === "string" ? initialConfig : initialConfig?.dateRangeDays || 28;
  const initialDates = initialCompDates || calculateDates(initialDays);

  const [dateRangeDays, setDateRangeDaysState] = useState(initialDays);
  const [startDate, setStartDate] = useState(typeof initialConfig === "object" && initialConfig?.startDate ? initialConfig.startDate : initialDates.startDate);
  const [endDate, setEndDate] = useState(typeof initialConfig === "object" && initialConfig?.endDate ? initialConfig.endDate : initialDates.endDate);

  // Explicit Comparison State
  const [comparisonEnabled, setComparisonEnabled] = useState(isInitialCompare);
  const [comparisonType, setComparisonType] = useState(initialCompDates?.comparisonType || "previous_period");
  const [comparisonStartDate, setComparisonStartDate] = useState(initialCompDates?.comparisonStartDate || null);
  const [comparisonEndDate, setComparisonEndDate] = useState(initialCompDates?.comparisonEndDate || null);
  const [granularity, setGranularity] = useState(initialCompDates?.granularity || "date");
  const [rangeLabel, setRangeLabel] = useState(initialCompDates?.rangeLabel || "");
  const [currentLabel, setCurrentLabel] = useState(initialCompDates?.currentLabel || "");
  const [comparisonLabel, setComparisonLabel] = useState(initialCompDates?.comparisonLabel || "");

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
    comparison: null,
    comparisonQueries: null,
    comparisonPages: null,
    comparisonCountries: null,
    comparisonDevices: null,
  });

  const [datasetErrors, setDatasetErrors] = useState({
    overview: null,
    performance: null,
    queries: null,
    pages: null,
    countries: null,
    devices: null,
    comparison: null,
    comparisonQueries: null,
    comparisonPages: null,
    comparisonCountries: null,
    comparisonDevices: null,
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
    setAnalyticsData({
      overview: null,
      performance: null,
      queries: null,
      pages: null,
      countries: null,
      devices: null,
      comparison: null,
      comparisonQueries: null,
      comparisonPages: null,
      comparisonCountries: null,
      comparisonDevices: null,
    });
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

  // Handler to update date ranges & comparison state flexibly
  const setDateRange = useCallback((config) => {
    const isCompareObj = typeof config === "object" && config !== null && (config.isCompare || config.isCustomCompare);

    if (isCompareObj) {
      const compareKey = config.isCustomCompare ? config : config.compareKey;
      const compDates = calculateComparisonDates(compareKey);
      setComparisonEnabled(true);
      setComparisonType(compDates.comparisonType);
      setGranularity(compDates.granularity);
      setStartDate(compDates.startDate);
      setEndDate(compDates.endDate);
      setComparisonStartDate(compDates.comparisonStartDate);
      setComparisonEndDate(compDates.comparisonEndDate);
      setRangeLabel(compDates.rangeLabel);
      setCurrentLabel(compDates.currentLabel);
      setComparisonLabel(compDates.comparisonLabel);
      setDateRangeDaysState("compare");
    } else {
      setComparisonEnabled(false);
      setComparisonType("previous_period");
      setComparisonStartDate(null);
      setComparisonEndDate(null);
      setGranularity("date");
      setRangeLabel("");
      setCurrentLabel("");
      setComparisonLabel("");

      if (typeof config === "number" || typeof config === "string") {
        const dates = calculateDates(config);
        setDateRangeDaysState(config);
        setStartDate(dates.startDate);
        setEndDate(dates.endDate);
      } else if (typeof config === "object" && config !== null) {
        if (config.isCustom || config.startDate) setDateRangeDaysState("custom");
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
            comparison: null,
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

        const fetchPromises = [
          safeFetch(() => getGoogleOverview(validProperty, dateOptions)),
          safeFetch(() => getGooglePerformance(validProperty, dateOptions)),
          safeFetch(() => getGoogleQueries(validProperty, dateOptions)),
          safeFetch(() => getGooglePages(validProperty, dateOptions)),
          safeFetch(() => getGoogleCountries(validProperty, dateOptions)),
          safeFetch(() => getGoogleDevices(validProperty, dateOptions)),
        ];

        if (comparisonEnabled) {
          const compOptions = {
            siteUrl: validProperty,
            startDate,
            endDate,
            comparisonType,
            comparisonStartDate,
            comparisonEndDate,
            granularity,
            signal: options.signal,
          };

          if (granularity === "hour") {
            let userTimezone = null;
            if (typeof window !== "undefined" && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
              try {
                const resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (resolvedTz && typeof resolvedTz === "string" && resolvedTz.trim()) {
                  userTimezone = resolvedTz.trim();
                }
              } catch (tzErr) {
                console.error("Failed to resolve browser timezone:", tzErr);
              }
            }
            if (userTimezone) {
              compOptions.timezone = userTimezone;
            }
          }

          fetchPromises.push(safeFetch(() => getGoogleComparison(validProperty, compOptions)));

          if (comparisonStartDate && comparisonEndDate) {
            const compBreakdownOptions = {
              siteUrl: validProperty,
              startDate: comparisonStartDate,
              endDate: comparisonEndDate,
              signal: options.signal,
            };
            fetchPromises.push(safeFetch(() => getGoogleQueries(validProperty, compBreakdownOptions)));
            fetchPromises.push(safeFetch(() => getGooglePages(validProperty, compBreakdownOptions)));
            fetchPromises.push(safeFetch(() => getGoogleCountries(validProperty, compBreakdownOptions)));
            fetchPromises.push(safeFetch(() => getGoogleDevices(validProperty, compBreakdownOptions)));
          }
        }

        const results = await Promise.all(fetchPromises);
        const [
          overviewRes,
          performanceRes,
          queriesRes,
          pagesRes,
          countriesRes,
          devicesRes,
          comparisonRes,
          compQueriesRes,
          compPagesRes,
          compCountriesRes,
          compDevicesRes,
        ] = results;

        if (!isMounted) return;

        setAnalyticsData({
          overview: overviewRes.success ? overviewRes.data : null,
          performance: performanceRes.success ? performanceRes.data : null,
          queries: queriesRes.success ? queriesRes.data : null,
          pages: pagesRes.success ? pagesRes.data : null,
          countries: countriesRes.success ? countriesRes.data : null,
          devices: devicesRes.success ? devicesRes.data : null,
          comparison: comparisonRes?.success ? comparisonRes.data : null,
          comparisonQueries: compQueriesRes?.success ? compQueriesRes.data : null,
          comparisonPages: compPagesRes?.success ? compPagesRes.data : null,
          comparisonCountries: compCountriesRes?.success ? compCountriesRes.data : null,
          comparisonDevices: compDevicesRes?.success ? compDevicesRes.data : null,
        });

        setDatasetErrors({
          overview: overviewRes.error,
          performance: performanceRes.error,
          queries: queriesRes.error,
          pages: pagesRes.error,
          countries: countriesRes.error,
          devices: devicesRes.error,
          comparison: comparisonRes?.error,
          comparisonQueries: compQueriesRes?.error,
          comparisonPages: compPagesRes?.error,
          comparisonCountries: compCountriesRes?.error,
          comparisonDevices: compDevicesRes?.error,
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
  }, [dateRangeDays, startDate, endDate, comparisonEnabled, comparisonType, comparisonStartDate, comparisonEndDate, granularity, retryCount, getStorageKey]);

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

    // Date Range & Comparison
    dateRangeDays,
    startDate,
    endDate,
    setDateRange,
    comparisonEnabled,
    comparisonType,
    comparisonStartDate,
    comparisonEndDate,
    granularity,
    rangeLabel,
    currentLabel,
    comparisonLabel,

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

