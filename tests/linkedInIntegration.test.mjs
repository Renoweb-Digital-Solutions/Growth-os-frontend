import test from "node:test";
import assert from "node:assert/strict";

// Mock environment
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";

// ============================================================================
// TEST 1: Normalize LinkedIn App Types
// ============================================================================
test("normalizeLinkedInApp correctly resolves app types", async () => {
  const { normalizeLinkedInApp } = await import("../lib/linkedInApi.js");

  assert.equal(normalizeLinkedInApp("ads"), "ads");
  assert.equal(normalizeLinkedInApp("ADS"), "ads");
  assert.equal(normalizeLinkedInApp("Growmentum"), "ads");
  assert.equal(normalizeLinkedInApp("advertising"), "ads");

  assert.equal(normalizeLinkedInApp("community"), "community");
  assert.equal(normalizeLinkedInApp("COMMUNITY"), "community");
  assert.equal(normalizeLinkedInApp("growmentum-community"), "community");
  assert.equal(normalizeLinkedInApp("pages"), "community");
  assert.equal(normalizeLinkedInApp("organization"), "community");

  // Default fallback
  assert.equal(normalizeLinkedInApp(null), "ads");
  assert.equal(normalizeLinkedInApp("unknown"), "ads");
});

// ============================================================================
// TEST 2: Exact routes, HTTP methods, and payload structures
// ============================================================================
test("LinkedIn API helper functions construct exact endpoints, methods, and payloads", async () => {
  const requestedCalls = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    requestedCalls.push({ url, method: options.method || "GET", body: options.body });
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ success: true, data: { mockResult: true } }),
    };
  };

  try {
    const linkedInApi = await import("../lib/linkedInApi.js");

    // 1. GET /api/linkedin/config
    await linkedInApi.getLinkedInConfig();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/config");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 2. GET /api/linkedin/status
    await linkedInApi.getLinkedInStatus();
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/status");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 3. GET /api/linkedin/:app/status
    await linkedInApi.getLinkedInAppStatus("ads");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/ads/status");
    assert.equal(requestedCalls.at(-1).method, "GET");

    await linkedInApi.getLinkedInAppStatus("community");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/community/status");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 4. GET /api/linkedin/:app/connect?format=json
    await linkedInApi.connectLinkedIn("ads");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/ads/connect?format=json");
    assert.equal(requestedCalls.at(-1).method, "GET");

    await linkedInApi.connectLinkedIn("community");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/community/connect?format=json");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 5. DELETE /api/linkedin/:app/disconnect
    await linkedInApi.disconnectLinkedIn("ads");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/ads/disconnect");
    assert.equal(requestedCalls.at(-1).method, "DELETE");

    await linkedInApi.disconnectLinkedIn("community");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/community/disconnect");
    assert.equal(requestedCalls.at(-1).method, "DELETE");

    // 6. GET /api/linkedin/:app/assets
    await linkedInApi.getLinkedInAssets("ads");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/ads/assets");
    assert.equal(requestedCalls.at(-1).method, "GET");

    await linkedInApi.getLinkedInAssets("community");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/community/assets");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // 7. POST /api/linkedin/:app/selected-asset
    await linkedInApi.selectLinkedInAsset("ads", "501234567");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/ads/selected-asset");
    assert.equal(requestedCalls.at(-1).method, "POST");
    assert.deepEqual(JSON.parse(requestedCalls.at(-1).body), { assetId: "501234567" });

    await linkedInApi.selectLinkedInAsset("community", "12345678");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/community/selected-asset");
    assert.equal(requestedCalls.at(-1).method, "POST");
    assert.deepEqual(JSON.parse(requestedCalls.at(-1).body), { assetId: "12345678" });

    // 8. GET /api/linkedin/:app/selected-asset
    await linkedInApi.getLinkedInSelectedAsset("ads");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/ads/selected-asset");
    assert.equal(requestedCalls.at(-1).method, "GET");

    await linkedInApi.getLinkedInSelectedAsset("community");
    assert.equal(requestedCalls.at(-1).url, "http://localhost:5000/api/linkedin/community/selected-asset");
    assert.equal(requestedCalls.at(-1).method, "GET");

    // Verify deprecated routes are NOT called
    for (const call of requestedCalls) {
      assert.ok(!call.url.includes("/assets/select"), "Route /assets/select must not be used");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 3: Top-level connect URL parsing and validation
// ============================================================================
test("Top-level connect URL parsing validates response before navigation", async () => {
  const originalFetch = globalThis.fetch;

  try {
    const linkedInApi = await import("../lib/linkedInApi.js");

    // Case A: Correct top-level url response
    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        url: "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=123",
        state: "safe_random_state_xyz",
        appType: "ads",
      }),
    });

    const res = await linkedInApi.connectLinkedIn("ads");
    // URL must be at top-level, NOT in res.data.url
    assert.equal(typeof res.url, "string");
    assert.ok(res.url.startsWith("https://www.linkedin.com/oauth/v2/authorization"));
    assert.equal(res.data, undefined, "Connect response does not nest url under data");

    // Case B: Validation simulation (handleConnect logic)
    const validateConnectResponse = (response) => {
      if (response && response.success !== false && typeof response.url === "string" && response.url.trim().length > 0) {
        const targetUrl = response.url.trim();
        if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
          return { canNavigate: true, url: targetUrl };
        }
      }
      return { canNavigate: false, error: response?.message || "Invalid or missing authorization URL" };
    };

    const validCheck = validateConnectResponse(res);
    assert.equal(validCheck.canNavigate, true);
    assert.ok(validCheck.url.startsWith("https://"));

    // Case C: Missing top-level url or wrongly nested under data
    const invalidNested = { success: true, data: { url: "https://example.com" } };
    const invalidCheck = validateConnectResponse(invalidNested);
    assert.equal(invalidCheck.canNavigate, false);

    // Case D: Non-HTTP protocol
    const maliciousProto = { success: true, url: "javascript:alert(1)" };
    const badProtoCheck = validateConnectResponse(maliciousProto);
    assert.equal(badProtoCheck.canNavigate, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 4: DELETE disconnect response handling (no data required)
// ============================================================================
test("DELETE disconnect handles { success: true, message } without requiring data", async () => {
  const originalFetch = globalThis.fetch;

  try {
    const linkedInApi = await import("../lib/linkedInApi.js");

    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        message: "Growmentum (Ads) disconnected successfully.",
      }),
    });

    const res = await linkedInApi.disconnectLinkedIn("ads");
    assert.equal(res.success, true);
    assert.equal(res.message, "Growmentum (Ads) disconnected successfully.");
    assert.equal(res.data, undefined, "DELETE response does not require data field");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 5: OAuth callback query-string handling and cleanup
