// src/screens/share/shareComponents.js
import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Path, Rect, Line } from "react-native-svg";
import { TOTAL_SECONDS } from "./shareStyles";

export function ArcTimer({
  secondsLeft,
  total = TOTAL_SECONDS,
  color,
  bgColor = "#e8eef5", // theme.surfaceAlt should be passed by callers
}) {
  const SIZE = 200;
  const STROKE = 10;
  const R = (SIZE - STROKE) / 2;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const START_DEG = 160;
  const SPAN = 220;
  const arcDeg = Math.max(0, secondsLeft / total) * SPAN;

  function polarToXY(deg) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
  }
  function arcPath(fromDeg, toDeg) {
    const from = polarToXY(fromDeg);
    const to = polarToXY(toDeg);
    const span = (toDeg - fromDeg + 360) % 360;
    return `M ${from.x} ${from.y} A ${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${to.x} ${to.y}`;
  }

  const bgPath = arcPath(START_DEG, START_DEG + SPAN);
  const fgPath = arcDeg > 1 ? arcPath(START_DEG, START_DEG + arcDeg) : null;
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE}>
        <Path d={bgPath} stroke={bgColor} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        {fgPath && <Path d={fgPath} stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />}
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 36, fontWeight: "800", color, letterSpacing: 2 }}>
          {mins}:{secs}
        </Text>
      </View>
    </View>
  );
}

export function BrandBubble({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24">
      <Path
        d="M12 2 C7 2 3 6 3 12 C3 15 4.5 17.5 6.5 19 L6.5 22 L9.5 20 C10.3 20.3 11.1 20.5 12 20.5 C17 20.5 21 16.5 21 11.5 C21 6.5 17 2.5 12 2 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <Circle cx="9" cy="12" r="1.2" fill={color} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
      <Circle cx="15" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

// ── Tab icons ─────────────────────────────────────────────────────────────

export function IconCode({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.5" />
      <Line x1="7" y1="13" x2="10" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="7" y1="16" x2="14" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconQuestionnaire({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconStudies({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 L22 8 L12 13 L2 8 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <Path d="M6 10.5 L6 16 C6 16 9 19 12 19 C15 19 18 16 18 16 L18 10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Line x1="22" y1="8" x2="22" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}