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

// Tier-based workout scoring (matches backend scoreCalculator.js).
// Used for instant UI display before the server round-trip completes.

export function tierForMinutes(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return { name: "none", points: 0 };
  let points;
  let name;
  if (m < 15) {
    name = "light";
    points = m * (10 / 15);
  } else if (m < 45) {
    name = "moderate";
    points = 10 + (m - 15) * (20 / 30);
  } else if (m < 90) {
    name = "hard";
    points = 30 + (m - 45) * (30 / 45);
  } else {
    name = "veryHard";
    points = 60 + (m - 90) * (20 / 90);
    if (points > 80) points = 80;
  }
  return { name, points };
}

export function effortMultiplier(effort) {
  switch (Number(effort)) {
    case 1: return 0.7;
    case 2: return 0.85;
    case 3: return 1.0;
    case 4: return 1.15;
    case 5: return 1.3;
    default: return 1.0;
  }
}

export function describeWorkoutScore(entry) {
  if (!entry || entry.isRestDay) {
    return { points: 0, minutes: 0, tier: "rest", score: entry?.isRestDay ? 60 : 0 };
  }
  const workouts = Array.isArray(entry.workouts) ? entry.workouts : [];
  let rawPoints = 0;
  let minutes = 0;
  let highest = "none";
  const order = ["none", "light", "moderate", "hard", "veryHard"];
  for (const w of workouts) {
    const m = Number(w?.durationMinutes) || 0;
    minutes += m;
    const tier = tierForMinutes(m);
    rawPoints += tier.points;
    if (order.indexOf(tier.name) > order.indexOf(highest)) highest = tier.name;
  }
  const mult = effortMultiplier(entry.effort);
  return {
    points: Math.round(rawPoints),
    minutes,
    tier: highest,
    score: Math.round(rawPoints * mult),
  };
}

// Map a composite 0-100 daily score to a 1-5 badge bucket.
export function bucketScore(n) {
  if (typeof n !== "number" || n < 0) return null;
  if (n >= 80) return 5;
  if (n >= 60) return 4;
  if (n >= 40) return 3;
  if (n >= 20) return 2;
  return 1;
}

// Tier → color (for minutes badges).
export function tierColor(tierName) {
  switch (tierName) {
    case "light":    return "#86B8F2";
    case "moderate": return "#4A7AB5";
    case "hard":     return "#2D4A6E";
    case "veryHard": return "#1A2F4A";
    case "rest":     return "#9CA3AF";
    default:         return "#D1D5DB";
  }
}
