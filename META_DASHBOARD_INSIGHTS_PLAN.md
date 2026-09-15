# GrowthOS Dashboard Meta Insights Plan (Step 3A)

## 1. Dashboard Component Hierarchy
- **Home Dashboard** (`app/dashboard/page.js`)
  - `Header`
  - `ForecastChart`
  - `AIInsightCard`
  - `LeadSourceCard`
  - `ActivityFeed`
  - `PerformanceCard`
  - `HealthScoreCard`
  - `PipelineStrip`
  - `CampaignCards`
- **Analytics Dashboard** (`app/dashboard/analytics/page.js`)
  - `AnalyticsKPICard`
  - `TrendChart`
  - `ChannelDonut`
  - `WeeklyBarChart`
  - `TopContentTable`
  - `AudienceDemographics`
  - `FunnelChart`
- **Reports Dashboard** (`app/dashboard/reports/page.js`)
  - `ReportBuilder`
  - `ReportPreviewTable`
  - `RecentReportsTable`

## 2. Home Dashboard Metric/Widget Audit
| Widget | Current Source | Meta Feasibility / Category | Details |
| :--- | :--- | :--- | :--- |
| **Growth Forecast** | `forecastData` | D (Remain Mock) | App-level business KPI (overall organic vs paid traffic/revenue). |
| **AI Alert** | Static | D (Remain Mock) | Product-level notification. |
| **Lead Source** | `leadSourceData` | B (Transformation) | A composite metric. The Meta segment can be backed by `GET /api/meta/insights/ads` (`actions` where `action_type === 'lead'`). Overall split remains a mock/product feature. |
| **Activity Feed** | `activityFeedData` | D (Remain Mock) | CRM/Product level feed. |
| **Performance** | `performanceData` | D (Remain Mock) | App-level monthly goal. |
| **Growth Health** | `healthScoreData` | D (Remain Mock) | Composite app metric. |
| **Pipeline Funnel** | `pipelineData` | D (Remain Mock) | CRM deal stages. |
| **Active Campaign** | `campaignData` | A (Directly Supported) | Can be powered by `GET /api/meta/insights/campaigns`. Needs mapping of Meta fields (e.g., `name`, `status`, `budget.dailyBudgetFormatted`) to the card UI. |

## 3. Analytics Metric/Chart Audit
| Metric / Chart | Current Source | Category | Meta Backend Endpoint / Field | Supported / Unsupported |
| :--- | :--- | :--- | :--- | :--- |
| **Total Reach** | `kpiData` (Reach) | A (Directly Supported) | `GET /api/meta/insights/overview` -> `adsOverview.reach` (and Instagram `insights.name: impressions` if treated as reach). | Supported for Ads. |
| **Engagement Rate** | `kpiData` (Engagement Rate) | C (Unsupported / Requires fallback) | Do not calculate reach-based engagement unless both reach and engagement are present. Phase 3 API gives IG impressions and IG likes/comments, but FB doesn't provide reach in the current contract. | Proceed with caution / Partially Supported. |
| **New Followers** | `kpiData` (New Followers) | C (Not Currently Supported) | `GET /api/meta/insights/social` provides total `followersCount`, but not time-series "new" followers. | Unsupported for date ranges. |
| **Website Clicks** | `kpiData` (Website Clicks) | A (Directly Supported) | `GET /api/meta/insights/ads` -> `clicks`. | Supported for Ads. |
| **Conversion Rate** | `kpiData` (Conv. Rate) | B (Supported via calc) | `GET /api/meta/insights/ads` -> `actions[lead] / clicks`. | Supported for Ads. |
| **Growth Trends** | `dailyMetrics` | B (Supported via calc) | `GET /api/meta/insights/social` -> `values` array (time series). | Supported for social. |
| **Traffic Breakdown** | `channelBreakdown` | B (Transformation) | Meta Ads and Instagram shares can use overview data. | App composite, partially Meta. |
| **Top Content** | `topContent` | A (Directly Supported) | `GET /api/meta/insights/content`. | Supported. |
| **Audience Demographics**| `audienceAge` / `Gender` | C (Not Currently Supported) | Demographic endpoints are missing from Phase 3 contract. | Unsupported, remain mock. |
| **Conversion Funnel** | `funnelData` | D (Remain Mock) | App-level CRM funnel. | Remain mock. |

## 4. Reports Metric Audit
- **Report Type & Date Range**: UI provides selection.
- **Channel Selection**: Meta / Instagram and Meta Ads rows can be populated.
- **Reach/Impressions/Clicks/Spend**: Backed by `GET /api/meta/insights/overview` and `GET /api/meta/insights/ads`.
- **Engagement**: Backed by `GET /api/meta/insights/social` (likes/comments from content) and IG insights.
- **Conversions**: Backed by Ads `actions`.
- **Unsupported**: Cross-platform aggregation (Google Ads, LinkedIn) must remain mock.

## 5. Ads Audit
- **Source**: `GET /api/meta/insights/ads` and `GET /api/meta/insights/campaigns`.
- **Metrics**: 
  - `spend`, `impressions`, `reach`, `clicks`, `ctr`, `cpc`, `cpm` are fully supported by `insights/ads`.
  - Monetization values (`spend`, `cpc`, `cpm`) are pre-normalized by the backend (do not divide by 100 in the frontend).
  - For campaigns, use `budget.dailyBudgetFormatted` (pre-normalized).
