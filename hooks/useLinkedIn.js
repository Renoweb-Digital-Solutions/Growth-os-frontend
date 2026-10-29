// Reason: Custom hook encapsulating LinkedIn OAuth integration states, asset discovery,
// and user-scoped asset selection for both 'ads' (Growmentum) and 'community' (Growmentum-community) apps.
// How: Communicates with backend endpoints through lib/linkedInApi.js, manages independent states for both apps,
//      handles OAuth callback parameters, distinguishes pending product approval from active access,
//      and guarantees no mock analytics or tokens are exposed.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getLinkedInStatus,
  getLinkedInConfig,
  getLinkedInAssets,
  selectLinkedInAsset,
  getLinkedInSelectedAsset,
  connectLinkedIn,
  disconnectLinkedIn,
  normalizeLinkedInApp,
} from "@/lib/linkedInApi";

export function useLinkedIn() {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState({
    ads: null,
    community: null,
  });

  const [adsAssetsData, setAdsAssetsData] = useState(null);
  const [communityAssetsData, setCommunityAssetsData] = useState(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState({
    ads: false,
    community: false,
  });

  const [isConnecting, setIsConnecting] = useState({
    ads: false,
    community: false,
  });

  const [isDisconnecting, setIsDisconnecting] = useState({
    ads: false,
    community: false,
  });

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const abortControllerRef = useRef(null);

  // Fetch status and safe config
  const fetchStatusAndConfig = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const options = { signal: abortControllerRef.current.signal };

    setIsLoadingStatus(true);
    try {
      const [configRes, statusRes] = await Promise.all([
        getLinkedInConfig(options).catch((err) => {
          if (err?.name === "AbortError") throw err;
          console.warn("LinkedIn config fetch warning:", err?.message);
          return null;
        }),
        getLinkedInStatus(options).catch((err) => {
          if (err?.name === "AbortError") throw err;
          throw err;
        }),
      ]);

      if (configRes && configRes.data) {
        setConfig(configRes.data);
      }

      if (statusRes && statusRes.data) {
        setStatus(statusRes.data);

        // If ads app is connected, fetch its assets
        if (statusRes.data.ads?.connected) {
          fetchAppAssets("ads", options);
        } else {
          setAdsAssetsData(null);
        }

        // If community app is connected, fetch its assets
        if (statusRes.data.community?.connected) {
          fetchAppAssets("community", options);
        } else {
          setCommunityAssetsData(null);
        }
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Failed to load LinkedIn status:", err);
      if (err?.status !== 401) {
        setError(err?.message || "Failed to load LinkedIn integration status.");
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Fetch assets for a specific app
  const fetchAppAssets = useCallback(async (appType, options = {}) => {
    const normalized = normalizeLinkedInApp(appType);
    setIsLoadingAssets((prev) => ({ ...prev, [normalized]: true }));

    try {
      const res = await getLinkedInAssets(normalized, options);
      if (res && res.data) {
        if (normalized === "ads") {
          setAdsAssetsData(res.data);
        } else {
          setCommunityAssetsData(res.data);
        }
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.warn(`Failed to discover LinkedIn assets for '${normalized}':`, err?.message);
    } finally {
      setIsLoadingAssets((prev) => ({ ...prev, [normalized]: false }));
    }
  }, []);

  // Fetch single active selected asset directly from backend
  const fetchSelectedAsset = useCallback(async (appType, options = {}) => {
    const normalized = normalizeLinkedInApp(appType);
    try {
      const res = await getLinkedInSelectedAsset(normalized, options);
      if (res && res.success !== false) {
        return res.data;
      }
    } catch (err) {
      if (err?.name === "AbortError") return null;
      console.warn(`Failed to fetch selected asset for '${normalized}':`, err?.message);
    }
    return null;
  }, []);

  // Handle OAuth callback parameters on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const linkedinStatusParam = params.get("linkedin_status");
    const appParam = params.get("app");
    const memberParam = params.get("member");
    const errorParam = params.get("error");
    const messageParam = params.get("message");

    let isPostOAuth = false;

    if (linkedinStatusParam === "success") {
      isPostOAuth = true;
      const normalizedApp = normalizeLinkedInApp(appParam);
      const appName = normalizedApp === "community" ? "Growmentum-community (Pages)" : "Growmentum (Ads)";
      const memberInfo = memberParam ? ` (${decodeURIComponent(memberParam)})` : "";
      setTimeout(() => {
        setSuccessMessage(`LinkedIn ${appName} connected successfully${memberInfo}.`);
        setError(null);
      }, 0);
    } else if (linkedinStatusParam === "error") {
      isPostOAuth = true;
      let errText = "LinkedIn authorization failed or was cancelled.";
      if (messageParam && errorParam) {
        const decodedMsg = decodeURIComponent(messageParam);
        const decodedErr = decodeURIComponent(errorParam);
        errText = decodedErr && decodedErr !== decodedMsg ? `${decodedMsg} (${decodedErr})` : decodedMsg;
      } else if (messageParam) {
        errText = decodeURIComponent(messageParam);
      } else if (errorParam) {
        errText = decodeURIComponent(errorParam);
      }
      setTimeout(() => {
        setError(errText);
      }, 0);
    }

    if (isPostOAuth) {
      params.delete("linkedin_status");
      params.delete("app");
      params.delete("member");
      params.delete("error");
      params.delete("message");
      const newQuery = params.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }

    fetchStatusAndConfig();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStatusAndConfig]);

  // Connect helper: validates top-level res.url before browser navigation
  const handleConnect = async (appType) => {
    const normalized = normalizeLinkedInApp(appType);
    setIsConnecting((prev) => ({ ...prev, [normalized]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await connectLinkedIn(normalized);
      if (res && res.success !== false && typeof res.url === "string" && res.url.trim().length > 0) {
        const targetUrl = res.url.trim();
        if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
          window.location.href = targetUrl;
        } else {
          throw new Error(`Invalid authorization URL returned from backend for LinkedIn '${normalized}'.`);
        }
      } else {
        throw new Error(res?.message || `No authorization URL returned from backend for LinkedIn '${normalized}'.`);
      }
    } catch (err) {
      console.error(`LinkedIn connect error (${normalized}):`, err);
      setError(err?.message || `Failed to initiate LinkedIn OAuth connection for '${normalized}'.`);
      setIsConnecting((prev) => ({ ...prev, [normalized]: false }));
    }
  };

  // Disconnect helper: handles DELETE response { success: true, message } without requiring data
  const handleDisconnect = async (appType) => {
    const normalized = normalizeLinkedInApp(appType);
    setIsDisconnecting((prev) => ({ ...prev, [normalized]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await disconnectLinkedIn(normalized);
      if (res && res.success !== false) {
        setStatus((prev) => ({
          ...prev,
          [normalized]: {
            appType: normalized,
            appName: normalized === "ads" ? "Growmentum" : "Growmentum-community",
            connected: false,
            status: "disconnected",
            approvalStatus: config?.[normalized]?.productStatus || "pending_approval",
            selectedAsset: null,
          },
        }));

        if (normalized === "ads") {
          setAdsAssetsData(null);
        } else {
          setCommunityAssetsData(null);
        }

        const appLabel = normalized === "ads" ? "Growmentum (Ads)" : "Growmentum-community (Pages)";
        setSuccessMessage(res?.message || `LinkedIn ${appLabel} disconnected.`);
      } else {
        throw new Error(res?.message || `Failed to disconnect LinkedIn '${normalized}'.`);
      }
    } catch (err) {
      console.error(`LinkedIn disconnect error (${normalized}):`, err);
      setError(err?.message || `Failed to disconnect LinkedIn '${normalized}'.`);
    } finally {
      setIsDisconnecting((prev) => ({ ...prev, [normalized]: false }));
    }
  };

  // Asset selection helper: handles POST /api/linkedin/:app/selected-asset response { success: true, message, data: AssetObj }
  const handleSelectAsset = async (appType, assetId) => {
    const normalized = normalizeLinkedInApp(appType);
    setError(null);

    try {
      const res = await selectLinkedInAsset(normalized, assetId);
      if (res && res.success !== false && res.data) {
        const selected = res.data;

        // Update local asset list & selected reference
        if (normalized === "ads") {
          setAdsAssetsData((prev) => {
            if (!prev) return prev;
            const updated = (prev.assets || []).map((item) => ({
              ...item,
              isSelected: String(item.assetId || item.id) === String(assetId),
            }));
            return {
              ...prev,
              assets: updated,
              selectedAsset: selected,
            };
          });
        } else {
          setCommunityAssetsData((prev) => {
            if (!prev) return prev;
            const updated = (prev.assets || []).map((item) => ({
              ...item,
              isSelected: String(item.assetId || item.id) === String(assetId),
            }));
            return {
              ...prev,
              assets: updated,
              selectedAsset: selected,
            };
          });
        }

        // Also update status record
        setStatus((prev) => ({
          ...prev,
          [normalized]: prev[normalized]
            ? { ...prev[normalized], selectedAsset: selected, selectedAssetId: selected.assetId || selected.id }
            : prev[normalized],
        }));

        setSuccessMessage(res?.message || `Active LinkedIn asset set to '${selected.name}'.`);
        return selected;
      } else {
        throw new Error(res?.message || `Failed to select LinkedIn asset.`);
      }
    } catch (err) {
      console.error(`LinkedIn selectAsset error (${normalized}):`, err);
      setError(err?.message || `Failed to select LinkedIn asset.`);
      throw err;
    }
  };

  // Derived state helpers
  const adsStatus = status?.ads;
  const communityStatus = status?.community;

  const isAdsConnected = Boolean(adsStatus?.connected && adsStatus?.status === "connected");
  const isCommunityConnected = Boolean(communityStatus?.connected && communityStatus?.status === "connected");
  const isAnyConnected = isAdsConnected || isCommunityConnected;

  const isAdsApprovalPending = adsStatus?.approvalStatus === "pending_approval" || config?.ads?.productStatus === "pending_approval";
  const isCommunityApprovalPending = communityStatus?.approvalStatus === "pending_approval" || config?.community?.productStatus === "pending_approval";

  const adsSelectedAsset = adsAssetsData?.selectedAsset || adsStatus?.selectedAsset || null;
  const communitySelectedAsset = communityAssetsData?.selectedAsset || communityStatus?.selectedAsset || null;

  return {
    config,
    status,
    adsStatus,
    communityStatus,
    isAdsConnected,
    isCommunityConnected,
    isAnyConnected,
    isAdsApprovalPending,
    isCommunityApprovalPending,
    adsAssetsData,
    communityAssetsData,
    adsAssets: adsAssetsData?.assets || [],
    communityAssets: communityAssetsData?.assets || [],
    adsSelectedAsset,
    communitySelectedAsset,
    isLoadingStatus,
    isLoadingAssets,
    isConnecting,
    isDisconnecting,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    refresh: fetchStatusAndConfig,
    refreshAssets: fetchAppAssets,
    getSelectedAsset: fetchSelectedAsset,
    connect: handleConnect,
    disconnect: handleDisconnect,
    selectAsset: handleSelectAsset,
  };
}

export default useLinkedIn;
