"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Gets the current authenticated user identity key to scope localStorage persistence
 */
export function getCurrentUserId() {
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
 * Clears the persisted Meta asset selection in localStorage for a specific or current user
 */
export function clearMetaAssetSelection(targetUserId = null) {
  if (typeof window === "undefined") return;
  try {
    const userId = targetUserId || getCurrentUserId();
    localStorage.removeItem(`growthos_selected_meta_assets_${userId}`);
    window.dispatchEvent(
      new CustomEvent("growthos_meta_asset_change", {
        detail: { pageId: null, instagramId: null, adAccountId: null },
      })
    );
  } catch (e) {
    console.error("Failed to clear stored Meta asset selection:", e);
  }
}

export function useMetaAssetSelection(discoveredAssets) {
  // Helper to read persisted selections from localStorage for current user
  const getStorageKey = useCallback(() => {
    const userId = getCurrentUserId();
    return `growthos_selected_meta_assets_${userId}`;
  }, []);

  const [selectedAssets, setSelectedAssets] = useState(() => {
    if (typeof window === "undefined") return { pageId: null, instagramId: null, adAccountId: null };
    try {
      const userId = getCurrentUserId();
      const raw = localStorage.getItem(`growthos_selected_meta_assets_${userId}`);
      let stored = {};
      if (raw) stored = JSON.parse(raw);

      if (discoveredAssets) {
        const pages = discoveredAssets.pages || [];
        const instagramAccounts = discoveredAssets.instagramAccounts || [];
        const adAccounts = discoveredAssets.adAccounts || [];

        let validPageId = null;
        if (pages.length > 0) {
          const found = pages.find((p) => String(p.pageId || p.id) === String(stored.pageId));
          validPageId = found ? String(found.pageId || found.id) : String(pages[0].pageId || pages[0].id);
        }

        let validInstagramId = null;
        if (instagramAccounts.length > 0) {
          const found = instagramAccounts.find((ig) => String(ig.instagramAccountId || ig.id) === String(stored.instagramId));
          validInstagramId = found ? String(found.instagramAccountId || found.id) : String(instagramAccounts[0].instagramAccountId || instagramAccounts[0].id);
        }

        let validAdAccountId = null;
        if (adAccounts.length > 0) {
          const found = adAccounts.find((ad) => String(ad.adAccountId || ad.id) === String(stored.adAccountId));
          validAdAccountId = found ? String(found.adAccountId || found.id) : String(adAccounts[0].adAccountId || adAccounts[0].id);
        }

        const initialSelection = { pageId: validPageId, instagramId: validInstagramId, adAccountId: validAdAccountId };
        try {
          localStorage.setItem(`growthos_selected_meta_assets_${userId}`, JSON.stringify(initialSelection));
        } catch (e) {
          console.error("Failed to save initial asset selection to localStorage:", e);
        }
        return initialSelection;
      }

      return {
        pageId: stored.pageId || null,
        instagramId: stored.instagramId || null,
        adAccountId: stored.adAccountId || null,
      };
    } catch (e) {
      console.error("Failed to parse initial stored asset selection:", e);
    }
    return { pageId: null, instagramId: null, adAccountId: null };
  });

  const [prevDiscoveredAssets, setPrevDiscoveredAssets] = useState(discoveredAssets);
  const [isInitialized, setIsInitialized] = useState(() => {
    return Boolean(!discoveredAssets || (discoveredAssets.pages || discoveredAssets.instagramAccounts || discoveredAssets.adAccounts));
  });

  // Adjust state during render when discoveredAssets changes (React recommended pattern)
  if (discoveredAssets && discoveredAssets !== prevDiscoveredAssets) {
    setPrevDiscoveredAssets(discoveredAssets);
    setIsInitialized(true);

    let stored = {};
    if (typeof window !== "undefined") {
      try {
        const userId = getCurrentUserId();
        const raw = localStorage.getItem(`growthos_selected_meta_assets_${userId}`);
        if (raw) stored = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to read stored asset selection:", e);
      }
    }

    const pages = discoveredAssets.pages || [];
    const instagramAccounts = discoveredAssets.instagramAccounts || [];
    const adAccounts = discoveredAssets.adAccounts || [];

    // 1. Resolve Facebook Page selection
    let validPageId = null;
    if (pages.length > 0) {
      const found = pages.find((p) => String(p.pageId || p.id) === String(stored.pageId || selectedAssets.pageId));
      if (found) {
        validPageId = String(found.pageId || found.id);
      } else {
        validPageId = String(pages[0].pageId || pages[0].id);
      }
    }

    // 2. Resolve Instagram Account selection
    let validInstagramId = null;
    if (instagramAccounts.length > 0) {
      const found = instagramAccounts.find((ig) => String(ig.instagramAccountId || ig.id) === String(stored.instagramId || selectedAssets.instagramId));
      if (found) {
        validInstagramId = String(found.instagramAccountId || found.id);
      } else {
        validInstagramId = String(instagramAccounts[0].instagramAccountId || instagramAccounts[0].id);
      }
    }

    // 3. Resolve Ad Account selection
    let validAdAccountId = null;
    if (adAccounts.length > 0) {
      const found = adAccounts.find((ad) => String(ad.adAccountId || ad.id) === String(stored.adAccountId || selectedAssets.adAccountId));
      if (found) {
        validAdAccountId = String(found.adAccountId || found.id);
      } else {
        validAdAccountId = String(adAccounts[0].adAccountId || adAccounts[0].id);
      }
    }

    const newSelection = {
      pageId: validPageId,
      instagramId: validInstagramId,
      adAccountId: validAdAccountId,
    };

    if (
      selectedAssets.pageId !== newSelection.pageId ||
      selectedAssets.instagramId !== newSelection.instagramId ||
      selectedAssets.adAccountId !== newSelection.adAccountId
    ) {
      setSelectedAssets(newSelection);
    }

    if (typeof window !== "undefined") {
      try {
        const userId = getCurrentUserId();
        localStorage.setItem(`growthos_selected_meta_assets_${userId}`, JSON.stringify(newSelection));
      } catch (e) {
        console.error("Failed to save asset selection to localStorage:", e);
      }
    }
  }

  // Listen to custom cross-hook and cross-tab storage changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAssetChange = (e) => {
      if (e?.detail) {
        setSelectedAssets((prev) => {
          if (
            prev.pageId === e.detail.pageId &&
            prev.instagramId === e.detail.instagramId &&
            prev.adAccountId === e.detail.adAccountId
          ) {
            return prev;
          }
          return {
            pageId: e.detail.pageId || null,
            instagramId: e.detail.instagramId || null,
            adAccountId: e.detail.adAccountId || null,
          };
        });
      }
    };

    const handleStorage = (e) => {
      const storageKey = getStorageKey();
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSelectedAssets((prev) => {
            if (
              prev.pageId === parsed.pageId &&
              prev.instagramId === parsed.instagramId &&
              prev.adAccountId === parsed.adAccountId
            ) {
              return prev;
            }
            return {
              pageId: parsed.pageId || null,
              instagramId: parsed.instagramId || null,
              adAccountId: parsed.adAccountId || null,
            };
          });
        } catch (err) {
          console.error("Failed to parse storage update:", err);
        }
      }
    };

    window.addEventListener("growthos_meta_asset_change", handleAssetChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("growthos_meta_asset_change", handleAssetChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [getStorageKey]);

  // Handler to update selected Page
  const selectPage = useCallback((pageId) => {
    const stringId = pageId ? String(pageId) : null;
    setSelectedAssets((prev) => {
      const updated = { ...prev, pageId: stringId };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save page selection:", e);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("growthos_meta_asset_change", { detail: updated }));
      }
      return updated;
    });
  }, [getStorageKey]);

  // Handler to update selected Instagram account
  const selectInstagram = useCallback((instagramId) => {
    const stringId = instagramId ? String(instagramId) : null;
    setSelectedAssets((prev) => {
      const updated = { ...prev, instagramId: stringId };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save instagram selection:", e);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("growthos_meta_asset_change", { detail: updated }));
      }
      return updated;
    });
  }, [getStorageKey]);

  // Handler to update selected Ad Account
  const selectAdAccount = useCallback((adAccountId) => {
    const stringId = adAccountId ? String(adAccountId) : null;
    setSelectedAssets((prev) => {
      const updated = { ...prev, adAccountId: stringId };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save ad account selection:", e);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("growthos_meta_asset_change", { detail: updated }));
      }
      return updated;
    });
  }, [getStorageKey]);

  const clearSelection = useCallback(() => {
    clearMetaAssetSelection();
    setSelectedAssets({ pageId: null, instagramId: null, adAccountId: null });
  }, []);

  return {
    selectedAssets,
    isInitialized,
    selectPage,
    selectInstagram,
    selectAdAccount,
    clearSelection,
  };
}
