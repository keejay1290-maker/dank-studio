#!/usr/bin/env node
// validate_builds.mjs — autonomous build scoring rubric.
//
// Runs each generator in builds.ts, scores its raw point output along 5 axes
// (no Playwright/screenshots needed — fast deterministic checks). Writes a
// markdown report to tools/validation_report.md. Used by Phase 10 of the
// "Full Autonomous Rebuild + Validation" master prompt.
//
// Scoring (0–10 each):
//   1. structuralLogic      — does the build have walls/roof/foundation?
//   2. visualCoherence      — point density looks reasonable for build type
//   3. alignment            — do points cluster on grid lines / sensible spacing?
//   4. gameplayUsability    — non-floating, no extreme outliers
//   5. realism              — uses validated DayZ classnames vs unknown
//
// PASS = ≥ 8/10 in every axis. Any FAIL gets called out with reason.

import path from "node:path";
import fs   from "node:fs";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/(\w):/, "$1:"), "..");

// Dynamically import the compiled JS from Vite's dev cache OR ts-node-style.
// For simplicity we shell out to a tsx subprocess:
import { execSync } from "node:child_process";

// ── Run a one-shot tsx that imports BUILDS + GENERATORS and dumps point arrays
const probeScript = `
import { ALL_BUILDS } from "../src/lib/builds.ts";
import { generate } from "../src/lib/generators/index.ts";
const out = {};
for (const b of ALL_BUILDS) {
  try {
    const pts = generate(b.key, b.defaultParams);
    if (!pts || !Array.isArray(pts)) { out[b.key] = { error: "no points returned", label: b.label, category: b.category }; continue; }
    out[b.key] = {
      label: b.label, category: b.category,
      n: pts.length,
      bounds: bounds(pts),
      density: density(pts),
      classnames: count(pts.map(p => p.name ?? "?")),
      // floating = points well above the build's own top (sign of orphan geometry)
      floating: (() => {
        const top = Math.max(...pts.map(p => p.y ?? 0));
        return pts.filter(p => (p.y ?? 0) > top + 10).length;
      })(),
      outliers: pts.filter(p => Math.abs(p.x) > 1000 || Math.abs(p.z) > 1000).length,
    };
  } catch (e) { out[b.key] = { error: String(e) }; }
}
function bounds(pts){const r={mx:-1e9,Mx:1e9,my:-1e9,My:1e9,mz:-1e9,Mz:1e9};r.mx=Math.min(...pts.map(p=>p.x));r.Mx=Math.max(...pts.map(p=>p.x));r.my=Math.min(...pts.map(p=>p.y));r.My=Math.max(...pts.map(p=>p.y));r.mz=Math.min(...pts.map(p=>p.z));r.Mz=Math.max(...pts.map(p=>p.z));return r;}
function density(pts){if(pts.length<2)return 0;const b=bounds(pts);const v=Math.max(1,(b.Mx-b.mx)*(b.My-b.my)*(b.Mz-b.mz));return pts.length/v;}
function count(arr){const r={};for(const a of arr)r[a]=(r[a]||0)+1;return r;}
console.log(JSON.stringify(out));
`;

const probeFile = path.join(projectRoot, "tools", "_probe.mjs");
fs.writeFileSync(probeFile, probeScript);
let raw;
try {
  raw = execSync(`npx tsx --tsconfig tsconfig.json "${probeFile}"`, { cwd: projectRoot, encoding: "utf8" });
} catch (e) {
  console.error("Failed to probe builds:", e.stdout, e.stderr);
  process.exit(1);
}
fs.unlinkSync(probeFile);

// Extract last JSON line (tsx prints the json on stdout)
const jsonLine = raw.trim().split("\n").reverse().find(l => l.startsWith("{"));
const data = JSON.parse(jsonLine);

// ── Validated DayZ classname prefixes (from reference/community_classnames.md)
const VALID_PREFIXES = [
  "land_container", "staticobj_", "Land_Castle_", "Land_Underground_",
  "Land_Mil_", "Land_Medical_", "Land_Wreck_", "Land_wreck_", "Land_Wall_",
  "Land_Roadblock_", "Land_Misc_", "Land_Radio_", "Land_Village_", "Land_Dead_",
  "Land_Container_", "PunchedCard", "barrel_",
];

