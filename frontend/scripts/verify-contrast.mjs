#!/usr/bin/env node
/**
 * Verifies the shipped token layer against WCAG 2.1 AA.
 *
 * Reads the COMPILED CSS bundle, not the source, so it checks the sRGB
 * fallbacks a browser actually renders rather than the OKLCH we authored.
 * Those differ by rounding, and rounding is exactly where a ratio slips
 * below threshold unnoticed.
 *
 * Implements "The Verified Contrast Rule" (DESIGN.md §2).
 * Exits non-zero on any failure OR any unresolved token, so a renamed
 * token cannot silently turn into a skipped check.
 *
 *   node scripts/verify-contrast.mjs [path/to/bundle.css]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const AA_TEXT = 4.5;
const AA_UI = 3.0;

/** [foreground, background, minimum, description] */
const PAIRS = [
  ["foreground", "background", AA_TEXT, "body text on page ground"],
  ["foreground", "card", AA_TEXT, "body text on a sheet"],
  ["foreground", "panel", AA_TEXT, "body text on the second surface"],
  ["muted-foreground", "background", AA_TEXT, "placeholders, timestamps"],
  ["muted-foreground", "card", AA_TEXT, "muted text on a sheet"],
  ["sidebar-foreground", "sidebar", AA_TEXT, "nav labels"],
  ["primary", "background", AA_TEXT, "accent as text/link"],
  ["primary", "card", AA_TEXT, "accent as text on a sheet"],
  ["primary-foreground", "primary", AA_TEXT, "label on a primary button"],
  ["accent-foreground", "accent", AA_TEXT, "text on a hover/selected surface"],
  ["sidebar-accent-foreground", "sidebar-accent", AA_TEXT, "active nav item"],
  ["destructive", "background", AA_TEXT, "critical as text"],
  ["destructive-foreground", "destructive", AA_TEXT, "label on a danger button"],
  ["destructive", "destructive-surface", AA_TEXT, "critical on its own surface"],
  ["warning", "background", AA_TEXT, "warning as text"],
  ["warning-foreground", "warning", AA_TEXT, "label on a warning fill"],
  ["warning", "warning-surface", AA_TEXT, "warning on its own surface"],
  ["success", "background", AA_TEXT, "success as text"],
  ["success-foreground", "success", AA_TEXT, "label on a success fill"],
  ["success", "success-surface", AA_TEXT, "success on its own surface"],
  ["input", "background", AA_UI, "form control boundary on ground"],
  ["input", "card", AA_UI, "form control boundary on a sheet"],
  ["ring", "background", AA_UI, "focus ring on ground"],
  ["ring", "card", AA_UI, "focus ring on a sheet"],
  ["ring", "panel", AA_UI, "focus ring on the second surface"],
];

function findBundle() {
  const roots = [".next/static/chunks", ".next/static/css"];
  const found = [];
  for (const root of roots) {
    let entries;
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = join(root, e);
      if (e.endsWith(".css") && statSync(p).isFile()) found.push(p);
    }
  }
  if (!found.length) {
    console.error("No compiled CSS found. Run `npm run build` first.");
    process.exit(2);
  }
  // The token layer lives in the largest bundle.
  return found.sort((a, b) => statSync(b).size - statSync(a).size)[0];
}

function parseBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\{([^}]*)\\}`));
  if (!match) return null;
  const out = {};
  for (const decl of match[1].split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const key = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    // Only the sRGB hex fallbacks. Lightning CSS also emits lab()/oklch()
    // layers for wide-gamut displays; hex is the guaranteed floor.
    if (key.startsWith("--") && /^#[0-9a-f]{6}$/i.test(value)) {
      out[key.slice(2)] = value;
    }
  }
  return out;
}

const luminance = (hex) => {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const bundle = process.argv[2] ?? findBundle();
const css = readFileSync(bundle, "utf8");

const themes = [
  ["light", parseBlock(css, ":root")],
  ["dark", parseBlock(css, ".dark")],
];

let failures = 0;
let unresolved = 0;

console.log(`Contrast audit — ${bundle}\n`);

for (const [name, tokens] of themes) {
  if (!tokens) {
    console.error(`  Theme block for "${name}" not found in the bundle.`);
    process.exit(2);
  }
  console.log(`${name.toUpperCase()}`);
  for (const [fg, bg, min, description] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      // An unresolved token is a failure, not a skip. Silently skipping is
      // how a renamed token stops being checked.
      unresolved++;
      const missing = [!tokens[fg] && fg, !tokens[bg] && bg]
        .filter(Boolean)
        .join(", ");
      console.log(`  UNRESOLVED  --${missing}  (${description})`);
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const pass = r >= min;
    if (!pass) failures++;
    console.log(
      `  ${pass ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(6)} / ${min}  ` +
        `${fg} on ${bg}  ${tokens[fg]} ${tokens[bg]}  — ${description}`,
    );
  }
  console.log("");
}

if (failures || unresolved) {
  console.error(
    `${failures} contrast failure(s), ${unresolved} unresolved token(s).`,
  );
  process.exit(1);
}
console.log(`All ${PAIRS.length * 2} pairs meet WCAG 2.1 AA.`);
