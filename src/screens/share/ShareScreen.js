// src/screens/share/ShareScreen.js
// Generates a 6-digit share code valid for 10 minutes. Coach enters it at
// the placeholder URL to view last 30 days of logs + stats.

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { shareApi } from "../../services/api";
import { styles, TOTAL_SECONDS, SHARE_DOMAIN } from "./shareStyles";
import { ArcTimer, BrandBubble } from "./shareComponents";

export default function ShareScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme?.accent ?? "#4A7AB5";

  const [code, setCode] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const expired = secondsLeft === 0;

  const startTimer = useCallback((expiry) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((new Date(expiry) - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  const generateCode = useCallback(
    async (notes = includeNotes) => {
      setLoading(true);
      try {
        const data = await shareApi.create({ includeNotes: notes });
        setCode(data.code);
        startTimer(data.expiresAt);
      } catch (e) {
        Alert.alert(
          "Error",
          t.errorGenCode ?? "Could not generate share code."
        );
      } finally {
        setLoading(false);
      }
    },
    [includeNotes, startTimer, t]
  );

  useEffect(() => {
    generateCode();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareCode = () => {
    if (!code) return;
    const url = `${SHARE_DOMAIN}/${code}`;
    Share.share({
      message: `${t.shareCodeMsg ?? "Your Coachly share code"}: ${code}\n\n${url}`,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: PRIMARY }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.shareData ?? "Share Data"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, alignItems: "center", paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Code card */}
        <TouchableOpacity style={styles.codeCard} onPress={shareCode} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={PRIMARY} size="large" />
          ) : (
            <>
              <Text style={[styles.codeText, { color: expired ? "#ccc" : PRIMARY }]}>
                {code ? code.split("").join(" ") : "— — — — — —"}
              </Text>
              <View style={styles.brandRow}>
                <BrandBubble color={PRIMARY} />
                <Text style={styles.brandText}>
                  <Text style={{ fontWeight: "700", color: PRIMARY }}>COACHLY</Text>
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.description}>
            {t.shareDescription ?? "Secure access to your training report on this website:"}
          </Text>
          {code && (
            <TouchableOpacity onPress={shareCode}>
              <Text style={[styles.shareUrl, { color: PRIMARY }]}>
                {SHARE_DOMAIN}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Include notes toggle */}
        <View style={styles.toggleRow}>
          <Switch
            value={includeNotes}
            onValueChange={(val) => {
              setIncludeNotes(val);
              generateCode(val);
            }}
            trackColor={{ false: "#D1D5DB", true: PRIMARY }}
            thumbColor="#fff"
            ios_backgroundColor="#D1D5DB"
          />
          <Text style={[styles.toggleLabel, { color: PRIMARY }]}>
            {t.sharePersonalNotes ?? "Include personal notes"}
          </Text>
        </View>

        {/* Timer card */}
        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <Svg width="18" height="18" viewBox="0 0 24 24">
              <Circle
                cx="12" cy="12" r="9" fill="none"
                stroke={expired ? "#ccc" : PRIMARY}
                strokeWidth="1.5"
              />
              <Path
                d="M12 7 L12 12 L15 14"
                stroke={expired ? "#ccc" : PRIMARY}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.timerLabel, { color: expired ? "#ccc" : PRIMARY }]}>
              {expired
                ? (t.codeExpired ?? "Code has expired")
                : (t.codeValidFor ?? "Valid for 10 minutes")}
            </Text>
          </View>
          <ArcTimer secondsLeft={secondsLeft} color={expired ? "#D1D5DB" : PRIMARY} />
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={() => generateCode()}
            disabled={loading}
            style={styles.generateBtn}
          >
            {loading ? (
              <ActivityIndicator color={PRIMARY} />
            ) : (
              <Text style={[styles.generateText, { color: PRIMARY }]}>
                {(t.generateNewCode ?? "GENERATE NEW CODE").toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
