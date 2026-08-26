#!/usr/bin/env node
// Merges data/ into site/data/portfolio.json.
//
// The generated file is committed and served, because the site is static and must not
// need a build to run. CI regenerates it and fails if the committed copy has drifted —
// the same drift-validator pattern architecture-standards uses for its plugin catalogue.
//
//   node scripts/build-manifest.mjs           writes site/data/portfolio.json
//   node scripts/build-manifest.mjs --check    fails if the committed file is stale
//
// The manifest carries BOTH languages in one file:
//
//   { pl: {...}, en: {...}, ui: { pl: {...}, en: {...} } }
//
// One file rather than two, because the alternative is a second network round trip
// on every language switch and a window where half the page is translated. It costs
// roughly double the bytes, which for a gzipped JSON of this size is not a real cost.
//
// Polish is the source. data/en/ is a translation with the same shape, and the
// validator enforces that shape rather than trusting it.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "site", "data", "portfolio.json");

const LANGS = ["pl", "en"];
const dirFor = (lang) => (lang === "pl" ? join(root, "data") : join(root, "data", lang));

function bundle(lang) {
  const src = dirFor(lang);
  const read = (p) => JSON.parse(readFileSync(join(src, p), "utf8"));

  const repoFiles = readdirSync(join(src, "repos")).filter((f) => f.endsWith(".json")).sort();
  const repos = repoFiles.map((f) => {
    const r = JSON.parse(readFileSync(join(src, "repos", f), "utf8"));
    const expected = `${r.slug}.json`;
    if (f !== expected) throw new Error(`data/${lang === "pl" ? "" : lang + "/"}repos/${f} declares slug "${r.slug}"; rename the file to ${expected}`);
    return r;
  });

  const consolidation = read("consolidation.json");

  // Optional: written by the nightly collector. Absent on a fresh clone, and the
  // site renders without it rather than showing an empty panel. It is collected
  // once, in Polish, and shared by both languages — the alternative is a
  // collector that writes prose twice and drifts between the two.
  let health = null;
  try { health = JSON.parse(readFileSync(join(root, "data", "health.json"), "utf8")); } catch { /* not collected yet */ }

  return {
    meta: read("meta.json"),
    clusters: read("clusters.json"),
    // Sorted in the language's own collation: "Ż" belongs after "Z" in Polish
    // and the English list should not inherit that.
    repos: repos.sort((a, b) => a.name.localeCompare(b.name, lang)),
    kernels: consolidation.kernels,
    kernelsRejected: consolidation.kernelsRejected,
    duplications: consolidation.duplications,
    boundaries: consolidation.boundaries,
    distribution: consolidation.distribution,
    ops: read("ops.json"),
    glossary: read("glossary.json"),
    health,
  };
}

// This deliberately does NOT fill in this repository's own commit count from git.
// It did, briefly, to stop those numbers going stale — and that produced a chase:
// the generated file is committed, so embedding the commit count meant every
// commit invalidated the file it had just written, and --check failed on the next
// run. A committed artefact cannot carry its own commit count without either
// lying or chasing itself. The nightly collector owns those numbers instead, for
// this repository on the same terms as the other thirty-four.

const manifest = { ui: {} };
for (const lang of LANGS) {
  manifest[lang] = bundle(lang);
  manifest.ui[lang] = JSON.parse(readFileSync(join(dirFor(lang), "ui.json"), "utf8"));
}

const json = JSON.stringify(manifest, null, 2) + "\n";

if (process.argv.includes("--check")) {
  let current = "";
  try { current = readFileSync(out, "utf8"); } catch { /* not generated yet */ }
  if (current !== json) {
    console.error("site/data/portfolio.json is stale. Run: node scripts/build-manifest.mjs");
    process.exit(1);
  }
  console.log(`site/data/portfolio.json is current (${LANGS.join(", ")}; ${manifest.pl.repos.length} repositories).`);
} else {
  writeFileSync(out, json);
  const h = manifest.pl.health;
  console.log(
    `Wrote site/data/portfolio.json — ${LANGS.length} languages (${LANGS.join(", ")}), ` +
    `${manifest.pl.repos.length} repositories, ${manifest.pl.glossary.length} glossary entries, ` +
    `${Object.keys(manifest.ui.pl).length} interface strings each, ` +
    `${(json.length / 1024).toFixed(0)} kB` +
    `${h ? `, health from ${h.collectedAt} (${h.breaches.length} breach(es))` : ", no health data"}.`
  );
}
