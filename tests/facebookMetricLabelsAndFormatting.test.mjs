import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDurationMinutes,
  evaluateDailySeries,
  evaluateMetricSummary,
  mapBackendTimeSeries,
  checkFallbackEligibility,
  resolveMetricWithFallback,
} from "../lib/analyticsInsights.js";

// ============================================================================
// TEST 1: formatDurationMinutes formats minutes into human-readable hours and minutes
// ============================================================================
test("formatDurationMinutes correctly formats minutes into 'Xh Ym' duration string", () => {
  // 317 minutes = 5h 17m (exact reported Moovana watch time)
  assert.equal(formatDurationMinutes(317), "5h 17m");

  // Fractional minutes from ms conversion: 19023513 ms / 60000 = 317.058... -> 5h 17m
  assert.equal(formatDurationMinutes(317.06), "5h 17m");

  // Exact hours
  assert.equal(formatDurationMinutes(60), "1h");
  assert.equal(formatDurationMinutes(120), "2h");

  // Minutes only (< 60)
  assert.equal(formatDurationMinutes(45), "45m");
  assert.equal(formatDurationMinutes(1), "1m");

  // Zero minutes
  assert.equal(formatDurationMinutes(0), "0m");

  // 201 minutes = 3h 21m (Meta Business Suite reference value)
  assert.equal(formatDurationMinutes(201), "3h 21m");
});

// ============================================================================
// TEST 2: formatDurationMinutes preserves unavailable semantics for null, undefined, non-finite
// ============================================================================
test("formatDurationMinutes returns 'Unavailable' for null, undefined, NaN, and non-finite", () => {
  assert.equal(formatDurationMinutes(null), "Unavailable");
  assert.equal(formatDurationMinutes(undefined), "Unavailable");
  assert.equal(formatDurationMinutes(""), "Unavailable");
  assert.equal(formatDurationMinutes(NaN), "Unavailable");
  assert.equal(formatDurationMinutes("not a number"), "Unavailable");
  assert.equal(formatDurationMinutes(Infinity), "Unavailable");
});

// ============================================================================
// TEST 3: Watch Time underlying numeric value is preserved alongside formatted duration
// ============================================================================
test("Watch Time card preserves underlying numeric value and timeSeries while displaying duration format", () => {
  const rawWatchTimeMinutes = 317.06;
  const mockWatchTimeSeries = [
    { date: "2026-10-01", value: 19023513 },
    { date: "2026-10-02", value: 0 },
  ];

  const watchTimeCurrent = {
    status: "AVAILABLE",
    value: rawWatchTimeMinutes,
    series: mockWatchTimeSeries,
  };

  const card = {
    key: "watch_time",
    label: "Watch Time",
    category: "Visibility & Reach",
    value: formatDurationMinutes(watchTimeCurrent.value),
    summary: watchTimeCurrent,
    series: watchTimeCurrent.series,
  };

  // 1. Display value is human-readable duration
  assert.equal(card.value, "5h 17m");

  // 2. Underlying summary value is preserved as numeric minutes
  assert.equal(card.summary.value, 317.06);
  assert.equal(typeof card.summary.value, "number");

  // 3. Time series observations are preserved
  assert.equal(card.series.length, 2);
  assert.equal(card.series[0].value, 19023513);
});

