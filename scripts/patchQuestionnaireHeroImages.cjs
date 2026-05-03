#!/usr/bin/env node
/**
 * patchQuestionnaireHeroImages.cjs
 *
 * Adds a hero image at the top of each questionnaire screen:
 *   StressScreen   → questionary1.png
 *   SleepScreen    → questionary2.png
 *   ActivityScreen → questionary3.png
 *
 * For each screen this script:
 *   1. Adds `Image` to the react-native named imports (if not already there)
 *   2. Inserts an <Image> element right after the opening <ScrollView>
 *      in the questions render (the form view, not the result view)
 *   3. Adds a `heroImage` style to the makeStyles() block
 *
 * Idempotent: detects already-patched files and skips them.
 *
 * Usage:
 *   cd ~/Projects/coachly/coachly-mobile
 *   node scripts/patchQuestionnaireHeroImages.cjs
 */

const fs   = require("fs");
const path = require("path");

const TARGETS = [
  { file: "src/screens/questionnaires/StressScreen.js",   asset: "questionary1.png" },
  { file: "src/screens/questionnaires/SleepScreen.js",    asset: "questionary2.png" },
  { file: "src/screens/questionnaires/ActivityScreen.js", asset: "questionary3.png" },
];

const MARKER = "// [hero] added";

function backup(file) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const bak = file + ".backup-" + ts;
  fs.copyFileSync(file, bak);
  return bak;
}

function patch(filePath, asset) {
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

  const changes = [];

  // ── 1. Add Image to react-native imports ────────────────────────────
  // Match the multi-line import block from "react-native".
  const rnImportRe = /import\s+\{([^}]+)\}\s+from\s+"react-native"/;
  const rnMatch = src.match(rnImportRe);
  if (!rnMatch) {
    console.log("  ⚠ " + filePath + " — could not find react-native import");
    return false;
  }
  const named = rnMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
  if (!named.includes("Image")) {
    named.push("Image");
    // Format with one item per line, matching the original style if possible
    const isMultiLine = rnMatch[0].includes("\n");
    let newBlock;
    if (isMultiLine) {
      newBlock = 'import {\n  ' + named.join(",\n  ") + ',\n} from "react-native"';
    } else {
      newBlock = 'import { ' + named.join(", ") + ' } from "react-native"';
    }
    src = src.replace(rnImportRe, newBlock);
    changes.push("Image import");
  }

  // ── 2. Insert <Image> element after the questions ScrollView ─────────
  // The questions ScrollView has contentContainerStyle with padding/Spacing
  // and is the second ScrollView in the file (the first is in the result view).
  // Anchor: the opening tag ending in `paddingBottom: 40 }}>` is unique to
  // the questions view in our screens.
  const scrollViewAnchor = '<ScrollView ref={scrollRef} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>';

  if (!src.includes(scrollViewAnchor)) {
    console.log("  ⚠ " + filePath + " — could not locate questions ScrollView");
    return false;
  }

  const heroBlock =
    scrollViewAnchor + "\n" +
    "        " + MARKER + "\n" +
    "        <Image\n" +
    '          source={require("../../../assets/images/' + asset + '")}\n' +
    "          style={s.heroImage}\n" +
    '          resizeMode="contain"\n' +
    "        />\n";

  src = src.replace(scrollViewAnchor, heroBlock);
  changes.push("hero <Image>");

  // ── 3. Add heroImage style to makeStyles() ──────────────────────────
  // Anchor: the `intro:` style is the first style block inside makeStyles.
  // We insert heroImage right before it.
  const introAnchor = "    intro: {";
  if (!src.includes(introAnchor)) {
    console.log("  ⚠ " + filePath + " — could not locate intro style");
    return false;
  }

  const heroStyle =
    "    heroImage: {\n" +
    '      width: "100%",\n' +
    "      height: 180,\n" +
    "      marginBottom: Spacing.lg,\n" +
    "    },\n" +
    introAnchor;

  src = src.replace(introAnchor, heroStyle);
  changes.push("heroImage style");

  fs.writeFileSync(abs, src, "utf8");
  console.log("  ✓ " + filePath + " — " + changes.join(", "));
  return true;
}

function main() {
  console.log("Adding hero images to questionnaire screens...\n");

  let patchedCount = 0;
  for (const { file, asset } of TARGETS) {
    const abs = path.resolve(process.cwd(), file);
    if (!fs.existsSync(abs)) {
      console.log("  ⚠ " + file + " — not found");
      continue;
    }

    const before = fs.readFileSync(abs, "utf8");
    if (before.includes(MARKER)) {
      console.log("  ✓ " + file + " — already patched");
      continue;
    }

    const bak = backup(abs);
    if (patch(file, asset)) {
      patchedCount++;
      console.log("    backup: " + path.basename(bak));
    } else {
      // Roll back
      fs.unlinkSync(bak);
    }
  }

  console.log("");
  if (patchedCount === 0) {
    console.log("Nothing to patch.");
  } else {
    console.log("✓ " + patchedCount + " file(s) patched.");
    console.log("");
    console.log("Make sure these images exist:");
    for (const { asset } of TARGETS) {
      console.log("  assets/images/" + asset);
    }
  }
}

main();
