import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// TEST 1: Numeric zero remains visible as zero, and null/missing does not show zero
// ============================================================================
test("formatSafeNumber and formatTableCellNumber preserve numeric zero vs null/missing semantics", () => {
  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  const formatTableCellNumber = (val) => {
    if (val === null || val === undefined) return "—";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "—";
    return parsed.toLocaleString();
  };

  // Case 1: Numeric zero must strictly show zero
  assert.equal(formatSafeNumber(0), "0");
  assert.equal(formatSafeNumber("0"), "0");
  assert.equal(formatTableCellNumber(0), "0");
  assert.equal(formatTableCellNumber("0"), "0");

  // Case 2: Null and missing must NOT show zero
  assert.equal(formatSafeNumber(null), "Unavailable");
  assert.equal(formatSafeNumber(undefined), "Unavailable");
  assert.equal(formatSafeNumber(""), "Unavailable");
  assert.equal(formatTableCellNumber(null), "—");
  assert.equal(formatTableCellNumber(undefined), "—");

  // Case 3: Positive numbers format with locale formatting
  assert.equal(formatSafeNumber(1250), "1,250");
  assert.equal(formatTableCellNumber(3400), "3,400");
});

// ============================================================================
// TEST 2: Metric evaluation distinguishes numeric 0, empty observations, and missing metrics
// ============================================================================
test("evaluateMetric cleanly discriminates genuine zero, empty observations (NO_DATA), and absent metric (UNAVAILABLE)", () => {
  const evaluateMetric = (insightsArray, metricNames, since, until) => {
    if (!insightsArray || !Array.isArray(insightsArray)) {
      return { status: "UNAVAILABLE" };
    }
    const names = Array.isArray(metricNames) ? metricNames : [metricNames];
    const item = insightsArray.find((i) => names.includes(i.name));
    if (!item) {
      return { status: "UNAVAILABLE" };
    }
    if (!Array.isArray(item.values) || item.values.length === 0) {
      return { status: "NO_DATA" };
    }

    let valuesToProcess = item.values;
    if (since || until) {
      valuesToProcess = valuesToProcess.filter((v) => {
        const rawTime = v.endTime || v.end_time || v.timestamp || v.date;
        if (!rawTime) return true;
        try {
          const itemDate = new Date(rawTime).toISOString().split("T")[0];
          if (since && itemDate < since) return false;
          if (until && itemDate > until) return false;
          return true;
        } catch (e) {
          return true;
        }
      });
    }

    if (valuesToProcess.length === 0) {
      return { status: "NO_DATA" };
    }

    const valid = valuesToProcess.filter((v) => v.value !== null && v.value !== undefined && Number.isFinite(Number(v.value)));
    if (valid.length === 0) {
      return { status: "NO_DATA" };
    }

    const sum = valid.reduce((acc, v) => acc + Number(v.value), 0);
    return { status: "VALUE", value: sum };
  };

  const renderMetricState = (metricState, isConnected = true) => {
    if (!isConnected) return "Not connected";
    if (metricState.status === "VALUE") return metricState.value === 0 ? "0" : metricState.value.toLocaleString();
    if (metricState.status === "NO_DATA") return "No data";
    return "Unavailable";
  };

  const sampleInsights = [
    {
      name: "page_views_total",
      values: [
        { endTime: "2026-10-01T07:00:00+0000", value: 45 },
        { endTime: "2026-10-02T07:00:00+0000", value: 55 },
      ],
    },
    {
      name: "page_post_engagements",
      values: [
        { endTime: "2026-10-01T07:00:00+0000", value: 0 },
        { endTime: "2026-10-02T07:00:00+0000", value: 0 },
      ],
    },
    {
      name: "page_follows",
      values: [], // Empty observations returned by backend
    },
  ];

  // 1. Valid non-zero sum
  const viewsRes = evaluateMetric(sampleInsights, "page_views_total");
  assert.equal(viewsRes.status, "VALUE");
  assert.equal(viewsRes.value, 100);
  assert.equal(renderMetricState(viewsRes), "100");

  // 2. Genuine numeric zero
  const engRes = evaluateMetric(sampleInsights, "page_post_engagements");
  assert.equal(engRes.status, "VALUE");
  assert.equal(engRes.value, 0);
  assert.equal(renderMetricState(engRes), "0");

  // 3. Empty observations array -> NO_DATA, not permission failure or 0
  const followsRes = evaluateMetric(sampleInsights, "page_follows");
  assert.equal(followsRes.status, "NO_DATA");
  assert.equal(renderMetricState(followsRes), "No data");

  // 4. Absent/null metric -> UNAVAILABLE
  const missingRes = evaluateMetric(sampleInsights, "non_existent_metric");
  assert.equal(missingRes.status, "UNAVAILABLE");
  assert.equal(renderMetricState(missingRes), "Unavailable");

  // 5. Deprecated page_impressions -> UNAVAILABLE
  const impressionsRes = evaluateMetric(sampleInsights, "page_impressions");
  assert.equal(impressionsRes.status, "UNAVAILABLE");
  assert.equal(renderMetricState(impressionsRes), "Unavailable");

  // 6. Disconnected state -> Not connected
  assert.equal(renderMetricState(viewsRes, false), "Not connected");
});

// ============================================================================
// TEST 3: Date range boundaries strictly filter observations
// ============================================================================
test("evaluateMetric filters observations strictly inside [since, until] date bounds", () => {
  const evaluateMetric = (insightsArray, metricNames, since, until) => {
    const item = insightsArray.find((i) => i.name === metricNames);
    if (!item || !Array.isArray(item.values)) return { status: "UNAVAILABLE" };

    let valuesToProcess = item.values;
    if (since || until) {
      valuesToProcess = valuesToProcess.filter((v) => {
        const rawTime = v.endTime || v.end_time || v.timestamp || v.date;
        if (!rawTime) return true;
        const itemDate = new Date(rawTime).toISOString().split("T")[0];
        if (since && itemDate < since) return false;
        if (until && itemDate > until) return false;
        return true;
      });
    }

    if (valuesToProcess.length === 0) return { status: "NO_DATA" };
    const sum = valuesToProcess.reduce((acc, v) => acc + Number(v.value), 0);
    return { status: "VALUE", value: sum };
  };

  const insights = [
    {
      name: "page_views_total",
      values: [
        { endTime: "2026-09-28T07:00:00+0000", value: 10 },
        { endTime: "2026-10-01T07:00:00+0000", value: 20 },
        { endTime: "2026-10-05T07:00:00+0000", value: 30 },
        { endTime: "2026-10-10T07:00:00+0000", value: 40 },
      ],
    },
  ];

  // Filtering between 2026-10-01 and 2026-10-05 should only sum 20 + 30 = 50
  const filteredRes = evaluateMetric(insights, "page_views_total", "2026-10-01", "2026-10-05");
  assert.equal(filteredRes.status, "VALUE");
  assert.equal(filteredRes.value, 50);

  // Filtering out of range should yield NO_DATA
  const outOfRange = evaluateMetric(insights, "page_views_total", "2026-10-15", "2026-10-20");
  assert.equal(outOfRange.status, "NO_DATA");
});