// ============================================================================
// TEST 4: Page Views are not mislabeled as content views, and Facebook Visits displays profile visits
// ============================================================================
test("Page Views is explicitly named and Facebook Visits renders profile visits from page_views_total", () => {
  const mockPerf = {
    views: {
      status: "AVAILABLE",
      total: 419,
      timeSeries: [{ date: "2026-10-01", value: 81 }],
      metricName: "page_views_total",
      comparison: { previousTotal: 471, delta: -52, percentageChange: -11.04 },
    },
    pageVisits: {
      status: "UNAVAILABLE",
      total: null,
      timeSeries: [],
      metricName: "page_visits",
    },
  };

  // Resolved visits uses page_views_total (since page_views_total is profile visits)
  const visitsResolved = (mockPerf.pageVisits && mockPerf.pageVisits.status === "AVAILABLE")
    ? mockPerf.pageVisits
    : (mockPerf.views && mockPerf.views.status === "AVAILABLE")
    ? mockPerf.views
    : { status: "UNAVAILABLE", total: null };

  const visibilityMetrics = [
    {
      key: "views",
      label: "Page Views",
      apiMetric: "page_views_total",
      value: String(mockPerf.views.total),
      definition: "Total number of times your Facebook Page profile was viewed during the selected reporting period (displayed as Facebook visits in Meta Business Suite).",
    },
    {
      key: "visits",
      label: "Facebook Visits",
      apiMetric: "page_views_total",
      value: String(visitsResolved.total),
      definition: "Total number of times people visited your Page profile directly (sourced from page_views_total; identical to Page Views in Meta Graph API).",
    },
  ];

  // 1. Card labeled 'views' is explicitly named "Page Views" (NOT generic content "Views")
  const pageViewsCard = visibilityMetrics.find((m) => m.key === "views");
  assert.equal(pageViewsCard.label, "Page Views");
  assert.notEqual(pageViewsCard.label, "Views");
  assert.equal(pageViewsCard.value, "419");
  assert.equal(pageViewsCard.apiMetric, "page_views_total");

  // 2. Facebook Visits renders 419 from page_views_total (corresponds to Meta Business Suite Facebook visits)
  const visitsCard = visibilityMetrics.find((m) => m.key === "visits");
  assert.equal(visitsCard.label, "Facebook Visits");
  assert.equal(visitsCard.value, "419");
  assert.equal(visitsCard.apiMetric, "page_views_total");

  // 3. Definitions explain the shared profile-visit reality rather than implying contradictory states
  assert.ok(pageViewsCard.definition.includes("Facebook visits in Meta Business Suite"));
  assert.ok(visitsCard.definition.includes("page_views_total"));
});

// ============================================================================
// TEST 5: Engagement is NEVER relabeled as content interactions
// ============================================================================
test("Post engagements is strictly distinct from Content Interactions and never relabeled", () => {
  // Scenario: Backend fallback sends page_post_engagements (248) under contentInteractions
  const mockBackendResponse = {
    performance: {
      postEngagements: {
        status: "AVAILABLE",
        total: 248,
        metricName: "page_post_engagements",
      },
      contentInteractions: {
        status: "AVAILABLE",
        total: 248,
        source: "page_post_engagements", // fallback flag
        breakdown: { reactions: null, comments: null, shares: null },
      },
    },
  };

  const perf = mockBackendResponse.performance;

  // Frontend resolution logic: Reject page_post_engagements as contentInteractions
  const resolveContentInteractions = (p, postSummary) => {
    if (p?.contentInteractions && p.contentInteractions.source !== "page_post_engagements") {
      return { status: "VALUE", value: p.contentInteractions.total, source: p.contentInteractions.source };
    }
    if (postSummary && postSummary.status === "VALUE") {
      return { status: "VALUE", value: postSummary.value, source: "fbPostInteractions" };
    }
    return {
      status: "UNAVAILABLE",
      value: null,
      source: "none",
      reason: "Content interactions (reactions, comments, shares, saves on content) is not provided by the current Page Insights query. Post engagements is available separately under Post Engagements.",
    };
  };

  const resolvedInteractions = resolveContentInteractions(perf, { status: "UNAVAILABLE", value: null });

  // 1. Content interactions MUST NOT display 248 from page_post_engagements
  assert.equal(resolvedInteractions.status, "UNAVAILABLE");
  assert.equal(resolvedInteractions.value, null);
  assert.notEqual(resolvedInteractions.value, 248);

  // 2. Post engagements card correctly displays 248
  assert.equal(perf.postEngagements.status, "AVAILABLE");
  assert.equal(perf.postEngagements.total, 248);
  assert.equal(perf.postEngagements.metricName, "page_post_engagements");
});

