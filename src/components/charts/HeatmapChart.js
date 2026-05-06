// Calendar heatmap (GitHub contributions style).
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";

const GAP = 3;
const MIN_CELL = 6;
const MAX_CELL = 14;

/**
 * Map a 0-100 score to a colour band.
 * Returns the empty grey for null/undefined.
 */
function colorFor(score, accent) {
  if (score == null) return "#E5E7EB";
  if (score >= 80) return accent;
  if (score >= 60) return accent + "BB";
  if (score >= 40) return accent + "88";
  if (score >= 20) return accent + "55";
  return accent + "33";
}

export default function HeatmapChart({ cells, weeks, theme }) {
  // Check if ANY cell has data — not just whether the cells array exists.
  // (heatmapCells always returns the full grid, even when there are no logs.)
  const hasAnyData =
    Array.isArray(cells) &&
    cells.some((c) => c.hasLog || c.score != null);

  if (!hasAnyData) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No data yet
        </Text>
      </View>
    );
  }

  // Compute cell size to fit the available width.
  // Card padding is ~32px on each side (2 × Spacing.lg = 16px each),
  // plus the screen's outer padding. ~64px total off the screen width.
  const screenWidth = Dimensions.get("window").width;
  const availableWidth = screenWidth - 64;
  const computedCell = Math.floor((availableWidth - (weeks - 1) * GAP) / weeks);
  const CELL = Math.max(MIN_CELL, Math.min(MAX_CELL, computedCell));

  const width = weeks * CELL + (weeks - 1) * GAP;
  const height = 7 * CELL + 6 * GAP;

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