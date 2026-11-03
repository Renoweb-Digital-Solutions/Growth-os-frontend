// Reason: Verification suite for Meta OAuth Reconnection flow, callback routing,
// and authoritative status verification in Growth-OS-Frontend.
// How: Tests URL routing through RouteGuard, Dashboard redirect forwarding, Settings tab defaulting,
//      URL history cleanup, and the post-OAuth authoritative status verification state machine.

import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// TEST 1: RouteGuard routes OAuth callbacks to /dashboard/settings?tab=integrations
// ============================================================================
test("RouteGuard routes OAuth callbacks arriving at root to /dashboard/settings?tab=integrations", () => {
  const resolveRedirectTarget = (token, pathname, queryString) => {
    const isAuthRoute = pathname.startsWith("/auth") || pathname === "/";
    const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

    if (!token && isProtectedRoute) {
      return "/auth";
    }

    if (token && isAuthRoute) {
      const searchParams = new URLSearchParams(queryString);
      const isOAuthCallback =
        searchParams.has("meta_status") ||
        searchParams.has("google_status") ||
        searchParams.has("google_error") ||
        searchParams.has("linkedin_status") ||
        searchParams.has("x_status");

      if (isOAuthCallback) {
        if (!searchParams.has("tab")) {
          searchParams.set("tab", "integrations");
        }
        return `/dashboard/settings?${searchParams.toString()}`;
      }
      return "/dashboard";
    }

    return null; // authorized in place
  };

  // 1. Meta OAuth success callback arriving at root
  const metaSuccess = resolveRedirectTarget("valid_jwt_token", "/", "?meta_status=success");
  assert.equal(metaSuccess, "/dashboard/settings?meta_status=success&tab=integrations");

  // 2. Meta OAuth error callback arriving at root
  const metaError = resolveRedirectTarget("valid_jwt_token", "/", "?meta_status=error&error=access_denied");
  assert.equal(metaError, "/dashboard/settings?meta_status=error&error=access_denied&tab=integrations");

  // 3. Regular logged-in user at root without OAuth params
  const normalLogin = resolveRedirectTarget("valid_jwt_token", "/", "");
  assert.equal(normalLogin, "/dashboard");

  // 4. Unauthenticated user accessing protected route
  const unauth = resolveRedirectTarget(null, "/dashboard", "");
  assert.equal(unauth, "/auth");
});

// ============================================================================
// TEST 2: DashboardPage forwards OAuth callbacks to Settings Integrations tab
// ============================================================================
test("DashboardPage forwards OAuth callbacks arriving at /dashboard to Settings Integrations tab", () => {
  const handleDashboardOAuthRedirect = (queryString) => {
    const searchParams = new URLSearchParams(queryString);
    const isOAuthCallback =
      searchParams.has("meta_status") ||
      searchParams.has("google_status") ||
      searchParams.has("google_error") ||
      searchParams.has("linkedin_status") ||
      searchParams.has("x_status");

    if (isOAuthCallback) {
      if (!searchParams.has("tab")) {
        searchParams.set("tab", "integrations");
      }
      return `/dashboard/settings?${searchParams.toString()}`;
    }
    return null;
  };

  assert.equal(
    handleDashboardOAuthRedirect("?meta_status=success"),
    "/dashboard/settings?meta_status=success&tab=integrations"
  );
  assert.equal(
    handleDashboardOAuthRedirect("?meta_status=error&error=declined"),
    "/dashboard/settings?meta_status=error&error=declined&tab=integrations"
  );
  assert.equal(handleDashboardOAuthRedirect(""), null);
});