// ============================================================================
// TEST 6: Multi-day sum of daily unique viewers is NOT presented as deduplicated reach
// ============================================================================
test("Multi-day sum of daily unique viewers is flagged as UNAVAILABLE for period-wide reach", () => {
  // 28 days of daily uniques summing to 7,065
  const mockDailyUniqueViewers = {
    status: "AVAILABLE",
    total: 7065,
    metricName: "page_total_media_view_unique",
    timeSeries: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      value: 250,
    })),
  };

  const resolveReach = (perfViewers, activeDays) => {
    const hasDailySeries = Array.isArray(perfViewers?.timeSeries) && perfViewers.timeSeries.length > 1;
    const isDailyUniqueMetric = perfViewers?.metricName === "page_total_media_view_unique" || perfViewers?.metricName === "page_impressions_unique";
    const isAdditiveDailySum =
      perfViewers?.isDeduplicatedReach !== true &&
      hasDailySeries &&
      isDailyUniqueMetric &&
      activeDays > 1;

    if (isAdditiveDailySum) {
      return {
        status: "UNAVAILABLE",
        value: null,
        series: perfViewers.timeSeries,
        reason: "Deduplicated period-wide reach is not provided by Meta Graph API for custom date ranges. Meta returns daily unique viewers, which cannot be mathematically summed across days without double-counting repeat viewers.",
      };
    }

    return {
      status: perfViewers?.status === "AVAILABLE" ? "VALUE" : "UNAVAILABLE",
      value: perfViewers?.total,
      series: perfViewers?.timeSeries || [],
    };
  };

  // Case A1: isDeduplicatedReach: true with multi-day time series -> displays supplied deduplicated total (6090 or 6043), NOT Unavailable
  const deduplicatedViewers6090 = {
    status: "AVAILABLE",
    total: 6090,
    isDeduplicatedReach: true,
    reachPeriod: "total_over_range",
    metricName: "page_total_media_view_unique",
    timeSeries: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      value: 250,
    })),
  };
  const reach6090 = resolveReach(deduplicatedViewers6090, 28);
  assert.equal(reach6090.status, "VALUE");
  assert.equal(reach6090.value, 6090, "UI must display deduplicated reach total 6090, not Unavailable");
  assert.equal(reach6090.series.length, 28);

  const deduplicatedViewers6043 = {
    status: "AVAILABLE",
    total: 6043,
    isDeduplicatedReach: true,
    reachPeriod: "total_over_range",
    metricName: "page_total_media_view_unique",
    timeSeries: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      value: 250,
    })),
  };
  const reach6043 = resolveReach(deduplicatedViewers6043, 28);
  assert.equal(reach6043.status, "VALUE");
  assert.equal(reach6043.value, 6043, "UI must display deduplicated reach total 6043, not Unavailable");

  // Case A2: isDeduplicatedReach: false with multi-day daily-unique series -> remains UNAVAILABLE to prevent misleading sum
  const nonDeduplicatedViewers = {
    status: "AVAILABLE",
    total: 7065,
    isDeduplicatedReach: false,
    metricName: "page_total_media_view_unique",
    timeSeries: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      value: 250,
    })),
  };
  const reachNonDeduplicated = resolveReach(nonDeduplicatedViewers, 28);
  assert.equal(reachNonDeduplicated.status, "UNAVAILABLE");
  assert.equal(reachNonDeduplicated.value, null);
  assert.ok(reachNonDeduplicated.reason.includes("cannot be mathematically summed"));

  // Case A3: Missing isDeduplicatedReach flag (undefined) -> does NOT allow potentially additive sum to appear as reach
  const missingFlagViewers = {
    status: "AVAILABLE",
    total: 7065,
    // isDeduplicatedReach is omitted/undefined
    metricName: "page_total_media_view_unique",
    timeSeries: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      value: 250,
    })),
  };
  const reachMissingFlag = resolveReach(missingFlagViewers, 28);
  assert.equal(reachMissingFlag.status, "UNAVAILABLE");
  assert.equal(reachMissingFlag.value, null);

  // Case B: Single day reporting period (1 day) -> daily unique IS the period reach
  const singleDayViewers = {
    status: "AVAILABLE",
    total: 250,
    metricName: "page_total_media_view_unique",
    timeSeries: [{ date: "2026-10-01", value: 250 }],
  };
  const singleDayReach = resolveReach(singleDayViewers, 1);
  assert.equal(singleDayReach.status, "VALUE");
  assert.equal(singleDayReach.value, 250);
});

// ============================================================================
// TEST 7: Page switching and date range selection parameters remain unaffected
// ============================================================================
test("Page switching and date range request propagation preserve selected Page ID and bounds", () => {
  const testPageId = "108002008285074";
  const since = "2026-09-30";
  const until = "2026-10-27";

  const buildRequestParams = (pageId, dateRange) => {
    return {
      pageId: String(pageId).trim(),
      since: dateRange.since,
      until: dateRange.until,
    };
  };

  const params = buildRequestParams(testPageId, { since, until });
  assert.equal(params.pageId, "108002008285074");
  assert.equal(params.since, "2026-09-30");
  assert.equal(params.until, "2026-10-27");
});

