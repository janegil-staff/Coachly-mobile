// lib/exerciseCatalog.js
// Hardcoded catalog — same as the Next.js web app.
// Names come from translation keys (ex_<slug>) defined in translations.js.

export const EXERCISE_CATALOG = [
  // ── STRENGTH (20) ──
  { slug: "bench_press", category: "strength" },
  { slug: "incline_bench_press", category: "strength" },
  { slug: "squat", category: "strength" },
  { slug: "front_squat", category: "strength" },
  { slug: "deadlift", category: "strength" },
  { slug: "romanian_deadlift", category: "strength" },
  { slug: "overhead_press", category: "strength" },
  { slug: "barbell_row", category: "strength" },
  { slug: "dumbbell_row", category: "strength" },
  { slug: "dumbbell_curl", category: "strength" },
  { slug: "tricep_extension", category: "strength" },
  { slug: "lat_pulldown", category: "strength" },
  { slug: "pull_up", category: "strength" },
  { slug: "push_up", category: "strength" },
  { slug: "lunge", category: "strength" },
  { slug: "bulgarian_split_squat", category: "strength" },
  { slug: "leg_press", category: "strength" },
  { slug: "hip_thrust", category: "strength" },
  { slug: "lateral_raise", category: "strength" },
  { slug: "plank", category: "strength" },

  // ── CARDIO (10) ──
  { slug: "running", category: "cardio" },
  { slug: "cycling", category: "cardio" },
  { slug: "rowing", category: "cardio" },
  { slug: "swimming", category: "cardio" },
  { slug: "elliptical", category: "cardio" },
  { slug: "jump_rope", category: "cardio" },
  { slug: "stair_climber", category: "cardio" },
  { slug: "walking", category: "cardio" },
  { slug: "hiking", category: "cardio" },
  { slug: "hiit", category: "cardio" },

  // ── MOBILITY (8) ──
  { slug: "yoga", category: "mobility" },
  { slug: "stretching", category: "mobility" },
  { slug: "foam_rolling", category: "mobility" },
  { slug: "hip_openers", category: "mobility" },
  { slug: "shoulder_mobility", category: "mobility" },
  { slug: "thoracic_rotation", category: "mobility" },
  { slug: "cat_cow", category: "mobility" },
  { slug: "pigeon_pose", category: "mobility" },

  // ── RECOVERY (6) ──
  { slug: "sauna", category: "recovery" },
  { slug: "ice_bath", category: "recovery" },
  { slug: "massage", category: "recovery" },
  { slug: "light_walk", category: "recovery" },
  { slug: "breathwork", category: "recovery" },
  { slug: "mobility_flow", category: "recovery" },
];

export function getCatalogItemName(slug, t) {
  return t[`ex_${slug}`] ?? slug.replace(/_/g, " ");
}

export function getTranslatedCatalog(t) {
  return EXERCISE_CATALOG.map((item) => ({
    slug: item.slug,
    category: item.category,
    name: getCatalogItemName(item.slug, t),
    isCustom: false,
    _id: `catalog:${item.slug}`,
  }));
}
