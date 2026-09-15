# Meta Settings Integration Plan — Read-Only Architectural Audit

This document provides a read-only technical audit and integration design for embedding live Meta / Facebook / Instagram integration capabilities into the GrowthOS Settings page (`components/dashboard/settings/IntegrationsTab.js`). It specifies component hierarchy, UI patterns, state models, OAuth flows, and security guidelines without modifying any application code.

---

## 1. Existing Settings Component Hierarchy

```
app/layout.js (Root Layout)
  └── RouteGuard.js (Protected Route Check)
        └── app/dashboard/layout.js (Nested Dashboard Layout with Sidebar)
              └── app/dashboard/settings/page.js (Settings Page Container)
                    ├── PageHeader.js ("Settings" Title & Subtitle)
                    └── SettingsTabs.js (Vertical Sub-Navigation Menu)
                          └── [Active Tab Component Container]
                                ├── ProfileForm.js (Profile Tab)
                                ├── BillingPlanTab.js (Billing Tab)
                                ├── PaymentMethodsTab.js (Payments Tab)
                                ├── TeamMembersTab.js (Team Tab)
                                ├── NotificationsTab.js (Notifications Tab)
                                ├── IntegrationsTab.js (Integrations Tab — Target Component)
                                └── SecurityTab.js (Security Tab)
```

---

## 2. Target Component for Meta Integration

- **Target File:** [`components/dashboard/settings/IntegrationsTab.js`](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/settings/IntegrationsTab.js)
- **Rationale:** `IntegrationsTab.js` is the dedicated place where third-party platforms (Google Analytics, Meta Business Suite, LinkedIn Ads, Slack, Zapier) are listed. 
- **Implementation Strategy:** Keep static mock cards for other platforms (Google Analytics, Slack, etc.) while enhancing the `Meta Business Suite` card to consume real backend status via `lib/metaApi.js`.

---

## 3. Existing UI Patterns to Reuse

1. **Card Container:**
   - Styling: `.dashboard-card p-6 md:p-8 max-w-4xl`
   - Border & Hover: `p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full`
2. **Icon & Header Row:**
   - Icon Box: `w-10 h-10 rounded-xl flex-shrink-0 shadow-sm bg-blue-600 flex items-center justify-center`
   - Title: `text-[14px] font-bold text-slate-900 mb-1`
   - Description: `text-[12.5px] text-slate-500 leading-snug`
3. **Action Buttons:**
   - Standard Button Class: `px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors`
   - Disconnected State: `bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm`
   - Connected State: `bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200`
4. **Badges & Pills:**
   - Status Pill: `px-2 py-0.5 rounded-full text-[10.5px] font-semibold`
   - Active Badge: `bg-emerald-50 text-emerald-700`
   - Pending / Warning Badge: `bg-amber-50 text-amber-700`
   - Inactive Badge: `bg-slate-100 text-slate-500`

---

## 4. Existing State, Loading & Error Patterns

- **Loading Indicator:** Buttons enter a `disabled` state with text updating to `"Connecting..."`, `"Disconnecting..."`, or `"Refreshing..."`.
- **Error Alerts:** Standard error callout matching `app/auth/page.js`:
  ```html
  <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium flex items-center justify-between">
    <span>{error}</span>
  </div>
  ```
- **Success Alerts:** Standard success callout:
  ```html
  <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-medium flex items-center justify-between">
    <span>{successMessage}</span>
  </div>
  ```

---

## 5. Exact `metaApi.js` Functions to Consume

| Function Name | Backend Route | Purpose | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `getMetaStatus()` | `GET /api/meta/status` | Fetches connection status and granted scopes | Component mount & after OAuth return |
| `connectMeta()` | `GET /api/meta/connect?format=json` | Retrieves OAuth URL with Bearer JWT | User clicks "Connect Meta" |
| `disconnectMeta()` | `DELETE /api/meta/disconnect` | Disconnects integration on backend | User clicks "Disconnect" & confirms |
| `getMetaAssets()` | `GET /api/meta/assets` | Fetches accessible Pages, IG, and Ad Accounts | Called automatically when `connected === true` |

---

## 6. Expected Backend Response Structures

### 1. `getMetaStatus()`
```json
{
  "connected": true,
  "status": "connected",
  "metaUserId": "10229876543210987",
  "grantedScopes": ["ads_read", "pages_show_list", "pages_read_engagement", "instagram_basic", "instagram_manage_insights"],
  "connectedAt": "2026-09-14T20:00:00.000Z",
  "updatedAt": "2026-09-14T20:00:00.000Z"
}
```

### 2. `connectMeta()`
```json
{
  "url": "https://www.facebook.com/v26.0/dialog/oauth?client_id=...&redirect_uri=...&state=..."
}
```

### 3. `disconnectMeta()`
```json
{
  "success": true,
  "message": "Meta account disconnected successfully"
}
```