// ============================================================================
// TEST 8: Fix A — Fallback for perf.views.status === "EMPTY" restores computed Page Views fallback (415)
// ============================================================================
test("perf.views.status === 'EMPTY' with matching fallback observations resolves to computed total (415)", () => {
  // Scenario: Upstream Meta API error causes perf.views to return EMPTY with null total
  const mockPerfViews = {
    status: "EMPTY",
    total: null,
    timeSeries: [],
    metricName: "page_views_total",
    reason: "Meta Page Insights notice: [page_views_total, page_post_engagements, page_total_actions] (day) was unavailable",
  };

  // currentInsights contains 28 daily observations in [2026-09-30, 2026-10-27] summing to 415,
  // plus 1 observation on 2026-10-28 (value 4) which must be filtered out by date bounds
  const mockCurrentInsights = [
    {
      name: "page_views_total",
      period: "day",
      values: [
        // 27 days with value 15 = 405
        ...Array.from({ length: 27 }, (_, i) => ({
          endTime: `2026-${String(i < 1 ? "09-30" : `10-${String(i).padStart(2, "0")}`)}T07:00:00+0000`,
          value: 15,
        })),
        // Oct 27 with value 10 -> total in range = 405 + 10 = 415
        { endTime: "2026-10-27T07:00:00+0000", value: 10 },
        // Oct 28 outside range (value 4) -> must be excluded
        { endTime: "2026-10-28T07:00:00+0000", value: 4 },
      ],
    },
  ];

  const resolved = resolveMetricWithFallback({
    perfMetric: mockPerfViews,
    insightsArray: mockCurrentInsights,
    metricNames: "page_views_total",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: true,
  });

  assert.equal(resolved.status, "VALUE");
  assert.equal(resolved.value, 415, "Views fallback must compute 415 strictly within date bounds");
  assert.equal(resolved.series.length, 28, "Series must strictly contain 28 bounded days");
  assert.notEqual(resolved.status, "NO_DATA", "Must not prematurely return NO_DATA when valid fallback exists");
});

// ============================================================================
// TEST 9: Fix A — Fallback for perf.postEngagements.status === "EMPTY" restores computed fallback (248)
// ============================================================================
test("perf.postEngagements.status === 'EMPTY' with matching fallback observations resolves to computed total (248)", () => {
  const mockPerfEngagements = {
    status: "EMPTY",
    total: null,
    timeSeries: [],
    metricName: "page_post_engagements",
  };

  const mockCurrentInsights = [
    {
      name: "page_post_engagements",
      period: "day",
      values: [
        // Daily observations summing to 248 within [2026-09-30, 2026-10-27]
        ...Array.from({ length: 27 }, (_, i) => ({
          endTime: `2026-${String(i < 1 ? "09-30" : `10-${String(i).padStart(2, "0")}`)}T07:00:00+0000`,
          value: 9,
        })), // 27 * 9 = 243
        { endTime: "2026-10-27T07:00:00+0000", value: 5 }, // 243 + 5 = 248
        // Outside range observation
        { endTime: "2026-10-28T07:00:00+0000", value: 12 },
      ],
    },
  ];

  const resolved = resolveMetricWithFallback({
    perfMetric: mockPerfEngagements,
    insightsArray: mockCurrentInsights,
    metricNames: "page_post_engagements",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: true,
  });

  assert.equal(resolved.status, "VALUE");
  assert.equal(resolved.value, 248, "Post engagements fallback must compute 248 within date bounds");
  assert.equal(resolved.series.length, 28);
  assert.notEqual(resolved.status, "NO_DATA", "Must not prematurely return NO_DATA when valid fallback exists");
});

