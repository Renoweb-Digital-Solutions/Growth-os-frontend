// ============================================================================
// Mock data for Reports page
// Report types, recent reports history, and preview data.
// ============================================================================

// TODO: replace with backend reporting API
// How: Fetch generated report list from /api/reports endpoint.

export const reportTypes = [
  "Overview",
  "Channel Performance",
  "Content Performance",
  "Audience",
  "Custom",
];

export const granularities = ["Daily", "Weekly", "Monthly", "Yearly"];

export const datePresets = [
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "Last Quarter", value: "last-quarter" },
  { label: "Year to Date", value: "ytd" },
  { label: "Custom", value: "custom" },
];

export const channels = [
  "Google Ads",
  "Meta / Instagram",
  "LinkedIn",
  "Organic Search",
  "Email",
];

// TODO: replace with backend /api/reports/history endpoint
export const recentReports = [
  {
    id: "r1",
    name: "Monthly Overview — June 2026",
    dateRange: "Jun 1 – Jun 30, 2026",
    type: "Overview",
    generatedDate: "Jul 1, 2026",
    fileSize: "2.4 MB",
    status: "Ready",
  },
  {
    id: "r2",
    name: "Q2 Channel Performance",
    dateRange: "Apr 1 – Jun 30, 2026",
    type: "Channel Performance",
    generatedDate: "Jul 3, 2026",
    fileSize: "3.8 MB",
    status: "Ready",
  },
  {
    id: "r3",
    name: "Content Performance — July W1",
    dateRange: "Jul 1 – Jul 7, 2026",
    type: "Content Performance",
    generatedDate: "Jul 8, 2026",
    fileSize: "1.1 MB",
    status: "Ready",
  },
  {
    id: "r4",
    name: "Audience Insights — Q2",
    dateRange: "Apr 1 – Jun 30, 2026",
    type: "Audience",
    generatedDate: "Jul 5, 2026",
    fileSize: "1.7 MB",
    status: "Ready",
  },
  {
    id: "r5",
    name: "Weekly Digest — Jul 14-20",
    dateRange: "Jul 14 – Jul 20, 2026",
    type: "Overview",
    generatedDate: "Processing",
    fileSize: "—",
    status: "Processing",
  },
];

// TODO: replace with backend /api/reports/preview endpoint
// How: Fetch report preview rows matching selected filters.
export const previewData = [
  { date: "Jul 20", channel: "Google Ads", reach: 14200, engagement: 890, clicks: 420, conversions: 38, spend: "$1,240" },
  { date: "Jul 19", channel: "Meta / Instagram", reach: 18500, engagement: 1450, clicks: 580, conversions: 52, spend: "$980" },
  { date: "Jul 18", channel: "LinkedIn", reach: 8400, engagement: 520, clicks: 210, conversions: 18, spend: "$620" },
  { date: "Jul 17", channel: "Organic Search", reach: 22100, engagement: 680, clicks: 890, conversions: 64, spend: "$0" },
  { date: "Jul 16", channel: "Email", reach: 6800, engagement: 1200, clicks: 340, conversions: 45, spend: "$120" },
  { date: "Jul 15", channel: "Google Ads", reach: 15800, engagement: 920, clicks: 460, conversions: 41, spend: "$1,180" },
  { date: "Jul 14", channel: "Meta / Instagram", reach: 17200, engagement: 1380, clicks: 540, conversions: 48, spend: "$1,020" },
  { date: "Jul 13", channel: "LinkedIn", reach: 7900, engagement: 480, clicks: 190, conversions: 15, spend: "$580" },
];