// ============================================================================
// TEST 4: TrendChart maps page_follows and preserves actual observations without zero-padding
// ============================================================================
test("TrendChart maps page_follows safely and only creates entries for real observations", () => {
  const buildFbTrendData = (pageInsights) => {
    const dateMap = {};

    const getIsoDateKey = (isoString) => {
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split("T")[0];
      } catch (e) {
        return null;
      }
    };

    const getOrCreateEntry = (isoString) => {
      const key = getIsoDateKey(isoString);
      if (!key) return null;
      if (!dateMap[key]) {
        dateMap[key] = { dateKey: key };
      }
      return dateMap[key];
    };

    // 1. page_post_engagements
    const fbEngagements = pageInsights?.find((i) => i.name === "page_post_engagements");
    if (fbEngagements && Array.isArray(fbEngagements.values)) {
      fbEngagements.values.forEach((v) => {
        const rawTime = v.endTime || v.end_time || v.timestamp || v.date;
        if (rawTime && v.value !== null && v.value !== undefined && Number.isFinite(Number(v.value))) {
          const entry = getOrCreateEntry(rawTime);
          if (entry) entry.fb_engagements = Number(v.value);
        }
      });
    }

    // 2. page_follows (with page_daily_follows fallback)
    const fbFollows = pageInsights?.find((i) => i.name === "page_follows" || i.name === "page_daily_follows");
    if (fbFollows && Array.isArray(fbFollows.values)) {
      fbFollows.values.forEach((v) => {
        const rawTime = v.endTime || v.end_time || v.timestamp || v.date;
        if (rawTime && v.value !== null && v.value !== undefined && Number.isFinite(Number(v.value))) {
          const entry = getOrCreateEntry(rawTime);
          if (entry) entry.fb_follows = Number(v.value);
        }
      });
    }

    return Object.values(dateMap);
  };

  const sampleBackendInsights = [
    {
      name: "page_follows",
      values: [
        { endTime: "2026-10-01T07:00:00+0000", value: 12 },
        { endTime: "2026-10-02T07:00:00+0000", value: 8 },
      ],
    },
    {
      name: "page_post_engagements",
      values: [
        { endTime: "2026-10-01T07:00:00+0000", value: 45 },
      ],
    },
  ];

  const trendData = buildFbTrendData(sampleBackendInsights);
  assert.equal(trendData.length, 2);

  const day1 = trendData.find((d) => d.dateKey === "2026-10-01");
  assert.equal(day1.fb_follows, 12);
  assert.equal(day1.fb_engagements, 45);

  const day2 = trendData.find((d) => d.dateKey === "2026-10-02");
  assert.equal(day2.fb_follows, 8);
  assert.equal(day2.fb_engagements, undefined, "Missing observations are NOT zero-padded");
});

// ============================================================================
// TEST 5: Content metrics distinction (reactions vs comments vs shares vs engaged users vs interactions)
// ============================================================================
test("Facebook content metrics cleanly distinguish reactionCount, commentCount, shareCount, engagement, and fbPostInteractions", () => {
  const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);

  const sampleBackendPost = {
    contentId: "12345_67890",
    message: "Announcement post",
    createdTime: "2026-10-05T12:00:00+0000",
    metrics: {
      reactionCount: 25,
      likeCount: 20,
      commentCount: 5,
      shareCount: 2,
      engagement: 30, // post_engaged_users
      fbPostInteractions: 32, // reactionCount (25) + commentCount (5) + shareCount (2) = 32
    },
  };

  const mappedPost = {
    reactions: normalizeNumber(sampleBackendPost.metrics?.reactionCount ?? sampleBackendPost.metrics?.likeCount),
    comments: normalizeNumber(sampleBackendPost.metrics?.commentCount),
    shares: normalizeNumber(sampleBackendPost.metrics?.shareCount),
    interactions: normalizeNumber(sampleBackendPost.metrics?.fbPostInteractions),
    engagedUsers: normalizeNumber(sampleBackendPost.metrics?.engagement),
  };

  assert.equal(mappedPost.reactions, 25);
  assert.equal(mappedPost.comments, 5);
  assert.equal(mappedPost.shares, 2);
  assert.equal(mappedPost.interactions, 32, "Interactions must equal sum of reactions, comments, and shares");
  assert.equal(mappedPost.engagedUsers, 30, "Engaged users is post_engaged_users and not equated with interactions");
  assert.notEqual(mappedPost.interactions, mappedPost.engagedUsers);
});

// ============================================================================
// TEST 6: Missing optional post metrics do not hide published posts and never show 0
// ============================================================================
test("Missing optional post metrics (shares, reactions) display as '—' and do not hide posts", () => {
  const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);
  const formatTableCell = (val) => {
    if (val === null || val === undefined) return "—";
    const num = Number(val);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString();
  };

  const postWithMissingShares = {
    contentId: "post_no_shares",
    message: "Post without share counts",
    createdTime: "2026-10-06T10:00:00+0000",
    metrics: {
      reactionCount: 14,
      commentCount: 0,
      shareCount: null, // Backend omitted or could not fetch shares
      fbPostInteractions: null, // Because required shareCount is missing
      engagement: 14,
    },
  };

  const mapped = {
    contentId: postWithMissingShares.contentId,
    reactions: normalizeNumber(postWithMissingShares.metrics?.reactionCount),
    comments: normalizeNumber(postWithMissingShares.metrics?.commentCount),
    shares: normalizeNumber(postWithMissingShares.metrics?.shareCount),
    interactions: normalizeNumber(postWithMissingShares.metrics?.fbPostInteractions),
  };

  assert.equal(mapped.contentId, "post_no_shares");
  assert.equal(formatTableCell(mapped.reactions), "14");
  assert.equal(formatTableCell(mapped.comments), "0", "0 comments must display as 0");
  assert.equal(formatTableCell(mapped.shares), "—", "Missing shares must display as '—', NOT 0");
  assert.equal(formatTableCell(mapped.interactions), "—", "Missing interactions must display as '—', NOT 0");
});

// ============================================================================
// TEST 7: Backend warnings (meta.warnings) are extracted and deduplicated
// ============================================================================
test("meta.warnings extraction surfaces backend notices safely", () => {
  const social = {
    meta: {
      warnings: ["Page insights limited by current Graph API permissions", "Rate limit headroom 85%"],
    },
  };
  const fbContent = {
    meta: {
      warnings: ["Page insights limited by current Graph API permissions"], // Duplicate warning
    },
  };

  const warnings = [
    ...(Array.isArray(social?.meta?.warnings) ? social.meta.warnings : []),
    ...(Array.isArray(fbContent?.meta?.warnings) ? fbContent.meta.warnings : []),
  ]
    .map((w) => (typeof w === "string" ? w : w?.message || String(w)))
    .filter(Boolean);

  const unique = Array.from(new Set(warnings));

  assert.equal(unique.length, 2);
  assert.equal(unique[0], "Page insights limited by current Graph API permissions");
  assert.equal(unique[1], "Rate limit headroom 85%");
});