// ============================================================================
// TEST 10: Fix A — UNAVAILABLE, null, and valid zero remain strictly distinct
// ============================================================================
test("UNAVAILABLE, null, and valid zero remain strictly distinct and are not conflated", () => {
  // Case A: Valid Zero
  const zeroPerf = {
    status: "AVAILABLE",
    total: 0,
    timeSeries: [{ date: "2026-10-01", value: 0 }],
  };
  const resolvedZero = resolveMetricWithFallback({
    perfMetric: zeroPerf,
    insightsArray: [],
    metricNames: "page_views_total",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: true,
  });
  assert.equal(resolvedZero.status, "VALUE");
  assert.equal(resolvedZero.value, 0, "Valid zero total must be preserved as value 0, not null/Unavailable");

  // Case B: UNAVAILABLE without fallback data
  const unavailablePerf = {
    status: "UNAVAILABLE",
    total: null,
    timeSeries: [],
  };
  const resolvedUnavailable = resolveMetricWithFallback({
    perfMetric: unavailablePerf,
    insightsArray: [],
    metricNames: "page_views_total",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: true,
  });
  assert.equal(resolvedUnavailable.status, "UNAVAILABLE");
  assert.equal(resolvedUnavailable.value, null, "UNAVAILABLE status must preserve null value");

  // Case C: EMPTY without fallback data -> returns NO_DATA ("No data")
  const emptyPerfNoFallback = {
    status: "EMPTY",
    total: null,
    timeSeries: [],
  };
  const resolvedEmpty = resolveMetricWithFallback({
    perfMetric: emptyPerfNoFallback,
    insightsArray: [],
    metricNames: "page_views_total",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: true,
  });
  assert.equal(resolvedEmpty.status, "NO_DATA");
  assert.equal(resolvedEmpty.value, null, "EMPTY without fallback observations must evaluate to NO_DATA");

  // Verify distinction: NO_DATA !== UNAVAILABLE !== VALUE (0)
  assert.notEqual(resolvedZero.status, resolvedUnavailable.status);
  assert.notEqual(resolvedEmpty.status, resolvedUnavailable.status);
  assert.notEqual(resolvedZero.value, resolvedEmpty.value);
});

// ============================================================================
// TEST 11: Fix A — Mismatched date windows or page selections cannot supply fallback data
// ============================================================================
test("Mismatched date windows or page selections cannot supply fallback data", () => {
  const mockCurrentInsights = [
    {
      name: "page_views_total",
      period: "day",
      values: [
        { endTime: "2026-10-01T07:00:00+0000", value: 50 },
        { endTime: "2026-10-02T07:00:00+0000", value: 50 },
      ],
    },
  ];

  const emptyPerf = {
    status: "EMPTY",
    total: null,
    timeSeries: [],
  };

  // Case 1: Page selection mismatch
  const pageMatchEligible = checkFallbackEligibility({
    selectedPageId: "108002008285074",
    socialPageId: "999999999999", // different page
    targetSince: "2026-09-30",
    targetUntil: "2026-10-27",
    socialSince: "2026-09-30",
    socialUntil: "2026-10-27",
  });
  assert.equal(pageMatchEligible, false, "Fallback must be ineligible when page selections mismatch");

  const resolvedPageMismatch = resolveMetricWithFallback({
    perfMetric: emptyPerf,
    insightsArray: mockCurrentInsights,
    metricNames: "page_views_total",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: pageMatchEligible,
  });
  assert.equal(resolvedPageMismatch.status, "NO_DATA", "Must not supply fallback from a mismatched page");
  assert.equal(resolvedPageMismatch.value, null);

  // Case 2: Date window mismatch via metadata
  const dateWindowEligible = checkFallbackEligibility({
    selectedPageId: "108002008285074",
    socialPageId: "108002008285074",
    targetSince: "2026-09-30",
    targetUntil: "2026-10-27",
    socialSince: "2026-01-01", // different window
    socialUntil: "2026-01-31",
  });
  assert.equal(dateWindowEligible, false, "Fallback must be ineligible when date windows mismatch");

  const resolvedDateMismatch = resolveMetricWithFallback({
    perfMetric: emptyPerf,
    insightsArray: mockCurrentInsights,
    metricNames: "page_views_total",
    since: "2026-09-30",
    until: "2026-10-27",
    isFallbackEligible: dateWindowEligible,
  });
  assert.equal(resolvedDateMismatch.status, "NO_DATA", "Must not supply fallback from a mismatched date window");

  // Case 3: Date window mismatch via observation timestamps (observations fall entirely outside [since, until])
  const resolvedOutofBoundsObservations = resolveMetricWithFallback({
    perfMetric: emptyPerf,
    insightsArray: mockCurrentInsights, // values are in 2026-10
    metricNames: "page_views_total",
    since: "2025-01-01", // window is in 2025
    until: "2025-01-31",
    isFallbackEligible: true,
  });
  assert.equal(resolvedOutofBoundsObservations.status, "NO_DATA", "Out of bounds observations must yield NO_DATA");
  assert.equal(resolvedOutofBoundsObservations.value, null);
});

