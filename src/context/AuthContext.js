// src/context/AuthContext.js
// Provides authentication state and auth actions.
// Stores token + user in SecureStore.
// Wires to the backend via services/api.js (created in step 4).

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api, { setAuthToken } from "../services/api";

const TOKEN_KEY = "coachly_token";
const USER_KEY = "coachly_user";

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from SecureStore on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
        }
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.warn("Auth hydrate failed:", err?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (nextToken, nextUser) => {
    if (nextToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
      setAuthToken(nextToken);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
    }
    if (nextUser) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    if (!data?.token || !data?.user) {
      throw new Error("Invalid server response");
    }
    await persist(data.token, data.user);
    return data.user;
  };

  const register = async ({ email, password, name, role }) => {
    const { data } = await api.post("/api/auth/register", {
      email,
      password,
      name,
      role,
    });
    if (!data?.token || !data?.user) {
      throw new Error("Invalid server response");
    }
    await persist(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout").catch(() => {}); // best-effort
    } finally {
      await persist(null, null);
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      if (data?.user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch {
      // 401 → clear session
      await persist(null, null);
    }
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;