- **Semantics**: Ads concepts map cleanly to UI elements (Campaign cards, CPC/CTR metrics in analytics/reports).

## 6. Existing Mock-Data Dependencies
- `app/dashboard/mockData.js`: Replace `campaignData` and integrate Meta portions of `leadSourceData`.
- `app/dashboard/analytics/mockAnalytics.js`: Replace parts of `kpiData`, `dailyMetrics` (for social), and `topContent`.
- `app/dashboard/reports/mockReports.js`: Inject Meta actuals into `previewData`.

## 7. Backend Endpoint Mapping
- **Overview KPIs**: `GET /api/meta/insights/overview`
- **Social KPIs (Followers, IG impressions)**: `GET /api/meta/insights/social`
- **Top Content Table**: `GET /api/meta/insights/content`
- **Ads KPIs (Spend, Clicks, CPC, CPM, CTR, Conversions)**: `GET /api/meta/insights/ads`
- **Active Campaigns Grid**: `GET /api/meta/insights/campaigns`

## 8. Exact Backend Response Fields
- **Ads**: `data.insights[0].spend`, `clicks`, `impressions`, `reach`, `cpc`, `ctr`, `cpm`, `actions` (filter by `action_type === 'lead'`).
- **Social**: `data.page.details.followersCount`, `data.instagram.insights` array.
- **Content**: `data[].metrics.likeCount`, `commentCount`, `fbPostInteractions`, `igMediaInteractions`.
- **Campaigns**: `data.campaigns[].name`, `status`, `budget.dailyBudgetFormatted`.

## 9. Supported Calculations
- **Ads Conversion Rate**: `(lead actions / clicks) * 100`.
- **Total Content Engagement**: Sum of `fbPostInteractions` and `igMediaInteractions`.

## 10. Unsupported Metrics
- **New Followers**: The API provides lifetime `followersCount`, but not new follows within the time range.
- **Demographics**: Age and gender insights are absent from the backend contract.
- **Reach-based FB Engagement Rate**: The backend does not expose FB Page reach in the contract.

## 11. Capability / Unavailable States
The backend returns a `capabilities` object (e.g., `social.available: true/false`, `code: REQUIREMENT_DISABLED | NOT_CONNECTED`).
- **UI Behavior**:
  - If `capabilities.ads.available === false`, render empty state / lock icon for Ads widgets (e.g., Campaign Cards).
  - Do not fallback to mock data when an account is disconnected or missing data. Show "No Data" or "Meta Disconnected".

## 12. Date-Range Mapping
- **Frontend Ranges**: Today (1D), 7D, 30D, 90D.
- **Mapping**: The backend accepts `since` and `until` as `YYYY-MM-DD` strings. The frontend must compute these dates locally (preferably aligned to the Ad Account's timezone, though simple JS `toISOString().split('T')[0]` will be used for the query).

## 13. Loading / Error Strategy
- **Loading**: Use React Suspense or simple loading skeleton states while `useEffect`/React Query fetches Meta data.
- **Error**: If the API returns 401 or `success: false`, catch the error and display a graceful "Failed to load Meta insights" message inside the specific widget instead of crashing the dashboard.

## 14. Meta API Functions to Consume
From `lib/metaApi.js`:
- `getMetaOverview(params)`
- `getMetaSocialInsights(params)`
- `getMetaContentInsights(params)`
- `getMetaAdsInsights(params)`
- `getMetaCampaignInsights(params)`

## 15. Recommended Implementation Order
1. **Shared State & Fetching**: Implement a custom hook (e.g., `useMetaInsights`) to fetch `getMetaOverview` based on selected date range.
2. **Overview Integration**: Update `AnalyticsKPICard` to render real data if the source is Meta, else mock.
3. **Ads & Campaigns Integration**: Wire `CampaignCards` to `getMetaCampaignInsights`.
4. **Content Integration**: Wire `TopContentTable` to `getMetaContentInsights`.
5. **Social Integration**: Wire `TrendChart` to `getMetaSocialInsights` time-series data.
6. **Loading/Error States**: Implement empty/disconnected states using the `capabilities` flag.
7. **Date Range Sync**: Connect the date range picker in Analytics to the API query params.

## 16. Exact Files that will need modification later
- `app/dashboard/page.js`
- `app/dashboard/analytics/page.js`
- `components/dashboard/CampaignCards.js`
- `components/dashboard/analytics/AnalyticsKPICard.js`
- `components/dashboard/analytics/TopContentTable.js`
- `components/dashboard/analytics/TrendChart.js`

## 17. Risks / Ambiguities
- **Engagement Rate Calculation**: Risk of calculating inaccurate rates since FB Reach is missing. We will avoid showing reach-based Engagement Rate for FB unless backend adds the metric.
- **Date Timezones**: Ad Account insights are returned in the ad account's native timezone. Frontend generating `YYYY-MM-DD` might have a slight offset if not localized to the ad account's timezone (which is provided in `overview.adsOverview.timezone`).

## 18. Clear Separation Between Meta-Backed and Non-Meta Product Metrics
- **Meta-Backed**: Meta Ad Clicks, Impressions, Spend, Active Meta Campaigns, FB/IG Post Interactions.
- **Product/Non-Meta**: Growth Health Score, Forecast, CRM Pipeline, Lead Source (overall), Overall KPI Goals.
- **Rule**: Never merge fake mock data with real Meta data in the same metric. Clearly delineate "Meta Ads Performance" from "App Platform Performance".
