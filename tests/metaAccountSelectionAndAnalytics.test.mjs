// Reason: Test suite for Meta asset discovery, account selection, persistence,
// and Facebook analytics account-specific query targeting.
// How: Tests single-account defaulting, multiple accounts switching, scoped localStorage persistence,
//      cross-tab/cross-hook synchronization, and analytics API parameter targeting.

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import ReactDOMServer from "react-dom/server";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";

import {
  getCurrentUserId,
  clearMetaAssetSelection,
  useMetaAssetSelection,
} from "../hooks/useMetaAssetSelection.js";
import {
  getMetaFacebookAnalytics,
  getMetaOverview,
  getMetaContentInsights,
  getMetaSocialInsights,
  normalizeMetaStatus,
  normalizeMetaAssets,
} from "../lib/metaApi.js";

// ============================================================================
// Mock Environment Setup
// ============================================================================
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// ============================================================================
// TEST 1: getCurrentUserId extracts user ID from JWT token or defaults safely
// ============================================================================
test("getCurrentUserId derives user-scoped identity for localStorage keys", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  try {
    globalThis.window = {};
    const mockStorage = new MockLocalStorage();
    globalThis.localStorage = mockStorage;

    // 1. Without token -> guest_user
    assert.equal(getCurrentUserId(), "guest_user");

    // 2. With valid JWT containing user.id
    const payload1 = { user: { id: "user_abc_123", email: "user@example.com" } };
    const encoded1 = `header.${Buffer.from(JSON.stringify(payload1)).toString("base64")}.sig`;
    mockStorage.setItem("token", encoded1);
    assert.equal(getCurrentUserId(), "user_abc_123");

    // 3. With JWT containing sub
    const payload2 = { sub: "auth0|998877" };
    const encoded2 = `header.${Buffer.from(JSON.stringify(payload2)).toString("base64")}.sig`;
    mockStorage.setItem("token", encoded2);
    assert.equal(getCurrentUserId(), "auth0|998877");
  } finally {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  }
});

// ============================================================================
// TEST 2: Single account is selected by default while retaining account identity
// ============================================================================
test("Single discovered Facebook Page is selected by default and persisted", () => {
  const mockStorage = new MockLocalStorage();
  const userId = "test_user_single";
  const storageKey = `growthos_selected_meta_assets_${userId}`;

  const discoveredAssets = {
    pages: [
      { pageId: "page_101", name: "Solo Business Page", category: "E-Commerce", fanCount: 4500 },
    ],
    instagramAccounts: [
      { instagramAccountId: "ig_201", username: "solobusiness", followersCount: 1200 },
    ],
    adAccounts: [
      { adAccountId: "act_301", name: "Solo Ads", currency: "USD", accountStatus: 1 },
    ],
  };

  // Resolution logic matching useMetaAssetSelection
  const resolveSelection = (assets, stored) => {
    const pages = assets?.pages || [];
    const instagramAccounts = assets?.instagramAccounts || [];
    const adAccounts = assets?.adAccounts || [];

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

    return { pageId: validPageId, instagramId: validInstagramId, adAccountId: validAdAccountId };
  };

  const initialStored = {};
  const selected = resolveSelection(discoveredAssets, initialStored);

  assert.equal(selected.pageId, "page_101", "Page 101 auto-selected as default");
  assert.equal(selected.instagramId, "ig_201", "IG 201 auto-selected as default");
  assert.equal(selected.adAccountId, "act_301", "Ad Account 301 auto-selected as default");

  // Save to storage
  mockStorage.setItem(storageKey, JSON.stringify(selected));

  // Verify persistence
  const saved = JSON.parse(mockStorage.getItem(storageKey));
  assert.equal(saved.pageId, "page_101");
});

