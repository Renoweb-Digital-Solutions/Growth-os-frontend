// Reason: Meta API wrapper providing frontend service calls for all backend Meta endpoints.
// How: Invokes apiClient methods, passing JWT in Authorization headers, handling query params via URLSearchParams,
//      and preserving exact backend response structures.

import apiClient from "./apiClient.js";

/**
 * Builds URL query string using URLSearchParams for safety
 */
const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      searchParams.append(key, val);
    }
  });
  return searchParams;
};

// ============================================================================
// PHASE 1 — META OAUTH & CONNECTION MANAGEMENT
// ============================================================================

/**
 * Robustly normalizes Meta connection status response across top-level and nested data envelopes
 */
export function normalizeMetaStatus(statusRes) {
  if (!statusRes) {
    return {
      connected: false,
      status: "disconnected",
      metaUserId: null,
      grantedScopes: [],
      connectedAt: null,
      updatedAt: null,
      needsReconnect: false,
    };
  }

  const nested = statusRes.data && typeof statusRes.data === "object" ? statusRes.data : null;

  const isConnected = Boolean(
    statusRes.connected === true ||
    nested?.connected === true ||
    statusRes.status === "connected" ||
    nested?.status === "connected"
  );

  const status =
    statusRes.status ||
    nested?.status ||
    (isConnected ? "connected" : "disconnected");

  const metaUserId = statusRes.metaUserId || nested?.metaUserId || null;

  const grantedScopes = Array.isArray(statusRes.grantedScopes)
    ? statusRes.grantedScopes
    : Array.isArray(nested?.grantedScopes)
    ? nested.grantedScopes
    : [];

  const connectedAt = statusRes.connectedAt || nested?.connectedAt || null;
  const updatedAt = statusRes.updatedAt || nested?.updatedAt || null;

  const needsReconnect = Boolean(
    statusRes.needsReconnect ??
    nested?.needsReconnect ??
    (status === "expired" || statusRes.status === "expired")
  );

  return {
    ...(nested || {}),
    ...statusRes,
    connected: isConnected,
    status,
    metaUserId,
    grantedScopes,
    connectedAt,
    updatedAt,
    needsReconnect,
  };
}

/**
 * Robustly normalizes Meta discovered assets response across top-level and nested data envelopes.
 * Guarantees every page has both pageId and id populated as matching strings.
 */
export function normalizeMetaAssets(assetsRes) {
  if (!assetsRes) return null;

  let raw = assetsRes;
  if (raw.data && typeof raw.data === "object") {
    if (
      Array.isArray(raw.data.pages) ||
      Array.isArray(raw.data.instagramAccounts) ||
      Array.isArray(raw.data.adAccounts) ||
      raw.data.capabilities
    ) {
      raw = raw.data;
    } else if (raw.data.data && typeof raw.data.data === "object") {
      raw = raw.data.data;
    }
  }

  const rawPages = Array.isArray(raw.pages)
    ? raw.pages
    : Array.isArray(assetsRes.pages)
    ? assetsRes.pages
    : [];
  const rawInstagram = Array.isArray(raw.instagramAccounts)
    ? raw.instagramAccounts
    : Array.isArray(assetsRes.instagramAccounts)
    ? assetsRes.instagramAccounts
    : [];
  const rawAdAccounts = Array.isArray(raw.adAccounts)
    ? raw.adAccounts
    : Array.isArray(assetsRes.adAccounts)
    ? assetsRes.adAccounts
    : [];

  const pages = rawPages.map((p) => {
    const pageId = String(p.pageId || p.id || "");
    return {
      ...p,
      id: pageId,
      pageId: pageId,
      name: p.name || `Page ${pageId}`,
    };
  });

  const instagramAccounts = rawInstagram.map((ig) => {
    const igId = String(ig.instagramAccountId || ig.id || "");
    return {
      ...ig,
      id: igId,
      instagramAccountId: igId,
      username: ig.username || ig.name || `Account ${igId}`,
    };
  });

  const adAccounts = rawAdAccounts.map((ad) => {
    const adId = String(ad.adAccountId || ad.id || "");
    return {
      ...ad,
      id: adId,
      adAccountId: adId,
      name: ad.name || `Ad Account ${adId}`,
    };
  });

  const capabilities = raw.capabilities || assetsRes.capabilities || {
    pagesAvailable: pages.length > 0,
    instagramAvailable: instagramAccounts.length > 0,
    adsAvailable: adAccounts.length > 0,
  };

  const normalized = {
    ...raw,
    pages,
    instagramAccounts,
    adAccounts,
    hasPages: pages.length > 0,
    hasInstagram: instagramAccounts.length > 0,
    hasAdAccounts: adAccounts.length > 0,
    capabilities,
  };

  normalized.data = {
    ...normalized,
    pages,
    instagramAccounts,
    adAccounts,
  };

  return normalized;
}

