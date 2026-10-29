"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { integrations } from "@/app/dashboard/settings/mockSettings";
import {
  getMetaStatus,
  connectMeta,
  disconnectMeta,
  getMetaAssets,
  normalizeMetaStatus,
  normalizeMetaAssets,
} from "@/lib/metaApi";
import { useMetaAssetSelection, clearMetaAssetSelection } from "@/hooks/useMetaAssetSelection";
import MetaAssetSelectionModal from "@/components/dashboard/settings/MetaAssetSelectionModal";

// Google Search Console & GA4 Imports
import useGoogleSearchConsole from "@/hooks/useGoogleSearchConsole";
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import useLinkedIn from "@/hooks/useLinkedIn";
import { useXAnalytics } from "@/hooks/useXAnalytics";
import { connectGoogle, disconnectGoogle } from "@/lib/googleSearchConsoleApi";
import GooglePropertySelectionModal from "@/components/dashboard/settings/GooglePropertySelectionModal";
import GA4PropertySelectionModal from "@/components/dashboard/settings/GA4PropertySelectionModal";
import LinkedInAssetSelectionModal from "@/components/dashboard/settings/LinkedInAssetSelectionModal";

import FacebookIcon from "@/components/icons/FacebookIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import XIcon from "@/components/icons/XIcon";
import { ChevronRight, Megaphone, CheckCircle2, SlidersHorizontal, Globe, BarChart3, Building2, ShieldAlert } from "lucide-react";

