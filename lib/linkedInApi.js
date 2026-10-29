// Reason: LinkedIn API client wrapper providing frontend service calls for backend LinkedIn endpoints.
// How: Communicates through apiClient, passing JWT in Authorization header, supporting both 'ads' and 'community' apps,
//      persisting exact backend response structures without fabricating mock analytics.

import apiClient from "./apiClient.js";

/**
 * Normalizes app parameter to 'ads' or 'community'
 */
export function normalizeLinkedInApp(app) {
  if (!app) return "ads";
  const lower = String(app).toLowerCase().trim();
  if (["ads", "growmentum", "ad", "advertising"].includes(lower)) {
    return "ads";
  }
  if (["community", "growmentum-community", "pages", "org", "organization"].includes(lower)) {
    return "community";
  }
  return "ads";
}

// ============================================================================
// CONFIGURATION & STATUS ENDPOINTS
// ============================================================================

/**
 * Fetches safe public configuration metadata for both LinkedIn apps (no secrets)
 * Route: GET /api/linkedin/config
 */
export async function getLinkedInConfig(options = {}) {
  return apiClient.get("/api/linkedin/config", null, options);
}

/**
 * Fetches connection status for both LinkedIn apps ('ads' and 'community')
 * Route: GET /api/linkedin/status
 */
export async function getLinkedInStatus(options = {}) {
  return apiClient.get("/api/linkedin/status", null, options);
}

/**
 * Fetches connection status for a specific LinkedIn app
 * Route: GET /api/linkedin/:app/status
 */
export async function getLinkedInAppStatus(appType, options = {}) {
  const normalized = normalizeLinkedInApp(appType);
  return apiClient.get(`/api/linkedin/${normalized}/status`, null, options);
}

// ============================================================================
// OAUTH CONNECT & DISCONNECT ENDPOINTS
// ============================================================================

/**
 * Initiates LinkedIn OAuth flow by requesting authorization URL with format=json
 * Route: GET /api/linkedin/:app/connect?format=json
 * Returns: { success: true, url, state, appType }
 */
export async function connectLinkedIn(appType, options = {}) {
  const normalized = normalizeLinkedInApp(appType);
  return apiClient.get(`/api/linkedin/${normalized}/connect`, { format: "json" }, options);
}

/**
 * Disconnects a specific LinkedIn app integration (soft disconnect)
 * Route: DELETE /api/linkedin/:app/disconnect
 */
export async function disconnectLinkedIn(appType, options = {}) {
  const normalized = normalizeLinkedInApp(appType);
  return apiClient.delete(`/api/linkedin/${normalized}/disconnect`, options);
}

// ============================================================================
// ASSET DISCOVERY & SELECTION ENDPOINTS
// ============================================================================

/**
 * Lists authorized assets for a specific LinkedIn app (Ad Accounts or Company Pages)
 * Route: GET /api/linkedin/:app/assets
 * Returns: { success: true, data: { appType, appName, apiAccessAvailable, approvalStatus, message, requiredScopes, grantedScopes, assets, selectedAsset, count } }
 */
export async function getLinkedInAssets(appType, options = {}) {
  const normalized = normalizeLinkedInApp(appType);
  return apiClient.get(`/api/linkedin/${normalized}/assets`, null, options);
}

/**
 * Selects active asset for a specific LinkedIn app
 * Route: POST /api/linkedin/:app/selected-asset
 * Body: { assetId: string }
 */
export async function selectLinkedInAsset(appType, assetId, options = {}) {
  const normalized = normalizeLinkedInApp(appType);
  return apiClient.post(`/api/linkedin/${normalized}/selected-asset`, { assetId: String(assetId) }, options);
}

/**
 * Gets currently selected asset for a specific LinkedIn app
 * Route: GET /api/linkedin/:app/selected-asset
 */
export async function getLinkedInSelectedAsset(appType, options = {}) {
  const normalized = normalizeLinkedInApp(appType);
  return apiClient.get(`/api/linkedin/${normalized}/selected-asset`, null, options);
}
