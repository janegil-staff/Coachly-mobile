// src/screens/onboarding/OnboardingScreen.js
// 5-slide horizontal pager onboarding. Mirrors Recover's structure.
// Illustration placeholders use Ionicons — swap for <Image source={...} /> later.

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";

const { width } = Dimensions.get("window");

const SLIDE_DEFS = [
  {
    key: "slide1",
    icon: "flash-outline",
    image: require("../../../assets/onboarding/slide1.png"),
  },
  {
    key: "slide2",
    icon: "create-outline",
    image: require("../../../assets/onboarding/slide2.png"),
  },
  {
    key: "slide3",
    icon: "people-outline",
    image: require("../../../assets/onboarding/slide3.png"),
  },
  {
    key: "slide4",
    icon: "trending-up-outline",
    image: require("../../../assets/onboarding/slide4.png"),
  },
  {
    key: "slide5",
    icon: "checkmark-circle-outline",
    image: require("../../../assets/onboarding/slide5.png"),
  },
];

export default function OnboardingScreen({ onDone }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);

  const isLast = page === SLIDE_DEFS.length - 1;

  const goTo = (idx) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const onMomentumEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== page) setPage(idx);
  };

  const handleNext = () => {
    if (isLast) {
      onDone?.();
    } else {
      goTo(page + 1);
    }
  };

  const handleSkip = () => onDone?.();

  const slides = SLIDE_DEFS.map((def) => ({
    ...def,
    title: t[`onb${Number(def.key.replace('slide','')) }Title`],
    body: t[`onb${Number(def.key.replace('slide','')) }Body`],
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      {/* Skip in top-right */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} hitSlop={16}>
            <Text style={[styles.skip, { color: theme.textSecondary }]}>
              {t.skip}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        bounces={false}
        style={styles.pager}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            {/* Illustration placeholder — replace with <Image> later */}
            <Image
              source={slide.image}
              style={{ width: 260, height: 260, marginBottom: 48 }}
              resizeMode="contain"
            />

            <Text style={[styles.title, { color: theme.text }]}>
              {slide.title}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === page ? theme.accent : theme.border,
                width: i === page ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next / Get started */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={[styles.button, { backgroundColor: theme.accent }]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: theme.buttonPrimaryText },
            ]}
          >
            {isLast ? t.getStarted : t.next}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    height: 56,
    alignItems: "flex-start",
  },
  skip: { fontSize: 16, fontWeight: "500" },
  pager: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
