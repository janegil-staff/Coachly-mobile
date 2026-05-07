// src/services/api.js
// Coachly backend client — no success-wrapper.
// Auto-refreshes expired access tokens transparently.

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://goldfish-app-8zz97.ondigitalocean.app";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

// ── Refresh coordination ──────────────────────────────────────────────
// If multiple requests fire at once and all hit 401, we want exactly ONE
// refresh round-trip — not N parallel ones that race and overwrite each
// other in SecureStore. inFlightRefresh is a shared promise; concurrent
// callers await the same one.
let inFlightRefresh = null;

// One-shot listener for "refresh failed, please sign out". The auth
// context registers a callback here and gets invoked when the refresh
// token has expired (genuine session end).
let onSessionExpired = null;
export function setOnSessionExpired(fn) {
  onSessionExpired = fn;
}

async function refreshAccessToken() {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh token expired or invalid — genuine session end.
      // Clear local state and notify the auth context.
      await clearSession();
      if (onSessionExpired) {
        try {
          onSessionExpired();
        } catch (e) {
          console.warn("[api] onSessionExpired handler threw:", e);
        }
      }
      throw new Error("Refresh failed");
    }

    const data = await res.json();
    if (data?.accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    }
    if (data?.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
    }
    return data;
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

// Internal: a single network round-trip with the current access token.
// Does NOT handle 401 — the public `request()` wrapper does that.
async function rawRequest(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {}

  return { res, json };
}

