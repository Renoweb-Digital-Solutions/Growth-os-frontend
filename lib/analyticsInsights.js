// Phase 4: Deterministic Analytics Intelligence Layer
// Generates actionable observations strictly from available Meta data.

function calculateTrend(current, previous) {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return { absolute: null, percentage: null, valid: false };
  }
  const absolute = current - previous;
  if (previous === 0) {
    return { absolute, percentage: null, valid: true };
  }
  const percentage = ((current - previous) / previous) * 100;
  return { absolute, percentage, valid: true };
}

function formatChange(changeObj, metricName) {
  if (!changeObj.valid) return null;
  const isCurrency = metricName.toLowerCase().includes("spend") || metricName.toLowerCase().includes("cpc") || metricName.toLowerCase().includes("cpm");
  
  if (changeObj.percentage !== null) {
    const dir = changeObj.percentage > 0 ? "increased" : changeObj.percentage < 0 ? "decreased" : "remained stable";
    if (dir === "remained stable") {
      return `${metricName} remained relatively stable compared with the previous period.`;
    }
    return `${metricName} ${dir} by ${Math.abs(changeObj.percentage).toFixed(1)}% compared with the previous period.`;
  }
  
  // Absolute only (previous was 0)
  const dir = changeObj.absolute > 0 ? "increased" : changeObj.absolute < 0 ? "decreased" : "remained stable";
  if (dir === "remained stable") {
     return `${metricName} remained relatively stable compared with the previous period.`;
  }
  return `${metricName} ${dir} compared with the previous period.`;
}