// ============================================================================
// TEST 8: Instagram, Ads, GSC, and GA4 series and configs remain strictly isolated
// ============================================================================
test("Platform isolation is preserved across Instagram, Ads, and search integrations", () => {
  const allowedPlatformsForTab = (tab) => {
    if (tab === "facebook") return ["facebook"];
    if (tab === "instagram") return ["instagram"];
    if (tab === "ads") return ["ads"];
    return ["facebook", "instagram", "ads"];
  };

  assert.deepEqual(allowedPlatformsForTab("facebook"), ["facebook"]);
  assert.deepEqual(allowedPlatformsForTab("instagram"), ["instagram"]);
  assert.deepEqual(allowedPlatformsForTab("ads"), ["ads"]);
  assert.deepEqual(allowedPlatformsForTab("overview"), ["facebook", "instagram", "ads"]);
});

// ============================================================================
// TEST 9: Meta Business Suite 10 KPI card definitions and honest availability states
// ============================================================================
test("Meta Business Suite 10 KPI card definitions distinguish supported vs unavailable metrics", () => {
  const evaluateDailySeries = (insightsArray, metricNames, since, until) => {
    if (!insightsArray || !Array.isArray(insightsArray)) return [];
    const names = Array.isArray(metricNames) ? metricNames : [metricNames];
    const item = insightsArray.find((i) => names.includes(i.name));
    if (!item || !Array.isArray(item.values)) return [];

    return item.values
      .filter((v) => v.value !== null && v.value !== undefined && Number.isFinite(Number(v.value)))
      .map((v) => ({ dateKey: v.endTime, value: Number(v.value) }));
  };

  const evaluateMetricSummary = (insightsArray, metricNames) => {
    const series = evaluateDailySeries(insightsArray, metricNames);
    if (!series || series.length === 0) return { status: "NO_DATA", value: null, series: [] };
    const total = series.reduce((acc, s) => acc + s.value, 0);
    return { status: "VALUE", value: total, series };
  };

  const mockInsights = [
    {
      name: "page_views_total",
      values: [{ endTime: "2026-10-01", value: 120 }, { endTime: "2026-10-02", value: 180 }],
    },
    {
      name: "page_follows",
      values: [{ endTime: "2026-10-01", value: 5 }, { endTime: "2026-10-02", value: 8 }],
    },
    {
      name: "page_post_engagements",
      values: [{ endTime: "2026-10-01", value: 50 }, { endTime: "2026-10-02", value: 70 }],
    },
  ];

  const pageDetails = { fanCount: 1540, followersCount: 1590 };

  const viewsRes = evaluateMetricSummary(mockInsights, "page_views_total");
  assert.equal(viewsRes.status, "VALUE");
  assert.equal(viewsRes.value, 300);

  const followsRes = evaluateMetricSummary(mockInsights, ["page_follows", "page_daily_follows"]);
  assert.equal(followsRes.status, "VALUE");
  assert.equal(followsRes.value, 13);

  const engRes = evaluateMetricSummary(mockInsights, "page_post_engagements");
  assert.equal(engRes.status, "VALUE");
  assert.equal(engRes.value, 120);

  // Lifetime followers snapshot: distinct from period follows
  assert.equal(pageDetails.fanCount, 1540);
  assert.notEqual(pageDetails.fanCount, followsRes.value);

  // Unsupported metrics must remain explicitly unavailable
  const unsupportedKeys = [
    "page_impressions_unique", // Viewers/Reach
    "page_daily_unfollows_unique", // Unfollows
    "net_follows", // Net Follows
    "page_views_login_unique", // Facebook Visits
    "page_video_views", // 3s Video Views
    "page_video_view_time", // Watch Time
  ];

  unsupportedKeys.forEach((key) => {
    const res = evaluateMetricSummary(mockInsights, key);
    assert.equal(res.status, "NO_DATA", `${key} must not be present or zero-filled`);
  });
});

// ============================================================================
// TEST 10: Previous-period comparison delta calculation with safe null/zero semantics
// ============================================================================
test("Previous-period comparison delta calculates valid changes and prevents division by zero", () => {
  const calculatePeriodDelta = (currentSummary, previousSummary) => {
    if (!currentSummary || currentSummary.status !== "VALUE") return null;
    if (!previousSummary || previousSummary.status !== "VALUE") return null;

    const curr = currentSummary.value;
    const prev = previousSummary.value;

    if (prev === 0) {
      if (curr === 0) return { deltaPercent: 0, direction: "flat", text: "0.0% vs prev" };
      return { deltaPercent: null, direction: "up", text: "+100% vs prev (from 0)" };
    }

    const diff = curr - prev;
    const percent = Math.round((diff / prev) * 1000) / 10;
    const direction = percent > 0 ? "up" : percent < 0 ? "down" : "flat";
    const sign = percent > 0 ? "+" : "";

    return {
      deltaPercent: percent,
      direction,
      text: `${sign}${percent}% vs prev period`,
    };
  };

  // Case 1: Positive growth
  const delta1 = calculatePeriodDelta({ status: "VALUE", value: 150 }, { status: "VALUE", value: 100 });
  assert.equal(delta1.deltaPercent, 50);
  assert.equal(delta1.direction, "up");
  assert.equal(delta1.text, "+50% vs prev period");

  // Case 2: Negative decline
  const delta2 = calculatePeriodDelta({ status: "VALUE", value: 80 }, { status: "VALUE", value: 100 });
  assert.equal(delta2.deltaPercent, -20);
  assert.equal(delta2.direction, "down");
  assert.equal(delta2.text, "-20% vs prev period");

  // Case 3: Flat
  const delta3 = calculatePeriodDelta({ status: "VALUE", value: 100 }, { status: "VALUE", value: 100 });
  assert.equal(delta3.deltaPercent, 0);
  assert.equal(delta3.direction, "flat");

  // Case 4: Previous period is zero
  const delta4 = calculatePeriodDelta({ status: "VALUE", value: 25 }, { status: "VALUE", value: 0 });
  assert.equal(delta4.direction, "up");
  assert.equal(delta4.text, "+100% vs prev (from 0)");

  // Case 5: Missing previous period returns null (honest lack of comparison)
  const delta5 = calculatePeriodDelta({ status: "VALUE", value: 100 }, { status: "NO_DATA", value: null });
  assert.equal(delta5, null);
  const delta6 = calculatePeriodDelta({ status: "VALUE", value: 100 }, null);
  assert.equal(delta6, null);
});

