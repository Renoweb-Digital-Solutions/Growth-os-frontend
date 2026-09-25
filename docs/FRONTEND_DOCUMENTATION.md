# GrowthOS Frontend — Comprehensive Technical Documentation

## 1. Executive Summary

The **GrowthOS Frontend** is a modern SaaS web application built with **Next.js 16 (App Router)** and **React 19**, styled using **Tailwind CSS v4** and styled custom CSS utilities in `app/globals.css`. It serves as a client-facing marketing ROI and work-status dashboard designed for agencies (B2B) and clients (B2C).

Currently, the repository contains a fully built, highly responsive user interface with multi-step auth, dynamic onboarding, 7 dashboard pages, drag-and-drop Kanban workflow tracking, analytics visualizations via Recharts, client support ticketing, and CSV report generation. 

However, except for the **Authentication (`/api/auth/*`)** and **Onboarding (`/api/users/*`)** endpoints which are wired to a local Node.js backend server (`http://localhost:7007`), the entire **Dashboard** domain (analytics, campaigns, leads, tickets, posts, settings, reports) relies on **local static mock data files**. No Meta/Facebook/Instagram Graph API integration is active on the frontend yet; Meta metrics are represented solely via hardcoded string titles and mock data objects.

---

## 2. Repository Structure

Below is the complete repository tree for the GrowthOS frontend application:

```
Growth-OS-Frontend/
├── .gitignore                          # Git ignore configuration
├── AGENTS.md                           # Agent directives & Next.js 16 breaking change warning
├── AI_GUIDELINES.md                    # Developer and AI quality & documentation guidelines
├── CHANGES_TIMELINE.md                 # Historical log of implementations & updates
├── CLAUDE.md                           # Local IDE marker file
├── README.md                           # Project introduction & high-level architecture diagrams
├── eslint.config.mjs                   # ESLint flat config extending next/core-web-vitals
├── jsconfig.json                       # JavaScript path alias definitions (@/* -> ./*)
├── next.config.mjs                     # Next.js 16 configuration file
├── package-lock.json                   # NPM lockfile specifying exact package trees
├── package.json                        # Node project manifest (dependencies & scripts)
├── postcss.config.mjs                  # PostCSS configuration importing @tailwindcss/postcss
├── app/                                # Next.js 16 App Router directory
│   ├── globals.css                     # Global styles, Tailwind v4 theme, custom gradients & keyframes
│   ├── layout.js                       # Root layout providing Google Inter font & wrapping RouteGuard
│   ├── page.js                         # Landing page ("Welcome to GrowthOS")
│   ├── auth/
│   │   └── page.js                     # Centralized multi-tab auth page (Login, Register, OTP Reset)
│   ├── onboarding/
│   │   └── page.js                     # Onboarding page wrapper rendering OnboardingWizard
│   └── dashboard/
│       ├── layout.js                   # Nested layout wrapping all dashboard pages with Sidebar
│       ├── mockData.js                 # Central mock data store for main dashboard home widgets
│       ├── page.js                     # Main Dashboard Home (12-column widget grid)
│       ├── analytics/
│       │   ├── mockAnalytics.js        # 90-day daily metrics generator & aggregated KPI mock data
│       │   └── page.js                 # Analytics Deep-Dive page with KPI cards & Recharts
│       ├── book-call/
│       │   ├── mockCalls.js            # Mock data for upcoming calls & call history
│       │   └── page.js                 # Book a Call page (Priority Call & TimeSlotPicker modal)
│       ├── reports/
│       │   ├── mockReports.js          # Mock data for report types, preview rows, and history
│       │   └── page.js                 # Reports Builder & Downloader page (Blob CSV generator)
│       ├── settings/
│       │   ├── mockSettings.js         # Mock data for profile, team, billing, payment, integrations
│       │   └── page.js                 # 7-tab Settings page (Profile, Team, Billing, Security, etc.)
│       ├── tickets/
│       │   ├── mockTickets.js          # Mock data for client support tickets, chats, and agents
│       │   └── page.js                 # 3-panel Support Ticket management interface
│       └── work-status/
│           ├── mockPosts.js            # Mock data for social posts & Kanban columns
│           └── page.js                 # Work Status Kanban board page using @dnd-kit
├── components/                         # Modular React components grouped by feature
│   ├── auth/
│   │   ├── AuthInput.js                # Reusable form input with dynamic password visibility toggle
│   │   ├── AuthSplitLayout.js          # Split screen presentational layout with testimonial marquee
│   │   └── RouteGuard.js               # Client-side authentication & route protection guard
│   ├── onboarding/
│   │   ├── OnboardingWizard.js         # 5-step dynamic onboarding state machine (B2B vs B2C, Palette)
│   │   └── SelfServeWizard.js          # (Unused/Legacy) Alternative 3-step B2B setup wizard
│   └── dashboard/                      # Dashboard UI components & widgets
│       ├── ActivityFeed.js             # Live activity feed card widget
│       ├── AIInsightCard.js            # Gradient AI Alert & recommendation card widget
│       ├── CampaignCards.js            # 4-column active marketing campaign cards widget
│       ├── ForecastChart.js            # 12-month Recharts AreaChart (Organic vs Paid growth) widget
│       ├── Header.js                   # Top navigation bar with greeting, search, & filter pills
│       ├── HealthScoreCard.js          # Health score card widget with sparkline bar chart
│       ├── LeadSourceCard.js           # Lead source breakdown widget with channel progress bars
│       ├── PageHeader.js               # Shared title/subtitle header component for inner subpages
│       ├── PerformanceCard.js          # Monthly goal progress & KPI overview card widget
│       ├── PipelineStrip.js            # Deal pipeline stage horizontal funnel strip widget
│       ├── Sidebar.js                  # Persistent responsive sidebar (Desktop fixed / Mobile overlay)
│       ├── analytics/                  # Analytics subpage widgets
│       │   ├── AnalyticsKPICard.js     # Individual metric card with trend badge & sparkline
│       │   ├── AudienceDemographics.js # Age bar chart & gender breakdown chart
│       │   ├── ChannelDonut.js         # Recharts Donut chart for traffic channels
│       │   ├── FunnelChart.js          # Conversion funnel step breakdown widget
│       │   ├── TopContentTable.js      # Table listing top performing content items
│       │   ├── TrendChart.js           # Interactive multi-metric daily area chart
│       │   └── WeeklyBarChart.js       # Recharts weekly comparison bar chart
│       ├── book-call/                  # Book-a-Call subpage widgets
│       │   ├── CallOptionCard.js       # Card for selecting call options (Priority vs Scheduled)
│       │   ├── TimeSlotPicker.js       # Modal dialog overlay for picking calendar time slots
│       │   └── UpcomingCallsList.js    # List of scheduled upcoming calls & historical logs
│       ├── reports/                    # Reports subpage widgets
│       │   ├── RecentReportsTable.js   # Table showing historical generated reports
│       │   ├── ReportBuilder.js        # Filter form with functional JS Blob CSV download
│       │   └── ReportPreviewTable.js   # Live preview table of filtered report data
│       ├── settings/                   # Settings subpage tab components
│       │   ├── BillingPlanTab.js       # Current subscription tier & plan upgrade options
│       │   ├── IntegrationsTab.js      # Third-party integration cards (Meta, GA4, LinkedIn, Slack)
│       │   ├── NotificationsTab.js     # Email & push notification preference toggles
│       │   ├── PaymentMethodsTab.js    # Saved credit card list & Add Payment modal
│       │   ├── ProfileForm.js          # User personal info update form
│       │   ├── SecurityTab.js          # Password change & active sessions list
│       │   ├── SettingsTabs.js         # Vertical tab navigation sub-menu
│       │   └── TeamMembersTab.js       # Team member list & Invite Member modal
│       ├── tickets/                    # Ticket management widgets
│       │   ├── TicketDetailsPanel.js   # Right panel showing ticket metadata & assignee
│       │   ├── TicketList.js           # Left panel showing list of tickets with search & status tabs
│       │   └── TicketThread.js         # Middle panel showing message thread & reply box
│       └── work-status/                # Kanban subpage widgets
│           ├── KanbanBoard.js          # @dnd-kit Drag-and-drop container managing columns & posts
│           ├── KanbanColumn.js         # Sortable droppable column container
│           └── PostCard.js             # Draggable post card component
└── public/                             # Static assets
    ├── file.svg
    ├── globe.svg
    ├── next.svg
    ├── vercel.svg
    └── window.svg
```

