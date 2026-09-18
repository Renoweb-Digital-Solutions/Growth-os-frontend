// Reason: Meta API wrapper providing frontend service calls for all backend Meta endpoints.
// How: Invokes apiClient methods, passing JWT in Authorization headers, handling query params via URLSearchParams,
//      and preserving exact backend response structures.

import apiClient from "./apiClient";

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
 */
export async function getMetaAssets(options = {}) {
  return apiClient.get("/api/meta/assets", null, options);
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
