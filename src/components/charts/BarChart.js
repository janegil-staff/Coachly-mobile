// Vertical bar chart, hand-rolled SVG.
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";

const HEIGHT = 200;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 28;

export default function BarChart({ data, theme, valueKey = "minutes", labelKey = "label" }) {
  const width = Dimensions.get("window").width - 80;

  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No data yet</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  const innerW = width - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;
  const slot = innerW / data.length;
  const barW = Math.max(4, slot * 0.6);

  // Y ticks at 0, 50%, 100%
  const ticks = [0, max / 2, max];

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={HEIGHT}>
        {ticks.map((t, i) => (
          <React.Fragment key={"t-" + i}>
            <Line
              x1={PAD_L}
              y1={PAD_T + innerH - (t / max) * innerH}
              x2={width - PAD_R}
              y2={PAD_T + innerH - (t / max) * innerH}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray={i === 0 ? null : "3,3"}
            />
            <SvgText
              x={PAD_L - 6}
              y={PAD_T + innerH - (t / max) * innerH + 3}
              fontSize={9}
              fill={theme.textMuted}
              textAnchor="end"
            >
              {Math.round(t)}
            </SvgText>
          </React.Fragment>
        ))}
        {data.map((d, i) => {
          const v = d[valueKey] || 0;
          const h = (v / max) * innerH;
          return (
            <Rect
              key={"b-" + i}
              x={PAD_L + i * slot + (slot - barW) / 2}
              y={PAD_T + innerH - h}
              width={barW}
              height={Math.max(0, h)}
              rx={2}
              fill={theme.accent}
            />
          );
        })}
        {/* X labels — first, middle, last */}
        {[0, Math.floor(data.length / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((idx) => {
          const d = data[idx];
          const label = d[labelKey] || "";
          return (
            <SvgText
              key={"xl-" + idx}
              x={PAD_L + idx * slot + slot / 2}
              y={HEIGHT - PAD_B + 14}
              fontSize={9}
              fill={theme.textMuted}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
});
