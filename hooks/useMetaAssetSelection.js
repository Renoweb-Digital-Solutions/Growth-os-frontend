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

export function useMetaAssetSelection(discoveredAssets) {
  const [selectedAssets, setSelectedAssets] = useState(() => {
    if (typeof window === "undefined") return { pageId: null, instagramId: null, adAccountId: null };
    try {
      const userId = getCurrentUserId();
      const raw = localStorage.getItem(`growthos_selected_meta_assets_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          pageId: parsed.pageId || null,
          instagramId: parsed.instagramId || null,
          adAccountId: parsed.adAccountId || null,
        };
      }
    } catch (e) {
      console.error("Failed to parse initial stored asset selection:", e);
    }
    return { pageId: null, instagramId: null, adAccountId: null };
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to read persisted selections from localStorage for current user
  const getStorageKey = useCallback(() => {
    const userId = getCurrentUserId();
    return `growthos_selected_meta_assets_${userId}`;
  }, []);

  // Sync selection with discovered assets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getStorageKey();
    let stored = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to read stored asset selection:", e);
    }

    if (!discoveredAssets) {
      setSelectedAssets((prev) => {
        const newSel = {
          pageId: stored.pageId || prev.pageId || null,
          instagramId: stored.instagramId || prev.instagramId || null,
          adAccountId: stored.adAccountId || prev.adAccountId || null,
        };
        if (
          prev.pageId === newSel.pageId &&
          prev.instagramId === newSel.instagramId &&
          prev.adAccountId === newSel.adAccountId
        ) {
          return prev;
        }
        return newSel;
      });
      return;
    }

    const pages = discoveredAssets.pages || [];
    const instagramAccounts = discoveredAssets.instagramAccounts || [];
    const adAccounts = discoveredAssets.adAccounts || [];

    // 1. Resolve Facebook Page selection
    let validPageId = null;
    if (pages.length > 0) {
      const found = pages.find((p) => String(p.pageId || p.id) === String(stored.pageId));
      if (found) {
        validPageId = String(found.pageId || found.id);
      } else {
        validPageId = String(pages[0].pageId || pages[0].id);
      }
    }

    // 2. Resolve Instagram Account selection
    let validInstagramId = null;
    if (instagramAccounts.length > 0) {
      const found = instagramAccounts.find((ig) => String(ig.instagramAccountId || ig.id) === String(stored.instagramId));
      if (found) {
        validInstagramId = String(found.instagramAccountId || found.id);
      } else {
        validInstagramId = String(instagramAccounts[0].instagramAccountId || instagramAccounts[0].id);
      }
    }

    // 3. Resolve Ad Account selection
    let validAdAccountId = null;
    if (adAccounts.length > 0) {
      const found = adAccounts.find((ad) => String(ad.adAccountId || ad.id) === String(stored.adAccountId));
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

    setSelectedAssets((prev) => {
      if (
        prev.pageId === newSelection.pageId &&
        prev.instagramId === newSelection.instagramId &&
        prev.adAccountId === newSelection.adAccountId
      ) {
        return prev;
      }
      return newSelection;
    });

    setIsInitialized(true);

    // Save validated selection to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSelection));
    } catch (e) {
      console.error("Failed to save asset selection to localStorage:", e);
    }
  }, [discoveredAssets, getStorageKey]);

  // Handler to update selected Page
  const selectPage = useCallback((pageId) => {
    setSelectedAssets((prev) => {
      const updated = { ...prev, pageId: pageId ? String(pageId) : null };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save page selection:", e);
      }
      return updated;
    });
  }, [getStorageKey]);

  // Handler to update selected Instagram account
  const selectInstagram = useCallback((instagramId) => {
    setSelectedAssets((prev) => {
      const updated = { ...prev, instagramId: instagramId ? String(instagramId) : null };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save instagram selection:", e);
      }
      return updated;
    });
  }, [getStorageKey]);

  // Handler to update selected Ad Account
  const selectAdAccount = useCallback((adAccountId) => {
    setSelectedAssets((prev) => {
      const updated = { ...prev, adAccountId: adAccountId ? String(adAccountId) : null };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save ad account selection:", e);
      }
      return updated;
    });
  }, [getStorageKey]);

  return {
    selectedAssets,
    isInitialized,
    selectPage,
    selectInstagram,
    selectAdAccount,
  };
}
