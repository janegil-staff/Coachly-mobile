// src/context/AuthContext.js
// Recover-style auth: PIN as credential, local-first PIN verification.

import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Hydrate on mount: if there's a stored token, fetch the user.
  useEffect(() => {
    authApi
      .getMe()
      .then((u) => setUser(u ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Login with email + PIN.
   * If the same email has a stored PIN locally, validate the PIN against
   * SecureStore first (no network call on success). Otherwise, fall back
   * to the backend.
   */
  const login = async (email, pin) => {
    const cleanEmail = email.trim().toLowerCase();
    const storedPin = await SecureStore.getItemAsync("userPin");
    const storedEmail = await SecureStore.getItemAsync("userEmail");
    const cleanStored = (storedEmail ?? "").trim().toLowerCase();

    if (storedPin && cleanStored && cleanEmail === cleanStored) {
      // Same email — validate PIN locally first
      if (pin !== storedPin) throw new Error("Incorrect PIN");
      const u = await authApi.getMe();
      if (u) {
        setPinVerified(true);
        setUser(u);
        return u;
      }
      // Token invalid → fall through to server login
    }

    // Different email or no stored session — go to server
    const u = await authApi.login({ email: cleanEmail, password: pin });
    await SecureStore.setItemAsync("userPin", pin);
    await SecureStore.setItemAsync("userEmail", cleanEmail);
    setPinVerified(true);
    setUser(u);
    return u;
  };

  /**
   * Register a new account. Called from RegisterScreen with the full payload
   * (email, password=pin, name, language, age, gender, height, weight).
   */
  const register = async (data) => {
    const u = await authApi.register(data);
    const cleanEmail = data.email.trim().toLowerCase();
    await SecureStore.setItemAsync("userEmail", cleanEmail);
    await SecureStore.setItemAsync("userPin", data.password);
    setIsNewUser(true);
    setPinVerified(true);
    setUser(u);
    return u;
  };

  /**
   * Save a PIN that was set after registration (e.g. from PIN setup in Profile).
   */
  const savePin = async (pin) => {
    await SecureStore.setItemAsync("userPin", pin);
    const email =
      user?.email ?? (await SecureStore.getItemAsync("userEmail"));
    if (email) {
      await SecureStore.setItemAsync("userEmail", email.trim().toLowerCase());
    }
  };

  const updateUser = (data) =>
    setUser((prev) => (prev ? { ...prev, ...data } : prev));

  /**
   * Sign out but keep the stored PIN (so user can PIN back in next launch
   * with the same email).
   */
  const logout = async () => {
    await authApi.logout();
    setPinVerified(false);
    setUser(null);
  };

  /**
   * Full sign-out — clears email and PIN too (used for "Forgot PIN").
   */
  const logoutAndClearPin = async () => {
    await authApi.logout();
    await SecureStore.deleteItemAsync("userPin").catch(() => {});
    await SecureStore.deleteItemAsync("userEmail").catch(() => {});
    setPinVerified(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pinVerified,
        isNewUser,
        setPinVerified,
        setIsNewUser,
        updateUser,
        login,
        register,
        logout,
        logoutAndClearPin,
        savePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
