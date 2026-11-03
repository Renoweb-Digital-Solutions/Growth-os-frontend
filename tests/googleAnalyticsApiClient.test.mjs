import test from "node:test";
import assert from "node:assert/strict";
import { extractErrorMessage } from "../lib/apiClient.js";

// ============================================================================
// TEST 1: Preferred data.message as a normal string
// ============================================================================
test("extractErrorMessage prefers a valid, non-empty data.message string", () => {
  const payload = {
    message: "Google Analytics property is not configured",
    error: { message: "Secondary error details" },
  };
  const msg = extractErrorMessage(payload, 400);
  assert.equal(msg, "Google Analytics property is not configured");
});

// ============================================================================
// TEST 2: data.error as a direct string
// ============================================================================
test("extractErrorMessage supports data.error as a string when data.message is absent", () => {
  const payload = {
    error: "Access denied to Google Analytics 4",
  };
  const msg = extractErrorMessage(payload, 403);
  assert.equal(msg, "Access denied to Google Analytics 4");
});

// ============================================================================
// TEST 3: data.error as an object containing message (Google API standard error)
// ============================================================================
test("extractErrorMessage extracts data.error.message from Google API error object without producing [object Object]", () => {
  const googleApiPayload = {
    error: {
      code: 403,
      message: "The caller does not have permission to access Analytics Admin API",
      status: "PERMISSION_DENIED",
    },
  };
  const msg = extractErrorMessage(googleApiPayload, 403);
  assert.equal(msg, "The caller does not have permission to access Analytics Admin API");
  assert.notEqual(msg, "[object Object]");
  assert.equal(msg.includes("[object Object]"), false);
});

// ============================================================================
// TEST 4: Unrecognized error-object structure falls back cleanly to HTTP status
// ============================================================================
test("extractErrorMessage cleanly falls back to HTTP status for unrecognized error objects", () => {
  const unrecognizedPayload = {
    error: {
      unknownField: 42,
      nested: { deeply: true },
    },
  };
  const msg = extractErrorMessage(unrecognizedPayload, 500);
  assert.equal(msg, "Request failed with status 500");
  assert.notEqual(msg, "[object Object]");
  assert.equal(msg.includes("[object Object]"), false);
});

// ============================================================================
// TEST 5: Invalid JSON or empty error response falls back to HTTP status
// ============================================================================
test("extractErrorMessage handles empty bodies, null, undefined, or empty objects safely", () => {
  assert.equal(extractErrorMessage({}, 404), "Request failed with status 404");
  assert.equal(extractErrorMessage(null, 502), "Request failed with status 502");
  assert.equal(extractErrorMessage(undefined, 503), "Request failed with status 503");
  assert.equal(extractErrorMessage("", 400), "Request failed with status 400");
});

// ============================================================================
// TEST 6: Nested OAuth error_description and Google error arrays
// ============================================================================
test("extractErrorMessage extracts OAuth error_description and nested Google errors arrays", () => {
  // OAuth error
  const oauthPayload = {
    error: "invalid_grant",
    error_description: "Token has expired or been revoked",
  };
  assert.equal(extractErrorMessage(oauthPayload, 401), "invalid_grant"); // string error preferred if present

  const oauthPayload2 = {
    error: {
      error_description: "Refresh token is invalid or expired",
    },
  };
  assert.equal(extractErrorMessage(oauthPayload2, 401), "Refresh token is invalid or expired");

  // Google API errors list
  const arrayPayload = {
    error: {
      errors: [{ message: "Property ID format is invalid: properties/abc" }],
    },
  };
  assert.equal(extractErrorMessage(arrayPayload, 400), "Property ID format is invalid: properties/abc");

  // Express validator list
  const expressValidatorPayload = {
    errors: [{ message: "startDate must be a valid ISO 8601 date" }],
  };
  assert.equal(extractErrorMessage(expressValidatorPayload, 422), "startDate must be a valid ISO 8601 date");
});

// ============================================================================
// TEST 7: Redaction of access tokens and sensitive credentials
// ============================================================================
test("extractErrorMessage redacts Google access tokens (ya29.) and bearer tokens", () => {
  const sensitivePayload = {
    error: {
      message: "Call to https://analyticsdata.googleapis.com failed with token=ya29.a0AfH6SMAxyz1234567890abcdef and client_secret=supersecret123",
    },
  };
  const msg = extractErrorMessage(sensitivePayload, 401);
  assert.equal(msg.includes("ya29.a0AfH6SMAxyz1234567890abcdef"), false, "Google OAuth token must be redacted");
  assert.equal(msg.includes("supersecret123"), false, "Secret must be redacted");
  assert.ok(msg.includes("[REDACTED"), "Must include redaction token");
});

// ============================================================================
// TEST 8: HTML error page handling
// ============================================================================
test("extractErrorMessage strips HTML tags from proxy or server error documents", () => {
  const htmlPayload = {
    message: "<html><head><title>502 Bad Gateway</title></head><body>502 Bad Gateway</body></html>",
  };
  const msg = extractErrorMessage(htmlPayload, 502);
  assert.equal(msg, "502 Bad Gateway 502 Bad Gateway");
  assert.equal(msg.includes("<"), false);
  assert.equal(msg.includes(">"), false);
});