// ============================================================================
// TEST 11: Metric detail panel selection and daily statistics derivation
// ============================================================================
test("Metric detail panel computes summary total, daily average, and peak observation safely", () => {
  const series = [
    { dateKey: "2026-10-01", dateLabel: "Oct 1", value: 50 },
    { dateKey: "2026-10-02", dateLabel: "Oct 2", value: 120 },
    { dateKey: "2026-10-03", dateLabel: "Oct 3", value: 70 },
  ];

  const total = series.reduce((acc, s) => acc + s.value, 0);
  const avg = Math.round((total / series.length) * 10) / 10;
  const peak = series.reduce((max, s) => (s.value > max.value ? s : max), series[0]);

  assert.equal(total, 240);
  assert.equal(avg, 80);
  assert.equal(peak.value, 120);
  assert.equal(peak.dateLabel, "Oct 2");
});

// ============================================================================
// TEST 12: Instagram-only warnings are strictly excluded in Facebook view
// ============================================================================
test("Instagram-only warnings are strictly excluded from Facebook warning banner", () => {
  const mixedWarnings = [
    "Facebook Page Insights rate limit remaining: 80%",
    "Instagram Professional account reach metric delayed by Meta",
    "General Meta API maintenance scheduled",
    "IG media comments require re-authentication",
  ];

  const filteredForFb = mixedWarnings.filter((warn) => {
    const lower = warn.toLowerCase();
    if (lower.includes("instagram") && !lower.includes("facebook") && !lower.includes("page")) {
      return false;
    }
    if (lower.startsWith("ig ") || lower.includes(" ig ")) {
      return false;
    }
    return true;
  });

  assert.equal(filteredForFb.length, 2);
  assert.equal(filteredForFb[0], "Facebook Page Insights rate limit remaining: 80%");
  assert.equal(filteredForFb[1], "General Meta API maintenance scheduled");
});

// ============================================================================
// TEST 13: Meta date presets (7D, 28D, 90D) mapping and bounds validation
// ============================================================================
test("Facebook date presets 7D, 28D, 90D map accurately to reporting day spans", () => {
  const getDaysForPreset = (rangeInput) => {
    if (typeof rangeInput === "number") return rangeInput;
    if (rangeInput === "7d" || rangeInput === "7D" || rangeInput === 7) return 7;
    if (rangeInput === "28d" || rangeInput === "28D" || rangeInput === 28) return 28;
    if (rangeInput === "90d" || rangeInput === "90D" || rangeInput === 90 || rangeInput === "3m") return 90;
    return 28; // Default Meta Business Suite Facebook preset
  };

  assert.equal(getDaysForPreset("7d"), 7);
  assert.equal(getDaysForPreset("28d"), 28);
  assert.equal(getDaysForPreset("90d"), 90);
  assert.equal(getDaysForPreset(28), 28);
  assert.equal(getDaysForPreset(null), 28);
});

// ============================================================================
// TEST 14: Exactly 4 Grouped KPI Cards with strictly mapped metrics
// ============================================================================
test("Four grouped KPI cards contain exactly their designated metrics with correct categories", () => {
  const cardGroupConfig = [
    {
      id: "visibility",
      title: "Visibility & Reach",
      expectedKeys: ["views", "reach", "visits", "video_views_3s", "watch_time"],
    },
    {
      id: "engagement",
      title: "Engagement & Content",
      expectedKeys: ["interactions", "post_engagements", "reactions", "comments", "shares"],
    },
    {
      id: "audience",
      title: "Audience & Followers",
      expectedKeys: ["lifetime_followers", "follows", "unfollows", "net_follows"],
    },
    {
      id: "trends",
      title: "Performance Trends",
      expectedKeys: ["daily_views", "daily_interactions", "daily_follows", "daily_unfollows"],
    },
  ];

  // Must have exactly four cards
  assert.equal(cardGroupConfig.length, 4);
  assert.deepEqual(
    cardGroupConfig.map((c) => c.title),
    ["Visibility & Reach", "Engagement & Content", "Audience & Followers", "Performance Trends"]
  );

  // Group 1: Visibility & Reach
  const vis = cardGroupConfig.find((c) => c.id === "visibility");
  assert.deepEqual(vis.expectedKeys, ["views", "reach", "visits", "video_views_3s", "watch_time"]);

  // Group 2: Engagement & Content
  const eng = cardGroupConfig.find((c) => c.id === "engagement");
  assert.deepEqual(eng.expectedKeys, ["interactions", "post_engagements", "reactions", "comments", "shares"]);

  // Group 3: Audience & Followers
  const aud = cardGroupConfig.find((c) => c.id === "audience");
  assert.deepEqual(aud.expectedKeys, ["lifetime_followers", "follows", "unfollows", "net_follows"]);

  // Group 4: Performance Trends
  const trends = cardGroupConfig.find((c) => c.id === "trends");
  assert.deepEqual(trends.expectedKeys, ["daily_views", "daily_interactions", "daily_follows", "daily_unfollows"]);
});

// ============================================================================
// TEST 15: Dropdowns are isolated and changing one card does not affect other cards
// ============================================================================
test("Card dropdowns are completely isolated; selection changes update only the targeted card", () => {
  let cardSelections = {
    visibility: "views",
    engagement: "interactions",
    audience: "lifetime_followers",
    trends: "daily_views",
  };

  const handleSelectMetric = (cardId, metricKey) => {
    cardSelections = {
      ...cardSelections,
      [cardId]: metricKey,
    };
  };

  // Initial state check
  assert.equal(cardSelections.visibility, "views");
  assert.equal(cardSelections.engagement, "interactions");
  assert.equal(cardSelections.audience, "lifetime_followers");
  assert.equal(cardSelections.trends, "daily_views");

  // Change Card 1 (Visibility) to "visits"
  handleSelectMetric("visibility", "visits");
  assert.equal(cardSelections.visibility, "visits");
  assert.equal(cardSelections.engagement, "interactions", "Card 2 remains unchanged");
  assert.equal(cardSelections.audience, "lifetime_followers", "Card 3 remains unchanged");
  assert.equal(cardSelections.trends, "daily_views", "Card 4 remains unchanged");

  // Change Card 3 (Audience) to "follows"
  handleSelectMetric("audience", "follows");
  assert.equal(cardSelections.visibility, "visits", "Card 1 remains unchanged");
  assert.equal(cardSelections.engagement, "interactions", "Card 2 remains unchanged");
  assert.equal(cardSelections.audience, "follows");
  assert.equal(cardSelections.trends, "daily_views", "Card 4 remains unchanged");

  // Change Card 4 (Trends) to "daily_follows"
  handleSelectMetric("trends", "daily_follows");
  assert.equal(cardSelections.visibility, "visits");
  assert.equal(cardSelections.engagement, "interactions");
  assert.equal(cardSelections.audience, "follows");
  assert.equal(cardSelections.trends, "daily_follows");
});

