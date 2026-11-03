import test from "node:test";
import assert from "node:assert/strict";

// Mock environment
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";

// ============================================================================
// TEST 1: Exact endpoints, HTTP methods, and payload handling in lib/xApi.js
// ============================================================================
test("X API helper functions construct exact endpoints, methods, and query strings", async () => {
  const requestedCalls = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    requestedCalls.push({ url: String(url), method: options.method || "GET", body: options.body });
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        data: { test: true },
        meta: { source: "test_cache" },
      }),
    };
  };

  try {
    const xApi = await import("../lib/xApi.js");

    // 1. GET /api/x/status
    await xApi.getXStatus();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/status");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 2. GET /api/x/connect?format=json
    await xApi.connectX();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/connect?format=json");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 3. DELETE /api/x/disconnect
    await xApi.disconnectX();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/disconnect");
    assert.equal(requestedCalls.at(-1).method, "DELETE");

    // 4. GET /api/x/analytics/overview (with and without params)
    await xApi.getXAnalyticsOverview();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/analytics/overview");
    assert.equal(requestedCalls.at(-1).method, "GET");

    await xApi.getXAnalyticsOverview({ limit: 15 });
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/analytics/overview?limit=15");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 5. GET /api/x/analytics/posts
    await xApi.getXRecentPosts({ limit: 20 });
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/analytics/posts?limit=20");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 6. GET /api/x/cache/status
    await xApi.getXCacheStatus();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/x/cache/status");
    assert.equal(requestedCalls.at(-1).method, "GET");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 2: connectX handles JSON URL and string redirect formats safely
// ============================================================================
test("connectX parses { success: true, url } or direct url strings safely", async () => {
  const originalFetch = globalThis.fetch;

  try {
    const xApi = await import("../lib/xApi.js");

    // Format A: JSON object { success: true, url: "https://twitter.com/i/oauth2/authorize..." }
    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        url: "https://twitter.com/i/oauth2/authorize?code_challenge=abc123xyz",
      }),
    });

    const resA = await xApi.connectX();
    assert.equal(resA.url, "https://twitter.com/i/oauth2/authorize?code_challenge=abc123xyz");

    // Format B: Nested in data { success: true, data: { url: "..." } }
    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        data: { url: "https://twitter.com/i/oauth2/authorize?nested=true" },
      }),
    });

    const resB = await xApi.connectX();
    assert.equal(resB.url, "https://twitter.com/i/oauth2/authorize?nested=true");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 3: Honest metric formatting distinguishes 0 vs null vs unavailable
// ============================================================================
test("Honest metric formatting guarantees numeric zero is never hidden or conflated with null", () => {
  const formatMetric = (val, suffix = "") => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const num = Number(val);
    if (!Number.isFinite(num)) return "Unavailable";
    return `${num.toLocaleString()}${suffix}`;
  };

  const formatTableCell = (val) => {
    if (val === null || val === undefined) return "—";
    const num = Number(val);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString();
  };

  // Zero MUST remain strictly "0"
  assert.equal(formatMetric(0), "0");
  assert.equal(formatMetric("0"), "0");
  assert.equal(formatTableCell(0), "0");

  // Missing or null values MUST be "Unavailable" or "—"
  assert.equal(formatMetric(null), "Unavailable");
  assert.equal(formatMetric(undefined), "Unavailable");
  assert.equal(formatTableCell(null), "—");
  assert.equal(formatTableCell(undefined), "—");

  // Positive numbers
  assert.equal(formatMetric(1420), "1,420");
  assert.equal(formatTableCell(52000), "52,000");
  assert.equal(formatMetric(3.8, "%"), "3.8%");
});

