// Donut/pie chart, hand-rolled SVG.
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 8;
const HOLE = RADIUS * 0.55;

const CATEGORY_COLORS = {
  strength: "#4A7AB5",
  cardio:   "#86B8F2",
  mobility: "#10B981",
  recovery: "#F59E0B",
  other:    "#9CA3AF",
};

function arcPath(cx, cy, r, hole, startAng, endAng) {
  const sx = cx + r * Math.sin(startAng);
  const sy = cy - r * Math.cos(startAng);
  const ex = cx + r * Math.sin(endAng);
  const ey = cy - r * Math.cos(endAng);
  const sx2 = cx + hole * Math.sin(endAng);
  const sy2 = cy - hole * Math.cos(endAng);
  const ex2 = cx + hole * Math.sin(startAng);
  const ey2 = cy - hole * Math.cos(startAng);
  const large = endAng - startAng > Math.PI ? 1 : 0;
  return [
    "M", sx, sy,
    "A", r, r, 0, large, 1, ex, ey,
    "L", sx2, sy2,
    "A", hole, hole, 0, large, 0, ex2, ey2,
    "Z",
  ].join(" ");
}

export default function DonutChart({ slices, theme, totalLabel }) {
  if (!slices || slices.length === 0 || slices.every((s) => !s.minutes)) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No data yet</Text>
      </View>
    );
  }

  const total = slices.reduce((a, b) => a + (b.minutes || 0), 0);
  let cursor = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {slices.map((sl) => {
          if (!sl.minutes) return null;
          const ang = (sl.minutes / total) * 2 * Math.PI;
          const start = cursor;
          const end = cursor + ang;
          cursor = end;
          const color = CATEGORY_COLORS[sl.category] || CATEGORY_COLORS.other;
          return (
            <Path
              key={sl.category}
              d={arcPath(CENTER, CENTER, RADIUS, HOLE, start, end)}
              fill={color}
            />
          );
        })}
        <SvgText
          x={CENTER}
          y={CENTER - 4}
          fontSize={20}
          fontWeight="800"
          fill={theme.text}
          textAnchor="middle"
        >
          {(total / 60).toFixed(1)}
        </SvgText>
        <SvgText
          x={CENTER}
          y={CENTER + 14}
          fontSize={10}
          fontWeight="600"
          fill={theme.textMuted}
          textAnchor="middle"
        >
          {totalLabel || "HOURS"}
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        {slices.map((sl) => (
          <View key={sl.category} style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: CATEGORY_COLORS[sl.category] || CATEGORY_COLORS.other },
              ]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>
              {sl.category} · {Math.round(sl.pct * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
  legend: { marginTop: 10, gap: 4, alignItems: "flex-start" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
});