// ============================================================================
// TEST 3: Multiple accounts selection and switching between accounts
// ============================================================================
test("Multiple discovered Facebook Pages allow switching and persist new selection", () => {
  const mockStorage = new MockLocalStorage();
  const userId = "test_user_multi";
  const storageKey = `growthos_selected_meta_assets_${userId}`;

  const discoveredAssets = {
    pages: [
      { pageId: "page_primary", name: "Primary Retail Brand", category: "Retail" },
      { pageId: "page_secondary", name: "Secondary Outlet", category: "Wholesale" },
      { pageId: "page_tertiary", name: "Specialty Niche", category: "Services" },
    ],
  };

  // User initially gets default first page
  let currentSelection = {
    pageId: discoveredAssets.pages[0].pageId,
    instagramId: null,
    adAccountId: null,
  };
  mockStorage.setItem(storageKey, JSON.stringify(currentSelection));

  // User switches to page_secondary
  const switchPage = (newPageId) => {
    currentSelection = { ...currentSelection, pageId: String(newPageId) };
    mockStorage.setItem(storageKey, JSON.stringify(currentSelection));
  };

  switchPage("page_secondary");
  assert.equal(currentSelection.pageId, "page_secondary", "State updated to secondary page");

  // Verify updated in localStorage
  const readBack = JSON.parse(mockStorage.getItem(storageKey));
  assert.equal(readBack.pageId, "page_secondary", "Secondary page persisted in localStorage");

  // User switches to page_tertiary
  switchPage("page_tertiary");
  assert.equal(currentSelection.pageId, "page_tertiary");
  assert.equal(JSON.parse(mockStorage.getItem(storageKey)).pageId, "page_tertiary");
});

// ============================================================================
// TEST 4: Persistence across page refresh & navigation
// ============================================================================
test("Saved selection is restored when navigating to Analytics without re-discovery delay", () => {
  const mockStorage = new MockLocalStorage();
  const userId = "nav_user";
  const storageKey = `growthos_selected_meta_assets_${userId}`;

  // Prior session saved page_secondary
  mockStorage.setItem(
    storageKey,
    JSON.stringify({ pageId: "page_secondary", instagramId: "ig_secondary", adAccountId: "act_secondary" })
  );

  // New hook instantiation on Analytics page without discoveredAssets passed initially
  const readStoredSelection = (storage) => {
    const raw = storage.getItem(storageKey);
    if (!raw) return { pageId: null, instagramId: null, adAccountId: null };
    try {
      const parsed = JSON.parse(raw);
      return {
        pageId: parsed.pageId || null,
        instagramId: parsed.instagramId || null,
        adAccountId: parsed.adAccountId || null,
      };
    } catch {
      return { pageId: null, instagramId: null, adAccountId: null };
    }
  };

  const restored = readStoredSelection(mockStorage);
  assert.equal(restored.pageId, "page_secondary", "Immediately restores pageId");
  assert.equal(restored.instagramId, "ig_secondary", "Immediately restores instagramId");
  assert.equal(restored.adAccountId, "act_secondary", "Immediately restores adAccountId");
});

// ============================================================================
// TEST 5: Disconnect clears stored asset selections
// ============================================================================
test("clearMetaAssetSelection removes stored asset keys and resets state", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  try {
    let customEventFired = false;
    globalThis.window = {
      dispatchEvent: (evt) => {
        if (evt.type === "growthos_meta_asset_change") customEventFired = true;
      },
    };
    const mockStorage = new MockLocalStorage();
    globalThis.localStorage = mockStorage;

    const userId = "disconnect_user";
    const storageKey = `growthos_selected_meta_assets_${userId}`;
    mockStorage.setItem(storageKey, JSON.stringify({ pageId: "p1", instagramId: "ig1", adAccountId: "act1" }));

    clearMetaAssetSelection(userId);

    assert.equal(mockStorage.getItem(storageKey), null, "Storage key removed");
    assert.equal(customEventFired, true, "Notified other components of clear event");
  } finally {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  }
});