---

## 3. Technology Stack

| Category | Technology | Version | Purpose & Usage in Codebase |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `16.2.10` | App Router frontend framework (`app/` directory). |
| **Language** | JavaScript (ES6+) | Modern JS | Primary codebase language; uses React JSX (`.js` files). |
| **UI Core** | React / React DOM | `19.2.4` | React 19 core library. |
| **Styling Solution** | Tailwind CSS | `^4.0.0` | Utility-first styling via `@tailwindcss/postcss`. |
| **Icons** | Lucide React | `^1.24.0` | SVG icons used across navigation, buttons, and metrics. |
| **Charts / Viz** | Recharts | `^3.9.2` | Area, Bar, Donut, Funnel, and Sparkline charts. |
| **Animations** | Framer Motion | `^12.42.2` | Page transitions, tab switching, and testimonial carousels. |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | `^6.3.1`, `^10.0.0`, `^3.2.2` | Interactive Kanban drag-and-drop in Work Status page. |
| **HTTP Client** | Native `fetch` API | Built-in | Used in `auth/page.js` and `onboarding/OnboardingWizard.js`. |
| **HTTP Client (Unused)** | Axios | `^1.18.1` | Installed in `package.json` but currently unused in source code. |
| **Linting** | ESLint / eslint-config-next | `^9.0.0`, `16.2.10` | Code style & Next.js core web vitals check (`npm run lint`). |
| **Package Manager** | npm | Standard | Node package manager (`package-lock.json` present). |

---

## 4. Application Architecture

The application adopts a **Feature-Based Architecture** organized within the Next.js 16 `app/` directory, backed by a modular `components/` directory.

### High-Level Request & Rendering Flow

```
Browser
  ↓
[RootLayout] (app/layout.js) - Applies Inter Font & Global CSS
  ↓
[RouteGuard] (components/auth/RouteGuard.js) - Checks localStorage "token"
  ├── If Unauthenticated on Protected Route -> Redirects to /auth
  └── If Authenticated on Auth Route -> Redirects to /dashboard
  ↓
[Router / Page Component]
  ├── /auth -> AuthPage (app/auth/page.js)
  ├── /onboarding -> OnboardingWizard (app/onboarding/page.js)
  └── /dashboard/* -> DashboardLayout (app/dashboard/layout.js)
        ↓
      [Sidebar] (components/dashboard/Sidebar.js)
        ↓
      {children} Page Content
        ├── /dashboard -> Home Grid (Forecast, AI, Leads, Activity, Health, Pipeline, Campaigns)
        ├── /dashboard/work-status -> KanbanBoard (@dnd-kit)
        ├── /dashboard/analytics -> AnalyticsKPICard, TrendChart, ChannelDonut, etc.
        ├── /dashboard/reports -> ReportBuilder, ReportPreviewTable, RecentReportsTable
        ├── /dashboard/tickets -> 3-Panel Ticket Manager (TicketList, Thread, Details)
        ├── /dashboard/book-call -> Priority Call & TimeSlotPicker Modal
        └── /dashboard/settings -> 7-Tab Settings Sub-navigation
```

