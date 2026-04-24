const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      walk(full, out);
    } else if (name.endsWith(".js") || name.endsWith(".jsx")) {
      out.push(full);
    }
  }
}

const files = [];
walk("src", files);

// Old nested → new flat
const replacements = [
  // t.common.*
  [/\bt\.common\.loading\b/g, "t.loading"],
  [/\bt\.common\.save\b/g, "t.save"],
  [/\bt\.common\.cancel\b/g, "t.cancel"],
  [/\bt\.common\.delete\b/g, "t.delete"],
  [/\bt\.common\.edit\b/g, "t.edit"],
  [/\bt\.common\.next\b/g, "t.next"],
  [/\bt\.common\.back\b/g, "t.back"],
  [/\bt\.common\.done\b/g, "t.done"],
  [/\bt\.common\.continue\b/g, "t.continue"],
  [/\bt\.common\.confirm\b/g, "t.confirm"],
  [/\bt\.common\.retry\b/g, "t.retry"],
  [/\bt\.common\.error\b/g, "t.error"],
  [/\bt\.common\.required\b/g, "t.required"],
  [/\bt\.common\.yes\b/g, "t.yes"],
  [/\bt\.common\.no\b/g, "t.no"],
  [/\bt\.common\.ok\b/g, "t.ok"],
  [/\bt\.common\.close\b/g, "t.close"],
  [/\bt\.common\.search\b/g, "t.search"],
  [/\bt\.common\.add\b/g, "t.add"],
  [/\bt\.common\.remove\b/g, "t.remove"],
  [/\bt\.common\.appName\b/g, "t.appName"],

  // t.onboarding.*
  [/\bt\.onboarding\.slide1Title\b/g, "t.onb1Title"],
  [/\bt\.onboarding\.slide1Body\b/g, "t.onb1Body"],
  [/\bt\.onboarding\.slide2Title\b/g, "t.onb2Title"],
  [/\bt\.onboarding\.slide2Body\b/g, "t.onb2Body"],
  [/\bt\.onboarding\.slide3Title\b/g, "t.onb3Title"],
  [/\bt\.onboarding\.slide3Body\b/g, "t.onb3Body"],
  [/\bt\.onboarding\.slide4Title\b/g, "t.onb4Title"],
  [/\bt\.onboarding\.slide4Body\b/g, "t.onb4Body"],
  [/\bt\.onboarding\.slide5Title\b/g, "t.onb5Title"],
  [/\bt\.onboarding\.slide5Body\b/g, "t.onb5Body"],
  [/\bt\.onboarding\.getStarted\b/g, "t.getStarted"],
  [/\bt\.onboarding\.skip\b/g, "t.skip"],

  // Dynamic onboarding key: t.onboarding[`${slide.key}Title`] / Body
  // Replace the pattern t.onboarding[`${x.key}Title`] with t[`onb${...}Title`]
  // Since slide.key is "slide1"..."slide5", map to "onb1"..."onb5"
  // This one is tricky. Handled separately below via a two-step replace.

  // t.auth.*
  [/\bt\.auth\.loginTitle\b/g, "t.loginTitle"],
  [/\bt\.auth\.registerTitle\b/g, "t.registerTitle"],
  [/\bt\.auth\.email\b/g, "t.email"],
  [/\bt\.auth\.password\b/g, "t.password"],
  [/\bt\.auth\.confirmPassword\b/g, "t.confirmPassword"],
  [/\bt\.auth\.name\b/g, "t.name"],
  [/\bt\.auth\.login\b/g, "t.signIn"],
  [/\bt\.auth\.register\b/g, "t.createAccount"],
  [/\bt\.auth\.noAccount\b/g, "t.noAccount"],
  [/\bt\.auth\.haveAccount\b/g, "t.alreadyAccount"],
  [/\bt\.auth\.forgotPassword\b/g, "t.forgotPassword"],
  [/\bt\.auth\.logout\b/g, "t.logout"],
  [/\bt\.auth\.termsIntro\b/g, "t.acceptTerms"],
  [/\bt\.auth\.termsLink\b/g, "t.termsLink"],
  [/\bt\.auth\.invalidCredentials\b/g, "t.invalidCredentials"],
  [/\bt\.auth\.emailInUse\b/g, "t.emailAlreadyExists"],
  [/\bt\.auth\.passwordsDontMatch\b/g, "t.pinMismatch"],
  [/\bt\.auth\.chooseRole\b/g, "t.chooseRole"],
  [/\bt\.auth\.roleClient\b/g, "t.roleClient"],
  [/\bt\.auth\.roleCoach\b/g, "t.roleCoach"],

  // t.pin.*
  [/\bt\.pin\.setupTitle\b/g, "t.setupTitle"],
  [/\bt\.pin\.setupBody\b/g, "t.setupBody"],
  [/\bt\.pin\.confirmTitle\b/g, "t.confirmTitle"],
  [/\bt\.pin\.confirmBody\b/g, "t.confirmBody"],
  [/\bt\.pin\.inputTitle\b/g, "t.pinInputTitle"],
  [/\bt\.pin\.verifyTitle\b/g, "t.verifyTitle"],
  [/\bt\.pin\.mismatch\b/g, "t.pinMismatch"],
  [/\bt\.pin\.wrongPin\b/g, "t.wrongPin"],
  [/\bt\.pin\.forgotPin\b/g, "t.forgotPin"],
  [/\bt\.pin\.skipForNow\b/g, "t.skipForNow"],

  // t.home.*
  [/\bt\.home\.greetingMorning\b/g, "t.greetingMorning"],
  [/\bt\.home\.greetingAfternoon\b/g, "t.greetingAfternoon"],
  [/\bt\.home\.greetingEvening\b/g, "t.greetingEvening"],
  [/\bt\.home\.todaysSession\b/g, "t.todaysSession"],
  [/\bt\.home\.logNow\b/g, "t.logNow"],
  [/\bt\.home\.viewHistory\b/g, "t.viewHistory"],
  [/\bt\.home\.myData\b/g, "t.myData"],
  [/\bt\.home\.workouts\b/g, "t.workouts"],
  [/\bt\.home\.upcomingSession\b/g, "t.upcomingSession"],
  [/\bt\.home\.noSessionToday\b/g, "t.noSessionToday"],

  // t.log.*
  [/\bt\.log\.entryTitle\b/g, "t.logEntryTitle"],
  [/\bt\.log\.historyTitle\b/g, "t.historyTitle"],
  [/\bt\.log\.date\b/g, "t.date"],
  [/\bt\.log\.duration\b/g, "t.duration"],
  [/\bt\.log\.effort\b/g, "t.effort"],
  [/\bt\.log\.mood\b/g, "t.mood"],
  [/\bt\.log\.energy\b/g, "t.energy"],
  [/\bt\.log\.notes\b/g, "t.notes"],
  [/\bt\.log\.workout\b/g, "t.workout"],
  [/\bt\.log\.selectWorkout\b/g, "t.selectWorkout"],
  [/\bt\.log\.saveEntry\b/g, "t.saveEntry"],
  [/\bt\.log\.entrySaved\b/g, "t.entrySaved"],
  [/\bt\.log\.deleteEntry\b/g, "t.deleteEntry"],
  [/\bt\.log\.deleteConfirm\b/g, "t.deleteEntryConfirm"],
  [/\bt\.log\.empty\b/g, "t.logEmpty"],
  [/\bt\.log\.effort1\b/g, "t.effort1"],
  [/\bt\.log\.effort2\b/g, "t.effort2"],
  [/\bt\.log\.effort3\b/g, "t.effort3"],
  [/\bt\.log\.effort4\b/g, "t.effort4"],
  [/\bt\.log\.effort5\b/g, "t.effort5"],

  // t.workouts.*
  [/\bt\.workouts\.title\b/g, "t.workoutsTitle"],
  [/\bt\.workouts\.add\b/g, "t.addWorkout"],
  [/\bt\.workouts\.edit\b/g, "t.editWorkout"],
  [/\bt\.workouts\.name\b/g, "t.workoutName"],
  [/\bt\.workouts\.description\b/g, "t.description"],
  [/\bt\.workouts\.category\b/g, "t.category"],
  [/\bt\.workouts\.duration\b/g, "t.typicalDuration"],
  [/\bt\.workouts\.empty\b/g, "t.workoutsEmpty"],
  [/\bt\.workouts\.delete\b/g, "t.deleteWorkout"],
  [/\bt\.workouts\.deleteConfirm\b/g, "t.deleteWorkoutConfirm"],
  [/\bt\.workouts\.categoryStrength\b/g, "t.categoryStrength"],
  [/\bt\.workouts\.categoryCardio\b/g, "t.categoryCardio"],
  [/\bt\.workouts\.categoryMobility\b/g, "t.categoryMobility"],
  [/\bt\.workouts\.categoryRecovery\b/g, "t.categoryRecovery"],
  [/\bt\.workouts\.categoryOther\b/g, "t.categoryOther"],

  // t.profile.*
  [/\bt\.profile\.title\b/g, "t.profileTitle"],
  [/\bt\.profile\.personalInfo\b/g, "t.personalInfo"],
  [/\bt\.profile\.age\b/g, "t.age"],
  [/\bt\.profile\.height\b/g, "t.heightCm"],
  [/\bt\.profile\.weight\b/g, "t.weightKg"],
  [/\bt\.profile\.gender\b/g, "t.gender"],
  [/\bt\.profile\.genderMale\b/g, "t.male"],
  [/\bt\.profile\.genderFemale\b/g, "t.female"],
  [/\bt\.profile\.genderOther\b/g, "t.genderUndefined"],
  [/\bt\.profile\.changeEmail\b/g, "t.changeEmail"],
  [/\bt\.profile\.newEmail\b/g, "t.newEmail"],
  [/\bt\.profile\.currentPassword\b/g, "t.currentPassword"],
  [/\bt\.profile\.deleteAccount\b/g, "t.deleteAccount"],
  [/\bt\.profile\.deleteConfirm\b/g, "t.deleteAccountConfirm"],

  // t.settings.*
  [/\bt\.settings\.title\b/g, "t.settingsTitle"],
  [/\bt\.settings\.about\b/g, "t.about"],
  [/\bt\.settings\.language\b/g, "t.language"],
  [/\bt\.settings\.personal\b/g, "t.personal"],
  [/\bt\.settings\.theme\b/g, "t.theme"],
  [/\bt\.settings\.themeLight\b/g, "t.themeLight"],
  [/\bt\.settings\.themeDark\b/g, "t.themeDark"],
  [/\bt\.settings\.themeSystem\b/g, "t.themeSystem"],
  [/\bt\.settings\.reminder\b/g, "t.reminder"],
  [/\bt\.settings\.reminderTime\b/g, "t.reminderTime"],
  [/\bt\.settings\.reminderOn\b/g, "t.reminderOn"],
  [/\bt\.settings\.reminderOff\b/g, "t.reminderOff"],
  [/\bt\.settings\.notifications\b/g, "t.notifications"],
  [/\bt\.settings\.shareData\b/g, "t.shareData"],
  [/\bt\.settings\.version\b/g, "t.version"],

  // t.errors.*
  [/\bt\.errors\.network\b/g, "t.errNetwork"],
  [/\bt\.errors\.server\b/g, "t.errServer"],
  [/\bt\.errors\.unauthorized\b/g, "t.errUnauthorized"],
  [/\bt\.errors\.notFound\b/g, "t.errNotFound"],
  [/\bt\.errors\.unknown\b/g, "t.errUnknown"],

  // Dynamic onboarding template: t.onboarding[`${x.key}Title`] → t[`onb${digit}Title`]
  // The slide defs used keys "slide1".."slide5"; need to convert at runtime.
  // Replace the bracket-access pattern with a helper instead.
  [
    /t\.onboarding\[`\$\{([^}]+)\}Title`\]/g,
    "t[`onb${Number($1.replace('slide','')) }Title`]",
  ],
  [
    /t\.onboarding\[`\$\{([^}]+)\}Body`\]/g,
    "t[`onb${Number($1.replace('slide','')) }Body`]",
  ],
];

let changed = 0;
for (const f of files) {
  const orig = fs.readFileSync(f, "utf8");
  let next = orig;
  for (const [re, to] of replacements) next = next.replace(re, to);
  if (next !== orig) {
    fs.writeFileSync(f, next, "utf8");
    changed++;
    console.log("Patched:", f);
  }
}
console.log(`\nDone. ${changed} file(s) updated.`);

// Sanity check: warn on any remaining nested t.xxx.yyy references
let remaining = 0;
const namespacePattern = /\bt\.(common|onboarding|auth|pin|home|log|workouts|profile|settings|errors)\./g;
for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const matches = content.match(namespacePattern);
  if (matches) {
    console.log(`\n  ⚠️  Still has nested refs: ${f}`);
    for (const m of matches.slice(0, 5)) console.log(`     ${m}...`);
    remaining += matches.length;
  }
}
if (remaining > 0) {
  console.log(`\n${remaining} nested references remain — you'll need to fix them manually.`);
} else {
  console.log("\n✓ No nested references left.");
}