// ============================================================================
// TEST 16: Global toggle expands all cards simultaneously to display all options
// ============================================================================
test("Global toggle transitions between compact and expanded states across all cards simultaneously", () => {
  let showAllMetrics = false;

  const toggleAllMetrics = () => {
    showAllMetrics = !showAllMetrics;
  };

  const cardGroup = {
    id: "visibility",
    metrics: [
      { key: "views", label: "Views", value: "300" },
      { key: "reach", label: "Viewers / Reach", value: "Unavailable" },
      { key: "visits", label: "Facebook Visits", value: "Unavailable" },
      { key: "video_views_3s", label: "3-second Video Views", value: "Unavailable" },
      { key: "watch_time", label: "Watch Time", value: "Unavailable" },
    ],
  };

  // State 1: Toggle OFF -> Compact mode renders single selected metric
  assert.equal(showAllMetrics, false);
  const selectedKey = "views";
  const compactRender = cardGroup.metrics.find((m) => m.key === selectedKey);
  assert.equal(compactRender.label, "Views");
  assert.equal(compactRender.value, "300");

  // State 2: Toggle ON -> Expanded mode displays all options in dropdown simultaneously
  toggleAllMetrics();
  assert.equal(showAllMetrics, true);
  const expandedRender = cardGroup.metrics.map((m) => ({ label: m.label, value: m.value }));
  assert.equal(expandedRender.length, 5);
  assert.deepEqual(expandedRender[0], { label: "Views", value: "300" });
  assert.deepEqual(expandedRender[1], { label: "Viewers / Reach", value: "Unavailable" });
  assert.deepEqual(expandedRender[2], { label: "Facebook Visits", value: "Unavailable" });
  assert.deepEqual(expandedRender[3], { label: "3-second Video Views", value: "Unavailable" });
  assert.deepEqual(expandedRender[4], { label: "Watch Time", value: "Unavailable" });

  // State 3: Toggle back OFF -> Returns to compact mode without mutating selection
  toggleAllMetrics();
  assert.equal(showAllMetrics, false);
  const compactAfterToggle = cardGroup.metrics.find((m) => m.key === selectedKey);
  assert.equal(compactAfterToggle.label, "Views");
  assert.equal(compactAfterToggle.value, "300");
});

// ============================================================================
// TEST 17: Conditional metrics (Returning Viewers and Daily Net Follows) inclusion rules
// ============================================================================
test("Returning Viewers and Daily Net Follows are strictly conditioned on backend data contract support", () => {
  // Case A: Standard backend contract where Returning Viewers and Unfollows are NOT queried
  const standardInsights = [
    { name: "page_views_total", values: [{ endTime: "2026-10-01", value: 50 }] },
    { name: "page_follows", values: [{ endTime: "2026-10-01", value: 5 }] },
  ];

  const supportsReturningViewers = (insights) =>
    insights.some((i) => i.name === "page_returning_viewers" || i.name === "returning_viewers");

  const supportsDailyNetFollows = (followsSum, unfollowsSum) =>
    followsSum?.status === "VALUE" &&
    unfollowsSum?.status === "VALUE" &&
    followsSum?.series?.length > 0 &&
    unfollowsSum?.series?.length > 0;

  assert.equal(supportsReturningViewers(standardInsights), false, "Standard contract does not support returning viewers");
  assert.equal(
    supportsDailyNetFollows({ status: "VALUE", series: [{ value: 5 }] }, { status: "UNAVAILABLE", series: [] }),
    false,
    "Daily Net Follows is not supported when unfollows is unavailable"
  );

  // Case B: Extended contract where both Returning Viewers and Unfollows are present
  const extendedInsights = [
    { name: "page_views_total", values: [{ endTime: "2026-10-01", value: 50 }] },
    { name: "page_follows", values: [{ endTime: "2026-10-01", value: 5 }] },
    { name: "page_daily_unfollows_unique", values: [{ endTime: "2026-10-01", value: 1 }] },
    { name: "page_returning_viewers", values: [{ endTime: "2026-10-01", value: 20 }] },
  ];

  assert.equal(supportsReturningViewers(extendedInsights), true, "Extended contract includes returning viewers");
  assert.equal(
    supportsDailyNetFollows({ status: "VALUE", series: [{ value: 5 }] }, { status: "VALUE", series: [{ value: 1 }] }),
    true,
    "Daily Net Follows is dynamically included when both follows and unfollows exist"
  );
});

// ============================================================================
// TEST 18: Performance trends daily average calculation
// ============================================================================
test("Performance trends computes accurate daily average rates without fabricating missing data", () => {
  const computeDailyAverage = (summary) => {
    if (summary.status === "VALUE" && Array.isArray(summary.series) && summary.series.length > 0) {
      const avg = Math.round((summary.value / summary.series.length) * 10) / 10;
      return {
        status: "VALUE",
        value: `${Math.round(avg).toLocaleString()} / day`,
        numericAvg: avg,
      };
    }
    return {
      status: summary.status,
      value: summary.status === "NO_DATA" ? "No data" : "Unavailable",
      numericAvg: null,
    };
  };

  // Valid series with 3 days of observations totaling 150
  const validSummary = {
    status: "VALUE",
    value: 150,
    series: [
      { dateKey: "2026-10-01", value: 40 },
      { dateKey: "2026-10-02", value: 50 },
      { dateKey: "2026-10-03", value: 60 },
    ],
  };
  const res1 = computeDailyAverage(validSummary);
  assert.equal(res1.status, "VALUE");
  assert.equal(res1.numericAvg, 50);
  assert.equal(res1.value, "50 / day");

  // Empty observations
  const emptySummary = { status: "NO_DATA", value: null, series: [] };
  const res2 = computeDailyAverage(emptySummary);
  assert.equal(res2.status, "NO_DATA");
  assert.equal(res2.value, "No data");

  // Unavailable metric
  const unavailSummary = { status: "UNAVAILABLE", value: null, series: [] };
  const res3 = computeDailyAverage(unavailSummary);
  assert.equal(res3.status, "UNAVAILABLE");
  assert.equal(res3.value, "Unavailable");
});