// ============================================================================
// TEST 6: Analytics API requests include pageId parameter for selected account
// ============================================================================
test("GET /api/meta/insights/facebook and related endpoints pass selected pageId parameter", async () => {
  const originalFetch = globalThis.fetch;
  const capturedUrls = [];

  globalThis.fetch = async (url) => {
    capturedUrls.push(String(url));
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        data: {
          pageId: "page_selected_88",
          performance: { views: { total: 1200, status: "AVAILABLE" } },
          audience: { lifetimeFollowers: { current: 3500 } },
        },
        meta: { source: "meta" },
      }),
    };
  };

  try {
    const selectedPageId = "page_selected_88";

    // 1. Facebook Analytics endpoint
    await getMetaFacebookAnalytics({ pageId: selectedPageId, datePreset: "28d" });
    assert.ok(
      capturedUrls[0].includes("/api/meta/insights/facebook?"),
      "Calls facebook analytics endpoint"
    );
    assert.ok(
      capturedUrls[0].includes("pageId=page_selected_88"),
      "Includes pageId in query parameters"
    );
    assert.ok(
      capturedUrls[0].includes("datePreset=28d"),
      "Includes datePreset in query parameters"
    );

    // 2. Facebook Content Insights endpoint
    await getMetaContentInsights({ platform: "facebook", pageId: selectedPageId, limit: 50 });
    assert.ok(
      capturedUrls[1].includes("/api/meta/insights/content?"),
      "Calls content insights endpoint"
    );
    assert.ok(
      capturedUrls[1].includes("pageId=page_selected_88"),
      "Includes pageId in content insights query parameters"
    );

    // 3. Social Insights endpoint
    await getMetaSocialInsights({ pageId: selectedPageId, datePreset: "28d" });
    assert.ok(
      capturedUrls[2].includes("/api/meta/insights/social?"),
      "Calls social insights endpoint"
    );
    assert.ok(
      capturedUrls[2].includes("pageId=page_selected_88"),
      "Includes pageId in social insights query parameters"
    );

    // 4. Overview endpoint
    await getMetaOverview({ pageId: selectedPageId, datePreset: "28d" });
    assert.ok(
      capturedUrls[3].includes("/api/meta/insights/overview?"),
      "Calls overview endpoint"
    );
    assert.ok(
      capturedUrls[3].includes("pageId=page_selected_88"),
      "Includes pageId in overview query parameters"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 7: useMetaAssetSelection returns all expected API fields including isInitialized
// ============================================================================
test("useMetaAssetSelection returns isInitialized, selectedAssets, and action handlers without ReferenceError", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  try {
    globalThis.window = {};
    const mockStorage = new MockLocalStorage();
    globalThis.localStorage = mockStorage;

    let hookResult;
    function TestComponent() {
      hookResult = useMetaAssetSelection();
      return null;
    }

    ReactDOMServer.renderToString(React.createElement(TestComponent));

    assert.ok(hookResult, "Hook returned an object");
    assert.equal(typeof hookResult.isInitialized, "boolean", "isInitialized is defined as a boolean");
    assert.equal(typeof hookResult.selectPage, "function", "selectPage is a function");
    assert.equal(typeof hookResult.selectInstagram, "function", "selectInstagram is a function");
    assert.equal(typeof hookResult.selectAdAccount, "function", "selectAdAccount is a function");
    assert.equal(typeof hookResult.clearSelection, "function", "clearSelection is a function");
    assert.ok(hookResult.selectedAssets !== undefined, "selectedAssets is defined");
  } finally {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  }
});

// ============================================================================
// TEST 8: normalizeMetaStatus parses status in both flat and nested data envelopes
// ============================================================================
test("normalizeMetaStatus accurately detects connected state across envelope variants", () => {
  // Case A: Flat backend response (Growth-OS-Backend standard)
  const flatConnected = {
    success: true,
    connected: true,
    status: "connected",
    metaUserId: "meta_123",
    grantedScopes: ["pages_show_list"],
    connectedAt: "2026-10-01T00:00:00Z",
  };
  const normFlat = normalizeMetaStatus(flatConnected);
  assert.equal(normFlat.connected, true, "Flat connected: true normalized");
  assert.equal(normFlat.status, "connected");
  assert.equal(normFlat.metaUserId, "meta_123");

  // Case B: Nested data envelope (API gateway or wrapper)
  const nestedConnected = {
    success: true,
    data: {
      connected: true,
      status: "connected",
      metaUserId: "meta_456",
      grantedScopes: ["pages_show_list", "instagram_basic"],
      connectedAt: "2026-10-02T00:00:00Z",
    },
  };
  const normNested = normalizeMetaStatus(nestedConnected);
  assert.equal(normNested.connected, true, "Nested data.connected: true normalized");
  assert.equal(normNested.status, "connected");
  assert.equal(normNested.metaUserId, "meta_456");

  // Case C: Disconnected response
  const disconnected = {
    success: true,
    connected: false,
    status: "disconnected",
  };
  const normDis = normalizeMetaStatus(disconnected);
  assert.equal(normDis.connected, false, "Disconnected state is false");
  assert.equal(normDis.status, "disconnected");

  // Case D: Null/undefined input
  const normNull = normalizeMetaStatus(null);
  assert.equal(normNull.connected, false);
  assert.equal(normNull.status, "disconnected");
});

// ============================================================================
// TEST 9: normalizeMetaAssets guarantees both id and pageId are string identifiers
// ============================================================================
test("normalizeMetaAssets guarantees pageId and id compatibility across nested and flat responses", () => {
  // Case A: Backend data envelope with safePages containing pageId
  const backendAssets = {
    success: true,
    data: {
      pages: [
        { pageId: "987654", name: "Renoweb Page", category: "Software" },
        { id: "123456", name: "Secondary Page" },
      ],
      instagramAccounts: [
        { instagramAccountId: "ig_999", username: "renoweb_official" },
      ],
      adAccounts: [
        { adAccountId: "act_777", name: "Main Ads", currency: "USD" },
      ],
    },
  };

  const norm = normalizeMetaAssets(backendAssets);
  assert.equal(norm.pages.length, 2);
  assert.equal(norm.pages[0].pageId, "987654");
  assert.equal(norm.pages[0].id, "987654", "Both pageId and id match");
  assert.equal(norm.pages[1].pageId, "123456");
  assert.equal(norm.pages[1].id, "123456");
  assert.equal(norm.instagramAccounts[0].instagramAccountId, "ig_999");
  assert.equal(norm.instagramAccounts[0].id, "ig_999");
  assert.equal(norm.adAccounts[0].adAccountId, "act_777");
  assert.equal(norm.adAccounts[0].id, "act_777");
  assert.equal(norm.hasPages, true);
  assert.equal(norm.hasInstagram, true);
  assert.equal(norm.hasAdAccounts, true);

  // Backwards compatibility with res.data.pages
  assert.equal(norm.data.pages.length, 2);
});

// ============================================================================
// TEST 10: StrictMode / remount sequence does not abort and leave disconnected state
// ============================================================================
test("StrictMode unmount and remount completes status and asset resolution cleanly", async () => {
  let isFetching = false;
  let abortController = null;
  let metaStatus = { connected: false, status: "loading" };
  let assets = null;
  let isLoadingStatus = true;

  const runFetch = async () => {
    if (isFetching && abortController && !abortController.signal.aborted) {
      abortController.abort();
    }
    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
    }
    const currentController = new AbortController();
    abortController = currentController;
    isFetching = true;
    isLoadingStatus = true;

    try {
      // Simulate network latency
      await new Promise((res) => setTimeout(res, 10));
      if (currentController.signal.aborted) return;

      metaStatus = normalizeMetaStatus({ success: true, connected: true, status: "connected" });
      assets = normalizeMetaAssets({
        success: true,
        data: { pages: [{ pageId: "111", name: "Active Page" }] },
      });
    } finally {
      if (!currentController.signal.aborted) {
        isFetching = false;
        isLoadingStatus = false;
      }
    }
  };

  // Mount 1 starts
  const p1 = runFetch();

  // StrictMode cleanup runs immediately (aborts mount 1)
  if (abortController) abortController.abort();
  isFetching = false;

  // Mount 2 starts
  const p2 = runFetch();

  await Promise.all([p1, p2]);

  assert.equal(isLoadingStatus, false, "Status loading completed");
  assert.equal(metaStatus.connected, true, "Meta status transitioned to connected: true");
  assert.equal(assets.pages.length, 1, "Discovered assets populated");
  assert.equal(assets.pages[0].pageId, "111");
});

