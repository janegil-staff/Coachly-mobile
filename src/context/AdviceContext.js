// src/context/AdviceContext.js
// Builds the advice list from translations, tracks viewed/relevant state
// (synced with user.clientProfile), and exposes unreadCount for the bulb badge.

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useLang } from "./LangContext";
import { authApi } from "../services/api";

const AdviceContext = createContext(null);

// Canonical list of advice IDs and their categories.
// Titles/bodies live in translations.js as advice_<id>_title / advice_<id>_body.
export const ADVICE_KEYS = [
  { id: "t1", category: "training" },
  { id: "t2", category: "training" },
  { id: "t3", category: "training" },
  { id: "r1", category: "recovery" },
  { id: "r2", category: "recovery" },
  { id: "r3", category: "recovery" },
  { id: "n1", category: "nutrition" },
  { id: "n2", category: "nutrition" },
  { id: "n3", category: "nutrition" },
  { id: "s1", category: "sleep" },
  { id: "s2", category: "sleep" },
  { id: "s3", category: "sleep" },
  { id: "m1", category: "mindset" },
  { id: "m2", category: "mindset" },
  { id: "m3", category: "mindset" },
  { id: "v1", category: "motivation" },
  { id: "v2", category: "motivation" },
  { id: "v3", category: "motivation" },
];

export const CATEGORIES = [
  "training",
  "recovery",
  "nutrition",
  "sleep",
  "mindset",
  "motivation",
];

export function AdviceProvider({ children }) {
  const { user, updateUser } = useAuth();
  const { t } = useLang();

  const viewed = useMemo(
    () => new Set(user?.clientProfile?.viewedAdvice ?? []),
    [user?.clientProfile?.viewedAdvice]
  );
  const relevant = useMemo(
    () => new Set(user?.clientProfile?.relevantAdvice ?? []),
    [user?.clientProfile?.relevantAdvice]
  );

  const items = useMemo(
    () =>
      ADVICE_KEYS.map(({ id, category }) => ({
        id,
        category,
        title: t[`advice_${id}_title`] ?? id,
        body: t[`advice_${id}_body`] ?? "",
      })),
    [t]
  );

  // Unread = total tips not yet viewed
  const unreadCount = items.length - viewed.size;

  const markViewed = useCallback(
    async (id) => {
      if (viewed.has(id)) return;
      const next = Array.from(new Set([...viewed, id]));
      // Optimistic update
      updateUser({
        clientProfile: {
          ...(user?.clientProfile ?? {}),
          viewedAdvice: next,
        },
      });
      try {
        const updated = await authApi.updateProfile({ viewedAdvice: next });
        if (updated) updateUser(updated);
      } catch (e) {
        console.warn("markViewed failed:", e?.message);
      }
    },
    [viewed, user?.clientProfile, updateUser]
  );

  const toggleRelevant = useCallback(
    async (id) => {
      const isRelevant = relevant.has(id);
      const next = isRelevant
        ? Array.from(relevant).filter((x) => x !== id)
        : Array.from(new Set([...relevant, id]));
      updateUser({
        clientProfile: {
          ...(user?.clientProfile ?? {}),
          relevantAdvice: next,
        },
      });
      try {
        const updated = await authApi.updateProfile({ relevantAdvice: next });
        if (updated) updateUser(updated);
      } catch (e) {
        console.warn("toggleRelevant failed:", e?.message);
      }
    },
    [relevant, user?.clientProfile, updateUser]
  );

  const isViewed = useCallback((id) => viewed.has(id), [viewed]);
  const isRelevant = useCallback((id) => relevant.has(id), [relevant]);

  return (
    <AdviceContext.Provider
      value={{
        items,
        unreadCount,
        markViewed,
        toggleRelevant,
        isViewed,
        isRelevant,
        categories: CATEGORIES,
      }}
    >
      {children}
    </AdviceContext.Provider>
  );
}

export function useAdvice() {
  const ctx = useContext(AdviceContext);
  if (!ctx) throw new Error("useAdvice must be used within AdviceProvider");
  return ctx;
}