async function request(method, path, body) {
  console.log("[api] →", method, path);

  // Don't try to refresh on the refresh endpoint itself, or on auth
  // endpoints that don't require a token. Those should fail outright
  // if they fail.
  const isAuthEndpoint =
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/signup") ||
    path.startsWith("/api/auth/refresh") ||
    path.startsWith("/api/auth/forgot-password") ||
    path.startsWith("/api/auth/reset-password") ||
    path.startsWith("/api/auth/check-email");

  let { res, json } = await rawRequest(method, path, body);

  // If the access token expired, try to refresh once and retry.
  if (res.status === 401 && !isAuthEndpoint) {
    console.log("[api] 401 — attempting token refresh for", path);
    try {
      await refreshAccessToken();
      console.log("[api] refresh OK — retrying", path);
      const retry = await rawRequest(method, path, body);
      res = retry.res;
      json = retry.json;
    } catch (refreshErr) {
      console.warn("[api] refresh failed:", refreshErr?.message);
      // Fall through — the original 401 will propagate as the error below.
    }
  }

  if (!res.ok) {
    const message = json?.error ?? `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = json?.code;
    throw err;
  }
  return json;
}

async function saveSession(data) {
  if (data?.accessToken)
    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
  if (data?.refreshToken)
    await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
  const u = data?.user ?? (data?._id ? data : null);
  if (u) await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
  await AsyncStorage.removeItem(USER_KEY).catch(() => {});
}

export const authApi = {
  checkEmail: async (email) => {
    const data = await request("POST", "/api/auth/check-email", { email });
    return { exists: !!data?.exists };
  },
  deleteAccount: async (pin) => {
    const data = await request("DELETE", "/api/auth/me", { pin });
    await clearSession();
    return data;
  },
  register: async ({
    email,
    password,
    name,
    language,
    role = "client",
    age,
    gender,
    heightCm,
    weightKg,
  }) => {
    const data = await request("POST", "/api/auth/signup", {
      email,
      password,
      name: name ?? email?.split("@")[0] ?? "",
      language: language ?? "en",
      role,
      ...(age != null ? { age } : {}),
      ...(gender ? { gender } : {}),
      ...(heightCm != null ? { heightCm } : {}),
      ...(weightKg != null ? { weightKg } : {}),
    });
    await saveSession(data);
    // Be defensive about response shape — backend may return either:
    //   { user: {...}, accessToken, refreshToken }
    // or the user object directly (with _id at root).
    const u = data?.user ?? (data?._id ? data : null);
    if (!u) {
      throw new Error("Registration succeeded but no user returned");
    }
    return u;
  },

  login: async ({ email, password }) => {
    const data = await request("POST", "/api/auth/login", { email, password });
    await saveSession(data);
    const u = data?.user ?? (data?._id ? data : null);
    if (!u) {
      throw new Error("Login succeeded but no user returned");
    }
    return u;
  },

  forgotPin: async (email) => {
    // Backend always returns 200 (anti-enumeration) — succeed quietly.
    await request("POST", "/api/auth/forgot-password", { email });
    return { ok: true };
  },

  resetPin: async (email, code, newPassword) => {
    // Returns { user, accessToken, refreshToken } same as login.
    // saveSession persists tokens for subsequent requests.
    const data = await request("POST", "/api/auth/reset-password", {
      email,
      code,
      newPassword,
    });
    await saveSession(data);
    const u = data?.user ?? (data?._id ? data : null);
    if (!u) {
      throw new Error("Reset succeeded but no user returned");
    }
    return { ...data, user: u };
  },

  getMe: async () => {
    const token = await getToken();
    if (!token) return null;
    try {
      const data = await request("GET", "/api/auth/me");
      return data?.user ?? data;
    } catch (e) {
      if (e.status === 401) return null;
      throw e;
    }
  },

  logout: async () => {
    try {
      await request("POST", "/api/auth/logout");
    } catch {}
    await clearSession();
  },

  updateProfile: async (fields) => {
    const data = await request("PATCH", "/api/auth/me", fields);
    return data?.user ?? data;
  },

  changeEmail: async ({ newEmail, password }) => {
    const data = await request("PATCH", "/api/auth/change-email", {
      newEmail,
      password,
    });
    return data?.user ?? data;
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    const data = await request("PATCH", "/api/auth/change-password", {
      oldPassword,
      newPassword,
    });
    await saveSession(data);
    return data;
  },
};

export const logsApi = {
  upsert: async (entry) => request("POST", "/api/logs", entry),
  list: async ({ from, to } = {}) => {
    const qs = [];
    if (from) qs.push(`from=${from}`);
    if (to) qs.push(`to=${to}`);
    const suffix = qs.length ? `?${qs.join("&")}` : "";
    const data = await request("GET", `/api/logs${suffix}`);
    return data?.logs ?? [];
  },
  getByDate: async (date) => {
    try {
      const data = await request("GET", `/api/logs/${date}`);
      return data?.entry ?? null;
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  },
  remove: async (date) => request("DELETE", `/api/logs/${date}`),
};

export const scoresApi = {
  list: async ({ from, to } = {}) => {
    const qs = [];
    if (from) qs.push(`from=${from}`);
    if (to) qs.push(`to=${to}`);
    const suffix = qs.length ? `?${qs.join("&")}` : "";
    const data = await request("GET", `/api/scores${suffix}`);
    return data?.data ?? data?.scores ?? [];
  },
};

export const workoutsApi = {
  listUpcoming: async () => {
    const data = await request("GET", "/api/workouts/upcoming");
    return {
      today: data?.today ?? [],
      upcoming: data?.upcoming ?? [],
      past: data?.past ?? [],
    };
  },

  get: async (id) => {
    const data = await request("GET", `/api/workouts/${id}`);
    return data?.workout ?? null;
  },

  complete: async (id, { rpe, feedback } = {}) => {
    const body = {};
    if (rpe != null) body.rpe = rpe;
    if (feedback != null) body.feedback = feedback;
    const data = await request("POST", `/api/workouts/${id}/complete`, body);
    return data?.workout ?? null;
  },

  uncomplete: async (id) => {
    const data = await request("POST", `/api/workouts/${id}/uncomplete`);
    return data?.workout ?? null;
  },
};

export const exercisesApi = {
  listCustom: async () => {
    const data = await request("GET", "/api/exercises/custom");
    return data?.exercises ?? [];
  },
  createCustom: async ({ name, category }) => {
    const data = await request("POST", "/api/exercises/custom", {
      name,
      category,
    });
    return data?.exercise ?? null;
  },
  updateCustom: async (id, patch) => {
    const data = await request("PATCH", `/api/exercises/custom/${id}`, patch);
    return data?.exercise ?? null;
  },
  deleteCustom: async (id) => {
    return request("DELETE", `/api/exercises/custom/${id}`);
  },

  getSelection: async () => {
    const data = await request("GET", "/api/exercises/selection");
    return data?.selectedSlugs ?? [];
  },
  toggleSelection: async (slug) => {
    const data = await request("POST", "/api/exercises/selection/toggle", {
      slug,
    });
    return {
      selectedSlugs: data?.selectedSlugs ?? [],
      selected: !!data?.selected,
    };
  },
  setSelection: async (slugs) => {
    const data = await request("PUT", "/api/exercises/selection", { slugs });
    return data?.selectedSlugs ?? [];
  },
};

export function setAuthToken(_token) {}

export default { authApi, logsApi, scoresApi, workoutsApi, setAuthToken };

export const shareApi = {
  create: async ({ includeNotes = true } = {}) => {
    const data = await request("POST", "/api/share", { includeNotes });
    return data;
  },
  revoke: async () => {
    const data = await request("DELETE", "/api/share");
    return data;
  },
};

export const questionnairesApi = {
  submit: async ({ type, answers, date, scores }) => {
    return await request("POST", "/api/questionnaires", {
      type,
      answers,
      date,
      scores,
    });
  },
  list: async ({ type, limit } = {}) => {
    const qs = [];
    if (type) qs.push("type=" + encodeURIComponent(type));
    if (limit) qs.push("limit=" + limit);
    const suffix = qs.length ? "?" + qs.join("&") : "";
    return await request("GET", "/api/questionnaires" + suffix);
  },
  latest: async (type) => {
    return await request(
      "GET",
      "/api/questionnaires/latest?type=" + encodeURIComponent(type),
    );
  },
};