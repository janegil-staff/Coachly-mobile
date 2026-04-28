// Calendar heatmap (GitHub contributions style).
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";

const CELL = 12;
const GAP = 3;

function colorFor(score, accent) {
  if (score == null) return "#E5E7EB";
  if (score >= 80) return accent;
  if (score >= 60) return accent + "BB";
  if (score >= 40) return accent + "88";
  if (score >= 20) return accent + "55";
  return accent + "33";
}

export default function HeatmapChart({ cells, weeks, theme }) {
  if (!cells || cells.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No data yet</Text>
      </View>
    );
  }

  const width = weeks * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        {cells.map((c) => (
          <Rect
            key={c.date}
            x={c.week * (CELL + GAP)}
            y={c.dow * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={2}
            fill={c.isRest ? "#9CA3AF44" : colorFor(c.score, theme.accent)}
          />
        ))}
      </Svg>
      <View style={styles.legendRow}>
        <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Less</Text>
        {[null, 25, 50, 75, 90].map((s, i) => (
          <View
            key={i}
            style={[
              styles.legendCell,
              { backgroundColor: colorFor(s, theme.accent) },
            ]}
          />
        ))}
        <Text style={[styles.legendLabel, { color: theme.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  legendLabel: { fontSize: 9, fontWeight: "600" },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});