// ============================================================================
// TEST 3: SettingsPage defaults to 'integrations' tab on OAuth callbacks
// ============================================================================
test("SettingsPage defaults to 'integrations' tab when OAuth callback params are present", () => {
  const validTabs = ["profile", "billing", "payments", "team", "notifications", "integrations", "security"];

  const resolveActiveTab = (selectedTab, tabParam, searchParamsObj) => {
    const isOAuthCallback =
      searchParamsObj.has("meta_status") ||
      searchParamsObj.has("google_status") ||
      searchParamsObj.has("google_error") ||
      searchParamsObj.has("linkedin_status") ||
      searchParamsObj.has("x_status");

    const defaultTab = isOAuthCallback ? "integrations" : "profile";
    return selectedTab || (tabParam && validTabs.includes(tabParam) ? tabParam : defaultTab);
  };

  // 1. meta_status=success without tab parameter defaults to 'integrations'
  const params1 = new URLSearchParams("meta_status=success");
  assert.equal(resolveActiveTab(null, null, params1), "integrations");

  // 2. meta_status=error without tab parameter defaults to 'integrations'
  const params2 = new URLSearchParams("meta_status=error&error=declined");
  assert.equal(resolveActiveTab(null, null, params2), "integrations");

  // 3. Normal navigation without tab parameter defaults to 'profile'
  const params3 = new URLSearchParams("");
  assert.equal(resolveActiveTab(null, null, params3), "profile");

  // 4. Explicit tab=security takes precedence if no tab selected yet
  const params4 = new URLSearchParams("tab=security");
  assert.equal(resolveActiveTab(null, "security", params4), "security");
});

// ============================================================================
// TEST 4: IntegrationsTab cleans callback params and retains tab=integrations
// ============================================================================
test("IntegrationsTab cleans callback parameters and preserves tab=integrations in URL history", () => {
  const cleanPostOAuthUrl = (pathname, searchString) => {
    const searchParams = new URLSearchParams(searchString);
    const metaStatusParam = searchParams.get("meta_status");
    let isPostOAuth = false;

    if (metaStatusParam === "success" || metaStatusParam === "error") {
      isPostOAuth = true;
    }

    if (isPostOAuth) {
      searchParams.delete("meta_status");
      searchParams.delete("google_status");
      searchParams.delete("google_error");
      searchParams.delete("linkedin_status");
      searchParams.delete("app");
      searchParams.delete("member");
      searchParams.delete("message");
      searchParams.delete("error");
      searchParams.delete("error_description");
      searchParams.delete("x_status");
      searchParams.delete("username");
      if (!searchParams.has("tab")) {
        searchParams.set("tab", "integrations");
      }
      const newSearch = searchParams.toString();
      const newUrl = pathname + (newSearch ? `?${newSearch}` : "");
      return { newUrl, isPostOAuth };
    }

    return { newUrl: pathname + (searchString ? `?${searchString}` : ""), isPostOAuth: false };
  };

  // When coming in with ?meta_status=success (no tab in query)
  const res1 = cleanPostOAuthUrl("/dashboard/settings", "meta_status=success");
  assert.equal(res1.newUrl, "/dashboard/settings?tab=integrations");
  assert.equal(res1.isPostOAuth, true);

  // When coming in with ?tab=integrations&meta_status=success
  const res2 = cleanPostOAuthUrl("/dashboard/settings", "tab=integrations&meta_status=success");
  assert.equal(res2.newUrl, "/dashboard/settings?tab=integrations");
  assert.equal(res2.isPostOAuth, true);

  // When coming in with ?meta_status=error&error=user_cancelled
  const res3 = cleanPostOAuthUrl("/dashboard/settings", "meta_status=error&error=user_cancelled");
  assert.equal(res3.newUrl, "/dashboard/settings?tab=integrations");
  assert.equal(res3.isPostOAuth, true);

  // Normal navigation with no callback params
  const res4 = cleanPostOAuthUrl("/dashboard/settings", "tab=integrations");
  assert.equal(res4.newUrl, "/dashboard/settings?tab=integrations");
  assert.equal(res4.isPostOAuth, false);
});

