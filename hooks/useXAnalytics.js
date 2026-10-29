"use client";

// Reason: Custom hook encapsulating X (Twitter) connection lifecycle, lazy daily analytics,
// and recent posts retrieval with request deduplication and abort controller cleanup.
// How: Communicates with backend endpoints through lib/xApi.js, manages loading and error states,
// preserves backend response structures, and supports demand-driven data fetching.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getXStatus,
  connectX,
  disconnectX,
  getXAnalyticsOverview,
  getXRecentPosts,
} from "@/lib/xApi";

export function useXAnalytics(options = {}) {
  const { autoFetch = true } = options;

  const [status, setStatus] = useState({
    connected: false,
    status: "loading",
    account: null,
  });

  const [overview, setOverview] = useState(null);
  const [posts, setPosts] = useState(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [error, setError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [postsError, setPostsError] = useState(null);

  const abortControllerRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch connection status
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await getXStatus();
      if (res && res.success !== false) {
        setStatus({
          connected: Boolean(res.connected),
          status: res.status || (res.connected ? "connected" : "disconnected"),
          account: res.account || null,
          lastSyncedAt: res.lastSyncedAt || null,
          grantedScopes: res.grantedScopes || [],
        });
        return res;
      }
      return null;
    } catch (err) {
      if (err?.name === "AbortError") return null;
      console.error("Failed to load X status:", err);
      setStatus({
        connected: false,
        status: "error",
        account: null,
      });
      if (err?.status !== 401) {
        setError(err?.message || "Failed to load X connection status.");
      }
      return null;
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Fetch analytics overview & posts (with deduplication)
  const fetchAnalytics = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const fetchOptions = { signal: abortControllerRef.current.signal };

    setIsLoadingAnalytics(true);
    setAnalyticsError(null);

    try {
      const overviewRes = await getXAnalyticsOverview(fetchOptions);
      if (overviewRes && overviewRes.success !== false) {
        setOverview(overviewRes);
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Failed to fetch X analytics overview:", err);
      setAnalyticsError(err?.message || "Failed to fetch X analytics overview.");
    } finally {
      setIsLoadingAnalytics(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch recent posts separately or as drill-down
  const fetchRecentPosts = useCallback(async (params = {}) => {
    setIsLoadingPosts(true);
    setPostsError(null);

    try {
      const postsRes = await getXRecentPosts(params);
      if (postsRes && postsRes.success !== false) {
        setPosts(postsRes);
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Failed to fetch X recent posts:", err);
      setPostsError(err?.message || "Failed to fetch X recent posts.");
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  // Full refresh helper
  const refresh = useCallback(async () => {
    setIsLoadingStatus(true);
    const statusRes = await fetchStatus();
    if (statusRes?.connected) {
      await fetchAnalytics();
    } else {
      setOverview(null);
      setPosts(null);
    }
  }, [fetchStatus, fetchAnalytics]);

  // Connect helper: requests OAuth PKCE authorization URL and navigates
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await connectX();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Invalid response from X connect endpoint: missing authorization URL.");
      }
    } catch (err) {
      console.error("Failed to initiate X connection:", err);
      setError(err?.message || "Failed to initiate X connection.");
      setIsConnecting(false);
    }
  }, []);

  // Disconnect helper: requests server-side token revocation and clears local state
  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      await disconnectX();
      setStatus({
        connected: false,
        status: "disconnected",
        account: null,
      });
      setOverview(null);
      setPosts(null);
      return true;
    } catch (err) {
      console.error("Failed to disconnect X account:", err);
      setError(err?.message || "Failed to disconnect X account.");
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  // Initial status fetch on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const res = await getXStatus();
        if (isMounted && res && res.success !== false) {
          setStatus({
            connected: Boolean(res.connected),
            status: res.status || (res.connected ? "connected" : "disconnected"),
            account: res.account || null,
            lastSyncedAt: res.lastSyncedAt || null,
            grantedScopes: res.grantedScopes || [],
          });
        }
      } catch (err) {
        if (!isMounted || err?.name === "AbortError") return;
        setStatus({
          connected: false,
          status: "error",
          account: null,
        });
        if (err?.status !== 401) {
          setError(err?.message || "Failed to load X connection status.");
        }
      } finally {
        if (isMounted) setIsLoadingStatus(false);
      }
    };
    init();
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Lazy analytics fetch when connected and autoFetch enabled
  useEffect(() => {
    if (status.connected && autoFetch && !overview && !isFetchingRef.current) {
      fetchAnalytics();
    }
  }, [status.connected, autoFetch, overview, fetchAnalytics]);

  return {
    status,
    isConnected: Boolean(status.connected),
    account: status.account,
    overview,
    analyticsData: overview?.data || null,
    meta: overview?.meta || null,
    posts: posts?.data?.posts || overview?.data?.recentPosts || [],
    isLoadingStatus,
    isLoadingAnalytics,
    isLoadingPosts,
    isLoading: isLoadingStatus || isLoadingAnalytics,
    isConnecting,
    isDisconnecting,
    error: error || analyticsError || postsError,
    analyticsError,
    postsError,
    connect: handleConnect,
    disconnect: handleDisconnect,
    refresh,
    fetchAnalytics,
    fetchRecentPosts,
  };
}

export default useXAnalytics;