// ============================================================================
// TEST 9: Error object properties preservation (status, statusCode, data)
// ============================================================================
test("Constructed Error preserves status, statusCode, and data while holding readable message", () => {
  const responseData = {
    error: {
      code: 403,
      message: "User lacks read access to GA4 property 123456789",
    },
  };
  const responseStatus = 403;

  const message = extractErrorMessage(responseData, responseStatus);
  const error = new Error(message);
  error.status = responseStatus;
  error.statusCode = responseStatus;
  error.data = responseData;

  assert.equal(error.message, "User lacks read access to GA4 property 123456789");
  assert.equal(error.status, 403);
  assert.equal(error.statusCode, 403);
  assert.deepEqual(error.data, responseData);
  assert.notEqual(error.message, "[object Object]");
});

// ============================================================================
// TEST 10: fetchStatusAndProperties simulated flow handling and UI state
// ============================================================================
test("fetchStatusAndProperties simulated error handling sets readable error without [object Object]", async () => {
  function getReadableErrorMessage(err, fallback) {
    const msg = err?.message;
    if (typeof msg === "string" && msg.trim() && msg.trim() !== "[object Object]") {
      return msg.trim();
    }
    return fallback;
  }

  // Simulated failure from apiClient
  const simulatedBackendResponse = {
    error: {
      code: 403,
      message: "Google Analytics scope 'analytics.readonly' required",
    },
  };
  const message = extractErrorMessage(simulatedBackendResponse, 403);
  const err = new Error(message);
  err.status = 403;
  err.data = simulatedBackendResponse;

  let statusError = null;
  try {
    throw err;
  } catch (caughtErr) {
    statusError = getReadableErrorMessage(caughtErr, "Failed to load Google Analytics status");
  }

  assert.equal(statusError, "Google Analytics scope 'analytics.readonly' required");
  assert.notEqual(statusError, "[object Object]");

  // Simulated legacy [object Object] error trapped by fallback
  const legacyErr = new Error("[object Object]");
  const fallbackError = getReadableErrorMessage(legacyErr, "Failed to load Google Analytics status");
  assert.equal(fallbackError, "Failed to load Google Analytics status");
});

// ============================================================================
// TEST 11: End-to-end HTTP request handling via apiClient
// ============================================================================
test("apiClient HTTP request end-to-end preserves 200 payload and transforms 403 Google object into readable error", async () => {
  const { apiClient } = await import("../lib/apiClient.js");
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.growmentum.test";

  const originalFetch = globalThis.fetch;
  let mockStatus = 200;
  let mockHeaders = { "content-type": "application/json" };
  let mockBody = JSON.stringify({ success: true, properties: [{ id: "prop1" }] });

  globalThis.fetch = async () => {
    return new Response(mockBody, {
      status: mockStatus,
      headers: mockHeaders,
    });
  };

  try {
    // 1. Successful 200 JSON response
    const successRes = await apiClient.get("/api/google/analytics/properties");
    assert.equal(successRes.success, true);
    assert.equal(successRes.properties.length, 1);

    // 2. 403 with nested Google API error object: { error: { code: 403, message: "User lacks permission" } }
    mockStatus = 403;
    mockHeaders = { "content-type": "application/json" };
    mockBody = JSON.stringify({
      error: {
        code: 403,
        message: "User lacks read permission for GA4 property",
      },
    });

    let caughtError = null;
    try {
      await apiClient.get("/api/google/analytics/properties");
    } catch (e) {
      caughtError = e;
    }

    assert.ok(caughtError, "Must throw on 403");
    assert.equal(caughtError.message, "User lacks read permission for GA4 property");
    assert.notEqual(caughtError.message, "[object Object]");
    assert.equal(caughtError.status, 403);
    assert.equal(caughtError.statusCode, 403);
    assert.equal(caughtError.data.error.code, 403);

    // 3. 500 with invalid/corrupt JSON response body
    mockStatus = 500;
    mockHeaders = { "content-type": "text/html" };
    mockBody = "<html>500 Internal Error</html>";

    let corruptError = null;
    try {
      await apiClient.get("/api/google/analytics/status");
    } catch (e) {
      corruptError = e;
    }

    assert.ok(corruptError, "Must throw on 500 without crashing JSON parser");
    assert.equal(corruptError.message, "500 Internal Error");
    assert.notEqual(corruptError.message, "[object Object]");
    assert.equal(corruptError.status, 500);

    // 4. 200 with empty body (e.g. 204 or empty response)
    mockStatus = 200;
    mockHeaders = { "content-type": "application/json" };
    mockBody = "";

    const emptyRes = await apiClient.get("/api/google/analytics/empty");
    assert.deepEqual(emptyRes, {}, "Empty response body safely returns empty object");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
