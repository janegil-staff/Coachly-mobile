import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    authApi
      .getMe()
      .then((u) => setUser(u ?? null))
      .catch(() => setUser(null))
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
        setPinVerified(true);
        setUser(u);
        return u;
      }
    }

    const u = await authApi.login({ email: cleanEmail, password: pin });
    await SecureStore.setItemAsync("userPin", pin);
    await SecureStore.setItemAsync("userEmail", cleanEmail);
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
    await SecureStore.setItemAsync("userEmail", cleanEmail);
    await SecureStore.setItemAsync("userPin", password);
    setIsNewUser(true);
    setPinVerified(true);
    setUser(u);
    return u;
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
    setPinVerified(false);
    setUser(null);
  };

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
