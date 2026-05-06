// src/utils/stats.js
// Pure data aggregation for the Stats screen.
// No UI, no chart library — just functions that take logs and return chart-ready shapes.

import { computeDailyScore } from "./score";

// ── Helpers ───────────────────────────────────────────────────────────────

const MS_DAY = 24 * 60 * 60 * 1000;

function dateKey(d) {
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yyyy + "-" + mm + "-" + dd;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  // Monday-based week
  const x = startOfDay(d);
  const dow = x.getDay(); // 0=Sun, 1=Mon, ...
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
}

function avg(nums) {
  const valid = nums.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/**
 * Total minutes for a single log. Prefer categoryDurations (authoritative
 * post-schema-migration); fall back to workouts[].durationMinutes for any
 * legacy logs that haven't been migrated.
 */
function logTotalMinutes(log) {
  if (!log) return 0;
  const cd = Array.isArray(log.categoryDurations) ? log.categoryDurations : [];
  if (cd.length) {
    return cd.reduce((s, c) => s + (Number(c?.durationMinutes) || 0), 0);
  }
  const ws = Array.isArray(log.workouts) ? log.workouts : [];
  return ws.reduce((s, w) => s + (Number(w?.durationMinutes) || 0), 0);
}

/**
 * Per-category minutes for a single log, returned as { type: minutes }.
 * Same authoritative-first preference as logTotalMinutes.
 *
 * Workouts use `type` (not `category`) — important if falling back to legacy
 * logs that only have `workouts[]` populated.
 */
function logCategoryMinutes(log) {
  const out = {};
  if (!log) return out;
  const cd = Array.isArray(log.categoryDurations) ? log.categoryDurations : [];
  if (cd.length) {
    cd.forEach((c) => {
      const k = (c.type || "other").toLowerCase();
      out[k] = (out[k] || 0) + (Number(c?.durationMinutes) || 0);
    });
    return out;
  }
  const ws = Array.isArray(log.workouts) ? log.workouts : [];
  ws.forEach((w) => {
    const k = (w.type || w.category || "other").toLowerCase();
    out[k] = (out[k] || 0) + (Number(w?.durationMinutes) || 0);
  });
  return out;
}

/**
 * Number of logged sessions for a single log. Uses categoryDurations
 * length if populated, falls back to workouts[].length.
 *
 * This matters for the "sessions" count in summary stats — a log with
 * categoryDurations: [strength 30m, cardio 30m] should count as 2 sessions
 * even if the workouts array is empty or only has 1 entry.
 */
function logSessionCount(log) {
  if (!log) return 0;
  const cd = Array.isArray(log.categoryDurations) ? log.categoryDurations : [];
  if (cd.length) return cd.length;
  const ws = Array.isArray(log.workouts) ? log.workouts : [];
  return ws.length;
}

/**
 * Compute a 0-100 daily score from a log entry.
 * Wraps computeDailyScore() to normalise whatever scale it returns into 0-100
 * so the heatmap colour bands work consistently.
 */
function scoreForLog(log) {
  if (!log || log.isRestDay) return null;
  const raw = computeDailyScore({
    isRestDay: log.isRestDay,
    effort: log.effort,
    mood: log.mood,
    energy: log.energy,
  });
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;

  // computeDailyScore returns 1-5 (matching the Rating scale).
  // Normalise to 0-100. If your score lib already returns 0-100, change to: return raw;
  return Math.round((raw / 5) * 100);
}

// Map a high-level chart key to the actual log field name.
// Charts use friendly keys ("sleep", "weight"); logs use the real ones
// ("sleepQuality", "weightKg"). Centralising the mapping here means we
// can't accidentally read the wrong field from elsewhere.
const FIELD_MAP = {
  effort: "effort",
  mood: "mood",
  energy: "energy",
  sleep: "sleepQuality",
  soreness: "soreness",
  weight: "weightKg",
  sleepQuality: "sleepQuality",
  weightKg: "weightKg",
};

function logField(log, key) {
  const realKey = FIELD_MAP[key] ?? key;
  return log?.[realKey];
}

// ── Public functions ──────────────────────────────────────────────────────

/**
 * Spider/radar chart points.
 * Returns 5 axes averaged over the last `days` days.
 * Soreness is INVERTED so all axes share the convention "higher = better".
 *
 * @returns {{ axis: string, value: number, raw: number }[]}
 */
export function radarPoints(logs, days = 14) {
  const cutoff = Date.now() - days * MS_DAY;
  const recent = (logs || []).filter((l) => {
    const t = new Date(l.date).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });

  const eff = avg(recent.map((l) => l.effort));
  const moo = avg(recent.map((l) => l.mood));
  const ene = avg(recent.map((l) => l.energy));
  const slp = avg(recent.map((l) => l.sleepQuality));   // ← was l.sleep
  const sor = avg(recent.map((l) => l.soreness));

  return [
    { axis: "Effort",   value: eff ?? 0, raw: eff },
    { axis: "Mood",     value: moo ?? 0, raw: moo },
    { axis: "Energy",   value: ene ?? 0, raw: ene },
    { axis: "Sleep",    value: slp ?? 0, raw: slp },
    { axis: "Recovery", value: sor != null ? 6 - sor : 0, raw: sor }, // invert: low soreness = good
  ];
}

export function trendSeries(logs, key, days = 90) {
  const cutoff = Date.now() - days * MS_DAY;
  const out = [];
  const sorted = (logs || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));

  const SKIP_REST_FOR = new Set(["effort", "energy", "mood", "soreness"]);

  for (const l of sorted) {
    const t = new Date(l.date).getTime();
    if (!Number.isFinite(t) || t < cutoff) continue;
    if (l.isRestDay && SKIP_REST_FOR.has(key)) continue;

    const v = logField(l, key);
    if (typeof v !== "number") continue;

    // TEMPORARY DEBUG
    if (key === "energy" && v === 1) {
      console.log("[trendSeries energy=1]", { date: l.date, isRestDay: l.isRestDay, log: l });
    }

    out.push({ x: t, y: v, date: l.date });
  }
  return out;
}
/**
 * Calendar heatmap cells — last N weeks of daily intensity.
 *
 * Score resolution order:
 *   1. Backend-supplied score for that date (scoresByDate[key])
 *   2. Client-computed score from the log entry
 *   3. null (cell renders as empty/grey)
 *
 * Returns a flat array suitable for a grid layout: weeks × 7 days.
 * All scores are normalised to a 0-100 scale.
 */
