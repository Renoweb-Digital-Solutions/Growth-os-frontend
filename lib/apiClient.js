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
    const error = new Error(
      `Network error connecting to API: ${netError.message || "Failed to fetch"}`
    );
    error.isNetworkError = true;
    throw error;
  }

  // Parse JSON or text response
  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const textData = await response.text();
    data = textData ? { message: textData } : {};
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed with status ${response.status}`;
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