### Key Architectural Characteristics
- **Client-Side Rendering (CSR):** All interactive pages use `"use client"` directives due to active state management, browser `localStorage` checks, and chart rendering.
- **Route Guard Protection:** Authentication state is governed centrally by `RouteGuard.js` wrapped around `{children}` in `app/layout.js`.
- **Nested Dashboard Layout:** `app/dashboard/layout.js` automatically wraps all sub-routes with the persistent `Sidebar.js`, maintaining seamless navigation.

---

## 5. Application Entry Point

1. **`app/layout.js` (Root Layout):**
   - Loads Google Fonts (`Geist`, `Geist_Mono`, `Inter`).
   - Imports `app/globals.css`.
   - Renders `<html>` and `<body>` with background `#F8F9FB`.
   - Wraps all rendered pages inside `<RouteGuard>`.

2. **`app/page.js` (Home Landing Page):**
   - Displays a public welcome screen with a gradient title ("Welcome to GrowthOS") and a "Get Started" button linking to `/auth`.

---

## 6. Routing Architecture

Routing is powered by Next.js 16 file-based routing within `app/`.

```
/                       -> app/page.js (Public Landing Page)
/auth                   -> app/auth/page.js (Public Auth: Login, Register, Forgot Password)
/onboarding             -> app/onboarding/page.js (Protected Multi-Step Setup Wizard)
/dashboard              -> app/dashboard/page.js (Protected Main Dashboard)
/dashboard/work-status  -> app/dashboard/work-status/page.js (Protected Kanban Board)
/dashboard/analytics    -> app/dashboard/analytics/page.js (Protected Growth Analytics)
/dashboard/reports      -> app/dashboard/reports/page.js (Protected Report Generator)
/dashboard/tickets      -> app/dashboard/tickets/page.js (Protected Client Support Tickets)
/dashboard/book-call    -> app/dashboard/book-call/page.js (Protected Call Scheduling)
/dashboard/settings     -> app/dashboard/settings/page.js (Protected Account & Team Settings)
```

---

## 7. Complete Route / Page Inventory

| Route | Page Component | Protected? | Purpose | Main Components | API Calls | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `app/page.js` | Public | Public landing page introducing GrowthOS. | `Link`, `Activity`, `ArrowRight` | None | COMPLETE |
| `/auth` | `app/auth/page.js` | Public | Auth portal (Sign In, Sign Up, Coded Invite, 3-Step OTP Reset). | `AuthSplitLayout`, `AuthInput` | `POST /api/auth/login`<br>`POST /api/auth/register`<br>`POST /api/auth/forgot-password`<br>`POST /api/auth/verify-otp`<br>`POST /api/auth/reset-password` | COMPLETE (Connected to Local Backend) |
| `/onboarding` | `app/onboarding/page.js` | Protected | 5-step onboarding wizard (Business model, company info, brand palette, pricing tier). | `OnboardingWizard` | `GET /api/users/me`<br>`PUT /api/users/onboarding` | COMPLETE (Connected to Local Backend) |
| `/dashboard` | `app/dashboard/page.js` | Protected | Main marketing ROI analytics overview dashboard. | `Header`, `ForecastChart`, `AIInsightCard`, `LeadSourceCard`, `ActivityFeed`, `PerformanceCard`, `HealthScoreCard`, `PipelineStrip`, `CampaignCards` | Reads `app/dashboard/mockData.js` | PLACEHOLDER / MOCK |
| `/dashboard/work-status` | `app/dashboard/work-status/page.js` | Protected | Kanban content pipeline tracker with drag-and-drop. | `PageHeader`, `KanbanBoard`, `KanbanColumn`, `PostCard` | Reads `app/dashboard/work-status/mockPosts.js` | PLACEHOLDER / MOCK |
| `/dashboard/analytics` | `app/dashboard/analytics/page.js` | Protected | 90-day growth metrics, traffic channels, & demographics. | `PageHeader`, `AnalyticsKPICard`, `TrendChart`, `ChannelDonut`, `WeeklyBarChart`, `TopContentTable`, `AudienceDemographics`, `FunnelChart` | Reads `app/dashboard/analytics/mockAnalytics.js` | PLACEHOLDER / MOCK |
| `/dashboard/reports` | `app/dashboard/reports/page.js` | Protected | Custom performance report builder & instant CSV generator. | `PageHeader`, `ReportBuilder`, `ReportPreviewTable`, `RecentReportsTable` | Reads `app/dashboard/reports/mockReports.js`<br>*(Fires JS Blob CSV download on client)* | PLACEHOLDER / MOCK |
| `/dashboard/tickets` | `app/dashboard/tickets/page.js` | Protected | 3-panel client support ticket and live chat interface. | `PageHeader`, `TicketList`, `TicketThread`, `TicketDetailsPanel` | Reads `app/dashboard/tickets/mockTickets.js` | PLACEHOLDER / MOCK |
| `/dashboard/book-call` | `app/dashboard/book-call/page.js` | Protected | Book strategy or priority support calls. | `PageHeader`, `CallOptionCard`, `UpcomingCallsList`, `TimeSlotPicker` | Reads `app/dashboard/book-call/mockCalls.js` | PLACEHOLDER / MOCK |
| `/dashboard/settings` | `app/dashboard/settings/page.js` | Protected | Account settings (Profile, Team, Billing, Integrations, Security). | `PageHeader`, `SettingsTabs`, `ProfileForm`, `BillingPlanTab`, `PaymentMethodsTab`, `TeamMembersTab`, `NotificationsTab`, `IntegrationsTab`, `SecurityTab` | Reads `app/dashboard/settings/mockSettings.js` | PLACEHOLDER / MOCK |

---

## 8. Layout Architecture

1. **`app/layout.js` (Root Layout):**
   - Applies global fonts, background color `#F8F9FB`, and wraps children in `<RouteGuard>`.
2. **`components/auth/AuthSplitLayout.js` (Auth Layout):**
   - Responsive 2-column layout: Form container on the left, branded teal-to-dark gradient panel on the right with an animated testimonial carousel and partner logo marquee.