export function heatmapCells(logs, scoresByDate, weeks = 26) {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  // Snap to Monday-aligned start
  const aligned = startOfWeek(start);

  // Index logs by date for O(1) lookup (otherwise this is O(n*days))
  const logsByDate = {};
  for (const l of logs || []) {
    if (l && l.date) logsByDate[l.date] = l;
  }

  const cells = [];
  const totalDays = Math.round((today - aligned) / MS_DAY) + 1;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(aligned);
    d.setDate(d.getDate() + i);
    const key = dateKey(d);
    const log = logsByDate[key];

    // Prefer backend score if available, otherwise compute from the log
    let score = null;
    const backendScore = scoresByDate?.[key];
    if (typeof backendScore === "number") {
      score = backendScore;
    } else if (log) {
      score = scoreForLog(log);
    }

    cells.push({
      date: key,
      score,
      isRest: !!log?.isRestDay,
      hasLog: !!log,
      dow: (d.getDay() + 6) % 7, // Mon=0..Sun=6
      week: Math.floor(i / 7),
    });
  }
  return { cells, weeks: Math.ceil(totalDays / 7) };
}

/**
 * Weekly total minutes (last N weeks). Bars.
 * Reads from categoryDurations (authoritative post-migration), falls back
 * to workouts[].durationMinutes for legacy logs.
 *
 * @returns {{ weekStart: string, minutes: number, sessions: number }[]}
 */
export function weeklyVolume(logs, weeks = 12) {
  const today = startOfDay(new Date());
  const cutoff = startOfWeek(new Date(today.getTime() - (weeks - 1) * 7 * MS_DAY));
  const buckets = new Map();

  for (let i = 0; i < weeks; i++) {
    const ws = new Date(cutoff);
    ws.setDate(ws.getDate() + i * 7);
    buckets.set(dateKey(ws), { minutes: 0, sessions: 0 });
  }

  for (const l of logs || []) {
    if (l.isRestDay) continue;
    const ws = startOfWeek(new Date(l.date));
    const key = dateKey(ws);
    if (!buckets.has(key)) continue;
    const minutes = logTotalMinutes(l);
    const sessions = logSessionCount(l);
    const b = buckets.get(key);
    b.minutes += minutes;
    b.sessions += sessions;
  }

  return Array.from(buckets.entries()).map(([weekStart, v]) => ({
    weekStart,
    minutes: v.minutes,
    sessions: v.sessions,
  }));
}