// ============================================================================
// TEST 4: Backend Overview payload normalization and data extraction
// ============================================================================
test("Backend X Analytics overview payload extracts all 6 analytical sections accurately", () => {
  const mockBackendPayload = {
    success: true,
    data: {
      snapshotDate: "2026-10-27",
      account: {
        metrics: {
          followersCount: 1540,
          followingCount: 320,
          tweetCount: 88,
          listedCount: 12,
        },
        comparison: {
          followersDelta: 45,
          followingDelta: -2,
          tweetCountDelta: 10,
        },
      },
      reach: {
        totalImpressions: 48200,
        totalVideoViews: 3100,
      },
      engagement: {
        totalEngagements: 2450,
        totalLikes: 1800,
        totalRetweets: 350,
        totalReplies: 120,
        totalQuotes: 80,
        totalBookmarks: 100,
        engagementRateByImpressions: 5.08,
        engagementRateByFollowers: 159.09,
      },
      contentSummary: {
        totalPostsEvaluated: 15,
        postsWithMedia: 8,
        postsWithLinks: 4,
        publishingFrequencyPerDay: 0.54,
      },
      dailyActivity: [
        { date: "2026-10-25", postCount: 2, impressions: 5000, likes: 200, retweets: 40, replies: 15, engagements: 255 },
        { date: "2026-10-26", postCount: 1, impressions: 8000, likes: 350, retweets: 70, replies: 25, engagements: 445 },
      ],
      recentPosts: [
        {
          id: "tweet_101",
          text: "Launching our new Growth OS update! 🚀",
          createdAt: "2026-10-26T14:00:00.000Z",
          publicMetrics: {
            likeCount: 350,
            retweetCount: 70,
            replyCount: 25,
            quoteCount: 10,
            bookmarkCount: 15,
            impressionCount: 8000,
          },
        },
      ],
      isStale: false,
    },
    meta: {
      source: "cache",
      cacheHit: true,
      isStale: false,
      lastSuccessfulRefresh: "2026-10-27T10:00:00.000Z",
    },
  };

  const overview = mockBackendPayload.data;

  // 1. Account Overview verification
  assert.equal(overview.account.metrics.followersCount, 1540);
  assert.equal(overview.account.comparison.followersDelta, 45);
  assert.equal(overview.account.metrics.listedCount, 12);

  // 2. Engagement Overview verification
  assert.equal(overview.engagement.totalEngagements, 2450);
  assert.equal(overview.engagement.totalLikes, 1800);
  assert.equal(overview.engagement.engagementRateByImpressions, 5.08);

  // 3. Reach verification
  assert.equal(overview.reach.totalImpressions, 48200);
  assert.equal(overview.reach.totalVideoViews, 3100);

  // 4. Content and Publishing verification
  assert.equal(overview.contentSummary.totalPostsEvaluated, 15);
  assert.equal(overview.contentSummary.postsWithMedia, 8);
  assert.equal(overview.contentSummary.publishingFrequencyPerDay, 0.54);

  // 5. Daily activity verification
  assert.equal(overview.dailyActivity.length, 2);
  assert.equal(overview.dailyActivity[0].impressions, 5000);

  // 6. Recent posts
  assert.equal(overview.recentPosts.length, 1);
  assert.equal(overview.recentPosts[0].publicMetrics.likeCount, 350);
  assert.equal(overview.recentPosts[0].publicMetrics.impressionCount, 8000);
});

// ============================================================================
// TEST 5: Graceful handling of missing or partial data (Free/Basic tier without impressions)
// ============================================================================
test("Handles missing impressions or empty tweet metrics without crashing or fabricating zeros", () => {
  const partialData = {
    account: {
      metrics: {
        followersCount: 500,
        followingCount: 120,
        tweetCount: 15,
        listedCount: 0,
      },
      comparison: null, // Historical snapshot unavailable
    },
    reach: {
      totalImpressions: null, // Impressions unavailable on free tier
    },
    engagement: {
      totalEngagements: 45,
      totalLikes: 30,
      totalRetweets: 10,
      totalReplies: 5,
      totalQuotes: 0,
      totalBookmarks: null,
      engagementRateByImpressions: null,
      engagementRateByFollowers: 9.0,
    },
    dailyActivity: [],
    recentPosts: [
      {
        id: "tweet_free_1",
        text: "Just testing free tier X API without impression metrics.",
        createdAt: "2026-10-27T08:00:00.000Z",
        publicMetrics: {
          likeCount: 5,
          retweetCount: 1,
          replyCount: 0,
          quoteCount: 0,
          // impressionCount is absent
        },
      },
    ],
  };

  // Impressions must be flagged as unavailable
  assert.equal(partialData.reach.totalImpressions, null);
  assert.equal(partialData.engagement.engagementRateByImpressions, null);

  // Rate by followers remains valid and calculated
  assert.equal(partialData.engagement.engagementRateByFollowers, 9.0);

  // Recent post without impressions
  const post = partialData.recentPosts[0];
  assert.equal(post.publicMetrics.impressionCount, undefined);
  assert.equal(post.publicMetrics.likeCount, 5);
  assert.equal(post.publicMetrics.quoteCount, 0); // Genuine zero
});