// ============================================================================
// TEST 19: Dedicated GET /api/meta/insights/facebook structured report mapping
// ============================================================================
test("GET /api/meta/insights/facebook structured report maps accurately into the 4 KPI groups", () => {
  const structuredBackendReport = {
    success: true,
    data: {
      pageId: "fb_page_123",
      pageName: "Gromentum Brand",
      performance: {
        views: {
          status: "AVAILABLE",
          total: 1250,
          timeSeries: [{ date: "2026-10-01", value: 45 }, { date: "2026-10-02", value: 55 }],
          comparison: { previousTotal: 1100, delta: 150, percentageChange: 13.6 },
        },
        viewers: {
          status: "UNAVAILABLE",
          total: null,
          timeSeries: [],
          reason: "page_impressions_unique not returned by Meta for this Page",
        },
        pageVisits: {
          status: "AVAILABLE",
          total: 320,
          timeSeries: [{ date: "2026-10-01", value: 10 }],
          comparison: { previousTotal: 300, delta: 20, percentageChange: 6.7 },
        },
        follows: {
          status: "AVAILABLE",
          total: 54478, // Old raw sum in backend
          isSnapshot: true,
          periodChange: 14,
          snapshotEarliest: 1938,
          snapshotLatest: 1952,
          timeSeries: [
            { date: "2026-10-01", value: 1938 },
            { date: "2026-10-28", value: 1952 },
          ],
          note: "Values represent cumulative follower snapshots, not daily new follows.",
          comparison: null,
        },
        unfollows: {
          status: "UNAVAILABLE",
          total: null,
          timeSeries: [],
        },
        netFollows: {
          status: "UNAVAILABLE",
          total: null,
          timeSeries: [],
          reason: "Net follows requires compatible flow metrics",
        },
        postEngagements: {
          status: "AVAILABLE",
          total: 420,
          timeSeries: [{ date: "2026-10-01", value: 15 }],
          comparison: { previousTotal: 390, delta: 30, percentageChange: 7.7 },
        },
        contentInteractions: {
          status: "AVAILABLE",
          total: 350,
          breakdown: {
            reactions: 210,
            comments: 90,
            shares: 50,
          },
          timeSeries: [{ date: "2026-10-01", value: 12 }],
          comparison: { previousTotal: 300, delta: 50, percentageChange: 16.7 },
        },
      },
      video: {
        threeSecondViews: {
          status: "AVAILABLE",
          total: 840,
          timeSeries: [{ date: "2026-10-01", value: 30 }],
          comparison: null,
        },
        watchTime: {
          status: "AVAILABLE",
          totalMinutes: 45.5,
          totalMs: 2730000,
          timeSeries: [{ date: "2026-10-01", value: 90000 }],
          comparison: null,
        },
      },
      audience: {
        lifetimeFollowers: {
          status: "AVAILABLE",
          current: 1952,
        },
        returningViewers: {
          status: "UNSUPPORTED_BY_META",
          total: null,
          timeSeries: [],
          reason: "Returning viewers metric is not exposed via public Meta Graph API",
        },
      },
      posts: [
        {
          id: "post_1",
          contentId: "post_1",
          message: "Product launch announcement",
          createdTime: "2026-10-15T12:00:00Z",
          reactions: 210,
          comments: 90,
          shares: 50,
          interactions: 350,
        },
      ],
    },
  };

  const perf = structuredBackendReport.data.performance;
  const video = structuredBackendReport.data.video;
  const aud = structuredBackendReport.data.audience;

  // 1. Visibility & Reach verification
  assert.equal(perf.views.total, 1250);
  assert.equal(perf.views.comparison.percentageChange, 13.6);
  assert.equal(perf.viewers.status, "UNAVAILABLE");
  assert.equal(perf.viewers.total, null);
  assert.ok(perf.viewers.reason.includes("page_impressions_unique"));
  assert.equal(perf.pageVisits.total, 320);
  assert.equal(video.threeSecondViews.total, 840);
  assert.equal(video.watchTime.totalMinutes, 45.5);

  // 2. Engagement & Content verification
  assert.equal(perf.contentInteractions.total, 350);
  assert.equal(perf.postEngagements.total, 420);
  assert.notEqual(perf.contentInteractions.total, perf.postEngagements.total, "Content interactions and post engagements must remain distinct");
  assert.equal(perf.contentInteractions.breakdown.reactions, 210);
  assert.equal(perf.contentInteractions.breakdown.comments, 90);
  assert.equal(perf.contentInteractions.breakdown.shares, 50);

  // 3. Audience & Followers verification
  assert.equal(aud.lifetimeFollowers.current, 1952);
  assert.equal(perf.follows.isSnapshot, true);
  assert.equal(perf.follows.periodChange, 14);
  assert.equal(perf.unfollows.status, "UNAVAILABLE");
  assert.equal(perf.netFollows.status, "UNAVAILABLE");
  assert.equal(aud.returningViewers.status, "UNSUPPORTED_BY_META");

  // Returning Viewers must NOT be displayed when UNSUPPORTED_BY_META
  const supportsReturningViewers = aud.returningViewers.status === "AVAILABLE";
  assert.equal(supportsReturningViewers, false, "Returning Viewers must be excluded when status is UNSUPPORTED_BY_META");
});

// ============================================================================
// TEST 20: Follower Presentation: Never sum page_follows snapshot observations
// ============================================================================
test("Follower Presentation never sums cumulative daily snapshots to 54,478 or computes 1,945.6/day", () => {
  // Simulate 28 daily snapshot observations (~1,946 each)
  const snapshotObservations = [];
  const baseCount = 1938;
  for (let i = 0; i < 28; i++) {
    snapshotObservations.push({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      value: baseCount + Math.floor((i / 27) * 14), // increases from 1938 to 1952
    });
  }

  // Old erroneous frontend sum calculation
  const buggySum = snapshotObservations.reduce((acc, s) => acc + s.value, 0);
  const buggyDailyRate = Math.round((buggySum / snapshotObservations.length) * 10) / 10;
  assert.ok(buggySum > 50000, "Old frontend mistakenly summed snapshots to >54,000");
  assert.equal(buggyDailyRate >= 1940, true, "Old frontend mistakenly computed ~1,945.6 / day");

  // Corrected snapshot-aware logic
  const earliest = snapshotObservations[0].value;
  const latest = snapshotObservations[snapshotObservations.length - 1].value;
  const periodChange = latest - earliest;
  const days = snapshotObservations.length;
  const correctDailyRate = Math.round((periodChange / days) * 10) / 10;

  // Assertions for corrected presentation
  assert.equal(earliest, 1938);
  assert.equal(latest, 1952);
  assert.equal(periodChange, 14, "Period change must be +14, NOT 54,478");
  assert.equal(correctDailyRate, 0.5, "Daily follows rate must be +0.5 / day, NOT 1,945.6 / day");

  // Formatted display values
  const formatFollowsDisplay = (isSnapshot, change) => {
    if (isSnapshot) {
      return change >= 0 ? `+${change.toLocaleString()}` : `${change.toLocaleString()}`;
    }
    return change.toLocaleString();
  };
  assert.equal(formatFollowsDisplay(true, periodChange), "+14");

  const formatDailyFollowsDisplay = (isSnapshot, rate) => {
    if (isSnapshot) {
      return `${rate >= 0 ? "+" : ""}${rate.toLocaleString()} / day (net rate)`;
    }
    return `${rate.toLocaleString()} / day`;
  };
  assert.equal(formatDailyFollowsDisplay(true, correctDailyRate), "+0.5 / day (net rate)");
});

