"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getGA4Status,
  getGA4Properties,
  selectGA4Property as selectGA4PropertyApi,
  getGA4Overview,
  getGA4TrafficAcquisition,
  getGA4UserAcquisition,
} from "@/lib/googleAnalyticsApi";

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
 * Calculates start and end YYYY-MM-DD dates for a given day/range configuration for GA4.
 */
function calculateGA4Dates(config = "28d") {
  const now = new Date();

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(now);

  const yesterdayObj = new Date(now);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayObj);

  if (config === "24h" || config === "24H" || config === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (config === "yesterday") {
    return { startDate: yesterdayStr, endDate: yesterdayStr };
  }

  if (config === "7d" || config === "7D" || config === 7) {
    const start = new Date(yesterdayObj);
    start.setDate(start.getDate() - 6);
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  if (config === "28d" || config === "28D" || config === 28) {
    const start = new Date(yesterdayObj);
    start.setDate(start.getDate() - 27);
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  if (config === "30d" || config === "30D" || config === 30) {
    const start = new Date(yesterdayObj);
    start.setDate(start.getDate() - 29);
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  if (config === "3m" || config === "3M" || config === "90d" || config === 90) {
    const start = new Date(yesterdayObj);
    start.setDate(start.getDate() - 89);
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  if (config === "6m" || config === "6M") {
    const start = new Date(yesterdayObj);
    start.setMonth(start.getMonth() - 6);
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  if (config === "12m" || config === "12M") {
    const start = new Date(yesterdayObj);
    start.setFullYear(start.getFullYear() - 1);
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  if (config === "this_week") {
    const sun = new Date(now);
    sun.setDate(now.getDate() - now.getDay());
    return { startDate: formatDate(sun), endDate: todayStr };
  }

  if (config === "last_week") {
    const sun = new Date(now);
    sun.setDate(now.getDate() - now.getDay() - 7);
    const sat = new Date(sun);
    sat.setDate(sun.getDate() + 6);
    return { startDate: formatDate(sun), endDate: formatDate(sat) };
  }

  if (config === "this_month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: formatDate(firstDay), endDate: todayStr };
  }

  if (config === "last_month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
  }

  if (config === "quarter_to_date") {
    const currentMonth = now.getMonth();
    const qStartMonth = Math.floor(currentMonth / 3) * 3;
    const firstDay = new Date(now.getFullYear(), qStartMonth, 1);
    return { startDate: formatDate(firstDay), endDate: todayStr };
  }

  if (config === "this_year") {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    return { startDate: formatDate(firstDay), endDate: todayStr };
  }

  if (config === "last_year") {
    const firstDay = new Date(now.getFullYear() - 1, 0, 1);
    const lastDay = new Date(now.getFullYear() - 1, 11, 31);
    return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
  }

  if (typeof config === "number") {
    const start = new Date(yesterdayObj);
    start.setDate(start.getDate() - (config - 1));
    return { startDate: formatDate(start), endDate: yesterdayStr };
  }

  const defaultStart = new Date(yesterdayObj);
  defaultStart.setDate(defaultStart.getDate() - 27);
  return { startDate: formatDate(defaultStart), endDate: yesterdayStr };
}

/**
 * React Hook for Google Analytics 4 status, property discovery, active property selection,
 * date range synchronization, and overview/acquisition data fetching.
 */
export function useGoogleAnalytics(initialConfig = "28d", activeTab = "overview") {
  const isInitialCompare = typeof initialConfig === "object" && initialConfig !== null && (initialConfig.isCompare || initialConfig.isCustomCompare);

  const initialDays = typeof initialConfig === "number" || typeof initialConfig === "string" ? initialConfig : "28d";
  const initialDates = calculateGA4Dates(initialDays);

  const [startDate, setStartDate] = useState(typeof initialConfig === "object" && initialConfig?.startDate ? initialConfig.startDate : initialDates.startDate);
  const [endDate, setEndDate] = useState(typeof initialConfig === "object" && initialConfig?.endDate ? initialConfig.endDate : initialDates.endDate);

  // Comparison State (GA4 Overview displays previous_period comparison by default)
  const isExplicitNoCompare = typeof initialConfig === "object" && initialConfig !== null && initialConfig.comparisonEnabled === false;
  const [comparisonEnabled, setComparisonEnabled] = useState(!isExplicitNoCompare);
  const [comparisonType, setComparisonType] = useState(
    isInitialCompare && initialConfig.compareKey?.includes("yoy") ? "year_over_year" : "previous_period"
  );
  const [comparisonStartDate, setComparisonStartDate] = useState(null);
  const [comparisonEndDate, setComparisonEndDate] = useState(null);

  // Connection & Status State
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Properties State
  const [properties, setProperties] = useState([]);
  const [propertiesError, setPropertiesError] = useState(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedPropertyState] = useState(null);
  const [selectedPropertyObj, setSelectedPropertyObj] = useState(null);
  const [isSwitchingProperty, setIsSwitchingProperty] = useState(false);

  // Selected Trend Chart Metric State (Defaults to 'activeUsers')
  const [selectedTrendMetric, setSelectedTrendMetric] = useState("activeUsers");

  // Datasets State
  const [analyticsData, setAnalyticsData] = useState({
    overview: null,
    trafficAcquisition: null,
    userAcquisition: null,
  });

  const [datasetErrors, setDatasetErrors] = useState({
    overview: null,
    trafficAcquisition: null,
    userAcquisition: null,
  });

  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

  // Storage key helper for user-scoped property persistence
  const getStorageKey = useCallback(() => {
    const userId = getCurrentUserId();
    return `growthos_selected_ga4_property_${userId}`;
  }, []);

  // Update date ranges from external config (AnalyticsHeader)
  const setDateRange = useCallback((config) => {
    const isCompareObj = typeof config === "object" && config !== null && (config.isCompare || config.isCustomCompare);
    const isExplicitNoCompareConfig = typeof config === "object" && config !== null && config.comparisonEnabled === false;

    if (isCompareObj) {
      setComparisonEnabled(true);
      if (config.isCustomCompare) {
        setComparisonType("custom");
        setStartDate(config.startDate);
        setEndDate(config.endDate);
        setComparisonStartDate(config.comparisonStartDate);
        setComparisonEndDate(config.comparisonEndDate);
      } else {
        const compareKey = config.compareKey;
        if (compareKey?.includes("yoy")) {
          setComparisonType("year_over_year");
        } else {
          setComparisonType("previous_period");
        }
        setComparisonStartDate(null);
        setComparisonEndDate(null);
      }
    } else if (isExplicitNoCompareConfig) {
      setComparisonEnabled(false);
      setComparisonType("none");
      setComparisonStartDate(null);
      setComparisonEndDate(null);
    } else {
      // Standard preset date range (28d, 7d, 3m, 24h) defaults to previous_period comparison enabled for GA4
      setComparisonEnabled(true);
      setComparisonType("previous_period");
      setComparisonStartDate(null);
      setComparisonEndDate(null);

      if (typeof config === "number" || typeof config === "string") {
        const dates = calculateGA4Dates(config);
        setStartDate(dates.startDate);
        setEndDate(dates.endDate);
      } else if (typeof config === "object" && config !== null) {
        if (config.startDate) setStartDate(config.startDate);
        if (config.endDate) setEndDate(config.endDate);
      }
    }
  }, []);

  // Handler to switch selected property via backend API and localStorage
  const selectProperty = useCallback(async (propertyId) => {
    if (!propertyId) return;
    const cleanId = String(propertyId).replace("properties/", "").trim();
    setIsSwitchingProperty(true);

    try {
      const res = await selectGA4PropertyApi(cleanId);
      if (res?.success) {
        setSelectedPropertyState(cleanId);
        if (res.data) {
          setSelectedPropertyObj(res.data);
        }
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(getStorageKey(), cleanId);
          } catch (e) {
            console.error("Failed to save GA4 property to localStorage:", e);
          }
        }
        // Force refetch analytics datasets
        setRetryCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Failed to select GA4 property:", err);
      setPropertiesError(err.message || "Failed to switch property");
    } finally {
      setIsSwitchingProperty(false);
    }
  }, [getStorageKey]);

  // Refresh trigger
  const refresh = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // Main status and property discovery effect
  useEffect(() => {
    let isMounted = true;

    async function fetchStatusAndProperties() {
      setIsLoadingStatus(true);
      setStatusError(null);

      try {
        const statusRes = await getGA4Status();
        if (!isMounted) return;

        setStatus(statusRes);
        setIsLoadingStatus(false);

        if (!statusRes?.connected || !statusRes?.hasAnalyticsScope) {
          setProperties([]);
          setSelectedPropertyState(null);
          setSelectedPropertyObj(null);
          setIsLoadingProperties(false);
          return;
        }

        // Fetch accessible properties
        setIsLoadingProperties(true);
        const propsRes = await getGA4Properties();
        if (!isMounted) return;

        const propsList = propsRes?.data?.properties || propsRes?.properties || [];
        setProperties(propsList);

        let activeProperty = propsRes?.data?.selectedProperty || propsList.find((p) => p.isSelected) || propsList[0];

        // Check local storage override if matching accessible property
        if (typeof window !== "undefined") {
          try {
            const storedId = localStorage.getItem(getStorageKey());
            if (storedId) {
              const matched = propsList.find((p) => String(p.propertyId) === String(storedId));
              if (matched) activeProperty = matched;
            }
          } catch (e) {
            console.error("Failed to read stored GA4 property:", e);
          }
        }

        if (activeProperty) {
          const cleanId = String(activeProperty.propertyId || activeProperty.id).replace("properties/", "").trim();
          setSelectedPropertyState(cleanId);
          setSelectedPropertyObj(activeProperty);
        }
      } catch (err) {
        console.error("Failed to initialize GA4 integration:", err);
        if (isMounted) setStatusError(err.message || "Failed to load Google Analytics status");
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
          setIsLoadingProperties(false);
        }
      }
    }

    fetchStatusAndProperties();

    return () => {
      isMounted = false;
    };
  }, [getStorageKey, retryCount]);

  // Fetch Analytics datasets effect (Overview, Traffic Acquisition, User Acquisition)
  useEffect(() => {
    let isMounted = true;
    if (activeTab && activeTab !== "ga4") {
      setIsLoadingAnalytics(false);
      return;
    }
    if (!status?.connected || !status?.hasAnalyticsScope || !selectedProperty) {
      return;
    }

    async function fetchAnalytics() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const options = { signal: abortControllerRef.current.signal };

      setIsLoadingAnalytics(true);
      setAnalyticsError(null);

      const queryParams = {
        propertyId: selectedProperty,
        startDate,
        endDate,
        comparisonType: comparisonEnabled ? comparisonType : "none",
        trendMetric: selectedTrendMetric,
        ...(comparisonStartDate ? { comparisonStartDate } : {}),
        ...(comparisonEndDate ? { comparisonEndDate } : {}),
      };

      console.log("[GA4 RUNTIME] overview request params:", queryParams);

      const safeFetch = async (fetchFn) => {
        try {
          const res = await fetchFn();
          return { success: true, data: res?.data ?? res, error: null };
        } catch (err) {
          if (err.name === "AbortError") throw err;
          return { success: false, data: null, error: err.message || "Request failed" };
        }
      };

      try {
        const [overviewRes, trafficRes, userRes] = await Promise.all([
          safeFetch(() => getGA4Overview(queryParams, options)),
          safeFetch(() => getGA4TrafficAcquisition({ ...queryParams, limit: 50 }, options)),
          safeFetch(() => getGA4UserAcquisition({ ...queryParams, limit: 50 }, options)),
        ]);

        if (!isMounted) return;

        if (overviewRes.success) {
          console.log("[GA4 RUNTIME] overview response:", overviewRes.data);
          console.log("[GA4 FRONTEND DEBUG] Overview response:", overviewRes.data);
        }

        setAnalyticsData({
          overview: overviewRes.success ? overviewRes.data : null,
          trafficAcquisition: trafficRes.success ? trafficRes.data : null,
          userAcquisition: userRes.success ? userRes.data : null,
        });

        setDatasetErrors({
          overview: overviewRes.error,
          trafficAcquisition: trafficRes.error,
          userAcquisition: userRes.error,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("GA4 Insights fetch error:", err);
        if (isMounted) setAnalyticsError(err.message || "Failed to load Google Analytics data");
      } finally {
        if (isMounted) setIsLoadingAnalytics(false);
      }
    }

    fetchAnalytics();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedProperty, startDate, endDate, comparisonEnabled, comparisonType, comparisonStartDate, comparisonEndDate, selectedTrendMetric, retryCount, status?.connected, status?.hasAnalyticsScope, activeTab]);

  const isConnected = status?.connected === true && status?.hasAnalyticsScope === true;
  const isLoading = isLoadingStatus || isLoadingProperties || isLoadingAnalytics || isSwitchingProperty;
  const globalError = statusError || propertiesError || analyticsError;

  return {
    status,
    isConnected,
    hasAnalyticsScope: status?.hasAnalyticsScope === true,
    isLoadingStatus,
    statusError,

    properties,
    selectedProperty,
    selectedPropertyObj,
    selectProperty,
    isLoadingProperties,
    isSwitchingProperty,
    propertiesError,

    startDate,
    endDate,
    setDateRange,
    comparisonEnabled,
    comparisonType,

    selectedTrendMetric,
    setSelectedTrendMetric,

    analyticsData,
    datasetErrors,
    isLoadingAnalytics,
    analyticsError,

    isLoading,
    error: globalError,
    refresh,
  };
}

export default useGoogleAnalytics;
