# Meta Reports Integration Plan (Step 3C)

## 1. Existing Reports Component Hierarchy
- `app/dashboard/reports/page.js` (Server/Client Entry)
  - `PageHeader`
  - `ReportBuilder` (Currently holds local state for dropdowns and handles CSV export)
  - `ReportPreviewTable` (Consumes mock data directly)
  - `RecentReportsTable` (Consumes mock data directly)

## 2. Existing Report-Builder Flow
The user selects parameters via dropdowns (Report Type, Granularity, Date Range, Channels) and clicks **Generate CSV** or **Generate PDF**. The CSV generation builds a Blob dynamically from `previewData` entirely on the client side. The PDF button is an inactive placeholder. Currently, the dropdown selections (other than Channels) do not dynamically filter the `previewData` preview rows.

## 3. Existing Report Types
1. **Overview**: Mock-driven. Best powered by aggregating `overview`, `ads`, and `social`.
2. **Channel Performance**: Mock-driven. Best powered by `ads` and `social`.
3. **Content Performance**: Mock-driven. Best powered by `content`.
4. **Audience**: Mock-driven. Unsafe to power (no demographic data in Phase 3 backend endpoints).
5. **Custom**: Mock-driven.

## 4. Existing Granularity Options
- **Daily, Weekly, Monthly, Yearly**
- **Backend Limitation / Risk**: The current Phase 3 `GET /api/meta/insights/ads` backend endpoint returns an aggregated summary for the entire requested `since` → `until` period (one row per account/campaign), not a daily time-series array. 
- **Strategy**: We CANNOT fabricate Daily/Weekly/Monthly breakdowns for Ads. If Meta is selected, we must output a single aggregated row for the entire date range, explicitly ignoring the granularity dropdown, or disabling granularity when the Meta channel is active.

## 5. Existing Date-Range Options
- **This Month, Last Month, Last Quarter, Year to Date, Custom**
- **Strategy**: We will map these logical presets to exact `since` and `until` boundaries calculated using the Ad Account's timezone, identical to the pattern used in Step 3B (fetching `overview` first to determine timezone).

## 6. Existing Channel Selectors
- **Google Ads, Meta / Instagram, LinkedIn, Organic Search, Email**
- **Strategy**: 
  - The "Meta / Instagram" channel row will be completely hijacked and populated with REAL data from the backend.
  - The other channels (Google, LinkedIn, etc.) will remain populated by `mockReports.js` data to preserve the product UI layout.
  - **Distinction**: We must visually distinguish the real Meta row in the preview table (e.g., adding a "Live Data" badge) so it is not confused with the mock rows.

## 7. Existing Preview Table Structure & Mappings
Columns: Date, Channel, Reach, Engagement, Clicks, Conversions, Spend.
**Backend to Frontend Mapping**:
- **Date**: The aggregated date range (e.g., "Aug 1 - Aug 31") because daily granularity is unsupported.
- **Channel**: "Meta / Instagram"
- **Reach**: `overview.data.adsOverview.reach`
- **Engagement**: Meta Ads does not have a direct "Engagement" metric in this payload. We must mark this as "Unavailable", or map it to `social` Page Views if acceptable, but semantic mismatch must be noted.
- **Clicks**: `ads.data.insights[0].clicks`
- **Conversions**: `ads.data.insights[0].actions` filtered by `action_type === 'lead'`
- **Spend**: `ads.data.insights[0].spend` (formatted as Currency)

## 8. Existing CSV Export Implementation
- Reads directly from `previewData` in memory.
- **Strategy**: We will update the export function to read from a new derived state array that merges the mock channel rows with the newly fetched, real Meta row. Formatting logic must safely handle "Unavailable" strings.

## 9. Existing PDF Implementation
- Placeholder button.
- **Strategy**: Do not modify. Leave as placeholder.

## 10. Existing Mock-Data Sources
- `app/dashboard/reports/mockReports.js`
- **Strategy**: We will retain the mock data for non-Meta channels and `recentReports`. We will intercept the rendering of the "Meta / Instagram" channel in `previewData` and replace it entirely with backend data.

## 11. Exact Meta Endpoints to Consume
We will use the `lib/metaApi.js` wrappers:
- `getMetaOverview(dateRange)`: To get the timezone and aggregated Reach.
- `getMetaAdsInsights(dateRange)`: To get Spend, Clicks, and Lead Conversions.

## 12. Capability & Unavailable State Strategy
- If `capabilities.ads.available === false`, the Meta row in the table and CSV will display `"Disconnected"` or `"Unavailable"` for all metrics.
- Missing insight rows or empty arrays will yield `"Unavailable"`.
- We will strictly follow the empty vs. zero rules established in Step 3B.

## 13. Proposed Frontend State Model
- **Lift State Up**: Move the filter state (`reportType`, `datePreset`, `selectedChannels`) out of `ReportBuilder.js` and into `app/dashboard/reports/page.js`.
- Create a `useMetaReports(filters)` hook to handle the fetching and data formatting logic.
- Pass the merged data (mock channels + real Meta channel) down to `ReportPreviewTable` and `ReportBuilder`.

## 14. Files that Need Modification
- `app/dashboard/reports/page.js` (Lift state, fetch data, coordinate components)
- `components/dashboard/reports/ReportBuilder.js` (Accept props for filters and custom `onExport` function)
- `components/dashboard/reports/ReportPreviewTable.js` (Accept `data` prop instead of hardcoded mock array, add "Live Data" visual distinction for Meta)

## 15. Files that Must Remain Untouched
- `components/dashboard/reports/RecentReportsTable.js` (Keep as mock history)
- `app/dashboard/reports/mockReports.js` (Keep config and mock arrays intact)
- `lib/apiClient.js`, `lib/metaApi.js`

## 16. Risks & Ambiguities
- **Granularity Mismatch**: The backend does not support dynamic granularity (Daily/Weekly) for Ads in a single request without making N requests. We will fall back to aggregating the entire date range into a single row.
- **Engagement Metric**: Ads endpoints don't provide a universal "Engagement" stat. We will set Engagement to "Unavailable" for Meta to avoid fabricating a number, unless directed to use `social` interactions.

## 17. Recommended Implementation Sequence
1. Create `hooks/useMetaReports.js` to handle timezone-safe date generation, API fetching, capability checking, and mapping to the exact 7-column table structure.
2. Refactor `app/dashboard/reports/page.js` to own the filter state and merge the hook's real Meta row with the mock rows from `mockReports.js`.
3. Update `ReportBuilder.js` to be a controlled component (receiving filter state via props) and accept a dynamic `data` array for CSV export.
4. Update `ReportPreviewTable.js` to render the dynamic `data` array and highlight the real Meta row.