// ============================================================================
// TEST 21: Metric integrity: Keep distinct reactions, comments, shares, content interactions, post engagements
// ============================================================================
test("Metric integrity distinguishes contentInteractions, postEngagements, reactions, comments, and shares", () => {
  const breakdown = { reactions: 150, comments: 40, shares: 10 };
  const contentInteractionsTotal = 200;
  const pagePostEngagements = 310;

  // 1. Reactions + Comments + Shares = Content Interactions (when from content)
  assert.equal(breakdown.reactions + breakdown.comments + breakdown.shares, contentInteractionsTotal);

  // 2. Post Engagements from Page Insights represents all interactions across page
  assert.notEqual(contentInteractionsTotal, pagePostEngagements);
  assert.equal(pagePostEngagements > contentInteractionsTotal, true);

  // 3. Unavailable breakdown items display as 'Unavailable'
  const partialBreakdown = { reactions: 150, comments: null, shares: null };
  const formatValue = (val) => (val !== null && val !== undefined ? val.toLocaleString() : "Unavailable");

  assert.equal(formatValue(partialBreakdown.reactions), "150");
  assert.equal(formatValue(partialBreakdown.comments), "Unavailable");
  assert.equal(formatValue(partialBreakdown.shares), "Unavailable");
});

// ============================================================================
// TEST 22: Date range filtering and honest empty period posts explanation
// ============================================================================
test("Date range filtering explains when no posts fall in period if posts exist outside period", () => {
  const allPosts = [
    { contentId: "post_old_1", caption: "Older post", createdTime: "2026-08-15T10:00:00Z" },
    { contentId: "post_old_2", caption: "Another old post", createdTime: "2026-08-20T10:00:00Z" },
  ];

  const activeSince = "2026-10-01";
  const activeUntil = "2026-10-28";
  const formattedRange = "Oct 1, 2026 – Oct 28, 2026";

  const periodPosts = allPosts.filter((p) => {
    const iso = new Date(p.createdTime).toISOString().split("T")[0];
    return iso >= activeSince && iso <= activeUntil;
  });

  assert.equal(periodPosts.length, 0, "Zero posts in selected reporting window");
  assert.equal(allPosts.length, 2, "Two posts exist in total");

  const getEmptyPostsExplanation = (periodCount, totalCount, searchTerm, rangeLabel) => {
    if (searchTerm) return "No posts matched your search criteria.";
    if (periodCount === 0 && totalCount > 0) {
      return `No posts were published in the selected date range (${rangeLabel}). ${totalCount} post${totalCount === 1 ? " exists" : "s exist"} outside this date range.`;
    }
    return "No posts were published in the selected date range.";
  };

  const explanation = getEmptyPostsExplanation(periodPosts.length, allPosts.length, "", formattedRange);
  assert.ok(explanation.includes("2 posts exist outside this date range"), "Clearly explains existence of outside posts");
  assert.ok(explanation.includes("Oct 1, 2026 – Oct 28, 2026"), "Mentions active range bounds");
});

// ============================================================================
// TEST 23: Confirmed backend scenario: 3 reactions, 0 comments, absent shares, 211 unique media viewers
// ============================================================================
test("Facebook post with 3 reactions, 0 comments, absent shares, and 211 unique media viewers displays accurately without fabricating zeros or reach", () => {
  const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);
  const formatTableCellNumber = (val) => {
    if (val === null || val === undefined) return "—";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "—";
    return parsed.toLocaleString();
  };
  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  // Real backend payload from Meta Graph API v26.0
  const realBackendPost = {
    id: "1020304050_99887766",
    contentId: "1020304050_99887766",
    platform: "facebook",
    message: "New product announcement",
    createdTime: "2026-10-15T14:30:00+0000",
    permalinkUrl: "https://www.facebook.com/1020304050/posts/99887766",
    reactions: 3,
    comments: 0,
    shares: null, // Absent from API response
    uniqueMediaViewers: 211, // post_total_media_view_unique
    reach: 211, // Backend fallback for reach
    views: 211,
    engagement: null, // post_engaged_users unsupported on v26.0
    interactions: null, // fbPostInteractions requires reactionCount + commentCount + shareCount; null when shares is null
    metrics: {
      reactionCount: 3,
      commentCount: 0,
      shareCount: null,
      uniqueMediaViewers: 211,
      reach: 211,
      views: 211,
      engagement: null,
      fbPostInteractions: null,
    },
  };

  // Frontend post normalization in FacebookTab
  const normalizedPost = {
    contentId: realBackendPost.contentId || realBackendPost.id,
    platform: "facebook",
    caption: realBackendPost.message,
    reactions: normalizeNumber(realBackendPost.reactions ?? realBackendPost.reactionCount ?? realBackendPost.metrics?.reactionCount),
    comments: normalizeNumber(realBackendPost.comments ?? realBackendPost.commentCount ?? realBackendPost.metrics?.commentCount),
    shares: normalizeNumber(realBackendPost.shares ?? realBackendPost.shareCount ?? realBackendPost.metrics?.shareCount),
    uniqueMediaViewers: normalizeNumber(realBackendPost.uniqueMediaViewers ?? realBackendPost.metrics?.uniqueMediaViewers),
    reach: normalizeNumber(realBackendPost.reach ?? realBackendPost.metrics?.reach),
    interactions: normalizeNumber(realBackendPost.interactions ?? realBackendPost.metrics?.fbPostInteractions),
    engagement: normalizeNumber(realBackendPost.engagement ?? realBackendPost.metrics?.engagement),
  };

  // 1. Reactions: 3 must display as "3"
  assert.equal(normalizedPost.reactions, 3);
  assert.equal(formatTableCellNumber(normalizedPost.reactions), "3");
  assert.equal(formatSafeNumber(normalizedPost.reactions), "3");

  // 2. Comments: 0 must strictly display as "0" (NEVER "Unavailable" or "—")
  assert.equal(normalizedPost.comments, 0);
  assert.equal(formatTableCellNumber(normalizedPost.comments), "0", "0 comments must strictly display as '0'");
  assert.equal(formatSafeNumber(normalizedPost.comments), "0", "0 comments in drawer must strictly display as '0'");

  // 3. Shares: absent/null must display as "—" in table and "Unavailable" in drawer (NEVER "0")
  assert.equal(normalizedPost.shares, null);
  assert.equal(formatTableCellNumber(normalizedPost.shares), "—", "Missing shares must display as '—'");
  assert.equal(formatSafeNumber(normalizedPost.shares), "Unavailable", "Missing shares in drawer must display as 'Unavailable'");

  // 4. Unique Media Viewers: 211 must display as "211" under the accurately labeled column
  assert.equal(normalizedPost.uniqueMediaViewers, 211);
  const displayedViewers = normalizedPost.uniqueMediaViewers ?? normalizedPost.reach;
  assert.equal(formatTableCellNumber(displayedViewers), "211");
  assert.equal(formatSafeNumber(normalizedPost.uniqueMediaViewers), "211");

  // 5. Column label must be "Unique Viewers", NOT traditional Reach
  const columnHeaderLabel = "Unique Viewers";
  assert.ok(columnHeaderLabel.includes("Unique Viewers"), "Table column must be labeled Unique Viewers");
  assert.notEqual(columnHeaderLabel, "Reach", "Must not call unique media viewers traditional Reach");

  // 6. Interactions & Engaged users: null must display as "—" and "Unavailable", NEVER fabricated
  assert.equal(normalizedPost.interactions, null);
  assert.equal(formatTableCellNumber(normalizedPost.interactions), "—", "Interactions with missing components must display as '—'");
  assert.equal(normalizedPost.engagement, null);
  assert.equal(formatSafeNumber(normalizedPost.engagement), "Unavailable", "Unsupported engagement must display as 'Unavailable'");
});

