// src/services/api.js
// Axios instance for the Coachly backend.
// Single source of truth for baseURL, timeouts, and auth header.
// The token is set imperatively via setAuthToken() from AuthContext.

import axios from "axios";
import Constants from "expo-constants";

/**
 * Resolve the backend base URL.
 *
 * Priority:
 *   1. app.json → expo.extra.apiUrl  (recommended)
 *   2. EXPO_PUBLIC_API_URL env var    (fallback for local dev)
 *   3. Hardcoded localhost             (last resort)
 *
 * IMPORTANT for device testing:
 *   - iOS simulator: "http://localhost:4000" works
 *   - Android emulator: use "http://10.0.2.2:4000"
 *   - Real phone on WiFi: use your Mac's LAN IP, e.g. "http://192.168.1.42:4000"
 */
function resolveBaseUrl() {
  const fromExtra = Constants?.expoConfig?.extra?.apiUrl;
  if (fromExtra) return fromExtra;

  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  return "http://localhost:4000";
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Set or clear the Authorization header for all subsequent requests.
 * Called by AuthContext after login/logout/hydrate.
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/**
 * Optional: a response interceptor to normalize errors.
 * Leaves 401s to AuthContext.refreshUser() to handle.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Network error (no response)
    if (!err.response) {
      return Promise.reject({
        code: "NETWORK",
        message: "No response from server",
        original: err,
      });
    }
    return Promise.reject(err);
  },
);

export default api;