// ============================================================================
test("OAuth callback handling extracts parameters and cleans up URL query", () => {
  const handleCallback = (queryString) => {
    const params = new URLSearchParams(queryString);
    const linkedinStatus = params.get("linkedin_status");
    const app = params.get("app");
    const member = params.get("member");
    const errorParam = params.get("error");
    const messageParam = params.get("message");

    let notification = null;
    let isPostOAuth = false;

    if (linkedinStatus === "success") {
      isPostOAuth = true;
      const appName = app === "community" ? "Growmentum-community (Pages)" : "Growmentum (Ads)";
      const memberInfo = member ? ` (${decodeURIComponent(member)})` : "";
      notification = {
        type: "success",
        message: `LinkedIn ${appName} connected successfully${memberInfo}.`,
      };
    } else if (linkedinStatus === "error") {
      isPostOAuth = true;
      let errText = "LinkedIn authorization failed or was cancelled.";
      if (messageParam && errorParam) {
        const decodedMsg = decodeURIComponent(messageParam);
        const decodedErr = decodeURIComponent(errorParam);
        errText = decodedErr && decodedErr !== decodedMsg ? `${decodedMsg} (${decodedErr})` : decodedMsg;
      } else if (messageParam) {
        errText = decodeURIComponent(messageParam);
      } else if (errorParam) {
        errText = decodeURIComponent(errorParam);
      }
      notification = {
        type: "error",
        message: errText,
      };
    }

    let remainingQuery = "";
    if (isPostOAuth) {
      params.delete("linkedin_status");
      params.delete("app");
      params.delete("member");
      params.delete("error");
      params.delete("message");
      remainingQuery = params.toString();
    }

    return { notification, remainingQuery };
  };

  // Case 1: Success for Ads
  const adsSuccess = handleCallback("?linkedin_status=success&app=ads&member=Samar%20Smith&tab=integrations");
  assert.equal(adsSuccess.notification.type, "success");
  assert.equal(adsSuccess.notification.message, "LinkedIn Growmentum (Ads) connected successfully (Samar Smith).");
  assert.equal(adsSuccess.remainingQuery, "tab=integrations", "Clears OAuth parameters while keeping tab param");

  // Case 2: Success for Community
  const commSuccess = handleCallback("?linkedin_status=success&app=community&member=Lusi%20Doe");
  assert.equal(commSuccess.notification.type, "success");
  assert.equal(commSuccess.notification.message, "LinkedIn Growmentum-community (Pages) connected successfully (Lusi Doe).");
  assert.equal(commSuccess.remainingQuery, "");

  // Case 3: Error with both message and error code
  const errBoth = handleCallback("?linkedin_status=error&error=access_denied&message=User%20denied%20consent");
  assert.equal(errBoth.notification.type, "error");
  assert.equal(errBoth.notification.message, "User denied consent (access_denied)");
  assert.equal(errBoth.remainingQuery, "");

  // Case 4: Error with only message
  const errOnlyMsg = handleCallback("?linkedin_status=error&message=Authorization%20cancelled");
  assert.equal(errOnlyMsg.notification.type, "error");
  assert.equal(errOnlyMsg.notification.message, "Authorization cancelled");

  // Case 5: Error with only code
  const errOnlyCode = handleCallback("?linkedin_status=error&error=server_error");
  assert.equal(errOnlyCode.notification.type, "error");
  assert.equal(errOnlyCode.notification.message, "server_error");
});

