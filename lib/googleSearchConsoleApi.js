// Reason: Google Search Console API wrapper providing frontend service calls for backend Google integration endpoints.
// How: Invokes apiClient methods, attaching JWT in Authorization headers, safely encoding siteUrl and query parameters via URLSearchParams,
//      and preserving exact backend JSON response structures.

import apiClient from "./apiClient";

// ============================================================================
// PHASE 1 — OAUTH & INTEGRATION MANAGEMENT
// ============================================================================

/**
 * Fetches Google Search Console connection status for authenticated user
 * Route: GET /api/google/status
 */
export async function getGoogleStatus(options = {}) {
  return apiClient.get("/api/google/status", null, options);
}

/**
 * Initiates Google OAuth authorization flow by fetching authorization URL with format=json
 * Route: GET /api/google/connect?format=json
 * Reason: Protected route requiring Bearer JWT. Returns { url } for client-side navigation.
 */
export async function connectGoogle(options = {}) {
  return apiClient.get("/api/google/connect", { format: "json" }, options);
}

/**
 * Disconnects Google Search Console integration for authenticated user
 * Route: DELETE /api/google/disconnect
 */
export async function disconnectGoogle(options = {}) {
  return apiClient.delete("/api/google/disconnect", options);
}

// ============================================================================
// PHASE 2 — SEARCH CONSOLE PROPERTIES & DISCOVERY
// ============================================================================

/**
 * Lists verified Google Search Console properties for authenticated user
 * Route: GET /api/google/properties
 */
export async function getGoogleProperties(options = {}) {
  return apiClient.get("/api/google/properties", null, options);
}

// ============================================================================
// PHASE 3 — SEARCH CONSOLE INSIGHTS & DELIVERABLES
// ============================================================================

/**
 * Helper to separate fetch options (signal, headers) from query parameters
 */
function parseOptions(siteUrl, options = {}) {
  if (!siteUrl) {
    throw new Error("siteUrl parameter is required for Google Search Console insights requests.");
  }

  const { signal, headers, ...queryParams } = options;
  const fetchOptions = {};
  if (signal) fetchOptions.signal = signal;
  if (headers) fetchOptions.headers = headers;

  return {
    queryParams: { siteUrl, ...queryParams },
    fetchOptions,
  };
}

/**
 * Executive overview of organic search metrics (Clicks, Impressions, CTR, Position)
 * Route: GET /api/google/insights/overview
 * Params: siteUrl (required), startDate (optional), endDate (optional)
 */
export async function getGoogleOverview(siteUrl, options = {}) {
  const { queryParams, fetchOptions } = parseOptions(siteUrl, options);
  return apiClient.get("/api/google/insights/overview", queryParams, fetchOptions);
}

/**
 * Performance trend metrics with dimension groupings
 * Route: GET /api/google/insights/performance
 * Params: siteUrl (required), startDate (optional), endDate (optional), dimension (optional), rowLimit (optional), startRow (optional)
 */
export async function getGooglePerformance(siteUrl, options = {}) {
  const { queryParams, fetchOptions } = parseOptions(siteUrl, options);
  return apiClient.get("/api/google/insights/performance", queryParams, fetchOptions);
}

/**
 * Top Search Queries performance breakdown
 * Route: GET /api/google/insights/queries
 * Params: siteUrl (required), startDate (optional), endDate (optional), rowLimit (optional), startRow (optional)
 */
export async function getGoogleQueries(siteUrl, options = {}) {
  const { queryParams, fetchOptions } = parseOptions(siteUrl, options);
  return apiClient.get("/api/google/insights/queries", queryParams, fetchOptions);
}

/**
 * Top Landing Pages performance breakdown
 * Route: GET /api/google/insights/pages
 * Params: siteUrl (required), startDate (optional), endDate (optional), rowLimit (optional), startRow (optional)
 */
export async function getGooglePages(siteUrl, options = {}) {
  const { queryParams, fetchOptions } = parseOptions(siteUrl, options);
  return apiClient.get("/api/google/insights/pages", queryParams, fetchOptions);
}

/**
 * Country geographic search performance breakdown
 * Route: GET /api/google/insights/countries
 * Params: siteUrl (required), startDate (optional), endDate (optional), rowLimit (optional), startRow (optional)
 */
export async function getGoogleCountries(siteUrl, options = {}) {
  const { queryParams, fetchOptions } = parseOptions(siteUrl, options);
  return apiClient.get("/api/google/insights/countries", queryParams, fetchOptions);
}

/**
 * Device category search performance breakdown
 * Route: GET /api/google/insights/devices
 * Params: siteUrl (required), startDate (optional), endDate (optional), rowLimit (optional), startRow (optional)
 */
export async function getGoogleDevices(siteUrl, options = {}) {
  const { queryParams, fetchOptions } = parseOptions(siteUrl, options);
  return apiClient.get("/api/google/insights/devices", queryParams, fetchOptions);
}