3. **`app/dashboard/layout.js` (Dashboard Nested Layout):**
   - Wraps all `/dashboard/*` sub-routes inside a flex container with a fixed left `Sidebar` (`240px` desktop / mobile drawer) and a max-width content area (`1400px`).

---

## 9. Component Architecture

### Reusable Components Summary

1. **Layout & Navigation:**
   - [Sidebar.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/Sidebar.js): Primary navigation bar with JWT user avatar decoding and logout.
   - [Header.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/Header.js): Main dashboard header with search bar, notifications icon, and filter dropdowns.
   - [PageHeader.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/PageHeader.js): Standardized page title header used across subpages.

2. **Authentication Components:**
   - [AuthInput.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/auth/AuthInput.js): Standard input field with dynamic eye toggle for password types.
   - [AuthSplitLayout.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/auth/AuthSplitLayout.js): Marketing split layout with carousel.
   - [RouteGuard.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/auth/RouteGuard.js): Client-side path authorization guard.

3. **Onboarding Components:**
   - [OnboardingWizard.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/onboarding/OnboardingWizard.js): 5-step wizard with HSL color palette generator and live preview.
   - [SelfServeWizard.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/onboarding/SelfServeWizard.js): *(Unused/Legacy)* 3-step alternative setup wizard.

4. **Analytics & Data Visualization Components:**
   - [ForecastChart.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/ForecastChart.js): Recharts 12-month area chart.
   - [TrendChart.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/analytics/TrendChart.js): Interactive metric switcher area chart.
   - [ChannelDonut.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/analytics/ChannelDonut.js): Traffic distribution pie/donut chart.
   - [WeeklyBarChart.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/analytics/WeeklyBarChart.js): Weekly engagement bar chart.
   - [HealthScoreCard.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/HealthScoreCard.js): Health score sparkline bar chart.

5. **Workflow & Kanban Components:**
   - [KanbanBoard.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/work-status/KanbanBoard.js): `@dnd-kit` drag-and-drop container.
   - [KanbanColumn.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/work-status/KanbanColumn.js): Column droppable area.
   - [PostCard.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/work-status/PostCard.js): Draggable social post item.

