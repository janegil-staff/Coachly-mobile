#!/usr/bin/env node
/**
 * patchQuestionnairePrefill.cjs
 *
 * Adds "always prefill with last submission" behavior to the three new
 * questionnaire screens: StressScreen, SleepScreen, ActivityScreen.
 *
 * On mount, each screen now:
 *   1. Calls questionnairesApi.list({ type, limit: 1 })
 *   2. If a previous record exists, populates `answers` from it
 *   3. Shows a brief loading state while fetching
 *
 * Idempotent: detects already-patched files and skips them.
 *
 * Usage:
 *   cd ~/Projects/coachly/coachly-mobile
 *   node scripts/patchQuestionnairePrefill.cjs
 */

const fs   = require("fs");
const path = require("path");

const TARGETS = [
  { file: "src/screens/questionnaires/StressScreen.js",   type: "pss10" },
  { file: "src/screens/questionnaires/SleepScreen.js",    type: "psqi"  },
  { file: "src/screens/questionnaires/ActivityScreen.js", type: "ipaq"  },
];

const MARKER = "// [prefill] mounted-fetch added";

function backup(file) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const bak = file + ".backup-" + ts;
  fs.copyFileSync(file, bak);
  return bak;
}

function patch(filePath, type) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    console.log("  ⚠ " + filePath + " — not found, skipping");
    return false;
  }

  let src = fs.readFileSync(abs, "utf8");

  if (src.includes(MARKER)) {
    console.log("  ✓ " + filePath + " — already patched");
    return false;
  }

  // 1. Make sure useEffect is imported
  // Match: import React, { useRef, useState } from "react";
  const reactImportRe = /import\s+React,\s*\{([^}]+)\}\s+from\s+"react"/;
  const m = src.match(reactImportRe);
  if (!m) {
    console.log("  ⚠ " + filePath + " — could not locate React import");
    return false;
  }
  const named = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  if (!named.includes("useEffect")) {
    named.push("useEffect");
    const newImport = 'import React, { ' + named.join(", ") + ' } from "react"';
    src = src.replace(reactImportRe, newImport);
  }

  // 2. Find the line where `result` state is declared and inject the new
  //    `loading` state + a useEffect right after it.
  //    Original: const [result, setResult] = useState(null);
  const resultStateRe = /(\n\s*const \[result, setResult\] = useState\(null\);)/;
  if (!resultStateRe.test(src)) {
    console.log("  ⚠ " + filePath + " — could not locate result state");
    return false;
  }

  const injection = `
  const [loading, setLoading] = useState(true);

  ${MARKER}
  // Fetch the latest submission once on mount and prefill the answers.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await questionnairesApi.list({ type: "${type}", limit: 1 });
        if (!alive) return;
        const last = Array.isArray(list) ? list[0] : null;
        if (last && last.answers && typeof last.answers === "object") {
          setAnswers(last.answers);
        }
      } catch (e) {
        console.warn("[${type}] prefill fetch failed:", e?.message ?? e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);
`;

  src = src.replace(resultStateRe, "$1\n" + injection);

  fs.writeFileSync(abs, src, "utf8");
  return true;
}

function main() {
  console.log("Patching questionnaire screens for prefill-on-mount...\n");

  let patchedCount = 0;
  const backups = [];

  for (const { file, type } of TARGETS) {
    const abs = path.resolve(process.cwd(), file);
    if (!fs.existsSync(abs)) continue;

    // Backup before potentially modifying
    const before = fs.readFileSync(abs, "utf8");
    if (before.includes(MARKER)) {
      console.log("  ✓ " + file + " — already patched");
      continue;
    }

    const bak = backup(abs);
    backups.push(bak);

    if (patch(file, type)) {
      console.log("  ✓ " + file + " — patched (type: " + type + ")");
      patchedCount++;
    } else {
      // Roll back the backup if nothing changed
      fs.unlinkSync(bak);
    }
  }

  console.log("");
  if (patchedCount === 0) {
    console.log("Nothing to patch.");
  } else {
    console.log("✓ " + patchedCount + " file(s) patched.");
    console.log("  Backups created with timestamp suffix.");
  }
}

main();