export default function IntegrationsTab() {
  // Meta Business Suite integration state
  const [metaStatus, setMetaStatus] = useState({
    connected: false,
    status: "loading",
    metaUserId: null,
    grantedScopes: [],
  });

  const [assets, setAssets] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetsError, setAssetsError] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Meta Asset selection state & modal management
  const [activeModalCategory, setActiveModalCategory] = useState(null);
  const { selectedAssets, selectPage, selectInstagram, selectAdAccount, clearSelection } = useMetaAssetSelection(assets);

  // Google Search Console integration hook & modal state
  const {
    status: gscStatus,
    isConnected: isGscConnected,
    isLoadingStatus: isLoadingGscStatus,
    properties: gscProperties,
    selectedProperty: gscSelectedProperty,
    setSelectedProperty: setGscSelectedProperty,
    isLoadingProperties: isLoadingGscProperties,
    refresh: refreshGsc,
  } = useGoogleSearchConsole(28, "integrations");

  const [isGscConnecting, setIsGscConnecting] = useState(false);
  const [isGscDisconnecting, setIsGscDisconnecting] = useState(false);
  const [showGscDisconnectConfirm, setShowGscDisconnectConfirm] = useState(false);
  const [isGscModalOpen, setIsGscModalOpen] = useState(false);

  // Google Analytics 4 integration hook & modal state
  const {
    status: ga4Status,
    isConnected: isGa4Connected,
    hasAnalyticsScope,
    isLoadingStatus: isLoadingGa4Status,
    properties: ga4Properties,
    selectedProperty: ga4SelectedProperty,
    selectedPropertyObj: ga4SelectedPropertyObj,
    selectProperty: setGa4SelectedProperty,
    isLoadingProperties: isLoadingGa4Properties,
    refresh: refreshGa4,
  } = useGoogleAnalytics("28d", "integrations");

  const [showGa4DisconnectConfirm, setShowGa4DisconnectConfirm] = useState(false);
  const [isGa4ModalOpen, setIsGa4ModalOpen] = useState(false);

  // LinkedIn integration hook & modals state
  const linkedIn = useLinkedIn();
  const [showLinkedInAdsDisconnectConfirm, setShowLinkedInAdsDisconnectConfirm] = useState(false);
  const [showLinkedInCommunityDisconnectConfirm, setShowLinkedInCommunityDisconnectConfirm] = useState(false);
  const [activeLinkedInModalApp, setActiveLinkedInModalApp] = useState(null);

  // X (Twitter) integration hook & state
  const xAnalytics = useXAnalytics({ autoFetch: false });
  const [showXDisconnectConfirm, setShowXDisconnectConfirm] = useState(false);
  const [isXConnecting, setIsXConnecting] = useState(false);
  const [isXDisconnecting, setIsXDisconnecting] = useState(false);

  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Keep stable refs for external integration refresh triggers
  const refreshGscRef = useRef(refreshGsc);
  const refreshGa4Ref = useRef(refreshGa4);
  const refreshLinkedInRef = useRef(linkedIn.refresh);
  const refreshXRef = useRef(xAnalytics.refresh);

  useEffect(() => {
    refreshGscRef.current = refreshGsc;
    refreshGa4Ref.current = refreshGa4;
    refreshLinkedInRef.current = linkedIn.refresh;
    refreshXRef.current = xAnalytics.refresh;
  });

  // Fetch Meta status and assets helper with concurrency protection and rate limit handling
  const fetchStatusAndAssets = useCallback(async (arg = false) => {
    const isManualRefresh = typeof arg === "boolean" ? arg : !!arg?.isManualRefresh;
    const isPostOAuthMeta = typeof arg === "object" ? !!arg?.isPostOAuthMeta : false;

    // Prevent duplicate in-flight requests, but allow manual refresh or post-OAuth verification to supersede.
    // If the previous controller was aborted, it is no longer an active in-flight request.
    if (isFetchingRef.current && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      if (!isManualRefresh && !isPostOAuthMeta) {
        return;
      }
      abortControllerRef.current.abort();
    }

    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController;
    const options = { signal: currentController.signal };

    isFetchingRef.current = true;
    setIsLoadingStatus(true);
    setIsRateLimited(false);
    setRateLimitMessage(null);
    setAssetsError(null);

    try {
      let statusRes = await getMetaStatus(options);
      let normalizedStatus = normalizeMetaStatus(statusRes);

      // If returning from OAuth and initial read returns not connected, retry once after a short delay
      // to accommodate database replication or transaction settling
      if (isPostOAuthMeta && !normalizedStatus.connected) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!currentController.signal.aborted) {
          try {
            const retryRes = await getMetaStatus(options);
            const retryNormalized = normalizeMetaStatus(retryRes);
            if (retryNormalized.connected) {
              statusRes = retryRes;
              normalizedStatus = retryNormalized;
            }
          } catch {
            // Ignore retry error and use first statusRes
          }
        }
      }

      if (currentController.signal.aborted) return;

      setMetaStatus(normalizedStatus);

      if (normalizedStatus.connected) {
        if (isPostOAuthMeta) {
          setSuccessMessage("Meta Business Suite connected successfully.");
          setError(null);
        }

        setIsLoadingAssets(true);
        try {
          const assetsRes = await getMetaAssets(isManualRefresh ? { refresh: true } : {}, options);
          if (currentController.signal.aborted) return;
          const normalizedAssets = normalizeMetaAssets(assetsRes);
          setAssets(normalizedAssets);
          setAssetsError(null);
        } catch (assetErr) {
          if (assetErr.name === "AbortError" || currentController.signal.aborted) return;
          console.error("Failed to fetch Meta assets:", assetErr);
          const is429 =
            assetErr?.status === 429 ||
            assetErr?.statusCode === 429 ||
            assetErr?.message?.toLowerCase().includes("too many requests") ||
            assetErr?.message?.toLowerCase().includes("rate limit");
          if (is429) {
            setAssetsError("Meta asset discovery rate limit reached. Please wait a moment before trying again.");
          } else {
            setAssetsError(assetErr?.message || "Failed to discover Meta assets.");
          }
        } finally {
          if (!currentController.signal.aborted) {
            setIsLoadingAssets(false);
          }
        }
      } else {
        setAssets(null);
        if (isPostOAuthMeta) {
          setSuccessMessage(null);
          setError("Meta connection could not be verified with the server. Please try reconnecting.");
        }
      }
    } catch (err) {
      if (err.name === "AbortError" || currentController.signal.aborted) return;
      console.error("Failed to fetch Meta status:", err);

      if (isPostOAuthMeta) {
        setSuccessMessage(null);
      }

      const is429 =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        err?.message?.toLowerCase().includes("too many requests") ||
        err?.message?.toLowerCase().includes("rate limit");

      if (is429) {
        setIsRateLimited(true);
        const rateMsg = "Too many requests. Meta integration is temporarily rate limited. Please wait a few minutes before trying again.";
        setRateLimitMessage(rateMsg);
        setError(rateMsg);
        setMetaStatus((prev) => ({
          ...prev,
          status: "rate_limited",
        }));
      } else if (err?.status === 401) {
        setMetaStatus({
          connected: false,
          status: "expired",
          needsReconnect: true,
          metaUserId: null,
          grantedScopes: [],
        });
        setAssets(null);
        setError("Meta authorization expired or invalid. Please reconnect.");
      } else {
        setMetaStatus({
          connected: false,
          status: "error",
          metaUserId: null,
          grantedScopes: [],
        });
        setAssets(null);
        setError(err?.message || "Failed to load Meta integration status.");
      }
    } finally {
      if (!currentController.signal.aborted) {
        isFetchingRef.current = false;
        setIsLoadingStatus(false);
      }
    }
  }, []);

  // Dedicated manual refresh handler for Meta assets
  const handleRefreshAssets = useCallback(async () => {
    await fetchStatusAndAssets(true);
  }, [fetchStatusAndAssets]);

  // Handle component mount and OAuth redirect callback parameter inspection (Meta, Google, LinkedIn, X)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const metaStatusParam = searchParams.get("meta_status");
    const googleStatusParam = searchParams.get("google_status");
    const linkedinStatusParam = searchParams.get("linkedin_status");
    const linkedInAppParam = searchParams.get("app");
    const linkedInMemberParam = searchParams.get("member");
    const xStatusParam = searchParams.get("x_status");
    const xUsernameParam = searchParams.get("username");
    const errorParam =
      searchParams.get("error") ||
      searchParams.get("error_description") ||
      searchParams.get("google_error") ||
      searchParams.get("message");

    let isPostOAuth = false;

    // Meta OAuth Callback Detection
    const isPostOAuthMeta = metaStatusParam === "success";

    if (metaStatusParam === "success") {
      isPostOAuth = true;
      // Do not infer connection success from query parameter alone!
      // Authoritative status will be confirmed by fetchStatusAndAssets before showing the banner.
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 0);
    } else if (metaStatusParam === "error") {
      isPostOAuth = true;
      setTimeout(() => {
        setSuccessMessage(null);
        setError(errorParam || "Meta authorization failed or was cancelled.");
      }, 0);
    }

    // Google OAuth Callback Detection (Search Console & GA4)
    if (googleStatusParam === "success") {
      isPostOAuth = true;
      setTimeout(() => {
        setSuccessMessage("Google services connected successfully.");
        setError(null);
      }, 0);
      refreshGscRef.current?.();
      refreshGa4Ref.current?.();
    } else if (googleStatusParam === "error" || (errorParam && !metaStatusParam && !linkedinStatusParam)) {
      isPostOAuth = true;
      setTimeout(() => {
        setError(errorParam || "Google authorization failed or was cancelled.");
      }, 0);
    }

    // LinkedIn OAuth Callback Detection (Ads & Community)
    if (linkedinStatusParam === "success") {
      isPostOAuth = true;
      const appName = linkedInAppParam === "community" ? "Growmentum-community (Pages)" : "Growmentum (Ads)";
      const memberInfo = linkedInMemberParam ? ` (${decodeURIComponent(linkedInMemberParam)})` : "";
      setTimeout(() => {
        setSuccessMessage(`LinkedIn ${appName} connected successfully${memberInfo}.`);
        setError(null);
      }, 0);
      refreshLinkedInRef.current?.();
    } else if (linkedinStatusParam === "error") {
      isPostOAuth = true;
      const msgParam = searchParams.get("message");
      const errCode = searchParams.get("error");
      let errText = "LinkedIn authorization failed or was cancelled.";
      if (msgParam && errCode) {
        const decodedMsg = decodeURIComponent(msgParam);
        const decodedErr = decodeURIComponent(errCode);
        errText = decodedErr && decodedErr !== decodedMsg ? `${decodedMsg} (${decodedErr})` : decodedMsg;
      } else if (msgParam) {
        errText = decodeURIComponent(msgParam);
      } else if (errCode) {
        errText = decodeURIComponent(errCode);
      }
      setTimeout(() => {
        setError(errText);
      }, 0);
    }

    // X (Twitter) OAuth Callback Detection
    if (xStatusParam === "success") {
      isPostOAuth = true;
      const userMsg = xUsernameParam ? ` (@${decodeURIComponent(xUsernameParam)})` : "";
      setTimeout(() => {
        setSuccessMessage(`X (Twitter) connected successfully${userMsg}.`);
        setError(null);
      }, 0);
      refreshXRef.current?.();
    } else if (xStatusParam === "error") {
      isPostOAuth = true;
      const xErr = searchParams.get("error") || searchParams.get("message") || "X authorization failed or was cancelled.";
      setTimeout(() => {
        setError(decodeURIComponent(xErr));
      }, 0);
    }

    if (isPostOAuth) {
      searchParams.delete("meta_status");
      searchParams.delete("google_status");
      searchParams.delete("google_error");
      searchParams.delete("linkedin_status");
      searchParams.delete("app");
      searchParams.delete("member");
      searchParams.delete("message");
      searchParams.delete("error");
      searchParams.delete("error_description");
      searchParams.delete("x_status");
      searchParams.delete("username");
      if (!searchParams.has("tab")) {
        searchParams.set("tab", "integrations");
      }
      const newSearch = searchParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }

    // Trigger status and asset discovery once on mount (with post-OAuth verification flag if returning from Meta OAuth)
    const initTimer = setTimeout(() => {
      fetchStatusAndAssets({ isManualRefresh: isPostOAuthMeta, isPostOAuthMeta });
    }, 0);

    return () => {
      clearTimeout(initTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isFetchingRef.current = false;
    };
  }, [fetchStatusAndAssets]);

  // Meta Connect flow
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await connectMeta();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("No OAuth authorization URL returned from backend.");
      }
    } catch (err) {
      console.error("Meta connect error:", err);
      setError(err?.message || "Failed to initiate Meta OAuth connection.");
      setIsConnecting(false);
    }
  };

  // Meta Disconnect flow
  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    setSuccessMessage(null);
    setShowDisconnectConfirm(false);

    try {
      const res = await disconnectMeta();
      if (res && res.success !== false) {
        setMetaStatus({
          connected: false,
          status: "disconnected",
          metaUserId: null,
          grantedScopes: [],
        });
        setAssets(null);
        clearSelection();
        setSuccessMessage("Meta integration disconnected.");
      } else {
        throw new Error(res?.message || "Failed to disconnect Meta integration.");
      }
    } catch (err) {
      console.error("Meta disconnect error:", err);
      setError(err?.message || "Failed to disconnect Meta integration.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Google Search Console Connect flow
  const handleGscConnect = async () => {
    setIsGscConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await connectGoogle();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("No OAuth authorization URL returned from backend.");
      }
    } catch (err) {
      console.error("GSC connect error:", err);
      setError(err?.message || "Failed to initiate Google OAuth connection.");
      setIsGscConnecting(false);
    }
  };

  // Google Search Console Disconnect flow
  const handleConfirmGscDisconnect = async () => {
    setIsGscDisconnecting(true);
    setError(null);
    setSuccessMessage(null);
    setShowGscDisconnectConfirm(false);

    try {
      await disconnectGoogle();
      refreshGsc();
      setSuccessMessage("Google Search Console integration disconnected.");
    } catch (err) {
      console.error("GSC disconnect error:", err);
      setError(err?.message || "Failed to disconnect Google Search Console.");
    } finally {
      setIsGscDisconnecting(false);
    }
  };

  // X (Twitter) Connect flow
  const handleXConnect = async () => {
    setIsXConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const authUrl = await xAnalytics.connect();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("No authorization URL returned from backend.");
      }
    } catch (err) {
      console.error("X connect error:", err);
      setError(err?.message || "Failed to initiate X connection.");
      setIsXConnecting(false);
    }
  };

  // X (Twitter) Disconnect flow
  const handleConfirmXDisconnect = async () => {
    setIsXDisconnecting(true);
    setError(null);
    setSuccessMessage(null);
    setShowXDisconnectConfirm(false);

    try {
      await xAnalytics.disconnect();
      setSuccessMessage("X (Twitter) integration disconnected successfully.");
    } catch (err) {
      console.error("X disconnect error:", err);
      setError(err?.message || "Failed to disconnect X integration.");
    } finally {
      setIsXDisconnecting(false);
    }
  };

  // Selected asset lookup helpers for Meta
  const pages = assets?.pages || [];
  const instagramAccounts = assets?.instagramAccounts || [];
  const adAccounts = assets?.adAccounts || [];

  const selectedPage = pages.find((p) => String(p.pageId || p.id) === String(selectedAssets.pageId));
  const selectedInstagram = instagramAccounts.find((ig) => String(ig.instagramAccountId || ig.id) === String(selectedAssets.instagramId));
  const selectedAdAccount = adAccounts.find((ad) => String(ad.adAccountId || ad.id) === String(selectedAssets.adAccountId));

  return (
    <div className="dashboard-card p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Integrations</h3>
        <p className="text-[13px] text-slate-500 mt-1">Connect your tools to pull data directly into Growth OS.</p>
      </div>

      {/* Global Alert Callouts */}
      {(error || linkedIn.error || rateLimitMessage) && (
        <div className={`mb-6 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-sm ${
          isRateLimited ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-red-50 text-red-600 border border-red-100"
        }`}>
          <div className="flex items-center gap-2">
            {isRateLimited && <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />}
            <span>{rateLimitMessage || error || linkedIn.error}</span>
          </div>
          <div className="flex items-center gap-3">
            {isRateLimited && (
              <button
                onClick={handleRefreshAssets}
                disabled={isLoadingStatus || isLoadingAssets}
                className="text-amber-800 hover:text-amber-900 font-bold px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded text-[11px] transition-colors whitespace-nowrap"
              >
                Retry Now
              </button>
            )}
            {metaStatus?.needsReconnect && (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="text-red-700 hover:text-red-900 font-bold px-2 py-1 bg-red-100 rounded text-[11px] transition-colors"
              >
                {isConnecting ? "Reconnecting..." : "Reconnect Meta"}
              </button>
            )}
            <button
              onClick={() => {
                setError(null);
                setRateLimitMessage(null);
                setIsRateLimited(false);
                linkedIn.setError(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold leading-none p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {(successMessage || linkedIn.successMessage) && (
        <div className="mb-6 p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-sm">
          <span>{successMessage || linkedIn.successMessage}</span>
          <button
            onClick={() => {
              setSuccessMessage(null);
              linkedIn.setSuccessMessage(null);
            }}
            className="text-emerald-500 hover:text-emerald-700 text-sm font-bold leading-none p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const isMeta = integration.id === "int2" || integration.name === "Meta Business Suite";
          const isGsc = integration.id === "int_gsc" || integration.name === "Google Search Console";
          const isGA4 = integration.id === "int1" || integration.name === "Google Analytics";
          const isLinkedIn = integration.id === "int3" || integration.name === "LinkedIn Ads";
          const isX = integration.id === "int_x" || integration.name?.toLowerCase().includes("x (twitter)");

          if (!isMeta && !isGsc && !isGA4 && !isLinkedIn && !isX) {
            // Render non-Meta, non-GSC, non-GA4, non-LinkedIn static mock integrations
            return (
              <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ${integration.iconColor}`} />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 mb-1">{integration.name}</h4>
                    <p className="text-[12.5px] text-slate-500 leading-snug">{integration.description}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors ${
                      integration.status === 'Connected' 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                        : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {integration.status}
                  </button>
                </div>
              </div>
            );
          }

          if (isX) {
            return (
              <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center bg-black text-white">
                      <XIcon className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">X (Twitter) Analytics</h4>
                        {xAnalytics.isLoadingStatus ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                            Checking...
                          </span>
                        ) : xAnalytics.isConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Connected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">
                        Track organic impressions, public tweet metrics, replies, retweets, and follower growth.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connected Account Details */}
                {xAnalytics.isConnected && xAnalytics.status?.account && (
                  <div className="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-3">
                      {xAnalytics.status.account.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={xAnalytics.status.account.profileImageUrl}
                          alt={xAnalytics.status.account.username || "X profile"}
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                          {(xAnalytics.status.account.username || "X").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {xAnalytics.status.account.name || xAnalytics.status.account.username}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          @{xAnalytics.status.account.username}
                        </div>
                      </div>
                    </div>
                    {xAnalytics.status.lastSyncedAt && (
                      <div className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-200/60">
                        Last synced: {new Date(xAnalytics.status.lastSyncedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {xAnalytics.isConnected && (
                      <span className="text-[11px] text-slate-400">
                        OAuth 2.0 PKCE Connected
                      </span>
                    )}
                  </div>

                  {xAnalytics.isConnected ? (
                    showXDisconnectConfirm ? (
                      <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                        <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                        <button
                          onClick={handleConfirmXDisconnect}
                          disabled={isXDisconnecting}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50"
                        >
                          {isXDisconnecting ? "Disconnecting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setShowXDisconnectConfirm(false)}
                          disabled={isXDisconnecting}
                          className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowXDisconnectConfirm(true)}
                        disabled={isXDisconnecting || xAnalytics.isLoadingStatus}
                        className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                      >
                        Disconnect
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleXConnect}
                      disabled={isXConnecting || xAnalytics.isLoadingStatus}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-900 text-white hover:bg-black shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isXConnecting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect X (Twitter)"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          }

          if (isLinkedIn) {
            return (
              <div key={integration.id} className="contents">
                {/* 1. Growmentum — LinkedIn Advertising API */}
                <div className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full col-span-1 md:col-span-2">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center bg-blue-50 text-[#0077b5] border border-blue-100">
                        <LinkedInIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">Growmentum (LinkedIn Advertising API)</h4>
                          {linkedIn.isLoadingStatus ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                              Checking...
                            </span>
                          ) : linkedIn.isAdsConnected && !linkedIn.isAdsApprovalPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Connected
                            </span>
                          ) : linkedIn.isAdsConnected && linkedIn.isAdsApprovalPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Approval Pending
                            </span>
                          ) : linkedIn.adsStatus?.status === "expired" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Auth Expired
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                              Disconnected
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">
                          Manage LinkedIn Advertising API accounts, B2B campaigns, and ad spend. (Approval pending with LinkedIn).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connected Member Banner */}
                  {linkedIn.isAdsConnected && linkedIn.adsStatus?.member && (
                    <div className="mb-3 px-3.5 py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium">Member: </span>
                        <strong className="text-slate-900">{linkedIn.adsStatus.member.name}</strong>
                        {linkedIn.adsStatus.member.email && (
                          <span className="text-slate-400 ml-1">({linkedIn.adsStatus.member.email})</span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        OpenID ID: {linkedIn.adsStatus.member.id}
                      </span>
                    </div>
                  )}

                  {/* Pending Approval Notice if Ads API product approval is pending */}
                  {linkedIn.isAdsConnected && linkedIn.isAdsApprovalPending && (
                    <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-start gap-2 text-amber-800">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Advertising API Product Review Pending</span>
                        <p className="text-[11.5px] text-amber-700 mt-0.5">
                          OpenID authentication succeeded, but the Advertising API product is awaiting review in the LinkedIn Developer Portal. Once approved by LinkedIn with the <code>r_ads</code> scope, authorized ad accounts will appear below.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Asset Discovery & Selection Section (when connected) */}
                  {linkedIn.isAdsConnected && (
                    <div className="my-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60">
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                          <span>Discovered Ad Accounts ({linkedIn.adsAssets.length})</span>
                        </span>
                        <button
                          onClick={() => linkedIn.refreshAssets("ads")}
                          disabled={linkedIn.isLoadingAssets.ads}
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {linkedIn.isLoadingAssets.ads ? "Syncing..." : "↻ Refresh Ad Accounts"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-xs">
                        <div
                          onClick={() => linkedIn.adsAssets.length > 0 && setActiveLinkedInModalApp("ads")}
                          className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                            linkedIn.adsAssets.length > 0
                              ? "border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer"
                              : "border-slate-200 opacity-80"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                                <Megaphone className="w-3.5 h-3.5 text-purple-600" />
                                <span>Ad Accounts ({linkedIn.adsAssets.length})</span>
                              </span>
                              {linkedIn.adsAssets.length > 0 ? (
                                <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">
                                  {linkedIn.isAdsApprovalPending ? "Approval Pending" : "No Accounts"}
                                </span>
                              )}
                            </div>

                            {/* Selected Asset Display */}
                            {linkedIn.adsSelectedAsset ? (
                              <div className="my-2 p-2.5 bg-purple-50/60 border border-purple-100 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                    Selected Ad Account
                                  </span>
                                  {linkedIn.adsSelectedAsset.currency && (
                                    <span className="text-[10px] font-mono font-bold text-purple-600">
                                      {linkedIn.adsSelectedAsset.currency}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={linkedIn.adsSelectedAsset.name}>
                                  {linkedIn.adsSelectedAsset.name}
                                </p>
                                <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                                  ID: {linkedIn.adsSelectedAsset.assetId}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic my-2">
                                {linkedIn.adsAssets.length === 0
                                  ? linkedIn.isAdsApprovalPending
                                    ? "Ad account discovery will unlock after LinkedIn API approval."
                                    : "No Ad Accounts discovered for this account."
                                  : "No Ad Account selected"}
                              </p>
                            )}
                          </div>

                          {linkedIn.adsAssets.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-purple-600 group-hover:text-purple-800 transition-colors">
                              <span>Change selection</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {linkedIn.isAdsConnected && linkedIn.adsStatus?.connectedAt && (
                        <span className="text-[11px] text-slate-400">
                          Connected: {new Date(linkedIn.adsStatus.connectedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {linkedIn.isAdsConnected ? (
                      showLinkedInAdsDisconnectConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                          <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                          <button
                            onClick={() => {
                              linkedIn.disconnect("ads");
                              setShowLinkedInAdsDisconnectConfirm(false);
                            }}
                            disabled={linkedIn.isDisconnecting.ads}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {linkedIn.isDisconnecting.ads ? "Disconnecting..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setShowLinkedInAdsDisconnectConfirm(false)}
                            disabled={linkedIn.isDisconnecting.ads}
                            className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowLinkedInAdsDisconnectConfirm(true)}
                          disabled={linkedIn.isDisconnecting.ads || linkedIn.isLoadingStatus}
                          className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200 cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => linkedIn.connect("ads")}
                        disabled={linkedIn.isConnecting.ads || linkedIn.isLoadingStatus}
                        className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-[#0077b5] text-white hover:bg-[#006097] shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {linkedIn.isConnecting.ads ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : linkedIn.adsStatus?.status === "expired" ? (
                          "Reconnect LinkedIn Ads"
                        ) : (
                          "Connect LinkedIn Ads"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Growmentum-community — LinkedIn Community Management API */}
                <div className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full col-span-1 md:col-span-2">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center bg-cyan-50 text-[#0077b5] border border-cyan-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">Growmentum-community (LinkedIn Pages API)</h4>
                          {linkedIn.isLoadingStatus ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                              Checking...
                            </span>
                          ) : linkedIn.isCommunityConnected && !linkedIn.isCommunityApprovalPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Connected
                            </span>
                          ) : linkedIn.isCommunityConnected && linkedIn.isCommunityApprovalPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Approval Pending
                            </span>
                          ) : linkedIn.communityStatus?.status === "expired" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Auth Expired
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                              Disconnected
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">
                          Community Management API for LinkedIn Organization Pages, organic updates, and follower insights.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connected Member Banner */}
                  {linkedIn.isCommunityConnected && linkedIn.communityStatus?.member && (
                    <div className="mb-3 px-3.5 py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium">Member: </span>
                        <strong className="text-slate-900">{linkedIn.communityStatus.member.name}</strong>
                        {linkedIn.communityStatus.member.email && (
                          <span className="text-slate-400 ml-1">({linkedIn.communityStatus.member.email})</span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        OpenID ID: {linkedIn.communityStatus.member.id}
                      </span>
                    </div>
                  )}

                  {/* Pending Approval Notice if Community API product approval is pending */}
                  {linkedIn.isCommunityConnected && linkedIn.isCommunityApprovalPending && (
                    <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-start gap-2 text-amber-800">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Company Verification & Approval Pending</span>
                        <p className="text-[11.5px] text-amber-700 mt-0.5">
                          OpenID authentication succeeded, but the Community Management API product requires organization verification and developer approval. Once approved with <code>r_organization_social</code> permission, authorized company pages will appear below.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Asset Discovery & Selection Section (when connected) */}
                  {linkedIn.isCommunityConnected && (
                    <div className="my-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60">
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                          <span>Discovered Company Pages ({linkedIn.communityAssets.length})</span>
                        </span>
                        <button
                          onClick={() => linkedIn.refreshAssets("community")}
                          disabled={linkedIn.isLoadingAssets.community}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {linkedIn.isLoadingAssets.community ? "Syncing..." : "↻ Refresh Pages"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-xs">
                        <div
                          onClick={() => linkedIn.communityAssets.length > 0 && setActiveLinkedInModalApp("community")}
                          className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                            linkedIn.communityAssets.length > 0
                              ? "border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                              : "border-slate-200 opacity-80"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Company Pages ({linkedIn.communityAssets.length})</span>
                              </span>
                              {linkedIn.communityAssets.length > 0 ? (
                                <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">
                                  {linkedIn.isCommunityApprovalPending ? "Approval Pending" : "No Pages"}
                                </span>
                              )}
                            </div>

                            {/* Selected Asset Display */}
                            {linkedIn.communitySelectedAsset ? (
                              <div className="my-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    Selected Company Page
                                  </span>
                                  {linkedIn.communitySelectedAsset.role && (
                                    <span className="text-[10px] font-mono text-blue-600">
                                      {linkedIn.communitySelectedAsset.role}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={linkedIn.communitySelectedAsset.name}>
                                  {linkedIn.communitySelectedAsset.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500 font-mono">
                                  <span>ID: {linkedIn.communitySelectedAsset.assetId}</span>
                                  {linkedIn.communitySelectedAsset.vanityName && (
                                    <span>• @{linkedIn.communitySelectedAsset.vanityName}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic my-2">
                                {linkedIn.communityAssets.length === 0
                                  ? linkedIn.isCommunityApprovalPending
                                    ? "Company page discovery will unlock after LinkedIn API approval."
                                    : "No Company Pages discovered for this account."
                                  : "No Company Page selected"}
                              </p>
                            )}
                          </div>

                          {linkedIn.communityAssets.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                              <span>Change selection</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {linkedIn.isCommunityConnected && linkedIn.communityStatus?.connectedAt && (
                        <span className="text-[11px] text-slate-400">
                          Connected: {new Date(linkedIn.communityStatus.connectedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {linkedIn.isCommunityConnected ? (
                      showLinkedInCommunityDisconnectConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                          <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                          <button
                            onClick={() => {
                              linkedIn.disconnect("community");
                              setShowLinkedInCommunityDisconnectConfirm(false);
                            }}
                            disabled={linkedIn.isDisconnecting.community}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {linkedIn.isDisconnecting.community ? "Disconnecting..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setShowLinkedInCommunityDisconnectConfirm(false)}
                            disabled={linkedIn.isDisconnecting.community}
                            className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowLinkedInCommunityDisconnectConfirm(true)}
                          disabled={linkedIn.isDisconnecting.community || linkedIn.isLoadingStatus}
                          className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200 cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => linkedIn.connect("community")}
                        disabled={linkedIn.isConnecting.community || linkedIn.isLoadingStatus}
                        className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-[#0077b5] text-white hover:bg-[#006097] shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {linkedIn.isConnecting.community ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : linkedIn.communityStatus?.status === "expired" ? (
                          "Reconnect LinkedIn Community"
                        ) : (
                          "Connect LinkedIn Community"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (isGA4) {
            // Render live Google Analytics 4 integration card
            return (
              <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full col-span-1 md:col-span-2">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center text-white ${integration.iconColor}`}>
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">{integration.name}</h4>
                        {isLoadingGa4Status ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                            Checking...
                          </span>
                        ) : isGa4Connected && hasAnalyticsScope ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Connected
                          </span>
                        ) : isGa4Connected && !hasAnalyticsScope ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Scope Missing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">{integration.description}</p>
                    </div>
                  </div>
                </div>

                {/* Property Discovery & Selection Section (when connected & scope granted) */}
                {isGa4Connected && hasAnalyticsScope && (
                  <div className="my-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                        <span>Discovered GA4 Properties</span>
                      </span>
                      <button
                        onClick={() => refreshGa4()}
                        disabled={isLoadingGa4Status || isLoadingGa4Properties}
                        className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold transition-colors disabled:opacity-50"
                      >
                        {isLoadingGa4Properties ? "Syncing..." : "↻ Refresh Properties"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div
                        onClick={() => ga4Properties.length > 0 && setIsGa4ModalOpen(true)}
                        className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                          ga4Properties.length > 0
                            ? "border-slate-200 hover:border-amber-300 hover:shadow-md cursor-pointer"
                            : "border-slate-200 opacity-80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Properties ({ga4Properties.length})</span>
                            </span>
                            {ga4Properties.length > 0 ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">No Properties</span>
                            )}
                          </div>

                          {/* Selected Property Display */}
                          {ga4SelectedProperty ? (
                            <div className="my-2 p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-amber-600" />
                                  Selected GA4 Property
                                </span>
                              </div>
                              <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={ga4SelectedPropertyObj?.displayName || ga4SelectedProperty}>
                                {ga4SelectedPropertyObj?.displayName || `Property ${ga4SelectedProperty}`}
                              </p>
                              <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                                ID: {ga4SelectedProperty}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic my-2">
                              {ga4Properties.length === 0
                                ? "No Google Analytics 4 properties are accessible for this account."
                                : "No property selected"}
                            </p>
                          )}
                        </div>

                        {ga4Properties.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-amber-600 group-hover:text-amber-800 transition-colors">
                            <span>Change selection</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isGa4Connected && ga4Status?.connectedAt && (
                      <span className="text-[11px] text-slate-400">
                        Connected: {new Date(ga4Status.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {isGa4Connected && hasAnalyticsScope ? (
                    showGa4DisconnectConfirm ? (
                      <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                        <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                        <button
                          onClick={handleConfirmGscDisconnect}
                          disabled={isGscDisconnecting}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50"
                        >
                          {isGscDisconnecting ? "Disconnecting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setShowGa4DisconnectConfirm(false)}
                          disabled={isGscDisconnecting}
                          className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowGa4DisconnectConfirm(true)}
                        disabled={isGscDisconnecting || isLoadingGa4Status}
                        className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                      >
                        Disconnect
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleGscConnect}
                      disabled={isGscConnecting || isLoadingGa4Status}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-amber-600 text-white hover:bg-amber-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGscConnecting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : isGa4Connected && !hasAnalyticsScope ? (
                        "Grant Analytics Access"
                      ) : (
                        "Connect Google Analytics"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          }

          if (isMeta) {
            // Render live Meta Business Suite integration card
            return (
              <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full col-span-1 md:col-span-2">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ${integration.iconColor}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">{integration.name}</h4>
                        {isLoadingStatus ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                            Checking...
                          </span>
                        ) : isRateLimited || metaStatus?.status === "rate_limited" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Rate Limited
                          </span>
                        ) : metaStatus?.connected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Connected
                          </span>
                        ) : metaStatus?.needsReconnect ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Auth Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">{integration.description}</p>
                    </div>
                  </div>
                </div>

                {/* Asset Discovery & Selection Section (when connected or rate-limited while retaining connection) */}
                {(metaStatus?.connected || isRateLimited) && (
                  <div className="my-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Discovered Meta Assets & Asset Selection</span>
                      </span>
                      <button
                        onClick={handleRefreshAssets}
                        disabled={isLoadingStatus || isLoadingAssets}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isLoadingAssets ? (
                          <>
                            <span className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                            <span>Syncing...</span>
                          </>
                        ) : (
                          <span>↻ Refresh Assets</span>
                        )}
                      </button>
                    </div>

                    {/* Inline Asset Discovery Notice / Error */}
                    {assetsError && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>{assetsError}</span>
                        </div>
                        <button
                          onClick={handleRefreshAssets}
                          disabled={isLoadingAssets}
                          className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[11px] transition-colors whitespace-nowrap"
                        >
                          Retry Discovery
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Category Summary Card 1: Facebook Pages */}
                      <div
                        onClick={() => pages.length > 0 && setActiveModalCategory("pages")}
                        className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                          pages.length > 0
                            ? "border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer"
                            : "border-slate-200 opacity-80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                              <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                              <span>Pages ({isLoadingAssets && !assets ? "..." : pages.length})</span>
                            </span>
                            {isLoadingAssets && !assets ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-slate-100 text-slate-500 rounded animate-pulse">Checking...</span>
                            ) : assetsError && pages.length === 0 ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Notice</span>
                            ) : assets?.capabilities?.pagesAvailable !== false ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Unavailable</span>
                            )}
                          </div>

                          {/* Selected Asset Display or State */}
                          {isLoadingAssets && !assets ? (
                            <div className="my-2 p-2.5 bg-slate-50 rounded-lg animate-pulse space-y-1">
                              <div className="h-3 bg-slate-200 rounded w-2/3" />
                              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                            </div>
                          ) : assetsError && pages.length === 0 ? (
                            <div className="my-2 p-2 bg-amber-50/80 border border-amber-100 rounded-lg text-amber-700 text-[11px]">
                              <p className="font-semibold">Discovery Incomplete</p>
                              <p className="text-[10px] text-amber-600 mt-0.5 truncate">{assetsError}</p>
                            </div>
                          ) : selectedPage ? (
                            <div className="my-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                  Selected
                                </span>
                              </div>
                              <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={selectedPage.name}>
                                {selectedPage.name || `Page ${selectedPage.pageId}`}
                              </p>
                              {selectedPage.category && (
                                <p className="text-[10.5px] text-slate-500 truncate">{selectedPage.category}</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-[11px] text-slate-400 italic my-2">
                                {pages.length === 0 ? "No Pages discovered" : "No Page selected"}
                              </p>
                              {pages.length === 0 && metaStatus?.grantedScopes && !metaStatus.grantedScopes.includes("pages_show_list") && (
                                <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                                  Missing &apos;pages_show_list&apos; permission. Reconnect Meta and grant Page access.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {pages.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                            <span>Change selection</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>

                      {/* Category Summary Card 2: Instagram Accounts */}
                      <div
                        onClick={() => instagramAccounts.length > 0 && setActiveModalCategory("instagram")}
                        className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                          instagramAccounts.length > 0
                            ? "border-slate-200 hover:border-pink-300 hover:shadow-md cursor-pointer"
                            : "border-slate-200 opacity-80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                              <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                              <span>Instagram ({isLoadingAssets && !assets ? "..." : instagramAccounts.length})</span>
                            </span>
                            {isLoadingAssets && !assets ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-slate-100 text-slate-500 rounded animate-pulse">Checking...</span>
                            ) : assetsError && instagramAccounts.length === 0 ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Notice</span>
                            ) : assets?.capabilities?.instagramAvailable !== false && instagramAccounts.length > 0 ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Unavailable</span>
                            )}
                          </div>

                          {/* Selected Asset Display or State */}
                          {isLoadingAssets && !assets ? (
                            <div className="my-2 p-2.5 bg-slate-50 rounded-lg animate-pulse space-y-1">
                              <div className="h-3 bg-slate-200 rounded w-2/3" />
                              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                            </div>
                          ) : assetsError && instagramAccounts.length === 0 ? (
                            <div className="my-2 p-2 bg-amber-50/80 border border-amber-100 rounded-lg text-amber-700 text-[11px]">
                              <p className="font-semibold">Discovery Incomplete</p>
                              <p className="text-[10px] text-amber-600 mt-0.5 truncate">{assetsError}</p>
                            </div>
                          ) : selectedInstagram ? (
                            <div className="my-2 p-2.5 bg-pink-50/60 border border-pink-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-pink-600" />
                                  Selected
                                </span>
                              </div>
                              <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={`@${selectedInstagram.username}`}>
                                @{selectedInstagram.username || selectedInstagram.name}
                              </p>
                              {selectedInstagram.followersCount !== undefined && (
                                <p className="text-[10.5px] text-slate-500 font-mono">{selectedInstagram.followersCount.toLocaleString()} followers</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-[11px] text-slate-400 italic my-2">
                                {instagramAccounts.length === 0 ? "No IG Accounts discovered" : "No IG Account selected"}
                              </p>
                              {instagramAccounts.length === 0 && metaStatus?.grantedScopes && !metaStatus.grantedScopes.includes("instagram_basic") && (
                                <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                                  Missing &apos;instagram_basic&apos; permission. Reconnect Meta to link Instagram.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {instagramAccounts.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-pink-600 group-hover:text-pink-800 transition-colors">
                            <span>Change selection</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>

                      {/* Category Summary Card 3: Ad Accounts */}
                      <div
                        onClick={() => adAccounts.length > 0 && setActiveModalCategory("adAccounts")}
                        className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                          adAccounts.length > 0
                            ? "border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer"
                            : "border-slate-200 opacity-80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-purple-600" />
                              <span>Ad Accounts ({isLoadingAssets && !assets ? "..." : adAccounts.length})</span>
                            </span>
                            {isLoadingAssets && !assets ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-slate-100 text-slate-500 rounded animate-pulse">Checking...</span>
                            ) : assetsError && adAccounts.length === 0 ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Notice</span>
                            ) : assets?.capabilities?.adsAvailable !== false && adAccounts.length > 0 ? (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Unavailable</span>
                            )}
                          </div>

                          {/* Selected Asset Display or State */}
                          {isLoadingAssets && !assets ? (
                            <div className="my-2 p-2.5 bg-slate-50 rounded-lg animate-pulse space-y-1">
                              <div className="h-3 bg-slate-200 rounded w-2/3" />
                              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                            </div>
                          ) : assetsError && adAccounts.length === 0 ? (
                            <div className="my-2 p-2 bg-amber-50/80 border border-amber-100 rounded-lg text-amber-700 text-[11px]">
                              <p className="font-semibold">Discovery Incomplete</p>
                              <p className="text-[10px] text-amber-600 mt-0.5 truncate">{assetsError}</p>
                            </div>
                          ) : selectedAdAccount ? (
                            <div className="my-2 p-2.5 bg-purple-50/60 border border-purple-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                  Selected
                                </span>
                                {selectedAdAccount.currency && (
                                  <span className="text-[10px] font-mono font-bold text-purple-600">{selectedAdAccount.currency}</span>
                                )}
                              </div>
                              <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={selectedAdAccount.name}>
                                {selectedAdAccount.name}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[11px] text-slate-400 italic my-2">
                                {adAccounts.length === 0 ? "No Ad Accounts discovered" : "No Ad Account selected"}
                              </p>
                              {adAccounts.length === 0 && metaStatus?.grantedScopes && !metaStatus.grantedScopes.includes("ads_read") && (
                                <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                                  Missing &apos;ads_read&apos; permission. Reconnect Meta to access Ad Accounts.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {adAccounts.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-purple-600 group-hover:text-purple-800 transition-colors">
                            <span>Change selection</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {metaStatus?.connected && metaStatus?.connectedAt && (
                      <span className="text-[11px] text-slate-400">
                        Connected: {new Date(metaStatus.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {metaStatus?.connected ? (
                    showDisconnectConfirm ? (
                      <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                        <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                        <button
                          onClick={handleConfirmDisconnect}
                          disabled={isDisconnecting}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50"
                        >
                          {isDisconnecting ? "Disconnecting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setShowDisconnectConfirm(false)}
                          disabled={isDisconnecting}
                          className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDisconnectConfirm(true)}
                        disabled={isDisconnecting || isLoadingStatus}
                        className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                      >
                        Disconnect
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || isLoadingStatus}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : isLoadingStatus ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : metaStatus?.needsReconnect ? (
                        "Reconnect Meta"
                      ) : (
                        "Connect Meta"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // Render live Google Search Console integration card
          return (
            <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full col-span-1 md:col-span-2">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center text-white ${integration.iconColor}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">{integration.name}</h4>
                      {isLoadingGscStatus ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                          Checking...
                        </span>
                      ) : isGscConnected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">{integration.description}</p>
                  </div>
                </div>
              </div>

              {/* Property Discovery & Selection Section (when connected) */}
              {isGscConnected && (
                <div className="my-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Search Console Properties</span>
                    </span>
                    <button
                      onClick={() => refreshGsc()}
                      disabled={isLoadingGscStatus || isLoadingGscProperties}
                      className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold transition-colors disabled:opacity-50"
                    >
                      {isLoadingGscProperties ? "Syncing..." : "↻ Refresh Properties"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-xs">
                    <div
                      onClick={() => gscProperties.length > 0 && setIsGscModalOpen(true)}
                      className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                        gscProperties.length > 0
                          ? "border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer"
                          : "border-slate-200 opacity-80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Properties ({gscProperties.length})</span>
                          </span>
                          {gscProperties.length > 0 ? (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">No Properties</span>
                          )}
                        </div>

                        {/* Selected Property Display */}
                        {gscSelectedProperty ? (
                          <div className="my-2 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Selected Property
                              </span>
                            </div>
                            <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={gscSelectedProperty}>
                              {gscSelectedProperty}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic my-2">
                            {gscProperties.length === 0
                              ? "No Google Search Console properties are available for this account."
                              : "No property selected"}
                          </p>
                        )}
                      </div>

                      {gscProperties.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-600 group-hover:text-emerald-800 transition-colors">
                          <span>Change selection</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isGscConnected && gscStatus?.connectedAt && (
                    <span className="text-[11px] text-slate-400">
                      Connected: {new Date(gscStatus.connectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {isGscConnected ? (
                  showGscDisconnectConfirm ? (
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                      <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                      <button
                        onClick={handleConfirmGscDisconnect}
                        disabled={isGscDisconnecting}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50"
                      >
                        {isGscDisconnecting ? "Disconnecting..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setShowGscDisconnectConfirm(false)}
                        disabled={isGscDisconnecting}
                        className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowGscDisconnectConfirm(true)}
                      disabled={isGscDisconnecting || isLoadingGscStatus}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleGscConnect}
                    disabled={isGscConnecting || isLoadingGscStatus}
                    className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGscConnecting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Google Search Console"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meta Asset Selection Modal */}
      {activeModalCategory && (
        <MetaAssetSelectionModal
          isOpen={!!activeModalCategory}
          onClose={() => setActiveModalCategory(null)}
          category={activeModalCategory}
          assets={
            activeModalCategory === "pages"
              ? pages
              : activeModalCategory === "instagram"
              ? instagramAccounts
              : adAccounts
          }
          selectedId={
            activeModalCategory === "pages"
              ? selectedAssets.pageId
              : activeModalCategory === "instagram"
              ? selectedAssets.instagramId
              : selectedAssets.adAccountId
          }
          onSelectAsset={(id) => {
            if (activeModalCategory === "pages") selectPage(id);
            else if (activeModalCategory === "instagram") selectInstagram(id);
            else if (activeModalCategory === "adAccounts") selectAdAccount(id);
          }}
        />
      )}

      {/* GSC Property Selection Modal */}
      {isGscModalOpen && (
        <GooglePropertySelectionModal
          isOpen={isGscModalOpen}
          onClose={() => setIsGscModalOpen(false)}
          properties={gscProperties}
          selectedProperty={gscSelectedProperty}
          onSelectProperty={(siteUrl) => {
            setGscSelectedProperty(siteUrl);
          }}
        />
      )}

      {/* GA4 Property Selection Modal */}
      {isGa4ModalOpen && (
        <GA4PropertySelectionModal
          isOpen={isGa4ModalOpen}
          onClose={() => setIsGa4ModalOpen(false)}
          properties={ga4Properties}
          selectedProperty={ga4SelectedProperty}
          onSelectProperty={(propertyId) => {
            setGa4SelectedProperty(propertyId);
          }}
        />
      )}

      {/* LinkedIn Asset Selection Modal */}
      {activeLinkedInModalApp && (
        <LinkedInAssetSelectionModal
          isOpen={!!activeLinkedInModalApp}
          onClose={() => setActiveLinkedInModalApp(null)}
          appType={activeLinkedInModalApp}
          assets={activeLinkedInModalApp === "ads" ? linkedIn.adsAssets : linkedIn.communityAssets}
          selectedId={
            activeLinkedInModalApp === "ads"
              ? linkedIn.adsSelectedAsset?.assetId || linkedIn.adsStatus?.selectedAssetId
              : linkedIn.communitySelectedAsset?.assetId || linkedIn.communityStatus?.selectedAssetId
          }
          approvalStatus={
            activeLinkedInModalApp === "ads" ? linkedIn.adsStatus?.approvalStatus : linkedIn.communityStatus?.approvalStatus
          }
          apiAccessAvailable={
            activeLinkedInModalApp === "ads"
              ? linkedIn.adsAssetsData?.apiAccessAvailable
              : linkedIn.communityAssetsData?.apiAccessAvailable
          }
          message={
            activeLinkedInModalApp === "ads" ? linkedIn.adsAssetsData?.message : linkedIn.communityAssetsData?.message
          }
          onSelectAsset={async (id) => {
            await linkedIn.selectAsset(activeLinkedInModalApp, id);
            setActiveLinkedInModalApp(null);
          }}
        />
      )}
    </div>
  );
}