export function formatDurationMinutes(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  if (num <= 0) return "0m";

  const totalMinutes = Math.round(num);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0 && mins === 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

function parseStrictNumber(val) {
  if (val === null || val === undefined || val === "") return null;
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : null;
}

export function generatePerformanceObservations(overview, prevOverview, capabilities, ads = null) {
  const observations = [];
  if (!capabilities) return observations;

  // Ads observations
  if (capabilities.ads?.available) {
    const isAdsEmpty = ads && (!ads.data?.insights || ads.data.insights.length === 0);
    
    if (!isAdsEmpty) {
      const currentAds = overview?.data?.adsOverview || {};
      const prevAds = prevOverview?.data?.adsOverview || {};

      const metrics = [
        { key: "spend", label: "Spend", type: "ads" },
        { key: "impressions", label: "Impressions", type: "ads" },
        { key: "reach", label: "Reach", type: "ads" },
        { key: "clicks", label: "Clicks", type: "ads" },
        { key: "cpc", label: "CPC", type: "ads" },
        { key: "cpm", label: "CPM", type: "ads" },
        { key: "ctr", label: "CTR", type: "ads" }
      ];

      metrics.forEach(m => {
        const currentVal = parseStrictNumber(currentAds[m.key]);
        const prevVal = parseStrictNumber(prevAds[m.key]);

        if (currentVal !== null && prevVal !== null) {
           const trend = calculateTrend(currentVal, prevVal);
           const text = formatChange(trend, m.label);
           if (text) {
             observations.push({
               category: m.type,
               metric: m.label,
               description: text,
               trend: trend.percentage !== null ? trend.percentage : null
             });
           }
        }
      });
    }
  }

  // Social Observations (Facebook/IG)
  if (capabilities.social?.available || capabilities.instagram?.available) {
     const fbCurrentNum = parseStrictNumber(overview?.data?.socialOverview?.fanCount);
     const fbPrevNum = parseStrictNumber(prevOverview?.data?.socialOverview?.fanCount);
     
     if (fbCurrentNum !== null && fbPrevNum !== null) {
       const trend = calculateTrend(fbCurrentNum, fbPrevNum);
       const text = formatChange(trend, "Facebook Fan Count");
       if (text) observations.push({ category: "social", metric: "Fan Count", description: text, trend: trend.percentage });
     }

     const igCurrentNum = parseStrictNumber(overview?.data?.instagramOverview?.followersCount);
     const igPrevNum = parseStrictNumber(prevOverview?.data?.instagramOverview?.followersCount);
     
     if (igCurrentNum !== null && igPrevNum !== null) {
       const trend = calculateTrend(igCurrentNum, igPrevNum);
       const text = formatChange(trend, "Instagram Followers");
       if (text) observations.push({ category: "social", metric: "Followers", description: text, trend: trend.percentage });
     }
  }

  return observations;
}

export function generateContentObservations(contentData, capabilities) {
  const observations = [];
  if (!capabilities?.social?.available && !capabilities?.instagram?.available) return observations;
  
  // contentData is now the normalized array of posts, or an object containing the array if passed directly from hook
  const posts = Array.isArray(contentData) ? contentData : (contentData?.data || []);
  if (!posts || posts.length === 0) return observations;
  
  const getHighest = (metric) => {
    let highest = null;
    for (const post of posts) {
      if (post[metric] !== undefined && post[metric] !== null) {
        if (!highest || post[metric] > highest[metric]) {
          highest = post;
        }
      }
    }
    return highest;
  };

  const highEngagement = getHighest("engagement");
  if (highEngagement) {
    observations.push({
      category: "content",
      metric: "Engagement",
      description: `The post "${highEngagement.title || 'Untitled'}" received the highest engagement among the returned content.`
    });
  }

  const highReach = getHighest("reach");
  if (highReach) {
    observations.push({
      category: "content",
      metric: "Reach",
      description: `The post "${highReach.title || 'Untitled'}" generated the highest reach among the returned content.`
    });
  }

  const highImpressions = getHighest("impressions");
  if (highImpressions && highImpressions !== highReach) {
    observations.push({
      category: "content",
      metric: "Impressions",
      description: `The post "${highImpressions.title || 'Untitled'}" received the highest impressions among the returned content.`
    });
  }

  return observations;
}

export function generateCampaignObservations(campaignsData, capabilities) {
  const observations = [];
  if (!capabilities?.ads?.available) return observations;
  const campaigns = campaignsData?.data?.campaigns;
  if (!campaigns || campaigns.length === 0) return observations;

  const getExtremes = (metric, isHighest = true) => {
    let extreme = null;
    for (const c of campaigns) {
      if (c[metric] !== undefined && c[metric] !== null && Number.isFinite(Number(c[metric]))) {
        if (!extreme) {
           extreme = c;
        } else {
           const currentVal = Number(c[metric]);
           const extremeVal = Number(extreme[metric]);
           if (isHighest ? currentVal > extremeVal : currentVal < extremeVal) {
             extreme = c;
           }
        }
      }
    }
    return extreme;
  };

  const highSpend = getExtremes("spend", true);
  if (highSpend) {
    observations.push({
      category: "campaign",
      metric: "Spend",
      description: `Campaign "${highSpend.name || 'Unknown'}" had the highest spend among the returned campaigns.`
    });
  }

  const highReach = getExtremes("reach", true);
  if (highReach) {
    observations.push({
      category: "campaign",
      metric: "Reach",
      description: `Campaign "${highReach.name || 'Unknown'}" generated the highest reach among the returned campaigns.`
    });
  }

  const highCTR = getExtremes("ctr", true);
  if (highCTR) {
    observations.push({
      category: "campaign",
      metric: "CTR",
      description: `Campaign "${highCTR.name || 'Unknown'}" achieved the highest CTR among the returned campaigns.`
    });
  }

  const lowCPC = getExtremes("cpc", false);
  if (lowCPC && Number(lowCPC.cpc) > 0) { // Don't report 0 CPC as an extreme, likely an inactive campaign
    observations.push({
      category: "campaign",
      metric: "CPC",
      description: `Campaign "${lowCPC.name || 'Unknown'}" achieved the lowest CPC among the returned active campaigns.`
    });
  }

  return observations;
}

/**
 * Safely parses and normalizes conversion action types from Meta Ads `actions` payload
 * Prevents double counting and preserves unavailable/zero states without fabricating metrics.
 */
export function parseAdsConversionActions(actions) {
  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    return {
      value: null,
      typeLabel: null,
      leads: null,
      purchases: null,
      hasData: false,
    };
  }

  const findVal = (types) => {
    for (const t of types) {
      const match = actions.find((a) => a.action_type === t);
      if (match && match.value !== null && match.value !== undefined && Number.isFinite(parseFloat(match.value))) {
        return parseFloat(match.value);
      }
    }
    return null;
  };

  const leads = findVal(["lead", "onsite_conversion.lead_grouped", "leadgen.other", "offsite_conversion.fb_pixel_lead"]);
  const purchases = findVal(["omni_purchase", "purchase", "onsite_conversion.purchase", "offsite_conversion.fb_pixel_purchase"]);
  const registrations = findVal(["complete_registration", "omni_complete_registration", "offsite_conversion.fb_pixel_complete_registration"]);

  // Specific single conversion types
  if (leads !== null && purchases === null && registrations === null) {
    return {
      value: leads,
      typeLabel: "Leads",
      leads,
      purchases: null,
      hasData: true,
    };
  }

  if (purchases !== null && leads === null && registrations === null) {
    return {
      value: purchases,
      typeLabel: "Purchases",
      leads: null,
      purchases,
      hasData: true,
    };
  }

  // Aggregate non-overlapping distinct conversions if present
  if (leads !== null || purchases !== null || registrations !== null) {
    const total = (leads || 0) + (purchases || 0) + (registrations || 0);
    const labels = [];
    if (leads !== null && leads > 0) labels.push("Leads");
    if (purchases !== null && purchases > 0) labels.push("Purchases");
    if (registrations !== null && registrations > 0) labels.push("Registrations");
    return {
      value: total,
      typeLabel: labels.length === 1 ? labels[0] : "Conversions",
      leads,
      purchases,
      hasData: true,
    };
  }

  // Other explicit conversion action types
  const otherTypes = [
    { type: "contact", label: "Contacts" },
    { type: "schedule", label: "Appointments" },
    { type: "submit_application", label: "Applications" },
  ];
  for (const ot of otherTypes) {
    const val = findVal([ot.type]);
    if (val !== null) {
      return {
        value: val,
        typeLabel: ot.label,
        leads: null,
        purchases: null,
        hasData: true,
      };
    }
  }

  // Actions array had only non-conversion engagement/traffic items
  return {
    value: null,
    typeLabel: null,
    leads: null,
    purchases: null,
    hasData: true,
  };
}