6. **Ticket Support Components:**
   - [TicketList.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/tickets/TicketList.js): Searchable ticket list.
   - [TicketThread.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/tickets/TicketThread.js): Chat message thread & reply box.
   - [TicketDetailsPanel.js](file:///d:/Internships/Renoweb/Growth-OS-Frontend/components/dashboard/tickets/TicketDetailsPanel.js): Metadata sidebar.

---

## 10. Authentication & Authorization

### Authentication Architecture & Flow

Authentication logic is reverse-engineered directly from `app/auth/page.js` and `components/auth/RouteGuard.js`.

```
User Action
  ↓
AuthPage (app/auth/page.js)
  ├── Submit Sign In / Sign Up Form
  │     ↓
  │   fetch("http://localhost:7007/api/auth/login" | "register")
  │     ↓
  │   Response Returns { token, user: { onboardingComplete } }
  │     ↓
  │   localStorage.setItem("token", token)
  │     ↓
  │   Redirect to /onboarding (if !onboardingComplete) OR /dashboard
  │
  └── Submit Forgot Password Flow (forgotPasswordStep state machine)
        ├── Step 1: POST /api/auth/forgot-password -> Sends OTP
        ├── Step 2: POST /api/auth/verify-otp        -> Returns resetToken
        └── Step 3: POST /api/auth/reset-password   -> Resets password
```

### Authorization & Route Protection Mechanism
- **Token Storage:** Stored in browser `localStorage` under the key `"token"`.
- **JWT Header Decoding:** Components such as `Sidebar.js` and `Header.js` read `localStorage.getItem("token")` and extract user information (name, email) by parsing `JSON.parse(atob(token.split(".")[1]))`.
- **Route Guard (`components/auth/RouteGuard.js`):**
  - Public paths: `/auth`, `/`
  - Protected paths: starts with `/dashboard`, starts with `/onboarding`
  - If a user attempts to access a protected path without a `token`, `RouteGuard` immediately redirects them to `/auth`.
  - If a user with a valid `token` accesses `/auth` or `/`, `RouteGuard` redirects them to `/dashboard`.
- **Logout:** `Sidebar.js` provides a "Sign Out" button that clears `localStorage.removeItem("token")` and redirects to `/auth`.

---

## 11. API Communication Architecture

- **HTTP Client:** Uses browser native `fetch()` with explicit JSON headers (`"Content-Type": "application/json"`) and Bearer Authorization headers (`"Authorization": "Bearer ${token}"`).
- **Base URL:** Currently hardcoded to `http://localhost:7007`. No `.env` environment variable is used for the API base URL in the frontend.
- **Interceptors:** No Axios interceptors or fetch wrapper middleware exist. API calls are made directly inside event handlers or `useEffect` hooks.

---

## 12. Complete Frontend API Inventory

Below is the complete inventory of backend API endpoints explicitly referenced in frontend code:

| Frontend Function / Hook | HTTP Method | Endpoint | Request Body Data | Auth Required? | Response Used By | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `handleAuthSubmit` | `POST` | `http://localhost:7007/api/auth/login` | `{ email, password }` | No | `app/auth/page.js` | User Sign In & JWT retrieval. |
| `handleAuthSubmit` | `POST` | `http://localhost:7007/api/auth/register` | `{ name, email, password }` | No | `app/auth/page.js` | User Registration & JWT retrieval. |
| `handleForgotPasswordSubmit` | `POST` | `http://localhost:7007/api/auth/forgot-password` | `{ email }` | No | `app/auth/page.js` | Request password reset OTP email. |
| `handleForgotPasswordSubmit` | `POST` | `http://localhost:7007/api/auth/verify-otp` | `{ email, otp }` | No | `app/auth/page.js` | Verify 6-digit OTP code & get `resetToken`. |
| `handleForgotPasswordSubmit` | `POST` | `http://localhost:7007/api/auth/reset-password` | `{ resetToken, newPassword }` | No | `app/auth/page.js` | Set new password using `resetToken`. |
| `fetchUser` | `GET` | `http://localhost:7007/api/users/me` | None | Yes (`Bearer ${token}`) | `components/onboarding/OnboardingWizard.js` | Fetch logged-in user profile & onboarding status. |
| `saveProgress` | `PUT` | `http://localhost:7007/api/users/onboarding` | `{ ...formData, onboardingStep, onboardingComplete }` | Yes (`Bearer ${token}`) | `components/onboarding/OnboardingWizard.js` | Save onboarding step progress & mark complete. |

*Note: All dashboard subpages (`/dashboard/*`) currently read from local `.js` mock files and do not make HTTP requests.*

---

## 13. Environment Variables

- **Current State:** There are **NO `.env` or `.env.local` files** present in the frontend repository root, nor are any `process.env` references present in the source code.
- **Hardcoded URLs:** The API base URL `http://localhost:7007` is directly hardcoded into fetch strings in `app/auth/page.js` and `components/onboarding/OnboardingWizard.js`.

---

## 14. State Management

The frontend utilizes **Local Component State** (`useState`, `useEffect`) and **Lifted State** without global state libraries like Redux, Zustand, or React Context.

### State Ownership Map
1. **Authentication State:** Managed locally inside `app/auth/page.js` (`activeTab`, `authMethod`, `forgotPasswordStep`, `formData`, `resetToken`).
2. **Onboarding State:** Managed locally inside `components/onboarding/OnboardingWizard.js` (`currentStepIndex`, `formData`, `shades`).
3. **Dashboard Shared Layout State:** `Sidebar.js` manages its own `mobileOpen` drawer state and decodes `userProfile` from `localStorage` JWT on mount.
4. **Kanban State:** `components/dashboard/work-status/KanbanBoard.js` holds local state `posts` initialized from `mockPosts.js` and updates it dynamically during drag-and-drop operations.
5. **Tickets State:** `app/dashboard/tickets/page.js` manages `selectedTicketId` state and passes `selectedTicket` down to `TicketThread` and `TicketDetailsPanel`.
6. **Settings State:** `app/dashboard/settings/page.js` holds `activeTab` state and renders the active settings sub-component.

---

## 15. Data Models & Types

The frontend is written in plain JavaScript (JSX) without TypeScript interfaces. Data structures are defined implicitly via object literals in mock data files and component states.

### Core Data Models
- **User / Auth Payload:** `{ name, email, onboardingComplete, businessType, companyName, onboardingStep }`
- **Onboarding Form Data:** `{ businessType, companyName, industry, companySize, b2bClients, companyWebsite, position, phoneNumber, brandColor, pricingTier }`
- **Kanban Post Item:** `{ id, title, platform, contentType, assignee, dueDate, priority, columnId }`
- **Support Ticket Item:** `{ id, subject, type, status, priority, createdAt, assignee, relatedCampaign, messages: [{ id, sender, text, timestamp }] }`
- **Report Item:** `{ id, name, dateRange, type, generatedDate, fileSize, status }`
- **Campaign Card Item:** `{ id, icon, iconBg, tags, name, client }`

---

## 16. Forms & Validation

1. **Auth Form (`app/auth/page.js`):**
   - Inputs: Email, Password, Full Name, Invite Code, OTP.
   - Validation: Native HTML5 `required` attribute; error messages rendered from backend response (`Error(data.message)`).
2. **Onboarding Form (`components/onboarding/OnboardingWizard.js`):**
   - Step-by-step validation via `isValidStep()` function checking required fields before enabling the "Continue" button.
3. **Settings Profile Form (`components/dashboard/settings/ProfileForm.js`):**
   - Unconnected presentational form for updating personal details, job title, and timezone.
4. **Report Builder Form (`components/dashboard/reports/ReportBuilder.js`):**
   - Captures report type, granularity, date range, and channels, generating a client-side CSV download via JS `Blob` and `URL.createObjectURL()`.

---

## 17. UI / Design System

- **Styling Core:** Tailwind CSS v4 using PostCSS (`@import "tailwindcss"` in `app/globals.css`).
- **Color Palette:** Curated Slate (`slate-900`, `slate-500`), Indigo (`indigo-600`), Teal (`teal-600`), and Purple (`purple-600`).
- **Custom CSS Classes in `globals.css`:**
  - `.glass-panel`: Glassmorphic background with `backdrop-filter: blur(12px)`.
  - `.gradient-text`: Text gradient from `#3b82f6` to `#8b5cf6`.
  - `.primary-button`: Indigo-to-blue gradient button with drop shadow.
  - `.dashboard-card`: White background (`#ffffff`), `border-radius: 16px`, subtle box shadow.
  - `.ai-gradient-card`: Gradient background (`#6366F1` -> `#8B5CF6` -> `#3B82F6`) with glowing blurred orbs.
  - `.scrollbar-hide`: Utility hiding default browser scrollbars.
  - `@keyframes fade-in-up`, `blob-drift-1`, `blob-drift-2`, `marquee`: Custom entrance and background animations.

---

## 18. Dashboard & Analytics UI

The dashboard consists of 6 dedicated analytical and operational views:

1. **Dashboard Home (`/dashboard`):** 12-column responsive widget grid featuring Growth Forecast (Recharts AreaChart), AI Alert Card, Lead Source breakdown, Activity Feed, Performance Goal progress, Growth Health Score, Pipeline Funnel Strip, and Campaign Cards.
2. **Work Status (`/dashboard/work-status`):** Full Kanban board supporting drag-and-drop between To Do, In Progress, and Done columns using `@dnd-kit`.
3. **Analytics (`/dashboard/analytics`):** 90-day growth metrics, multi-metric trend chart, traffic channel donut chart, weekly bar chart, top content performance table, audience demographics, and conversion funnel.
4. **Reports (`/dashboard/reports`):** Custom report builder with live data preview and functional CSV export.
5. **Tickets (`/dashboard/tickets`):** 3-panel chat and ticketing system supporting status filters (Open, Pending, Resolved) and ticket threads.
6. **Book a Call (`/dashboard/book-call`):** Call option selection cards and an interactive `TimeSlotPicker` overlay modal.

---

## 19. Meta / Facebook / Instagram / Ads Implementation

### Current Meta Code Status
A complete grep search across the frontend repository reveals that **NO active Meta Graph API or OAuth connection code exists**.

### Existing References in Code:
- **Mock Channel Label:** `Meta / Instagram` and `Meta Ads` appear as string labels in `app/dashboard/mockData.js`, `app/dashboard/analytics/mockAnalytics.js`, and `app/dashboard/reports/mockReports.js`.
- **Mock Settings Card:** `components/dashboard/settings/IntegrationsTab.js` lists a card for `Meta Business Suite` with a static "Connect" button.
- **Mock Ticket Thread:** `app/dashboard/tickets/mockTickets.js` contains a ticket titled *"Campaign not spending on Meta"*.

---

## 20. Existing Mock Data / Placeholder Data

Below is the complete inventory of mock data files used across the application:

| File Path | Mock Data Export(s) | Consumed By Component / Page | Intended Backend Endpoint | Replace Later? |
| :--- | :--- | :--- | :--- | :--- |
| `app/dashboard/mockData.js` | `forecastData`, `leadSourceData`, `activityFeedData`, `pipelineData`, `campaignData`, `healthScoreData`, `performanceData` | `app/dashboard/page.js` and widgets | `/api/analytics/forecast`<br>`/api/meta/insights`<br>`/api/activity`<br>`/api/crm/pipeline` | **YES** |
| `app/dashboard/analytics/mockAnalytics.js` | `dailyMetrics`, `kpiData`, `channelBreakdown`, `topContent`, `audienceAge`, `audienceGender`, `funnelData`, `weeklyComparison` | `app/dashboard/analytics/page.js` | `/api/analytics/daily`<br>`/api/meta/insights/breakdown`<br>`/api/content/top` | **YES** |
| `app/dashboard/reports/mockReports.js` | `reportTypes`, `granularities`, `datePresets`, `channels`, `recentReports`, `previewData` | `app/dashboard/reports/page.js` | `/api/reports/history`<br>`/api/reports/generate` | **YES** |
| `app/dashboard/tickets/mockTickets.js` | `agents`, `mockTickets` | `app/dashboard/tickets/page.js` | `/api/tickets`<br>`/api/tickets/:id/messages` | **YES** |
| `app/dashboard/work-status/mockPosts.js` | `columns`, `platforms`, `contentTypes`, `assignees`, `initialPosts` | `app/dashboard/work-status/page.js` | `/api/posts`<br>`/api/posts/:id/status` | **YES** |
| `app/dashboard/book-call/mockCalls.js` | `upcomingCalls`, `callHistory` | `app/dashboard/book-call/page.js` | `/api/calls/upcoming`<br>`/api/calls/schedule` | **YES** |
| `app/dashboard/settings/mockSettings.js` | `userProfile`, `teamMembers`, `paymentMethods`, `integrations`, `activeSessions` | `app/dashboard/settings/page.js` | `/api/users/profile`<br>`/api/team`<br>`/api/billing/methods` | **YES** |

---

## 21. Loading / Error / Empty States

- **Loading States:**
  - `AuthPage`: Buttons show `"Processing..."` and enter `disabled` state during HTTP fetch requests.
  - `OnboardingWizard`: Shows a full-screen centered text `"Loading your profile..."` while initial user data is being fetched.
- **Error States:**
  - `AuthPage`: Renders a red error banner (`bg-red-50 text-red-600`) displaying `error` string if `res.ok` is false.
- **Empty States:**
  - Most tables render fallback dashes (`"—"`) or empty array placeholders if data is omitted.

---

## 22. File-by-File Implementation Map

| File Path | Type | Responsibility | Depends On | Used By | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/layout.js` | Layout | Root layout & font loader | `RouteGuard.js`, `globals.css` | Next.js Router | COMPLETE |
| `app/globals.css` | Styles | Global CSS, Tailwind v4 theme, custom keyframes | `@tailwindcss/postcss` | `app/layout.js` | COMPLETE |
| `app/page.js` | Page | Public landing page | `lucide-react`, `next/link` | Next.js Router | COMPLETE |
| `app/auth/page.js` | Page | Auth state machine (Login, Register, OTP Reset) | `AuthSplitLayout`, `AuthInput` | Next.js Router | COMPLETE (Backend Connected) |
| `components/auth/AuthInput.js` | Component | Input component with password eye toggle | `lucide-react` | `app/auth/page.js` | COMPLETE |
| `components/auth/AuthSplitLayout.js` | Component | Responsive split-screen auth panel with carousel | `framer-motion` | `app/auth/page.js` | COMPLETE |
| `components/auth/RouteGuard.js` | Component | Client-side auth route guard | `next/navigation` | `app/layout.js` | COMPLETE |
| `app/onboarding/page.js` | Page | Onboarding page wrapper | `OnboardingWizard.js` | Next.js Router | COMPLETE |
| `components/onboarding/OnboardingWizard.js` | Component | 5-step onboarding wizard with HSL color palette generator | `framer-motion`, `lucide-react` | `app/onboarding/page.js` | COMPLETE (Backend Connected) |
| `components/onboarding/SelfServeWizard.js` | Component | Alternative 3-step B2B setup wizard | `framer-motion`, `lucide-react` | None | UNUSED / LEGACY |
| `app/dashboard/layout.js` | Layout | Nested dashboard layout with Sidebar | `Sidebar.js` | Next.js Router | COMPLETE |
| `app/dashboard/page.js` | Page | Main dashboard home widget grid | `Header`, `ForecastChart`, etc. | Next.js Router | PLACEHOLDER / MOCK |
| `app/dashboard/mockData.js` | Data | Mock data for main dashboard widgets | None | `app/dashboard/page.js` & widgets | PLACEHOLDER / MOCK |
| `components/dashboard/Sidebar.js` | Component | Responsive dashboard sidebar with logout & user info | `lucide-react`, `next/navigation` | `app/dashboard/layout.js` | COMPLETE |
| `components/dashboard/Header.js` | Component | Dashboard top header with greeting & filters | `lucide-react` | `app/dashboard/page.js` | COMPLETE |
| `components/dashboard/ForecastChart.js` | Component | Recharts growth forecast area chart | `recharts`, `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `components/dashboard/AIInsightCard.js` | Component | AI Alert card widget | `lucide-react` | `app/dashboard/page.js` | COMPLETE |
| `components/dashboard/HealthScoreCard.js` | Component | Health score sparkline bar card | `recharts`, `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `components/dashboard/LeadSourceCard.js` | Component | Lead source progress bar list | `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `components/dashboard/ActivityFeed.js` | Component | Live activity feed list | `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `components/dashboard/PerformanceCard.js` | Component | Performance goal progress bar | `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `components/dashboard/PipelineStrip.js` | Component | Funnel stage strip | `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `components/dashboard/CampaignCards.js` | Component | Active campaign cards grid | `mockData.js` | `app/dashboard/page.js` | PLACEHOLDER / MOCK |
| `app/dashboard/work-status/page.js` | Page | Work status page wrapper | `KanbanBoard.js` | Next.js Router | PLACEHOLDER / MOCK |
| `components/dashboard/work-status/KanbanBoard.js` | Component | `@dnd-kit` drag-and-drop container | `@dnd-kit/core`, `mockPosts.js` | `work-status/page.js` | PLACEHOLDER / MOCK |
| `app/dashboard/analytics/page.js` | Page | Growth analytics page | Recharts sub-components, `mockAnalytics.js` | Next.js Router | PLACEHOLDER / MOCK |
| `app/dashboard/reports/page.js` | Page | Report generator page | `ReportBuilder.js`, `mockReports.js` | Next.js Router | PLACEHOLDER / MOCK |
| `app/dashboard/tickets/page.js` | Page | Support tickets page | Ticket sub-components, `mockTickets.js` | Next.js Router | PLACEHOLDER / MOCK |
| `app/dashboard/book-call/page.js` | Page | Book a call page | Call sub-components, `mockCalls.js` | Next.js Router | PLACEHOLDER / MOCK |
| `app/dashboard/settings/page.js` | Page | Settings page | Settings sub-components, `mockSettings.js` | Next.js Router | PLACEHOLDER / MOCK |

---

## 23. Existing Work Completed by Previous Developers

### Completed Features
1. **Authentication Flow (`/auth`):** Sign in, sign up, invite code sign up, 3-step OTP forgot-password flow, JWT token storage in `localStorage`, and route protection via `RouteGuard.js`.
2. **Onboarding Flow (`/onboarding`):** 5-step wizard capturing business type (B2B vs B2C), company details, position, brand color (with HSL palette generation), and pricing tier selection. Integrates with `/api/users/me` and `/api/users/onboarding`.
3. **UI / Styling System:** Full Tailwind CSS v4 design system with custom CSS variables, glassmorphic panels, animated gradients, and responsive layouts.
4. **Dashboard Layout Shell:** Responsive Sidebar navigation with mobile drawer toggle, path highlighting, and token decoding.
5. **Interactive UI Widgets:**
   - Full drag-and-drop Kanban board (`@dnd-kit`) on `/dashboard/work-status`.
   - Client-side CSV file download generator on `/dashboard/reports`.
   - Multi-chart analytics dashboard (Area, Bar, Donut, Funnel) on `/dashboard/analytics`.
   - 3-panel support ticket & messaging workspace on `/dashboard/tickets`.
   - 7-tab Settings interface on `/dashboard/settings`.

---

## 24. Partial / Missing / Unknown Areas

### Partially Implemented
- **Settings Tabs (`/dashboard/settings`):** The forms (Profile, Team, Billing, Payment Methods) render UI controls and static lists, but form submissions are local-only and do not persist to backend APIs.
- **Search & Filters (`Header.js`):** The top search bar and filter pills ("Last 30 days", "All channels") are presentational and not connected to page filter handlers.

### Missing Features
- **Meta / Social Media Integration UI:** No Meta OAuth button, Facebook Page selector, Instagram Account picker, or Meta Ad Account sync controls exist in the frontend.
- **API Client Layer:** There is no centralized Axios instance or API client module; fetch calls are made directly inside page components.

### Unknown / Requires Verification
- **`SelfServeWizard.js`:** This file exists in `components/onboarding/SelfServeWizard.js` and is referenced in `README.md`, but it is not imported anywhere in `app/`. It appears to be an abandoned early prototype for B2B onboarding.

---

## 25. Frontend ↔ Backend Contract Analysis

The GrowthOS backend provides endpoints for authentication, onboarding, and Meta Graph API integrations (Meta connection, status, disconnect, assets, pages, ad accounts, insights, campaigns).

Below is the contract comparison between backend capabilities and frontend consumer components:

| Backend Endpoint | Frontend Consumer Component | Already Connected? | Expected Request | Expected Response | Required Frontend Changes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | `app/auth/page.js` | **YES** | `{ email, password }` | `{ token, user }` | None required. |
| `POST /api/auth/register` | `app/auth/page.js` | **YES** | `{ name, email, password }` | `{ token, user }` | None required. |
| `POST /api/auth/forgot-password` | `app/auth/page.js` | **YES** | `{ email }` | `{ message }` | None required. |
| `POST /api/auth/verify-otp` | `app/auth/page.js` | **YES** | `{ email, otp }` | `{ resetToken }` | None required. |
| `POST /api/auth/reset-password` | `app/auth/page.js` | **YES** | `{ resetToken, newPassword }` | `{ message }` | None required. |
| `GET /api/users/me` | `OnboardingWizard.js` | **YES** | Header `Bearer ${token}` | `{ user }` | None required. |
| `PUT /api/users/onboarding` | `OnboardingWizard.js` | **YES** | `{ ...formData, onboardingStep, onboardingComplete }` | `{ user }` | None required. |
| `GET /api/meta/status` | Needs new UI Component | **NO** | Header `Bearer ${token}` | `{ connected, pageName, adAccountName }` | Create Meta Connection Card in `IntegrationsTab.js`. |
| `GET /api/meta/insights` | `ForecastChart.js`, `LeadSourceCard.js` | **NO** | Header `Bearer ${token}` | `{ reach, impressions, spend, cpc, ctr }` | Replace `mockData.js` imports with API fetch hook. |
| `GET /api/meta/campaigns` | `CampaignCards.js` | **NO** | Header `Bearer ${token}` | `[{ id, name, status, spend, roas }]` | Replace `campaignData` mock array with API fetch hook. |
| `GET /api/tickets` | `app/dashboard/tickets/page.js` | **NO** | Header `Bearer ${token}` | `[{ id, subject, status, messages }]` | Replace `mockTickets.js` with backend fetch. |
| `GET /api/posts` | `app/dashboard/work-status/page.js` | **NO** | Header `Bearer ${token}` | `[{ id, title, columnId, platform }]` | Replace `mockPosts.js` with backend fetch. |

---

## 26. Future Integration Map — NOT YET IMPLEMENTED

*(Planning / Non-Code Guidance for Next Phase)*

1. **Centralized API Service Layer:**
   - Create an API client module (e.g. `lib/apiClient.js`) using `axios` or custom `fetch` wrapper that automatically attaches `Authorization: Bearer ${localStorage.getItem("token")}` and handles `401 Unauthorized` responses by redirecting to `/auth`.
2. **Environment Variable Configuration:**
   - Define `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to replace hardcoded `http://localhost:7007` strings across all service calls.
3. **Meta OAuth & Connection UI:**
   - Add a "Connect Meta Account" button inside `components/dashboard/settings/IntegrationsTab.js` that initiates the backend OAuth redirect flow (`/api/meta/connect`).
   - Add a connection status banner and asset selection dropdowns (Facebook Pages, Ad Accounts).
4. **Mock Data Replacement:**
   - Replace static exports in `app/dashboard/mockData.js` and `app/dashboard/analytics/mockAnalytics.js` with React Query hooks or custom `useEffect` fetch hooks calling backend endpoints `/api/meta/insights`, `/api/analytics/daily`, etc.
5. **Tickets & Kanban Backend Persistence:**
   - Connect `KanbanBoard.js` drag-and-drop callbacks (`handleDragEnd`) to send `PUT /api/posts/:id/status` updates to persist column moves on the server.
   - Connect `TicketThread.js` reply form to `POST /api/tickets/:id/messages`.

---

## 27. Security Audit

| Finding | Risk Level | Details & Root Cause | Recommended Mitigation (Future) |
| :--- | :--- | :--- | :--- |
| **JWT Stored in localStorage** | **MEDIUM** | JWT tokens are saved directly in browser `localStorage.getItem("token")`, exposing them to potential XSS attacks. | Migrate token storage to HTTP-Only, Secure cookies. |
| **Client-Side JWT Decoding** | **LOW** | `Sidebar.js` and `Header.js` decode token payload using `atob(token.split(".")[1])` without signature verification. | Non-critical for UI display, but sensitive actions must be validated on the backend. |
| **Hardcoded HTTP Localhost Endpoint** | **LOW** | `http://localhost:7007` is hardcoded in source files instead of using environment variables, which will fail in staging/production deployments. | Extract API endpoint to `process.env.NEXT_PUBLIC_API_BASE_URL`. |
| **Unused Legacy Component** | **SAFE** | `components/onboarding/SelfServeWizard.js` contains unreferenced dead code. | Safe, but should be removed or cleaned up in future maintenance. |

---

## 28. Important Technical Notes

- **Next.js 16 App Router Constraints:** All interactive pages use `"use client"` directives. Note that Next.js 16 includes strict rules regarding server vs client components; keep client-side hooks scoped to interactive sub-components when refactoring in future steps.
- **Tailwind CSS v4 Import:** Tailwind v4 uses `@import "tailwindcss";` in `globals.css` instead of traditional `@tailwind base; @tailwind components; @tailwind utilities;`. Custom theme tokens are defined via `@theme`.
- **Recharts Dynamic Sizing:** All charts are wrapped inside `<ResponsiveContainer width="100%" height="100%">` and parent elements specify explicit pixel or Tailwind heights (`h-[280px]`).

---

## 29. Known Risks / Questions for the Team

1. **Meta OAuth Redirect Strategy:** Should the Meta connection flow open in a popup window or perform a full-page redirect to the backend OAuth URL?
2. **Dashboard Data Polling vs SWR:** Should analytics and campaign metrics poll periodically or rely on on-demand refreshes when the user visits the dashboard?
3. **Legacy `SelfServeWizard.js`:** Confirm whether `SelfServeWizard.js` can be safely deleted in future cleanups.

---

## 30. Final Repository Status

- **Codebase Integrity:** 100% Intact. No application files modified, renamed, moved, or deleted.
- **Audit Verification:** Every directory, route, component, style, and mock dataset has been reverse-engineered and documented.
- **Readiness:** The repository is fully analyzed and prepared for backend API integration in the subsequent phase.
