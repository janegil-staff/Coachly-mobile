// src/services/api.js
// Coachly backend client. Based on Recover's api.js pattern.

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://monkfish-app-qjb62.ondigitalocean.app";

async function getToken() {
  return SecureStore.getItemAsync("token");
}

async function request(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Request failed");
  return json.data ?? json;
}

async function saveTokens(data) {
  if (data.token) await SecureStore.setItemAsync("token", data.token);
  if (data.refreshToken)
    await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  if (data.user) await AsyncStorage.setItem("user", JSON.stringify(data.user));
}

async function clearSession() {
  await SecureStore.deleteItemAsync("token").catch(() => {});
  await SecureStore.deleteItemAsync("refreshToken").catch(() => {});
  await AsyncStorage.removeItem("user").catch(() => {});
}

// ── authApi ───────────────────────────────────────────────────────────────
export const authApi = {
  register: async ({
    email,
    password,
    name,
    language,
    age,
    gender,
    height,
    weight,
  }) => {
    if (!email) throw new Error("Email is required");
    const payload = {
      email,
      password,
      name: name ?? (typeof email === "string" ? email.split("@")[0] : "") ?? "",
      language: language ?? "en",
      age: age ?? 0,
      gender: gender ?? "other",
      height: height ?? 0,
      weight: weight ?? 0,
    };
    const data = await request("POST", "/api/auth/register", payload);
    await saveTokens(data);
    return data.user;
  },

  login: async ({ email, password }) => {
    const data = await request("POST", "/api/auth/login", { email, password });
    await saveTokens(data);
    return data.user;
  },

  getMe: async () => {
    const token = await getToken();
    if (!token) return null;
    try {
      return await request("GET", "/api/auth/me");
    } catch {
      return null;
    }
  },

  logout: async () => {
    await clearSession();
  },

  deleteAccount: async () => {
    await request("DELETE", "/api/auth/account");
    await clearSession();
  },

  requestPasswordReset: async (email) =>
    request("POST", "/api/auth/forgot-password", { email }),

  verifyResetCode: async (email, code) =>
    request("POST", "/api/auth/forgot-password/verify", { email, code }),

  resetPassword: async (email, code, newPassword) =>
    request("POST", "/api/auth/forgot-password/reset", {
      email,
      code,
      newPassword,
    }),

  checkEmail: async (email) => {
    try {
      await request("POST", "/api/auth/check-email", { email });
      return { exists: false };
    } catch (e) {
      if (e.message?.toLowerCase().includes("already")) return { exists: true };
      throw e;
    }
  },
};

// Keep setAuthToken available for older imports that might still reference it
export function setAuthToken(_token) {
  // Legacy no-op: token is read from SecureStore on each request().
}

export default { authApi, setAuthToken };