/**
 * Fetches Meta connection status for authenticated user
 * Route: GET /api/meta/status
 */
export async function getMetaStatus(options = {}) {
  return apiClient.get("/api/meta/status", null, options);
}

/**
 * Initiates Meta OAuth flow by fetching authorization URL with format=json
 * Route: GET /api/meta/connect?format=json
 * Reason: Protected route requiring Bearer JWT. Returns { url } for client-side navigation.
 */
export async function connectMeta() {
  const query = buildQuery({ format: "json" });
  return apiClient.get(`/api/meta/connect?${query.toString()}`);
}

/**
 * Disconnects Meta integration for authenticated user
 * Route: DELETE /api/meta/disconnect
 */
export async function disconnectMeta() {
  return apiClient.delete("/api/meta/disconnect");
}

// ============================================================================
// PHASE 2 — META ASSETS & DISCOVERY
// ============================================================================

/**
 * Discovers accessible Meta assets & capability flags
 * Route: GET /api/meta/assets
 * Supports optional params like { refresh: true } to bust cache on backend
 */
export async function getMetaAssets(params = {}, options = {}) {
  const isParamsOptions = params && (params.signal !== undefined || params.headers !== undefined);
  const actualParams = isParamsOptions ? {} : params;
  const actualOptions = isParamsOptions ? params : options;
  const query = buildQuery(actualParams);
  const queryStr = query.toString();
  return apiClient.get(`/api/meta/assets${queryStr ? `?${queryStr}` : ""}`, null, actualOptions);
}

/**
 * Lists accessible Facebook Pages
 * Route: GET /api/meta/pages
 */
export async function getMetaPages() {
  return apiClient.get("/api/meta/pages");
}

/**
 * Lists connected Instagram Professional accounts
 * Route: GET /api/meta/instagram
 */
export async function getMetaInstagramAccounts() {
  return apiClient.get("/api/meta/instagram");
}

/**
 * Lists accessible Meta Ad Accounts
 * Route: GET /api/meta/ad-accounts
 */
export async function getMetaAdAccounts() {
  return apiClient.get("/api/meta/ad-accounts");
}

// ============================================================================
// PHASE 3 — UNIFIED GROMENTUM INSIGHTS & DELIVERY
// ============================================================================

/**
 * Executive overview of Social & Ads performance metrics
 * Route: GET /api/meta/insights/overview
 * Params: { datePreset, since, until }
 */
export async function getMetaOverview(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/overview", params, options);
}

/**
 * Unified Social insights for Facebook Pages and Instagram Accounts
 * Route: GET /api/meta/insights/social
 * Params: { pageId, instagramAccountId, datePreset, since, until }
 */
export async function getMetaSocialInsights(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/social", params, options);
}

/**
 * Dedicated Facebook Analytics endpoint inspired by Meta Business Suite
 * Route: GET /api/meta/insights/facebook
 * Params: { pageId, datePreset, since, until }
 */
export async function getMetaFacebookAnalytics(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/facebook", params, options);
}

/**
 * Consolidated post & media content insights list
 * Route: GET /api/meta/insights/content
 * Params: { platform, limit, after, since, until, datePreset }
 */
export async function getMetaContentInsights(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/content", params, options);
}

/**
 * Individual post/media content details
 * Route: GET /api/meta/insights/content/:contentId
 */
export async function getMetaContentDetail(contentId, options = {}) {
  return apiClient.get(`/api/meta/insights/content/${encodeURIComponent(contentId)}`, null, options);
}

/**
 * Advertising Insights across Ad Accounts with derived metrics
 * Route: GET /api/meta/insights/ads
 * Params: { adAccountId, level, datePreset, since, until, limit, after }
 */
export async function getMetaAdsInsights(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/ads", params, options);
}

/**
 * Campaign-level performance breakdown with currency subunit conversion
 * Route: GET /api/meta/insights/campaigns
 * Params: { adAccountId, status, limit, after }
 */
export async function getMetaCampaignInsights(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/campaigns", params, options);
}

/**
 * Ad Set performance breakdown
 * Route: GET /api/meta/insights/adsets
 * Params: { adAccountId, status, limit, after, since, until }
 */
export async function getMetaAdSetInsights(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/adsets", params, options);
}

/**
 * Individual Ad performance metrics
 * Route: GET /api/meta/insights/ads-level
 * Params: { adAccountId, status, limit, after, since, until }
 */
export async function getMetaAdsLevelInsights(params = {}, options = {}) {
  return apiClient.get("/api/meta/insights/ads-level", params, options);
}