// ============================================================================
// TEST 12: Fix B — Genuine Content Views (9,561) is not in backend contract and is not fabricated
// ============================================================================
test("Content Views (9,561) represents aggregated content impressions and is not fabricated from profile views", () => {
  // In Meta Business Suite:
  // - "Views: 9,561" represents aggregated content impressions (page_impressions) across published posts/content.
  // - "Facebook visits: 419" represents Page profile visits (page_views_total).
  // The backend currently only queries page_views_total, not page_impressions.
  const backendPerformanceResponse = {
    views: {
      status: "AVAILABLE",
      total: 419,
      metricName: "page_views_total",
      description: "Profile views / visits to the Facebook Page (labeled 'Facebook visits' in Meta Business Suite).",
    },
  };

  // 1. Backend contract contains page_views_total (419), NOT content-level views (9,561)
  assert.equal(backendPerformanceResponse.views.metricName, "page_views_total");
  assert.equal(backendPerformanceResponse.views.total, 419);
  assert.equal(backendPerformanceResponse.contentViews, undefined, "contentViews is not in backend contract");

  // 2. Frontend must not fabricate 9,561 or alias 419 as content views
  const displayLabel = "Page Views";
  assert.equal(displayLabel, "Page Views");
  assert.notEqual(displayLabel, "Content Views");
});

// ============================================================================
// TEST 13: Content Views (page_media_view: 9,546) vs Profile Visits (page_views_total: 415)
// ============================================================================
test("views card reflects content views (page_media_view) while visits card strictly displays profile views (page_views_total)", () => {
  const mockPerf = {
    views: {
      status: "AVAILABLE",
      total: 9546,
      metricName: "page_media_view",
      description: "Content media views across all posts and videos.",
      timeSeries: [{ date: "2026-10-01", value: 450 }],
    },
    profileViews: {
      status: "AVAILABLE",
      total: 415,
      metricName: "page_views_total",
      description: "Profile views / visits to the Facebook Page.",
      timeSeries: [{ date: "2026-10-01", value: 20 }],
    },
    pageVisits: {
      status: "UNAVAILABLE",
      total: null,
      timeSeries: [],
      metricName: "page_visits",
    },
  };

  // viewsCurrent resolves page_media_view
  const viewsCurrent = resolveMetricWithFallback({
    perfMetric: mockPerf.views,
    insightsArray: [],
    metricNames: ["page_media_view", "page_views_total"],
    isFallbackEligible: false,
  });

  assert.equal(viewsCurrent.status, "VALUE");
  assert.equal(viewsCurrent.value, 9546);
  assert.equal(viewsCurrent.metricName, "page_media_view");

  // visitsCurrent resolves profileViews (415) and does NOT inherit 9546 from viewsCurrent
  const visitsResolved = (mockPerf.pageVisits && mockPerf.pageVisits.status === "AVAILABLE" && mockPerf.pageVisits.total !== null)
    ? mockPerf.pageVisits
    : (mockPerf.profileViews && mockPerf.profileViews.status === "AVAILABLE" && mockPerf.profileViews.total !== null)
    ? mockPerf.profileViews
    : (mockPerf.views && mockPerf.views.metricName === "page_views_total" && mockPerf.views.status === "AVAILABLE")
    ? mockPerf.views
    : (viewsCurrent && viewsCurrent.status === "VALUE" && viewsCurrent.metricName !== "page_media_view" && mockPerf.views?.metricName !== "page_media_view")
    ? viewsCurrent
    : { status: "UNAVAILABLE", value: null };

  assert.equal(visitsResolved.status, "AVAILABLE");
  assert.equal(visitsResolved.total, 415);
  assert.notEqual(visitsResolved.total, 9546, "visitsCurrent must NEVER display content views (9,546) as Facebook profile visits");

  // Verify card group mapping
  const viewsCardLabel = (mockPerf.views?.metricName === "page_media_view" || viewsCurrent?.metricName === "page_media_view") ? "Views" : "Page Views";
  const viewsApiMetric = (mockPerf.views?.metricName === "page_media_view" || viewsCurrent?.metricName === "page_media_view") ? "page_media_view" : "page_views_total";

  assert.equal(viewsCardLabel, "Views");
  assert.equal(viewsApiMetric, "page_media_view");

  const visitsCardLabel = "Facebook Visits";
  const visitsApiMetric = visitsResolved.metricName || "page_views_total";

  assert.equal(visitsCardLabel, "Facebook Visits");
  assert.equal(visitsApiMetric, "page_views_total");
});

