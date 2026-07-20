// ============================================================================
// Mock Data for Growth OS Dashboard
// All data is hardcoded for demo purposes. Each export includes a TODO
// comment indicating which real API endpoint should replace it.
// ============================================================================

// TODO: replace with Google Analytics API call (GA4 Reporting API)
// How: Fetch monthly traffic & revenue data from GA4 property,
//      mapping to { month, organic, paid } shape.
export const forecastData = [
  { month: "Jan", organic: 4200, paid: 2800 },
  { month: "Feb", organic: 4800, paid: 3100 },
  { month: "Mar", organic: 5400, paid: 3600 },
  { month: "Apr", organic: 6100, paid: 4200 },
  { month: "May", organic: 7200, paid: 5100 },
  { month: "Jun", organic: 8800, paid: 6400 },
  { month: "Jul", organic: 10200, paid: 7800 },
  { month: "Aug", organic: 11500, paid: 8200 },
  { month: "Sep", organic: 12100, paid: 7600 },
  { month: "Oct", organic: 11800, paid: 6900 },
  { month: "Nov", organic: 13200, paid: 8100 },
  { month: "Dec", organic: 14800, paid: 9200 },
];

// TODO: replace with Meta Graph API + Google Ads API calls
// How: Aggregate lead-source data from Meta's Marketing API and
//      Google Ads Reporting API, normalizing into percentage shares.
export const leadSourceData = [
  {
    name: "Google Ads",
    percentage: 32.5,
    color: "#4285F4",
    icon: "google",
  },
  {
    name: "Meta / Instagram",
    percentage: 28.7,
    color: "#E1306C",
    icon: "meta",
  },
  {
    name: "LinkedIn",
    percentage: 18.4,
    color: "#0A66C2",
    icon: "linkedin",
  },
  {
    name: "Organic Search",
    percentage: 13.2,
    color: "#34A853",
    icon: "organic",
  },
  {
    name: "Email",
    percentage: 7.2,
    color: "#F59E0B",
    icon: "email",
  },
];

// TODO: replace with internal CRM webhook / activity stream API
// How: Fetch the latest N activity events from the backend activity
//      log endpoint, mapping into { id, avatar, name, action, time }.
export const activityFeedData = [
  {
    id: 1,
    avatar: "L",
    avatarColor: "#8B5CF6",
    name: "Lusi",
    action: 'Campaign "Summer Sale" launched',
    time: "2m ago",
  },
  {
    id: 2,
    avatar: "A",
    avatarColor: "#3B82F6",
    name: "Alex",
    action: "New lead from LinkedIn Ads",
    time: "15m ago",
  },
  {
    id: 3,
    avatar: "M",
    avatarColor: "#EC4899",
    name: "Maria",
    action: "Report generated for Client X",
    time: "1h ago",
  },
  {
    id: 4,
    avatar: "R",
    avatarColor: "#10B981",
    name: "Ravi",
    action: 'A/B test "Hero CTA v2" completed',
    time: "3h ago",
  },
];

// TODO: replace with CRM pipeline API (e.g. HubSpot Deals API)
// How: Fetch deal-stage aggregates from CRM, mapping each stage
//      to { stage, value, count }.
export const pipelineData = [
  { stage: "Awareness", value: "$879,422", count: 142 },
  { stage: "Consideration", value: "$2,984,500", count: 89 },
  { stage: "Conversion", value: "$684,888", count: 34 },
  { stage: "Retention", value: "$289,113", count: 21 },
];

// TODO: replace with composite data from multiple ad platform APIs
// How: Each campaign card maps to a live campaign object from
//      Meta, Google, or LinkedIn ad manager APIs.
export const campaignData = [
  {
    id: 1,
    icon: "📱",
    iconBg: "#EEF2FF",
    tags: ["Paid Social", "Retargeting"],
    name: "Summer Flash Sale",
    client: "Nexus Ventures",
  },
  {
    id: 2,
    icon: "🎯",
    iconBg: "#ECFDF5",
    tags: ["SEO", "Content"],
    name: "Q3 Brand Awareness",
    client: "Marvel Agency",
  },
  {
    id: 3,
    icon: "📊",
    iconBg: "#FEF2F2",
    tags: ["Google Ads", "PPC"],
    name: "Lead Gen Campaign",
    client: "Green Tech",
  },
  {
    id: 4,
    icon: "✉️",
    iconBg: "#FFFBEB",
    tags: ["Email", "Nurture"],
    name: "Re-engagement Drip",
    client: "Horizon Estates",
  },
];

// TODO: replace with composite health score from analytics aggregator
// How: Calculate a weighted score from multiple KPI sources
//      (conversion rate, ROAS, engagement) via the backend.
export const healthScoreData = {
  score: 87,
  trend: "+11%",
  trendUp: true,
  activeCampaigns: 6,
  sparkline: [65, 72, 68, 80, 75, 87],
};

// TODO: replace with analytics aggregate endpoint
// How: Fetch monthly KPI rollups from the backend reporting API.
export const performanceData = {
  monthlyGoal: 82,
  avgConversionRate: "$8,200",
  rating: 4.8,
};

// Export removed since it's now dynamically fetched from the JWT
