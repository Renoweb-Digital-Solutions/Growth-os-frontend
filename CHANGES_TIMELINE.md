# Frontend Changes Timeline

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