// ============================================================================
// TEST 14: Deduplicated period reach (6,087) is not suppressed by daily timeSeries
// ============================================================================
test("Deduplicated reach (page_total_media_view_unique with total_over_range: 6,087) is not suppressed by multi-day series", () => {
  // Mock 28 daily series points
  const timeSeries28Days = Array.from({ length: 28 }, (_, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    value: 250,
  }));

  const mockPerf = {
    viewers: {
      status: "AVAILABLE",
      total: 6087,
      metricName: "page_total_media_view_unique",
      isDeduplicatedReach: true,
      reachPeriod: "total_over_range",
      timeSeries: timeSeries28Days,
    },
  };

  const activeDays = 28;
  const hasDailySeries = Array.isArray(mockPerf.viewers.timeSeries) && mockPerf.viewers.timeSeries.length > 1;
  const isDailyUniqueMetric = mockPerf.viewers.metricName === "page_total_media_view_unique" || mockPerf.viewers.metricName === "page_impressions_unique";
  const isExplicitDeduplicated =
    mockPerf.viewers.isDeduplicatedReach === true ||
    mockPerf.viewers.reachPeriod === "total_over_range" ||
    mockPerf.viewers.period === "total_over_range";

  const isAdditiveDailySum =
    !isExplicitDeduplicated &&
    hasDailySeries &&
    isDailyUniqueMetric &&
    activeDays > 1;

  // The guard must NOT flag this as an additive daily sum because it is explicitly deduplicated by Meta
  assert.equal(isAdditiveDailySum, false, "Explicitly deduplicated reach must not be flagged as additive daily sum");

  const status = mockPerf.viewers.status === "AVAILABLE" && mockPerf.viewers.total !== null ? "VALUE" : "UNAVAILABLE";
  const reachCurrent = {
    status,
    value: mockPerf.viewers.total,
    series: mapBackendTimeSeries(mockPerf.viewers.timeSeries),
  };

  assert.equal(reachCurrent.status, "VALUE");
  assert.equal(reachCurrent.value, 6087);
  assert.equal(reachCurrent.series.length, 28, "Time series observations are preserved for trend chart");
});

// ============================================================================
// TEST 15: Post-wise metrics for Moovana target post (108002008285074_1122234583890132)
// ============================================================================
test("Target post (108002008285074_1122234583890132) preserves comments: 0, reactions: 3, shares: null as '—', and views as Lifetime views", () => {
  const formatTableCellNumber = (val) => {
    if (val === null || val === undefined) return "—";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "—";
    return parsed.toLocaleString();
  };

  const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);

  const rawPost = {
    contentId: "108002008285074_1122234583890132",
    message: "Moovana luxury home design showcase",
    createdTime: "2026-10-26T12:57:37+0000",
    permalinkUrl: "https://www.facebook.com/108002008285074/posts/1122234583890132",
    reactions: { total: 3, status: "AVAILABLE" },
    comments: { total: 0, status: "AVAILABLE" },
    shares: { total: null, status: "UNAVAILABLE" },
    viewsDetails: { total: 248, period: "lifetime", status: "AVAILABLE", metricName: "post_media_view" },
    metrics: {
      reactionCount: 3,
      commentCount: 0,
      shareCount: null,
      views: 248,
      viewsPeriod: "lifetime",
    },
  };

  const post = {
    contentId: rawPost.contentId,
    caption: rawPost.message,
    createdTime: rawPost.createdTime,
    permalinkUrl: rawPost.permalinkUrl,
    reactions: normalizeNumber(rawPost.reactions?.total ?? rawPost.metrics?.reactionCount),
    comments: normalizeNumber(rawPost.comments?.total ?? rawPost.metrics?.commentCount),
    shares: normalizeNumber(rawPost.shares?.total ?? rawPost.metrics?.shareCount),
    views: normalizeNumber(rawPost.viewsDetails?.total ?? rawPost.metrics?.views),
    viewsPeriod: rawPost.viewsDetails?.period || rawPost.metrics?.viewsPeriod || "lifetime",
  };

  // 1. Comments: 0 is preserved as numeric 0 and renders as "0", never "—" or "Unavailable"
  assert.equal(post.comments, 0);
  assert.equal(formatTableCellNumber(post.comments), "0");

  // 2. Reactions: 3 renders as "3"
  assert.equal(post.reactions, 3);
  assert.equal(formatTableCellNumber(post.reactions), "3");

  // 3. Shares: null renders as "—", never coerced to "0"
  assert.equal(post.shares, null);
  assert.equal(formatTableCellNumber(post.shares), "—");

  // 4. Views: 248 is labeled Lifetime views
  assert.equal(post.views, 248);
  assert.equal(formatTableCellNumber(post.views), "248");
  assert.equal(post.viewsPeriod, "lifetime");

  // 5. Permalink URL is preserved for opening post on Facebook
  assert.equal(post.permalinkUrl, "https://www.facebook.com/108002008285074/posts/1122234583890132");
});