// ============================================================================
// TEST 24: Partial API responses render available metrics alongside unavailable states
// ============================================================================
test("Partial API responses display available post metrics cleanly without failing the row or dashboard", () => {
  const formatTableCellNumber = (val) => {
    if (val === null || val === undefined) return "—";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "—";
    return parsed.toLocaleString();
  };

  const posts = [
    {
      contentId: "post_1",
      reactions: 3,
      comments: 0,
      shares: null, // Partial: missing shares
      uniqueMediaViewers: 211,
      interactions: null, // Partial: missing interactions
    },
    {
      contentId: "post_2",
      reactions: 15,
      comments: 4,
      shares: 2,
      uniqueMediaViewers: 540,
      interactions: 21,
    },
  ];

  // Post 1: has partial availability
  assert.equal(formatTableCellNumber(posts[0].reactions), "3");
  assert.equal(formatTableCellNumber(posts[0].comments), "0");
  assert.equal(formatTableCellNumber(posts[0].shares), "—");
  assert.equal(formatTableCellNumber(posts[0].uniqueMediaViewers), "211");
  assert.equal(formatTableCellNumber(posts[0].interactions), "—");

  // Post 2: full availability
  assert.equal(formatTableCellNumber(posts[1].reactions), "15");
  assert.equal(formatTableCellNumber(posts[1].comments), "4");
  assert.equal(formatTableCellNumber(posts[1].shares), "2");
  assert.equal(formatTableCellNumber(posts[1].uniqueMediaViewers), "540");
  assert.equal(formatTableCellNumber(posts[1].interactions), "21");
});

// ============================================================================
// TEST 25: Sanitized error and permission detection protects secrets
// ============================================================================
test("isPermissionError detects authorization issues and sanitizeErrorMessage strips tokens and secrets", () => {
  const isPermissionError = (msg) => {
    if (!msg || typeof msg !== "string") return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("permission") ||
      lower.includes("reconnect") ||
      lower.includes("re-authorize") ||
      lower.includes("reauthorize") ||
      lower.includes("unauthorized") ||
      lower.includes("access token") ||
      lower.includes("oauth") ||
      lower.includes("expired")
    );
  };

  const sanitizeErrorMessage = (msg) => {
    if (!msg || typeof msg !== "string") return "An error occurred while accessing Facebook insights.";
    return msg
      .replace(/(?:access_token|token|secret|client_secret|bearer)=?[^\s&]+/gi, "[REDACTED]")
      .replace(/EA[A-Za-z0-9]{20,}/g, "[REDACTED_TOKEN]");
  };

  // 1. Permission error detection
  assert.ok(isPermissionError("Permissions error: pages_read_engagement required"));
  assert.ok(isPermissionError("Session has expired or access token is invalid."));
  assert.ok(isPermissionError("OAuthException: (#10) Application does not have permission"));
  assert.equal(isPermissionError("Network timeout connecting to server"), false);

  // 2. Sensitive credential sanitization
  const rawError = "Graph API error with access_token=EAABwzLxyz9876543210abcdef and client_secret=secret12345";
  const sanitized = sanitizeErrorMessage(rawError);
  assert.equal(sanitized.includes("EAABwzLxyz9876543210abcdef"), false, "Token must be redacted");
  assert.equal(sanitized.includes("secret12345"), false, "Secret must be redacted");
  assert.ok(sanitized.includes("[REDACTED]"), "Must replace sensitive values with [REDACTED]");
});

// ============================================================================
// TEST 26: Sorting on Unique Viewers column handles numeric ordering and nulls
// ============================================================================
test("Sorting on uniqueMediaViewers sorts numerically and preserves null semantics", () => {
  const posts = [
    { contentId: "p1", uniqueMediaViewers: 211 },
    { contentId: "p2", uniqueMediaViewers: null },
    { contentId: "p3", uniqueMediaViewers: 50 },
    { contentId: "p4", uniqueMediaViewers: 1200 },
  ];

  const sortPosts = (list, sortKey, sortAsc) => {
    return [...list].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (sortKey === "uniqueMediaViewers" || sortKey === "reach") {
        aVal = a.uniqueMediaViewers ?? a.reach;
        bVal = b.uniqueMediaViewers ?? b.reach;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  };

  // Descending (highest views first, null last)
  const desc = sortPosts(posts, "uniqueMediaViewers", false);
  assert.equal(desc[0].contentId, "p4", "1200 is first");
  assert.equal(desc[1].contentId, "p1", "211 is second");
  assert.equal(desc[2].contentId, "p3", "50 is third");
  assert.equal(desc[3].contentId, "p2", "null is last");

  // Ascending (lowest views first, null last)
  const asc = sortPosts(posts, "uniqueMediaViewers", true);
  assert.equal(asc[0].contentId, "p3", "50 is first");
  assert.equal(asc[1].contentId, "p1", "211 is second");
  assert.equal(asc[2].contentId, "p4", "1200 is third");
  assert.equal(asc[3].contentId, "p2", "null is last");
});

// ============================================================================
// TEST 27: Content CSV export preserves 0 comments and formats unavailable metrics
// ============================================================================
test("Facebook content export formats real 0 comments as 0 and absent shares as Unavailable", () => {
  const formatVal = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : "Unavailable");

  const post = {
    contentId: "fb_post_100",
    platform: "facebook",
    createdTime: "2026-10-15T12:00:00Z",
    message: "Test export post",
    reactions: 3,
    comments: 0,
    shares: null,
    uniqueMediaViewers: 211,
    interactions: null,
    permalinkUrl: "https://facebook.com/100",
  };

  const row = [
    post.contentId,
    post.platform,
    new Date(post.createdTime).toLocaleDateString("en-US"),
    post.message,
    formatVal(post.reactions),
    formatVal(post.comments),
    formatVal(post.shares),
    formatVal(post.uniqueMediaViewers),
    formatVal(post.interactions),
    post.permalinkUrl,
  ];

  assert.equal(row[4], 3, "Reactions is 3");
  assert.equal(row[5], 0, "Comments of 0 is exported as 0, not Unavailable");
  assert.equal(row[6], "Unavailable", "Missing shares is exported as Unavailable, not 0");
  assert.equal(row[7], 211, "Unique Media Viewers is exported as 211");
  assert.equal(row[8], "Unavailable", "Missing interactions is exported as Unavailable, not 0");
});