### 4. `getMetaAssets()`
```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "pageId": "1001234567890",
        "name": "GrowthOS Official Page",
        "category": "Marketing Agency"
      }
    ],
    "instagramAccounts": [
      {
        "instagramAccountId": "17841400000000000",
        "username": "growthos_app",
        "followersCount": 14200
      }
    ],
    "adAccounts": [
      {
        "adAccountId": "act_10987654321",
        "name": "GrowthOS Primary Ad Account",
        "currency": "USD"
      }
    ],
    "capabilities": {
      "pagesAvailable": true,
      "instagramAvailable": true,
      "adsAvailable": true
    }
  }
}
```

---

## 7. Proposed Frontend State Model

```javascript
const [metaStatus, setMetaStatus] = useState({
  connected: false,
  status: "loading", // "loading" | "connected" | "disconnected" | "expired"
  metaUserId: null,
  grantedScopes: [],
});

const [assets, setAssets] = useState(null); // { pages: [], instagramAccounts: [], adAccounts: [], capabilities: {} }
const [isLoadingStatus, setIsLoadingStatus] = useState(true);
const [isLoadingAssets, setIsLoadingAssets] = useState(false);
const [isConnecting, setIsConnecting] = useState(false);
const [isDisconnecting, setIsDisconnecting] = useState(false);
const [error, setError] = useState(null);
const [successMessage, setSuccessMessage] = useState(null);
```

---

## 8. OAuth Redirect Flow

```
1. User clicks "Connect Meta" in IntegrationsTab.js
     ↓
2. Component sets isConnecting = true
     ↓
3. Calls connectMeta() -> GET /api/meta/connect?format=json (passes Bearer JWT)
     ↓
4. Backend returns { url: "https://www.facebook.com/v26.0/dialog/oauth?..." }
     ↓
5. Browser navigates: window.location.href = data.url
     ↓
6. User authorizes permissions on Facebook
     ↓
7. Meta redirects to Backend Callback: GET /api/meta/callback?code=...&state=...
     ↓
8. Backend exchanges code for long-lived token, saves to DB, and redirects to:
   ${FRONTEND_URL}/dashboard/settings?meta_status=success
```

---

## 9. Post-OAuth Status Refresh Strategy

- On mount, `IntegrationsTab.js` inspects URL search parameters via `window.location.search`.
- If `meta_status=success` is detected:
  1. Displays success alert: *"Meta Business Suite connected successfully."*
  2. Cleans up URL parameter using `window.history.replaceState({}, document.title, window.location.pathname)` to prevent alert re-triggering on page refresh.
  3. Executes `fetchStatusAndAssets()`.

---

## 10. Asset Display Strategy

When `connected === true`, the Meta Business Suite card expands to show an asset discovery summary:

- **Facebook Pages:** Displays total count & list of page names with `pagesAvailable` badge (`bg-emerald-50 text-emerald-700`).
- **Instagram Professional Accounts:** Displays connected username & follower count with `instagramAvailable` badge.
- **Ad Accounts:** Displays ad account name & currency code (`USD`) with `adsAvailable` badge.
- **Unavailable Assets:** If a capability is false (e.g. `adsAvailable: false`), renders an inline warning pill: `Unavailable (No Ad Account Found)`.

---

## 11. Disconnect Flow

1. User clicks `"Disconnect"` button on Meta card.
2. Component displays inline confirmation prompt: `"Disconnect Meta Business Suite?"` with `"Confirm Disconnect"` and `"Cancel"` buttons.
3. On confirm, component sets `isDisconnecting = true` and invokes `disconnectMeta()`.
4. On success:
   - Resets state: `connected: false`, `status: "disconnected"`, `assets: null`.
   - Displays success message: *"Meta integration disconnected."*

---

## 12. Security Considerations

- **No Client-Side Meta Tokens:** Meta access tokens are stored securely in backend MongoDB (`MetaIntegration` model). The frontend NEVER handles, requests, or stores Meta access tokens.
- **JWT Protection:** All calls to `/api/meta/*` rely on `apiClient.js` which automatically attaches `Authorization: Bearer <token>` from `localStorage.getItem("token")`.
- **Zero Direct Graph API Calls:** All requests pass through the backend API client wrapper (`lib/metaApi.js`).
- **Strict Environment Base URL:** All requests derive their endpoint from `process.env.NEXT_PUBLIC_API_BASE_URL`.

---

## 13. Exact Files to Modify (When Approved)

1. [`components/dashboard/settings/IntegrationsTab.js`](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/settings/IntegrationsTab.js) — Primary component to connect live Meta API state and asset rendering.

---

## 14. Discovered Ambiguities & Resolution

- **Backend Success Redirect Target:** Backend `metaController.js` redirects to `process.env.FRONTEND_URL` on callback completion. To ensure smooth post-OAuth status refresh, `FRONTEND_URL` in backend `.env` should be configured as `http://localhost:3000/dashboard/settings` (or the frontend origin).
