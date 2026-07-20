// ============================================================================
// Mock data for Analytics page
// 90 days of daily metrics, channel breakdown, top content, audience
// demographics, and funnel data. All internally consistent.
// ============================================================================

// TODO: replace with Google Analytics Data API (GA4 runReport)
// How: Fetch daily metric rows from GA4 property, mapping to
//      { date, reach, engagement, clicks, followers, conversions } shape.

// Reason: Generate 90 days of realistic daily metrics with plausible trends.
// How: Uses a seeded loop with sine-wave + noise to produce realistic data.
function generateDailyMetrics() {
  const data = [];
  const startDate = new Date("2026-04-22");
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    // Base values with upward trend + weekly seasonality
    const trend = 1 + i * 0.005;
    const weekday = d.getDay();
    const weekdayFactor = weekday === 0 || weekday === 6 ? 0.7 : 1.0 + (weekday === 3 ? 0.15 : 0);
    const noise = () => 0.85 + Math.random() * 0.3;

    const reach = Math.round(12000 * trend * weekdayFactor * noise());
    const engagement = Math.round(reach * (0.04 + Math.random() * 0.03));
    const clicks = Math.round(reach * (0.015 + Math.random() * 0.01));
    const followers = Math.round(45 * trend * noise());
    const conversions = Math.round(clicks * (0.08 + Math.random() * 0.06));

    data.push({
      date: d.toISOString().split("T")[0],
      dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reach,
      engagement,
      clicks,
      followers,
      conversions,
    });
  }
  return data;
}

export const dailyMetrics = generateDailyMetrics();

// Aggregated KPI values (computed from last 30 days for display)
const last30 = dailyMetrics.slice(-30);
const sum = (arr, key) => arr.reduce((s, d) => s + d[key], 0);
const avg = (arr, key) => Math.round(sum(arr, key) / arr.length);

export const kpiData = [
  {
    label: "Total Reach",
    value: sum(last30, "reach").toLocaleString(),
    trend: "+12.4%",
    trendUp: true,
    sparkline: last30.map((d) => d.reach),
    color: "#6366F1",
  },
  {
    label: "Engagement Rate",
    value: ((sum(last30, "engagement") / sum(last30, "reach")) * 100).toFixed(1) + "%",
    trend: "+3.2%",
    trendUp: true,
    sparkline: last30.map((d) => d.engagement),
    color: "#EC4899",
  },
  {
    label: "New Followers",
    value: sum(last30, "followers").toLocaleString(),
    trend: "+8.7%",
    trendUp: true,
    sparkline: last30.map((d) => d.followers),
    color: "#10B981",
  },
  {
    label: "Website Clicks",
    value: sum(last30, "clicks").toLocaleString(),
    trend: "-2.1%",
    trendUp: false,
    sparkline: last30.map((d) => d.clicks),
    color: "#3B82F6",
  },
  {
    label: "Conversion Rate",
    value: ((sum(last30, "conversions") / sum(last30, "clicks")) * 100).toFixed(1) + "%",
    trend: "+5.6%",
    trendUp: true,
    sparkline: last30.map((d) => d.conversions),
    color: "#F59E0B",
  },
];

// TODO: replace with Meta Graph API + Google Ads API calls
export const channelBreakdown = [
  { name: "Instagram", value: 34, color: "#E1306C" },
  { name: "Meta Ads", value: 26, color: "#1877F2" },
  { name: "LinkedIn", value: 18, color: "#0A66C2" },
  { name: "Google Ads", value: 14, color: "#34A853" },
  { name: "Organic", value: 8, color: "#8B5CF6" },
];

// TODO: replace with content performance API
export const topContent = [
  { id: 1, title: "Summer Collection Launch BTS", platform: "Instagram", date: "Jul 15", reach: 45200, engRate: "6.8%", clicks: 1240 },
  { id: 2, title: "5 Tips for E-commerce Growth", platform: "LinkedIn", date: "Jul 12", reach: 38100, engRate: "5.2%", clicks: 980 },
  { id: 3, title: "Customer Spotlight: Nexus", platform: "Facebook", date: "Jul 10", reach: 32500, engRate: "4.5%", clicks: 850 },
  { id: 4, title: "Q2 Results Infographic", platform: "Instagram", date: "Jul 8", reach: 28900, engRate: "7.1%", clicks: 720 },
  { id: 5, title: "Product Demo — Dashboard", platform: "YouTube", date: "Jul 5", reach: 25400, engRate: "3.8%", clicks: 620 },
  { id: 6, title: "UTM Tagging Best Practices", platform: "TikTok", date: "Jul 3", reach: 22800, engRate: "8.4%", clicks: 540 },
  { id: 7, title: "Brand Story Video", platform: "YouTube", date: "Jun 28", reach: 19200, engRate: "4.1%", clicks: 480 },
  { id: 8, title: "Flash Sale Announcement", platform: "Facebook", date: "Jun 25", reach: 16500, engRate: "5.9%", clicks: 390 },
];

export const audienceAge = [
  { group: "18-24", percentage: 22 },
  { group: "25-34", percentage: 38 },
  { group: "35-44", percentage: 24 },
  { group: "45-54", percentage: 11 },
  { group: "55+", percentage: 5 },
];

export const audienceGender = [
  { name: "Male", value: 46, color: "#6366F1" },
  { name: "Female", value: 48, color: "#EC4899" },
  { name: "Other", value: 6, color: "#94A3B8" },
];

export const funnelData = [
  { stage: "Impressions", value: 482000 },
  { stage: "Clicks", value: 28500 },
  { stage: "Leads", value: 4200 },
  { stage: "Conversions", value: 1860 },
];

// TODO: replace with weekly analytics aggregate endpoint
export const weeklyComparison = [
  { week: "W1", posts: 12, engagement: 3400 },
  { week: "W2", posts: 15, engagement: 4200 },
  { week: "W3", posts: 10, engagement: 2800 },
  { week: "W4", posts: 18, engagement: 5100 },
  { week: "W5", posts: 14, engagement: 3900 },
  { week: "W6", posts: 16, engagement: 4600 },
  { week: "W7", posts: 20, engagement: 5800 },
  { week: "W8", posts: 17, engagement: 4900 },
];