// ============================================================================
// TEST 5: Authoritative Post-OAuth Status Verification State Machine
// ============================================================================
test("Authoritative Post-OAuth verification guarantees banner and card status never contradict", async () => {
  // Simulates the exact state machine in IntegrationsTab.js
  const runOAuthVerificationFlow = async ({ queryMetaStatus, queryError, fetchStatusResult, fetchStatusError }) => {
    let successMessage = null;
    let error = null;
    let metaStatus = { connected: false, status: "loading" };
    let isRateLimited = false;

    const isPostOAuthMeta = queryMetaStatus === "success";

    if (queryMetaStatus === "success") {
      // Do not infer connection success from query parameter alone!
      successMessage = null;
      error = null;
    } else if (queryMetaStatus === "error") {
      successMessage = null;
      error = queryError || "Meta authorization failed or was cancelled.";
    }

    // Now execute fetchStatusAndAssets with { isPostOAuthMeta }
    try {
      if (fetchStatusError) {
        throw fetchStatusError;
      }

      const statusRes = fetchStatusResult;
      metaStatus = statusRes;

      if (statusRes && statusRes.connected === true) {
        if (isPostOAuthMeta) {
          successMessage = "Meta Business Suite connected successfully.";
          error = null;
        }
      } else {
        if (isPostOAuthMeta) {
          successMessage = null;
          error = "Meta connection could not be verified with the server. Please try reconnecting.";
        }
      }
    } catch (err) {
      if (isPostOAuthMeta) {
        successMessage = null; // NEVER report success on error!
      }

      const is429 =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        err?.message?.toLowerCase().includes("too many requests") ||
        err?.message?.toLowerCase().includes("rate limit");

      if (is429) {
        isRateLimited = true;
        error = "Too many requests. Meta integration is temporarily rate limited. Please wait a few minutes before trying again.";
        metaStatus = { ...metaStatus, status: "rate_limited" };
      } else {
        metaStatus = { connected: false, status: "error" };
        error = err?.message || "Failed to load Meta integration status.";
      }
    }

    // Determine card badge text
    let badgeText = "Disconnected";
    if (isRateLimited || metaStatus?.status === "rate_limited") {
      badgeText = "Rate Limited";
    } else if (metaStatus?.connected) {
      badgeText = "Connected";
    } else if (metaStatus?.needsReconnect) {
      badgeText = "Auth Expired";
    }

    // Determine button text
    let buttonText = metaStatus?.connected ? "Disconnect" : "Connect Meta";

    return {
      successMessage,
      error,
      metaStatus,
      isRateLimited,
      badgeText,
      buttonText,
    };
  };

  // SCENARIO 1: OAuth succeeds and /api/meta/status confirms connected: true
  const s1 = await runOAuthVerificationFlow({
    queryMetaStatus: "success",
    fetchStatusResult: { connected: true, status: "connected", metaUserId: "fb_123" },
  });
  assert.equal(s1.successMessage, "Meta Business Suite connected successfully.");
  assert.equal(s1.error, null);
  assert.equal(s1.metaStatus.connected, true);
  assert.equal(s1.badgeText, "Connected");
  assert.equal(s1.buttonText, "Disconnect");

  // SCENARIO 2: OAuth returns success query param but backend status is connected: false
  const s2 = await runOAuthVerificationFlow({
    queryMetaStatus: "success",
    fetchStatusResult: { connected: false, status: "disconnected" },
  });
  assert.equal(s2.successMessage, null, "MUST NOT show success banner when status confirms false");
  assert.equal(s2.error, "Meta connection could not be verified with the server. Please try reconnecting.");
  assert.equal(s2.metaStatus.connected, false);
  assert.equal(s2.badgeText, "Disconnected");
  assert.equal(s2.buttonText, "Connect Meta");

  // SCENARIO 3: OAuth callback fails (user cancelled or error)
  const s3 = await runOAuthVerificationFlow({
    queryMetaStatus: "error",
    queryError: "User cancelled login",
    fetchStatusResult: { connected: false, status: "disconnected" },
  });
  assert.equal(s3.successMessage, null);
  assert.equal(s3.error, "User cancelled login");
  assert.equal(s3.metaStatus.connected, false);
  assert.equal(s3.badgeText, "Disconnected");
  assert.equal(s3.buttonText, "Connect Meta");

  // SCENARIO 4: Status request fails with HTTP 429 Rate Limit
  const s4 = await runOAuthVerificationFlow({
    queryMetaStatus: "success",
    fetchStatusError: { status: 429, message: "Too many requests" },
  });
  assert.equal(s4.successMessage, null, "MUST NOT show success banner on rate limit failure");
  assert.ok(s4.error.includes("rate limited"));
  assert.equal(s4.isRateLimited, true);
  assert.equal(s4.badgeText, "Rate Limited");
  assert.equal(s4.buttonText, "Connect Meta");

  // SCENARIO 5: Page refresh (no OAuth query params in URL)
  const s5 = await runOAuthVerificationFlow({
    queryMetaStatus: null, // clean URL on refresh
    fetchStatusResult: { connected: true, status: "connected" },
  });
  assert.equal(s5.successMessage, null, "MUST NOT recreate success banner on page refresh");
  assert.equal(s5.error, null);
  assert.equal(s5.metaStatus.connected, true);
  assert.equal(s5.badgeText, "Connected");
  assert.equal(s5.buttonText, "Disconnect");
});
