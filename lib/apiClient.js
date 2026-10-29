// Reason: Centralized API client for GrowthOS frontend communicating with backend server.
// How: Wraps native fetch, enforces NEXT_PUBLIC_API_BASE_URL, attaches JWT Bearer token from localStorage,
//      handles JSON serialization/deserialization, and normalizes HTTP errors while preserving backend response structures.

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Configuration Error: NEXT_PUBLIC_API_BASE_URL environment variable is missing."
    );
  }
  return baseUrl.replace(/\/+$/, "");
};

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Sanitizes an error message string to remove any credentials, tokens, or secrets.
 */
function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== "string") return "";
  return msg
    .replace(/(?:bearer|access_token|token|secret|client_secret|api_key|apikey)=?[^\s&"']+/gi, "[REDACTED]")
    .replace(/ya29\.[A-Za-z0-9_-]{20,}/g, "[REDACTED_TOKEN]")
    .replace(/EA[A-Za-z0-9]{20,}/g, "[REDACTED_TOKEN]");
}

/**
 * Validates and strips HTML tags from candidate error strings, rejecting empty strings or "[object Object]".
 */
function cleanStringMessage(str) {
  if (typeof str !== "string") return "";
  const trimmed = str.trim();
  if (!trimmed || trimmed === "[object Object]") return "";
  // Strip HTML tags if server returned an HTML error document
  if (trimmed.includes("<") && trimmed.includes(">")) {
    const textOnly = trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return textOnly.length > 0 && textOnly.length < 300 && textOnly !== "[object Object]" ? textOnly : "";
  }
  return trimmed;
}

/**
 * Safely extracts a human-readable, non-empty error message from response data.
 * Guarantees a string return value that is never "[object Object]".
 */
export function extractErrorMessage(data, status) {
  const fallback = `Request failed with status ${status}`;

  if (!data) return fallback;

  // 1. Prefer a valid, non-empty data.message string
  const cleanMsg = cleanStringMessage(data.message);
  if (cleanMsg) {
    return sanitizeErrorMessage(cleanMsg);
  }

  // 2. data.error as a string
  const cleanErrStr = cleanStringMessage(data.error);
  if (cleanErrStr) {
    return sanitizeErrorMessage(cleanErrStr);
  }

  // 3. data.error as an object (e.g. Google API, Express, or OAuth format)
  if (data.error && typeof data.error === "object") {
    // 3a. data.error.message (e.g. { error: { message: "The caller does not have permission", code: 403 } })
    const nestedMsg = cleanStringMessage(data.error.message);
    if (nestedMsg) {
      return sanitizeErrorMessage(nestedMsg);
    }
    // 3b. OAuth description (e.g. { error: { error_description: "..." } })
    const nestedOAuthDesc = cleanStringMessage(data.error.error_description || data.error.description);
    if (nestedOAuthDesc) {
      return sanitizeErrorMessage(nestedOAuthDesc);
    }
    // 3c. Google API nested errors array (e.g. { error: { errors: [{ message: "..." }] } })
    if (Array.isArray(data.error.errors) && data.error.errors.length > 0) {
      const first = data.error.errors[0];
      const arrayMsg = cleanStringMessage(typeof first === "string" ? first : first?.message);
      if (arrayMsg) {
        return sanitizeErrorMessage(arrayMsg);
      }
    }
    // 3d. Non-numeric error status (e.g. { error: { status: "PERMISSION_DENIED" } })
    const statusStr = cleanStringMessage(data.error.status);
    if (statusStr && isNaN(Number(statusStr))) {
      return sanitizeErrorMessage(statusStr);
    }
  }

  // 4. Top-level OAuth error_description
  const oAuthDesc = cleanStringMessage(data.error_description);
  if (oAuthDesc) {
    return sanitizeErrorMessage(oAuthDesc);
  }

  // 5. Common validation errors: data.errors
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    const arrayMsg = cleanStringMessage(typeof first === "string" ? first : first?.message);
    if (arrayMsg) {
      return sanitizeErrorMessage(arrayMsg);
    }
  } else {
    const errorsStr = cleanStringMessage(data.errors);
    if (errorsStr) {
      return sanitizeErrorMessage(errorsStr);
    }
  }

  // 6. If data itself is a string
  const dataAsStr = cleanStringMessage(data);
  if (dataAsStr) {
    return sanitizeErrorMessage(dataAsStr);
  }

  return fallback;
}

async function request(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const headers = {
    ...(options.headers || {}),
  };

  // Automatically attach JWT token if present
  const token = getAuthToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set Content-Type to application/json if body is passed and not FormData
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    typeof options.body === "object"
  ) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  } else if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netError) {
    if (netError.name === "AbortError") {
      throw netError;
    }
    const error = new Error(
      `Network error connecting to API: ${netError.message || "Failed to fetch"}`
    );
    error.isNetworkError = true;
    throw error;
  }

  // Parse JSON or text response safely
  let data;
  const contentType = response.headers?.get?.("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (typeof response.json === "function" && isJson) {
    try {
      data = await response.json();
    } catch {
      // If response.json() fails (e.g. empty body or invalid JSON), fallback to text if available
      if (typeof response.text === "function") {
        try {
          const textData = await response.text();
          data = textData && textData.trim() ? { message: textData.trim() } : {};
        } catch {
          data = {};
        }
      } else {
        data = {};
      }
    }
  } else if (typeof response.text === "function") {
    try {
      const textData = await response.text();
      if (textData && textData.trim()) {
        try {
          data = JSON.parse(textData);
        } catch {
          data = { message: textData.trim() };
        }
      } else {
        data = {};
      }
    } catch {
      data = {};
    }
  } else if (typeof response.json === "function") {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    data = {};
  }

  if (!response.ok) {
    const message = extractErrorMessage(data, response.status);
    const error = new Error(message);
    error.status = response.status;
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  get(endpoint, queryParams, options = {}) {
    let finalEndpoint = endpoint;
    if (queryParams && typeof queryParams === "object") {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalEndpoint += (endpoint.includes("?") ? "&" : "?") + queryString;
      }
    }
    return request(finalEndpoint, { ...options, method: "GET" });
  },

  post(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: "POST", body });
  },

  put(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: "PUT", body });
  },

  patch(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: "PATCH", body });
  },

  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: "DELETE" });
  },
};

export default apiClient;