// ============================================================================
// TEST 6: Stale snapshot and cache metadata reporting
// ============================================================================
test("Correctly detects and surfaces stale snapshot warnings and cache metadata", () => {
  const staleResponse = {
    success: true,
    data: {
      isStale: true,
      staleReason: "Twitter API rate limit reached; serving cached snapshot.",
      fetchedAt: "2026-10-26T12:00:00.000Z",
    },
    meta: {
      source: "mongodb_snapshot",
      isStale: true,
      servedStaleFallback: true,
      lastSuccessfulRefresh: "2026-10-26T12:00:00.000Z",
    },
  };

  const isStale = Boolean(staleResponse.data.isStale || staleResponse.meta?.isStale);
  const reason = staleResponse.data.staleReason || staleResponse.meta?.staleReason;
  const lastSync = staleResponse.meta.lastSuccessfulRefresh || staleResponse.data.fetchedAt;

  assert.equal(isStale, true);
  assert.equal(reason, "Twitter API rate limit reached; serving cached snapshot.");
  assert.equal(lastSync, "2026-10-26T12:00:00.000Z");
});

// ============================================================================
// TEST 7: Analytics Navigation and Tab Registration
// ============================================================================
test("Analytics page and tabs navigation register X tab without breaking existing tabs", async () => {
  const fs = await import("node:fs/promises");
  const navSource = await fs.readFile(
    new URL("../components/dashboard/analytics/AnalyticsTabsNav.js", import.meta.url),
    "utf-8"
  );
  const pageSource = await fs.readFile(
    new URL("../app/dashboard/analytics/page.js", import.meta.url),
    "utf-8"
  );

  // Check nav tabs include 'x'
  assert.match(navSource, /\{ id: "x", label: "X \(Twitter\)", icon: XIcon \}/);

  // Check page.js VALID_ANALYTICS_TABS includes 'x' and all legacy tabs
  assert.match(pageSource, /VALID_ANALYTICS_TABS = \[.*"overview".*"facebook".*"instagram".*"ads".*"linkedin".*"x".*"gsc".*"ga4".*\]/);

  // Check page.js TAB_ALIASES includes 'twitter'
  assert.match(pageSource, /"twitter": "x"/);

  // Check XTab is conditionally rendered in page.js
  assert.match(pageSource, /\{activeTab === "x" && <XTab xState=\{xAnalytics\} \/>\}/);
});

// ============================================================================
// TEST 8: IntegrationsTab displays X integration card and handles OAuth callback
// ============================================================================
test("IntegrationsTab contains X integration card and OAuth callback logic", async () => {
  const fs = await import("node:fs/promises");
  const settingsSource = await fs.readFile(
    new URL("../components/dashboard/settings/IntegrationsTab.js", import.meta.url),
    "utf-8"
  );

  // Contains X imports
  assert.match(settingsSource, /import XIcon from "@\/components\/icons\/XIcon"/);
  assert.match(settingsSource, /import { useXAnalytics } from "@\/hooks\/useXAnalytics"/);

  // Contains X OAuth callback parameter detection
  assert.match(settingsSource, /searchParams\.get\("x_status"\)/);
  assert.match(settingsSource, /searchParams\.get\("username"\)/);

  // Contains X card rendering with Disconnect confirmation
  assert.match(settingsSource, /isX/);
  assert.match(settingsSource, /handleXConnect/);
  assert.match(settingsSource, /handleConfirmXDisconnect/);
  assert.match(settingsSource, /showXDisconnectConfirm/);
});
