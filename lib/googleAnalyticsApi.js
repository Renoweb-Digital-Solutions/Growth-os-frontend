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

/**
 * Constructs the native Google Analytics 4 report URL for a given card/report type,
 * target property object or ID, date range preset, and active metric/dimension selections.
 *
 * Uses the native GA4 report explorer route:
 * /reports/explorer?params=_r.explorerCard..selmet=["<METRIC>"]&_r.explorerCard..seldim=["<DIMENSION>"]
 */
export function getGA4ReportUrl(vizTypeOrCardId, propertyObjOrId, dateRange, activeMetric, activeDimension) {
  let cleanPropId = "";
  let cleanAccId = "";

  if (typeof propertyObjOrId === "object" && propertyObjOrId !== null) {
    cleanPropId = String(propertyObjOrId.propertyId || propertyObjOrId.id || "").replace(/^properties\//, "").trim();
    cleanAccId = String(propertyObjOrId.googleAccountId || propertyObjOrId.accountId || "").replace(/^accounts\//, "").trim();
  } else if (propertyObjOrId) {
    cleanPropId = String(propertyObjOrId).replace(/^properties\//, "").trim();
  }

  // Fallback to localStorage if propertyId was not explicitly passed
  if (!cleanPropId && typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("growthos_selected_ga4_property_")) {
          const val = localStorage.getItem(key);
          if (val) {
            cleanPropId = String(val).replace(/^properties\//, "").trim();
            break;
          }
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Gracefully handle missing or invalid property ID
  if (!cleanPropId) {
    return "https://analytics.google.com/analytics/web/";
  }

  const propertyHash = cleanAccId ? `a${cleanAccId}p${cleanPropId}` : `p${cleanPropId}`;

  // Card 1: Realtime card
  if (vizTypeOrCardId === "realtime" || vizTypeOrCardId === "sugg-1") {
    return `https://analytics.google.com/analytics/web/#/${propertyHash}/reports/realtime-overview`;
  }

  // Detailed Explorer Configuration per Card Type
  const CARD_CONFIGS = {
    // 1. Sessions by Session primary channel group
    trafficAcquisition: {
      defaultMetric: "sessions",
      defaultDimension: "sessionPrimaryChannelGroup",
      reportId: "lifecycle-traffic-acquisition-v2",
    },
    "sugg-2": {
      defaultMetric: "sessions",
      defaultDimension: "sessionPrimaryChannelGroup",
      reportId: "lifecycle-traffic-acquisition-v2",
    },

    // 2. Active users by Country
    country: {
      defaultMetric: "activeUsers",
      defaultDimension: "country",
      reportId: "user-demographics-detail",
    },
    "sugg-3": {
      defaultMetric: "activeUsers",
      defaultDimension: "country",
      reportId: "user-demographics-detail",
    },

    // 3. Event count by Platform
    platform: {
      defaultMetric: "eventCount",
      defaultDimension: "platform",
      reportId: "user-technology-detail",
    },
    "sugg-7": {
      defaultMetric: "eventCount",
      defaultDimension: "platform",
      reportId: "user-technology-detail",
    },
    "key-events-by-platform": {
      defaultMetric: "eventCount",
      defaultDimension: "platform",
      reportId: "user-technology-detail",
    },

    // 4. New users by First user primary channel group
    firstUserChannel: {
      defaultMetric: "newUsers",
      defaultDimension: "firstUserPrimaryChannelGroup",
      reportId: "lifecycle-user-acquisition-v2",
    },
    "sugg-8": {
      defaultMetric: "newUsers",
      defaultDimension: "firstUserPrimaryChannelGroup",
      reportId: "lifecycle-user-acquisition-v2",
    },
    "new-users-by-channel": {
      defaultMetric: "newUsers",
      defaultDimension: "firstUserPrimaryChannelGroup",
      reportId: "lifecycle-user-acquisition-v2",
    },

    // 5. Views by Page title and screen class (Card 2)
    pageTitle: {
      defaultMetric: "screenPageViews",
      defaultDimension: "unifiedScreenClass",
      reportId: "all-pages-and-screens",
    },
    "sugg-5": {
      defaultMetric: "screenPageViews",
      defaultDimension: "unifiedScreenClass",
      reportId: "all-pages-and-screens",
    },
    "views-by-page-title": {
      defaultMetric: "screenPageViews",
      defaultDimension: "unifiedScreenClass",
      reportId: "all-pages-and-screens",
    },

    // 6. Active users by Town/City (Card 1)
    city: {
      defaultMetric: "activeUsers",
      defaultDimension: "city",
      reportId: "user-demographics-detail",
    },
    "sugg-6": {
      defaultMetric: "activeUsers",
      defaultDimension: "city",
      reportId: "user-demographics-detail",
    },
    "active-users-by-city": {
      defaultMetric: "activeUsers",
      defaultDimension: "city",
      reportId: "user-demographics-detail",
    },

    // Remaining cards (Unmodified - e.g. sourceMedium / sugg-4 / active-users-by-source-medium)
    sourceMedium: {
      defaultMetric: "activeUsers",
      defaultDimension: "firstUserSourceMedium",
    },
    "sugg-4": {
      defaultMetric: "activeUsers",
      defaultDimension: "firstUserSourceMedium",
    },
    "active-users-by-source-medium": {
      defaultMetric: "activeUsers",
      defaultDimension: "firstUserSourceMedium",
    },
  };

  const cardConfig = CARD_CONFIGS[vizTypeOrCardId] || {
    defaultMetric: "sessions",
    defaultDimension: "sessionPrimaryChannelGroup",
  };

  let metric = activeMetric || cardConfig.defaultMetric;
  if (vizTypeOrCardId === "platform" || vizTypeOrCardId === "sugg-7" || vizTypeOrCardId === "key-events-by-platform") {
    if (metric === "keyEvents") metric = "eventCount";
  }
  const dimension = activeDimension || cardConfig.defaultDimension;

  const queryParts = [
    `_r.explorerCard..selmet%3D%5B%22${encodeURIComponent(metric)}%22%5D`,
    `_r.explorerCard..seldim%3D%5B%22${encodeURIComponent(dimension)}%22%5D`,
  ];

  if (dateRange) {
    queryParts.push(`_r.date-range-preset%3D${encodeURIComponent(dateRange)}`);
  }

  const paramsStr = queryParts.join("%26");

  let url = `https://analytics.google.com/analytics/web/#/${propertyHash}/reports/explorer?params=${paramsStr}`;

  if (cardConfig.reportId) {
    url += `&r=${encodeURIComponent(cardConfig.reportId)}`;
  }

  return url;
}


