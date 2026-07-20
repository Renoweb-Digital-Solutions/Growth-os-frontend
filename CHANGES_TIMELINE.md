# Frontend Changes Timeline

## [2026-07-20] Tickets, Book a Call & Settings Pages
- **Overview**: Built 3 new dashboard pages (Tickets, Book a Call, Settings) with fully responsive layouts, complex multi-panel UI, and comprehensive mock data.
- **Data Flow**:
  - **Tickets**: `mockTickets.js` → `page.js` distributes to `TicketList`, `TicketThread`, and `TicketDetailsPanel`. Supports filtering and active ticket selection.
  - **Book a Call**: `mockCalls.js` → `page.js`. Shows `CallOptionCard`s, `UpcomingCallsList` (with history), and a `TimeSlotPicker` modal overlay using simple React state.
  - **Settings**: `mockSettings.js` → `page.js`. Implements a vertical sub-nav (`SettingsTabs`) that switches between 7 tab components (`ProfileForm`, `BillingPlanTab`, `PaymentMethodsTab`, `TeamMembersTab`, `NotificationsTab`, `IntegrationsTab`, `SecurityTab`).
- **Technical Details**:
  - Modals (Time Slot Picker, Add Payment Method, Invite Member) built using native React state and CSS overlays without external dependencies.
  - All pages reuse the `PageHeader` component and integrate seamlessly into the shared `dashboard/layout.js`.

## [2026-07-20] Work Status, Analytics & Reports Pages
- **Overview**: Built 3 new dashboard pages (Work Status Kanban, Analytics charts, Reports builder) plus architectural refactor to share Sidebar via `app/dashboard/layout.js`.
- **Data Flow**:
  - `app/dashboard/layout.js`: Shared layout wrapping all `/dashboard/*` routes with Sidebar. Each page renders into `{children}`.
  - `components/dashboard/PageHeader.js`: Generic header reused by all 3 pages (title, subtitle, action slot).
  - **Work Status**: `work-status/mockPosts.js` → `KanbanBoard.js` (manages DnD state via @dnd-kit) → `KanbanColumn.js` (droppable zones) → `PostCard.js` (draggable cards).
  - **Analytics**: `analytics/mockAnalytics.js` (90 days generated data) → page distributes to `AnalyticsKPICard`, `TrendChart`, `ChannelDonut`, `WeeklyBarChart`, `TopContentTable`, `AudienceDemographics`, `FunnelChart`.
  - **Reports**: `reports/mockReports.js` → `ReportBuilder.js` (functional CSV download via Blob API), `ReportPreviewTable.js`, `RecentReportsTable.js`.
- **Technical Details**:
  - Added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for Kanban drag-and-drop.
  - Refactored `app/dashboard/page.js` to remove Sidebar wrapper (now in layout).
  - All charts use Recharts (AreaChart, PieChart, BarChart).
  - CSV generation is fully functional — uses JS Blob download.
  - All mock data files have `// TODO: replace with [API]` comments.

## [2026-07-20] Full Dashboard Build — Growth OS Analytics Dashboard
- **Overview**: Built the complete Growth OS marketing analytics dashboard with 10 widget components, responsive sidebar navigation, header with search/filters, and mock data layer ready for API integration.
- **Data Flow**:
  - `app/dashboard/mockData.js`: Centralized mock data store. All dashboard components read from this file. Each export is commented with the future API endpoint (`// TODO: replace with [API] call`).
  - `app/dashboard/page.js`: Assembles all widget components into a responsive 12-column CSS Grid layout. No inter-component data passing — each component independently imports from `mockData.js`.
  - `components/dashboard/Sidebar.js`: Self-contained navigation. Reads `usePathname()` for active state highlighting. Manages its own `mobileOpen` state for hamburger overlay.
  - `components/dashboard/Header.js`: Reads `userProfile` from `mockData.js` for greeting and avatar. Filter dropdowns are local state (not yet connected).
  - `components/dashboard/ForecastChart.js`: Reads `forecastData` from `mockData.js`. Renders Recharts AreaChart with custom tooltip.
  - `components/dashboard/AIInsightCard.js`: Static content, no data dependencies.
  - `components/dashboard/HealthScoreCard.js`: Reads `healthScoreData` from `mockData.js`. Renders Recharts BarChart sparkline.
  - `components/dashboard/LeadSourceCard.js`: Reads `leadSourceData` from `mockData.js`.
  - `components/dashboard/ActivityFeed.js`: Reads `activityFeedData` from `mockData.js`.
  - `components/dashboard/PerformanceCard.js`: Reads `performanceData` from `mockData.js`.
  - `components/dashboard/PipelineStrip.js`: Reads `pipelineData` from `mockData.js`.
  - `components/dashboard/CampaignCards.js`: Reads `campaignData` from `mockData.js`.
- **Technical Details**:
  - Added `recharts` dependency for chart rendering (AreaChart, BarChart).
  - Added Inter font via `next/font/google` in root layout.
  - Dashboard-specific CSS classes in `globals.css`: `.dashboard-card`, `.ai-gradient-card`, `.scrollbar-hide`, fade-in animation.
  - Sidebar is responsive: full sidebar on desktop, hamburger overlay on mobile.
  - All components follow `AI_GUIDELINES.md` with Reason/How comments and data flow annotations.


## [2026-07-16] OTP-Based Forgot Password Flow
- **Overview**: Added a 3-step password reset UI directly into the authentication page without requiring new routes.
- **Data Flow**:
  - `app/auth/page.js`: Now manages `forgotPasswordStep` state (`email` -> `otp` -> `new-password` -> `success`).
  - Fetches from `/api/auth/forgot-password`, `/verify-otp`, and `/reset-password` sequentially.
  - Temporary reset token is held in local state `resetToken` during the flow.
- **Technical Details**:
  - Reused `AuthInput` components for a cohesive aesthetic.
  - Animated UI transitions in `AuthSplitLayout` remain active during the flow.

## [2026-07-16] Unified Authentication Flow
- **Overview**: Unified the separated Sign In and Sign Up flows into a single `/auth` route utilizing an interactive tab system.
- **Data Flow**:
  - `app/auth/page.js`: Central state machine for authentication. Manages `activeTab` (Sign In vs Sign Up) and `authMethod` (Email vs Invite Code). Submits to backend depending on state.
  - `app/page.js`: "Get Started" links now point dynamically to `/auth`.
- **Technical Details**:
  - Maintained the premium `AuthSplitLayout` for both Sign In and Sign Up.
  - Added a toggle for "Coded Sign In" within the Sign In tab.
  - Removed old `/login` directory.

## [2026-07-16] Authentication & Onboarding Redesign
- **Overview**: Implemented separate, modern SaaS auth screens and preserved the existing onboarding flow.
- **Data Flow**:
  - `app/login/page.js`: (Deprecated) Managed local `formData`, submitted via fetch API to backend.
  - `components/auth/AuthSplitLayout.js`: Pure presentational layout component handling responsive split screens.
  - `components/auth/AuthInput.js`: Reusable input component handling its own local `showPassword` state.
- **Technical Details**:
  - Styled with custom CSS variables in `globals.css` for gradients.
  - Added strict documentation standards per `AI_GUIDELINES.md`.