/**
 * Category breakdown (donut/pie) for the last N days.
 * Reads from categoryDurations (authoritative post-migration), falls back
 * to grouping workouts by type for legacy logs.
 *
 * @returns {{ category: string, minutes: number, sessions: number, pct: number }[]}
 */
export function categoryBreakdown(logs, days = 30) {
  const cutoff = Date.now() - days * MS_DAY;
  const totals = new Map();

  for (const l of logs || []) {
    if (l.isRestDay) continue;
    const t = new Date(l.date).getTime();
    if (!Number.isFinite(t) || t < cutoff) continue;

    const perCat = logCategoryMinutes(l);
    Object.entries(perCat).forEach(([cat, mins]) => {
      const cur = totals.get(cat) || { minutes: 0, sessions: 0 };
      cur.minutes += mins;
      cur.sessions += 1;
      totals.set(cat, cur);
    });
  }

  const all = Array.from(totals.entries()).map(([category, v]) => ({
    category,
    minutes: v.minutes,
    sessions: v.sessions,
  }));
  const totalMinutes = all.reduce((a, b) => a + b.minutes, 0);
  return all
    .map((x) => ({ ...x, pct: totalMinutes > 0 ? x.minutes / totalMinutes : 0 }))
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

/**
 * Hooper status timeline.
 * Maps the latest Hooper score per week to a band: fresh/normal/strained/overreaching.
 * @returns {{ weekStart: string, status: string, total: number | null }[]}
 */
export function hooperTimeline(hoopers, weeks = 12) {
  const today = startOfDay(new Date());
  const start = startOfWeek(new Date(today.getTime() - (weeks - 1) * 7 * MS_DAY));

  const buckets = new Map();
  for (let i = 0; i < weeks; i++) {
    const ws = new Date(start);
    ws.setDate(ws.getDate() + i * 7);
    buckets.set(dateKey(ws), { totals: [] });
  }

  for (const h of hoopers || []) {
    const ws = startOfWeek(new Date(h.date));
    const key = dateKey(ws);
    if (!buckets.has(key)) continue;
    // Hooper total: stress + sleep + fatigue + soreness + mood (5 items, 1-7 each → 5-35)
    const total =
      (Number(h.stress) || 0) +
      (Number(h.sleep) || 0) +
      (Number(h.fatigue) || 0) +
      (Number(h.soreness) || 0) +
      (Number(h.mood) || 0);
    if (total > 0) buckets.get(key).totals.push(total);
  }

  function statusFor(total) {
    if (total == null) return "none";
    if (total <= 12) return "fresh";
    if (total <= 17) return "normal";
    if (total <= 22) return "strained";
    return "overreaching";
  }

  return Array.from(buckets.entries()).map(([weekStart, v]) => {
    const t = v.totals.length ? v.totals.reduce((a, b) => a + b, 0) / v.totals.length : null;
    return { weekStart, total: t, status: statusFor(t) };
  });
}

/**
 * Weight series — daily weight values over last N days.
 * @returns {{ x: number, y: number, date: string }[]}
 */
export function weightSeries(logs, days = 90) {
  return trendSeries(logs, "weight", days);
}

// ── Headline numbers (for stat cards above the charts) ────────────────────

export function summaryNumbers(logs, days = 30) {
  const cutoff = Date.now() - days * MS_DAY;
  const recent = (logs || []).filter((l) => new Date(l.date).getTime() >= cutoff);

  const sessions = recent.reduce((a, l) => a + logSessionCount(l), 0);
  const minutes = recent.reduce((a, l) => a + logTotalMinutes(l), 0);
  const restDays = recent.filter((l) => l.isRestDay).length;
  const avgEffort = avg(recent.map((l) => l.effort));
  const avgMood = avg(recent.map((l) => l.mood));

  return {
    sessions,
    minutes,
    restDays,
    avgEffort,
    avgMood,
    daysCovered: recent.length,
  };
}