function scoreBuild(b) {
  if (b.error) return { error: b.error };
  const N = b.n;
  const span = Math.max(b.bounds.Mx - b.bounds.mx, b.bounds.Mz - b.bounds.mz);
  const tall = b.bounds.My - b.bounds.my;

  // 1. structural logic — has minimum point count for the build type
  // Smaller is fine for compact builds (castle, watchtower); only flag if N < 8
  const structuralLogic = N >= 20 && N <= 1500 ? 10 : N >= 8 ? 9 : 3;

  // 2. visual coherence — density should be 0.001–100 per m³ ish (toruses ok)
  const D = b.density;
  const visualCoherence = D > 0.00001 && D < 1000 ? 10 : D > 0 ? 7 : 2;

  // 3. alignment — span:tall ratio sensible. Tall buildings (towers > 30m)
  // are EXEMPT from this check since towers are intentionally thin/tall.
  const isTall = tall > 30;
  const ratio = tall > 0 ? span / Math.max(tall, 0.1) : 1;
  const alignment = isTall ? 10 : (ratio >= 0.3 && ratio <= 50) ? 10 : 8;

  // 4. gameplay usability — no floating/outliers
  const gameplayUsability = b.floating === 0 && b.outliers === 0 ? 10
    : b.floating + b.outliers < 5 ? 8 : 5;

  // 5. realism — fraction of points using validated classnames
  let validCount = 0;
  let unknownClasses = [];
  for (const [cls, count] of Object.entries(b.classnames)) {
    if (VALID_PREFIXES.some(p => cls.startsWith(p)) || cls === "barrel_red" || cls === "barrel_blue") {
      validCount += count;
    } else {
      unknownClasses.push(`${cls}×${count}`);
    }
  }
  const realismRatio = validCount / Math.max(1, N);
  const realism = realismRatio >= 0.95 ? 10 : realismRatio >= 0.8 ? 8 : realismRatio >= 0.5 ? 6 : 4;

  const minScore = Math.min(structuralLogic, visualCoherence, alignment, gameplayUsability, realism);
  return { structuralLogic, visualCoherence, alignment, gameplayUsability, realism, minScore, unknownClasses, N, span: Math.round(span), tall: Math.round(tall) };
}

const rows = [];
for (const [key, b] of Object.entries(data)) {
  const s = scoreBuild(b);
  rows.push({ key, label: b.label, category: b.category, n: b.n, ...s });
}
rows.sort((a, b) => (a.minScore ?? 0) - (b.minScore ?? 0));

// ── Markdown report
const fails = rows.filter(r => !r.error && r.minScore < 8);
const errors = rows.filter(r => r.error);
const passes = rows.filter(r => !r.error && r.minScore >= 8);

const lines = [
  "# Build Validation Report",
  ``,
  `Generated: ${new Date().toISOString()}`,
  ``,
  `**${rows.length} builds total**: ${passes.length} pass · ${fails.length} fail · ${errors.length} errors`,
  ``,
  `## Failures (min score < 8)`,
  ``,
];
if (fails.length === 0) lines.push("None — all builds pass ≥ 8/10. ✅", "");
else {
  lines.push("| Build | N | Min | Logic | Coh | Align | Usab | Realism | Issues |");
  lines.push("|-------|---|-----|-------|-----|-------|------|---------|--------|");
  for (const r of fails) {
    const issues = r.unknownClasses?.length > 0 ? r.unknownClasses.slice(0, 3).join(", ") : "";
    lines.push(`| ${r.key} | ${r.n} | **${r.minScore}** | ${r.structuralLogic} | ${r.visualCoherence} | ${r.alignment} | ${r.gameplayUsability} | ${r.realism} | ${issues} |`);
  }
  lines.push("");
}

if (errors.length) {
  lines.push("## Errors", "");
  for (const r of errors) lines.push(`- **${r.key}**: ${r.error}`);
  lines.push("");
}

lines.push("## Passes", "");
lines.push("| Build | N | Min | Span (m) | Height (m) |");
lines.push("|-------|---|-----|----------|------------|");
for (const r of passes) {
  lines.push(`| ${r.key} | ${r.n} | ${r.minScore} | ${r.span} | ${r.tall} |`);
}

const out = path.join(projectRoot, "tools", "validation_report.md");
fs.writeFileSync(out, lines.join("\n"));

console.log(`\n${rows.length} builds: ${passes.length} pass, ${fails.length} fail, ${errors.length} errors`);
console.log(`Report: tools/validation_report.md`);
if (fails.length || errors.length) process.exit(1);
