// Reason: Google Analytics 4 API wrapper providing frontend service calls for backend GA4 endpoints.
// How: Invokes apiClient methods, passing Bearer JWT, formatting date/comparison/property params,
//      and preserving backend JSON envelope structures.

import apiClient from "./apiClient";

/**
 * Get Google Analytics 4 integration status and scope details
 * Route: GET /api/google/analytics/status
 */
export async function getGA4Status(options = {}) {
  return apiClient.get("/api/google/analytics/status", null, options);
}

/**
 * List verified Google Analytics 4 properties accessible by the user
 * Route: GET /api/google/analytics/properties
 */
export async function getGA4Properties(options = {}) {
  return apiClient.get("/api/google/analytics/properties", null, options);
}

/**
 * Select active GA4 property for authenticated user
 * Route: POST /api/google/analytics/property
 * Body: { propertyId }
 */
export async function selectGA4Property(propertyId, options = {}) {
  return apiClient.post("/api/google/analytics/property", { propertyId }, options);
}

/**
 * Executive overview of GA4 metrics (Active Users, Sessions, Engagement, Trends, Comparison)
 * Route: GET /api/google/analytics/insights/overview
 */
export async function getGA4Overview(params = {}, options = {}) {
  const { signal, headers, ...queryParams } = options;
  const fetchOptions = {};
  if (signal) fetchOptions.signal = signal;
  if (headers) fetchOptions.headers = headers;

  return apiClient.get("/api/google/analytics/insights/overview", { ...params, ...queryParams }, fetchOptions);
}

/**
 * Session-level Traffic Acquisition report (Channels, Sources, Mediums, Campaigns)
 * Route: GET /api/google/analytics/insights/acquisition
 */
export async function getGA4TrafficAcquisition(params = {}, options = {}) {
  const { signal, headers, ...queryParams } = options;
  const fetchOptions = {};
  if (signal) fetchOptions.signal = signal;
  if (headers) fetchOptions.headers = headers;

  return apiClient.get("/api/google/analytics/insights/acquisition", { ...params, ...queryParams }, fetchOptions);
}

/**
 * First-user Acquisition report (First-User Channels, Sources, Mediums, Campaigns)
 * Route: GET /api/google/analytics/insights/user-acquisition
 */
export async function getGA4UserAcquisition(params = {}, options = {}) {
  const { signal, headers, ...queryParams } = options;
  const fetchOptions = {};
  if (signal) fetchOptions.signal = signal;
  if (headers) fetchOptions.headers = headers;

  return apiClient.get("/api/google/analytics/insights/user-acquisition", { ...params, ...queryParams }, fetchOptions);
}

/**
 * Realtime GA4 metrics & dimensions report (Active users in last 30 minutes card)
 * Route: GET /api/google/analytics/insights/realtime
 */
export async function getGA4Realtime(params = {}, options = {}) {
  const { signal, headers, ...queryParams } = options;
  const fetchOptions = {};
  if (signal) fetchOptions.signal = signal;
  if (headers) fetchOptions.headers = headers;

  return apiClient.get("/api/google/analytics/insights/realtime", { ...params, ...queryParams }, fetchOptions);
}

/**
 * Suggested-for-You Card Data API supporting per-card independent date ranges and metric/dimension selection
 * Route: GET /api/google/analytics/insights/suggested-cards/:cardKey
 */
export async function getGA4SuggestedCard(cardKey, params = {}, options = {}) {
  const { signal, headers, ...queryParams } = options;
  const fetchOptions = {};
  if (signal) fetchOptions.signal = signal;
  if (headers) fetchOptions.headers = headers;

  const endpoint = cardKey
    ? `/api/google/analytics/insights/suggested-cards/${cardKey}`
    : `/api/google/analytics/insights/suggested-cards`;

  return apiClient.get(endpoint, { ...params, ...queryParams }, fetchOptions);
}
