// src/services/api.js
// Coachly backend client — no success-wrapper.

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5050";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function request(method, path, body) {
  console.log("[api] →", method, path);
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
  if (data?.user)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
    return data.user;
  },

  login: async ({ email, password }) => {
    const data = await request("POST", "/api/auth/login", { email, password });
    await saveSession(data);
    return data.user;
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
    // Accepts { gender, age, heightCm, weightKg } — any subset.
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
    // Server rotates tokens — persist the new ones so future requests auth.
    await saveSession(data);
    return data;
  },

  deleteAccount: async () => {
    await request("DELETE", "/api/auth/me");
    await clearSession();
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
    // Controller returns { success: true, data: [...] }
    return data?.data ?? data?.scores ?? [];
  },
};

// Add this to src/services/api.js alongside scoresApi, logsApi, etc.

export const workoutsApi = {
  /** Returns { today: [...], upcoming: [...], past: [...] } */
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
};
// Don't forget to add `workoutsApi` to the default export object too:
//
// export default { authApi, logsApi, scoresApi, workoutsApi, setAuthToken };
export function setAuthToken(_token) {}

export default { authApi, logsApi, scoresApi, setAuthToken };

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
  submit: async ({ type, answers, date }) => {
    return await request("POST", "/api/questionnaires", {
      type,
      answers,
      date,
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
