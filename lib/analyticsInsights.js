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

export function generatePerformanceObservations(overview, prevOverview, capabilities) {
  const observations = [];
  if (!capabilities) return observations;

  // Ads observations
  if (capabilities.ads?.available) {
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
      if (currentAds[m.key] !== undefined && currentAds[m.key] !== null) {
         const trend = calculateTrend(Number(currentAds[m.key]), prevAds[m.key] !== undefined && prevAds[m.key] !== null ? Number(prevAds[m.key]) : null);
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

  // Social Observations (Facebook/IG)
  if (capabilities.social?.available || capabilities.instagram?.available) {
     const currentFB = overview?.data?.socialOverview?.fanCount;
     const prevFB = prevOverview?.data?.socialOverview?.fanCount;
     
     if (currentFB !== undefined && currentFB !== null) {
       const trend = calculateTrend(Number(currentFB), prevFB !== undefined && prevFB !== null ? Number(prevFB) : null);
       const text = formatChange(trend, "Facebook Fan Count");
       if (text) observations.push({ category: "social", metric: "Fan Count", description: text, trend: trend.percentage });
     }

     const currentIG = overview?.data?.instagramOverview?.followersCount;
     const prevIG = prevOverview?.data?.instagramOverview?.followersCount;
     
     if (currentIG !== undefined && currentIG !== null) {
       const trend = calculateTrend(Number(currentIG), prevIG !== undefined && prevIG !== null ? Number(prevIG) : null);
       const text = formatChange(trend, "Instagram Followers");
       if (text) observations.push({ category: "social", metric: "Followers", description: text, trend: trend.percentage });
     }
  }

  return observations;
}

export function generateContentObservations(contentData, capabilities) {
  const observations = [];
  if (!capabilities?.social?.available && !capabilities?.instagram?.available) return observations;
  if (!contentData?.data?.posts || contentData.data.posts.length === 0) return observations;

  const posts = contentData.data.posts;
  
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

