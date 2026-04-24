// src/utils/score.js
// Daily score: rounded average of effort + mood + energy.
// On rest days, effort is excluded (average of mood + energy only).

export function computeDailyScore({ isRestDay, effort, mood, energy }) {
  const values = isRestDay ? [mood, energy] : [effort, mood, energy];
  const valid = values.filter((v) => typeof v === "number" && v >= 1 && v <= 5);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg);
}

export function scoreLabel(score) {
  if (score == null) return "–";
  return String(score);
}

export function scoreColor(score, theme) {
  if (score == null) return theme.textMuted;
  if (score >= 4) return theme.scoreHigh ?? "#16A34A";
  if (score === 3) return theme.scoreMid ?? "#D97706";
  return theme.scoreLow ?? "#DC2626";
}
