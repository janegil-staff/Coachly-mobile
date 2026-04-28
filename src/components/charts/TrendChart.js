// Multi-line trend chart, hand-rolled SVG.
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Line, Text as SvgText, Circle } from "react-native-svg";

const HEIGHT = 200;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 28;

export default function TrendChart({
  series,        // [{ key, label, color, data: [{x, y}] }, ...]
  theme,
  yMin = 1,
  yMax = 5,
  yTicks = [1, 2, 3, 4, 5],
}) {
  const width = Dimensions.get("window").width - 80;

  const allTimes = useMemo(() => {
    const xs = [];
    for (const s of series || []) for (const p of s.data || []) xs.push(p.x);
    return xs;
  }, [series]);

  if (!allTimes.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No data yet</Text>
      </View>
    );
  }

  const minX = Math.min(...allTimes);
  const maxX = Math.max(...allTimes);
  const xRange = Math.max(1, maxX - minX);
  const yRange = yMax - yMin;
  const innerW = width - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  const xAt = (x) => PAD_L + ((x - minX) / xRange) * innerW;
  const yAt = (y) => PAD_T + innerH - ((y - yMin) / yRange) * innerH;

  // Tick labels: start, mid, end
  const xLabels = [
    { x: minX, label: new Date(minX).toLocaleDateString(undefined, { month: "short", day: "numeric" }) },
    { x: minX + xRange / 2, label: "" },
    { x: maxX, label: new Date(maxX).toLocaleDateString(undefined, { month: "short", day: "numeric" }) },
  ];

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={HEIGHT}>
        {/* Y grid */}
        {yTicks.map((y) => (
          <React.Fragment key={"yg-" + y}>
            <Line
              x1={PAD_L} y1={yAt(y)}
              x2={width - PAD_R} y2={yAt(y)}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <SvgText
              x={PAD_L - 6}
              y={yAt(y) + 3}
              fontSize={9}
              fill={theme.textMuted}
              textAnchor="end"
            >
              {y}
            </SvgText>
          </React.Fragment>
        ))}
        {/* X labels */}
        {xLabels.map((l, i) => (
          l.label ? (
            <SvgText
              key={"xl-" + i}
              x={xAt(l.x)}
              y={HEIGHT - PAD_B + 14}
              fontSize={9}
              fill={theme.textMuted}
              textAnchor="middle"
            >
              {l.label}
            </SvgText>
          ) : null
        ))}
        {/* Series lines */}
        {(series || []).map((s) => {
          const pts = (s.data || []).map((p) => xAt(p.x) + "," + yAt(p.y)).join(" ");
          return (
            <Polyline
              key={s.key}
              points={pts}
              stroke={s.color}
              strokeWidth={2}
              fill="none"
            />
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {(series || []).map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "stretch" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: "600" },
});