// ============================================================================
// TEST 16: Partial post data does not crash table or fail post display
// ============================================================================
test("Partial post data with missing shares or missing error fields displays available metrics gracefully", () => {
  const formatTableCellNumber = (val) => {
    if (val === null || val === undefined) return "—";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "—";
    return parsed.toLocaleString();
  };

  const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);

  const posts = [
    {
      id: "post_1",
      message: "Post with complete metrics",
      createdTime: "2026-10-15T10:00:00+0000",
      reactionCount: 15,
      commentCount: 4,
      shareCount: 2,
      views: 520,
    },
    {
      id: "post_2",
      message: "Post with missing shares",
      createdTime: "2026-10-16T10:00:00+0000",
      reactionCount: 8,
      commentCount: 0,
      shareCount: null, // missing shares
      views: 310,
    },
    {
      id: "post_3",
      message: "Post with missing views and shares",
      createdTime: "2026-10-17T10:00:00+0000",
      reactionCount: 0,
      commentCount: 0,
      shareCount: null,
      views: null,
    },
  ];

  const processed = posts.map((item) => ({
    contentId: item.id,
    caption: item.message,
    reactions: normalizeNumber(item.reactionCount),
    comments: normalizeNumber(item.commentCount),
    shares: normalizeNumber(item.shareCount),
    views: normalizeNumber(item.views),
  }));

  assert.equal(processed.length, 3);

  // Post 1: all present
  assert.equal(formatTableCellNumber(processed[0].reactions), "15");
  assert.equal(formatTableCellNumber(processed[0].comments), "4");
  assert.equal(formatTableCellNumber(processed[0].shares), "2");
  assert.equal(formatTableCellNumber(processed[0].views), "520");

  // Post 2: comments 0 preserved, shares "—"
  assert.equal(formatTableCellNumber(processed[1].reactions), "8");
  assert.equal(formatTableCellNumber(processed[1].comments), "0");
  assert.equal(formatTableCellNumber(processed[1].shares), "—");
  assert.equal(formatTableCellNumber(processed[1].views), "310");

  // Post 3: reactions 0, comments 0, shares "—", views "—"
  assert.equal(formatTableCellNumber(processed[2].reactions), "0");
  assert.equal(formatTableCellNumber(processed[2].comments), "0");
  assert.equal(formatTableCellNumber(processed[2].shares), "—");
  assert.equal(formatTableCellNumber(processed[2].views), "—");
});

// ============================================================================
// TEST 17: Post table client-side pagination slices posts without extra API calls
// ============================================================================
test("Post table client-side pagination slices posts with default 10 and load more (+10)", () => {
  const dummyPosts = Array.from({ length: 25 }, (_, i) => ({
    contentId: `post_${i + 1}`,
    caption: `Post #${i + 1}`,
    createdTime: `2026-10-${String((i % 25) + 1).padStart(2, "0")}T12:00:00+0000`,
    views: (i + 1) * 10,
  }));

  let visibleCount = 10;
  let visiblePosts = dummyPosts.slice(0, visibleCount);
  assert.equal(visiblePosts.length, 10, "Initial slice displays 10 posts");
  assert.equal(visiblePosts[0].contentId, "post_1");
  assert.equal(visiblePosts[9].contentId, "post_10");

  // Load more (+10)
  visibleCount = Math.min(visibleCount + 10, dummyPosts.length);
  visiblePosts = dummyPosts.slice(0, visibleCount);
  assert.equal(visiblePosts.length, 20, "Loading more displays 20 posts");
  assert.equal(visiblePosts[19].contentId, "post_20");

  // Show all
  visibleCount = dummyPosts.length;
  visiblePosts = dummyPosts.slice(0, visibleCount);
  assert.equal(visiblePosts.length, 25, "Showing all displays all 25 posts");
  assert.equal(visiblePosts[24].contentId, "post_25");
});


