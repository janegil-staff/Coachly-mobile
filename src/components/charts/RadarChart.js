// src/components/charts/RadarChart.js
// 5-axis spider chart, hand-rolled SVG.
// Each axis is 1-5 scale; values < 1 are clamped to 0 for rendering.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";

const SIZE = 260;
const PADDING = 40;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - PADDING;
const RINGS = 5; // 1, 2, 3, 4, 5

function pointAt(angle, distance) {
  // angle in radians, 0 = up, clockwise
  const x = CENTER + Math.sin(angle) * distance;
  const y = CENTER - Math.cos(angle) * distance;
  return { x, y };
}

export default function RadarChart({ axes, accentColor = "#4A7AB5", textColor = "#1A2F4A", mutedColor = "#9CA3AF", gridColor = "#E5E7EB" }) {
  // axes: [{ axis: 'Effort', value: 3.4, raw: 3.4 }, ...]
  if (!axes || axes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: mutedColor }]}>No data yet</Text>
      </View>
    );
  }

  const N = axes.length;
  const angles = axes.map((_, i) => (2 * Math.PI * i) / N);

  // Grid rings
  const rings = [];
  for (let r = 1; r <= RINGS; r++) {
    const dist = (r / RINGS) * RADIUS;
    const pts = angles.map((a) => pointAt(a, dist));
    rings.push(pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
  }

  // Axis lines
  const axisLines = angles.map((a) => pointAt(a, RADIUS));

  // Data polygon
  const dataPoints = angles.map((a, i) => {
    const v = Math.max(0, Math.min(5, Number(axes[i].value) || 0));
    const dist = (v / 5) * RADIUS;
    return pointAt(a, dist);
  });
  const dataStr = dataPoints.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");

  // Labels (outside the outer ring)
  const labels = angles.map((a, i) => {
    const p = pointAt(a, RADIUS + 18);
    return { x: p.x, y: p.y, text: axes[i].axis, value: axes[i].raw };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {/* Grid rings */}
        {rings.map((pts, idx) => (
          <Polygon
            key={"ring-" + idx}
            points={pts}
            fill="none"
            stroke={gridColor}
            strokeWidth={idx === RINGS - 1 ? 1.5 : 1}
          />
        ))}
        {/* Axis lines */}
        {axisLines.map((p, idx) => (
          <Line
            key={"axis-" + idx}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {/* Data area */}
        <Polygon
          points={dataStr}
          fill={accentColor}
          fillOpacity={0.25}
          stroke={accentColor}
          strokeWidth={2.5}
        />
        {/* Data points */}
        {dataPoints.map((p, idx) => (
          <Circle
            key={"pt-" + idx}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={accentColor}
          />
        ))}
        {/* Labels */}
        {labels.map((l, idx) => (
          <SvgText
            key={"lbl-" + idx}
            x={l.x}
            y={l.y}
            fontSize={11}
            fontWeight="700"
            fill={textColor}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {l.text.toUpperCase()}
          </SvgText>
        ))}
      </Svg>

      {/* Legend with raw values */}
      <View style={styles.legend}>
        {axes.map((a) => (
          <View key={a.axis} style={styles.legendItem}>
            <Text style={[styles.legendLabel, { color: mutedColor }]}>
              {a.axis}
            </Text>
            <Text style={[styles.legendValue, { color: textColor }]}>
              {a.raw != null ? Number(a.raw).toFixed(1) : "–"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
    gap: 12,
  },
  legendItem: { alignItems: "center", minWidth: 50 },
  legendLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  legendValue: { fontSize: 14, fontWeight: "800", marginTop: 1 },
});