/**
 * Evaluates time-series metric observations within [since, until] date bounds
 */
export function evaluateDailySeries(insightsArray, metricNames, since, until) {
  if (!insightsArray || !Array.isArray(insightsArray)) return [];
  const names = Array.isArray(metricNames) ? metricNames : [metricNames];
  const item = insightsArray.find((i) => names.includes(i.name));
  if (!item || !Array.isArray(item.values)) return [];

  const dateMap = {};
  item.values.forEach((v) => {
    const rawTime = v.endTime || v.end_time || v.timestamp || v.date;
    if (!rawTime) return;
    if (v.value === null || v.value === undefined || !Number.isFinite(Number(v.value))) return;

    try {
      const d = new Date(rawTime);
      const isoDate = d.toISOString().split("T")[0];
      if (since && isoDate < since) return;
      if (until && isoDate > until) return;

      dateMap[isoDate] = {
        dateKey: isoDate,
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
        value: Number(v.value),
        timestamp: d.getTime(),
      };
    } catch (e) {
      // Ignore unparseable timestamps
    }
  });

  return Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Evaluates summary status and total value for a metric
 */
export function evaluateMetricSummary(insightsArray, metricNames, since, until) {
  if (!insightsArray || !Array.isArray(insightsArray)) return { status: "UNAVAILABLE", value: null, series: [] };
  const names = Array.isArray(metricNames) ? metricNames : [metricNames];
  const item = insightsArray.find((i) => names.includes(i.name));
  if (!item) return { status: "UNAVAILABLE", value: null, series: [] };
  if (!Array.isArray(item.values) || item.values.length === 0) return { status: "NO_DATA", value: null, series: [] };

  const series = evaluateDailySeries(insightsArray, metricNames, since, until);
  if (series.length === 0) return { status: "NO_DATA", value: null, series: [] };

  const total = series.reduce((acc, s) => acc + s.value, 0);
  return { status: "VALUE", value: total, series, metricName: item.name };
}

/**
 * Maps timeSeries array from backend structured endpoint [{ date: "YYYY-MM-DD", value: 45 }]
 */
export function mapBackendTimeSeries(series) {
  if (!Array.isArray(series) || series.length === 0) return [];
  return series
    .filter((pt) => pt && pt.date)
    .map((pt) => {
      const d = new Date(pt.date);
      const validDate = !isNaN(d.getTime());
      return {
        dateKey: pt.date,
        dateLabel: validDate ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : pt.date,
        fullDate: validDate ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : pt.date,
        value: typeof pt.value === "number" ? pt.value : 0,
        timestamp: validDate ? d.getTime() : 0,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Evaluates whether fallback to raw Page Insights observations is eligible.
 * Fallback is only permitted if the page selection and requested date window match.
 */
export function checkFallbackEligibility({
  selectedPageId = null,
  socialPageId = null,
  targetSince = null,
  targetUntil = null,
  socialSince = null,
  socialUntil = null,
} = {}) {
  const isPageMatch =
    !selectedPageId ||
    !socialPageId ||
    String(selectedPageId) === String(socialPageId);

  const isDateWindowMatch =
    (!targetSince || !socialSince || targetSince === socialSince) &&
    (!targetUntil || !socialUntil || targetUntil === socialUntil);

  return isPageMatch && isDateWindowMatch;
}

/**
 * Resolves a primary performance metric with a verified fallback to raw Page Insights observations.
 * If the primary metric is AVAILABLE with a finite number (including valid 0), it is returned.
 * If the primary metric is EMPTY, and fallback is eligible and has matching observations, the fallback total is returned.
 * Preserves UNAVAILABLE, null, and valid 0 semantics without conflating them.
 */
export function resolveMetricWithFallback({
  perfMetric,
  insightsArray,
  metricNames,
  since,
  until,
  isFallbackEligible = true,
}) {
  if (
    perfMetric &&
    perfMetric.status === "AVAILABLE" &&
    perfMetric.total !== null &&
    perfMetric.total !== undefined &&
    Number.isFinite(Number(perfMetric.total))
  ) {
    return {
      status: "VALUE",
      value: perfMetric.total,
      series: mapBackendTimeSeries(perfMetric.timeSeries),
      metricName: perfMetric.metricName,
    };
  }

  if (isFallbackEligible) {
    const fallback = evaluateMetricSummary(insightsArray, metricNames, since, until);
    if (fallback.status === "VALUE") {
      return fallback;
    }
  }

  const status = perfMetric?.status === "EMPTY" ? "NO_DATA" : (perfMetric?.status || "UNAVAILABLE");
  return {
    status,
    value: null,
    series: perfMetric?.timeSeries ? mapBackendTimeSeries(perfMetric.timeSeries) : [],
    metricName: perfMetric?.metricName,
  };
}

