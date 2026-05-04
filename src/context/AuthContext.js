// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Tracks whether the user manually authed (login/register) before the
  // initial getMe() resolves, so we don't clobber a fresh user with null.
  const authedManually = useRef(false);

  useEffect(() => {
    authApi
      .getMe()
      .then((u) => {
        if (authedManually.current) return;
        setUser(u ?? null);
      })
      .catch(() => {
        if (authedManually.current) return;
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, pin) => {
    const cleanEmail = email.trim().toLowerCase();
    const storedPin = await SecureStore.getItemAsync("userPin");
    const storedEmail = await SecureStore.getItemAsync("userEmail");
    const cleanStored = (storedEmail ?? "").trim().toLowerCase();

    if (storedPin && cleanStored && cleanEmail === cleanStored) {
      if (pin !== storedPin) throw new Error("Incorrect PIN");
      const u = await authApi.getMe();
      if (u) {
        authedManually.current = true;
        setPinVerified(true);
        setUser(u);
        return u;
      }
    }

    const u = await authApi.login({ email: cleanEmail, password: pin });
    if (!u) throw new Error("Login failed: no user returned");
    await SecureStore.setItemAsync("userPin", pin);
    await SecureStore.setItemAsync("userEmail", cleanEmail);
    authedManually.current = true;
    setPinVerified(true);
    setUser(u);
    return u;
  };

  const register = async ({
    email,
    password,
    name,
    language,
    age,
    gender,
    height,
    weight,
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const u = await authApi.register({
      email: cleanEmail,
      password,
      name,
      language,
      role: "client",
      age: age != null ? Number(age) : undefined,
      gender,
      heightCm: height != null ? Number(height) : undefined,
      weightKg: weight != null ? Number(weight) : undefined,
    });

    if (!u) {
      throw new Error("Registration failed: no user returned");
    }

    await SecureStore.setItemAsync("userEmail", cleanEmail);
    await SecureStore.setItemAsync("userPin", password);

    authedManually.current = true;
    setIsNewUser(true);
    setPinVerified(true);
    setUser(u);
    setLoading(false);
    return u;
  };

  /**
   * Called by ResetPinScreen after the backend has returned a fresh session.
   *
   * The reset endpoint already issued tokens and (via authApi.resetPin) the
   * api layer should have stored them — same way `authApi.login` does. All
   * we need to do here is mirror what `login` does for state:
   *   - persist the new PIN + email to SecureStore
   *   - flip pinVerified / authedManually
   *   - set the user object
   *
   * Takes the email + new pin so SecureStore stays consistent with what the
   * user just chose, and the resolved `user` object from the API response.
   */
  const loginAfterReset = async ({ email, pin, user: resetUser }) => {
    const cleanEmail = (email ?? "").trim().toLowerCase();
    if (!cleanEmail || !pin || !resetUser) {
      throw new Error("loginAfterReset: missing email, pin, or user");
    }
    await SecureStore.setItemAsync("userPin", pin);
    await SecureStore.setItemAsync("userEmail", cleanEmail);
    authedManually.current = true;
    setPinVerified(true);
    setIsNewUser(false);
    setUser(resetUser);
    setLoading(false);
    return resetUser;
  };

  const savePin = async (pin) => {
    await SecureStore.setItemAsync("userPin", pin);
    const email = user?.email ?? (await SecureStore.getItemAsync("userEmail"));
    if (email)
      await SecureStore.setItemAsync("userEmail", email.trim().toLowerCase());
  };

  const updateUser = (data) =>
    setUser((prev) => (prev ? { ...prev, ...data } : prev));

  const logout = async () => {
    await authApi.logout();
    authedManually.current = false;
    setPinVerified(false);
    setIsNewUser(false);
    setUser(null);
  };

  const logoutAndClearPin = async () => {
    await authApi.logout();
    await SecureStore.deleteItemAsync("userPin").catch(() => {});
    await SecureStore.deleteItemAsync("userEmail").catch(() => {});
    authedManually.current = false;
    setPinVerified(false);
    setIsNewUser(false);
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
        loginAfterReset,
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