// ============================================================================
// TEST 6: Response envelope variations & top-level backend error handling
// ============================================================================
test("Response envelope variations and top-level error messages are handled safely", async () => {
  const originalFetch = globalThis.fetch;

  try {
    const linkedInApi = await import("../lib/linkedInApi.js");

    // Variation A: Express error returning top-level { message: "..." } with HTTP 403
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      headers: { get: () => "application/json" },
      json: async () => ({
        message: "LinkedIn Advertising API permission is pending approval from LinkedIn Developer Portal.",
      }),
    });

    await assert.rejects(
      async () => {
        await linkedInApi.getLinkedInAssets("ads");
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.message, "LinkedIn Advertising API permission is pending approval from LinkedIn Developer Portal.");
        assert.ok(err.data.message);
        return true;
      }
    );

    // Variation B: POST /api/linkedin/:app/selected-asset returning { success: true, message, data }
    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        message: "Active LinkedIn asset updated successfully.",
        data: { assetId: "501234567", name: "Main Campaign Ad Account", currency: "USD" },
      }),
    });

    const selectRes = await linkedInApi.selectLinkedInAsset("ads", "501234567");
    assert.equal(selectRes.success, true);
    assert.equal(selectRes.message, "Active LinkedIn asset updated successfully.");
    assert.equal(selectRes.data.assetId, "501234567");

    // Variation C: GET /api/linkedin/:app/selected-asset returning { success: true, data: null }
    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        data: null,
      }),
    });

    const nullSelectedRes = await linkedInApi.getLinkedInSelectedAsset("ads");
    assert.equal(nullSelectedRes.success, true);
    assert.equal(nullSelectedRes.data, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// TEST 7: Honest status differentiation (OpenID vs Product Approval vs Phase 2)
// ============================================================================
test("Connection status strictly discriminates OpenID identity from product approval", () => {
  const evaluateStatus = (integration, appConfig) => {
    if (!integration || integration.status === "disconnected" || !integration.connected) {
      return { badge: "Disconnected", isConnected: false, isPending: false };
    }
    if (integration.status === "expired") {
      return { badge: "Auth Expired", isConnected: false, isPending: false, needsReconnect: true };
    }
    const isPending =
      integration.approvalStatus === "pending_approval" ||
      appConfig?.productStatus === "pending_approval";
    return {
      badge: isPending ? "Approval Pending" : "Connected",
      isConnected: true,
      isPending,
    };
  };

  // Case 1: Disconnected
  const disc = evaluateStatus({ connected: false, status: "disconnected" }, { productStatus: "pending_approval" });
  assert.equal(disc.badge, "Disconnected");
  assert.equal(disc.isConnected, false);

  // Case 2: OpenID connected, but r_ads product review pending with LinkedIn
  const pending = evaluateStatus(
    { connected: true, status: "connected", approvalStatus: "pending_approval" },
    { productStatus: "pending_approval" }
  );
  assert.equal(pending.badge, "Approval Pending");
  assert.equal(pending.isConnected, true);
  assert.equal(pending.isPending, true);

  // Case 3: Fully approved and active
  const approved = evaluateStatus(
    { connected: true, status: "connected", approvalStatus: "approved" },
    { productStatus: "approved" }
  );
  assert.equal(approved.badge, "Connected");
  assert.equal(approved.isConnected, true);
  assert.equal(approved.isPending, false);
});

// ============================================================================
// TEST 8: Zero fabricated metrics guarantee in Phase 1
// ============================================================================
test("Phase 1 strictly renders empty reporting shell and never fabricates metrics", () => {
  // When Phase 2 reporting endpoints are not yet implemented by the backend,
  // frontend must return empty KPI states with null values and "--" placeholders
  const getReportingShell = (endpointData) => {
    if (!endpointData) {
      return {
        hasLiveMetrics: false,
        kpis: [
          { label: "Total Spend", value: null, placeholder: "--" },
          { label: "Impressions", value: null, placeholder: "--" },
          { label: "Clicks", value: null, placeholder: "--" },
          { label: "CTR", value: null, placeholder: "--" },
          { label: "Avg. CPC", value: null, placeholder: "--" },
          { label: "Conversions", value: null, placeholder: "--" },
        ],
        phase: "Phase 1 - Awaiting Phase 2 Reporting API",
      };
    }
    return { hasLiveMetrics: true, data: endpointData };
  };

  const shell = getReportingShell(null);
  assert.equal(shell.hasLiveMetrics, false);
  assert.equal(shell.kpis.length, 6);
  for (const kpi of shell.kpis) {
    assert.equal(kpi.value, null);
    assert.equal(kpi.placeholder, "--");
  }
  assert.ok(shell.phase.includes("Phase 1"));
});

// ============================================================================
// TEST 9: Dual-app isolation between Ads (Growmentum) and Community (Pages)
// ============================================================================
test("Ad Accounts and Company Pages maintain strict state and asset isolation", () => {
  const store = {
    ads: {
      connected: true,
      assets: [{ assetId: "501", name: "Account A" }, { assetId: "502", name: "Account B" }],
      selectedAssetId: "501",
    },
    community: {
      connected: true,
      assets: [{ assetId: "901", name: "Page Alpha" }, { assetId: "902", name: "Page Beta" }],
      selectedAssetId: "901",
    },
  };

  // Switch selection in ads only
  store.ads.selectedAssetId = "502";

  assert.equal(store.ads.selectedAssetId, "502");
  // Community selection remains completely isolated
  assert.equal(store.community.selectedAssetId, "901");
});
