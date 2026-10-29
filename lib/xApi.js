// Reason: Frontend API client wrapper for X (Twitter) integration and analytics endpoints.
// How: Communicates with backend endpoints through centralized apiClient, passing JWT in Authorization header,
//      handling query parameters, and preserving exact backend response structures without fabricating metrics.

import apiClient from "./apiClient.js";

/**
 * Fetches X account connection status and safe profile identity for authenticated user
 * Route: GET /api/x/status
 * Returns: { success: true, connected: boolean, status: string, account?: { xUserId, username, name, profileImageUrl, description } }
 */
export async function getXStatus(options = {}) {
  return apiClient.get("/api/x/status", null, options);
}

/**
 * Initiates X OAuth 2.0 PKCE flow by requesting authorization URL with format=json
 * Route: GET /api/x/connect?format=json
 * Returns: { success: true, url: string }
 */
export async function connectX(options = {}) {
  const res = await apiClient.get("/api/x/connect", { format: "json" }, options);
  if (res?.data?.url && !res.url) {
    return { ...res, url: res.data.url };
  }
  return res;
}

/**
 * Disconnects X account integration, revokes credentials, and clears snapshot cache
 * Route: DELETE /api/x/disconnect
 * Returns: { success: true, message: string }
 */
export async function disconnectX(options = {}) {
  return apiClient.delete("/api/x/disconnect", options);
}

/**
 * Fetches X analytics overview with lazy daily refresh and Redis caching
 * Route: GET /api/x/analytics/overview
 * Returns: { success: true, data: { account, audience, reach, engagement, contentSummary, topPosts, dailyActivity, recentPosts, fetchedAt, isStale, staleReason }, meta: { ... } }
 */
export async function getXAnalyticsOverview(params = null, options = {}) {
  if (params && (params.signal || params.headers)) {
    return apiClient.get("/api/x/analytics/overview", null, params);
  }
  return apiClient.get("/api/x/analytics/overview", params, options);
}

/**
 * Fetches recent X posts with public and organic engagement metrics
 * Route: GET /api/x/analytics/posts
 * Returns: { success: true, data: { posts: Array, count: number }, meta: { ... } }
 */
export async function getXRecentPosts(params = {}, options = {}) {
  return apiClient.get("/api/x/analytics/posts", params, options);
}

/**
 * Internal diagnostic endpoint for cache engine status (admin only)
 * Route: GET /api/x/cache/status
 */
export async function getXCacheStatus(options = {}) {
  return apiClient.get("/api/x/cache/status", null, options);
}
