#!/usr/bin/env node
// Asserts that a SERVED manifest is the real thing, not merely valid JSON.
//
//   node scripts/assert-served-manifest.mjs http://127.0.0.1:8080/data/portfolio.json
//   node scripts/assert-served-manifest.mjs ./site/data/portfolio.json
//
// Both workflows need this and were carrying two hand-written copies of it
// inline, in shell, inside YAML, with the quoting that implies. One of those
// copies still asserted the old flat shape after the manifest changed, and
// nothing noticed until the container job went red. So it lives here, where it
// can be run and negative-tested like anything else.
//
// A health check proves nginx answers. This proves what nginx is answering with:
// a truncated upload, a builder run against a half-translated tree, or a stale
// image all serve a perfectly valid JSON document that a reader of one language
// would never notice was missing the other.

import { readFileSync } from "node:fs";

const REQUIRED_LANGS = ["pl", "en"];
const MIN_REPOS = 30;
const MIN_UI_STRINGS = 100;

const target = process.argv[2];
if (!target) {
  console.error("usage: assert-served-manifest.mjs <url|path>");
  process.exit(2);
}

// ::error:: is the GitHub Actions annotation prefix; outside CI it is just noise
// on stderr, which is where an error belongs anyway.
const die = (m) => { console.error(`::error::${m}`); process.exit(1); };

let text;
if (/^https?:\/\//.test(target)) {
  // Retries, because a container that has just started and a Fly machine waking
  // from zero both answer late rather than wrongly.
  let lastErr;
  for (let i = 1; i <= 5; i++) {
    try {
      const res = await fetch(target, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      text = await res.text();
      break;
    } catch (e) {
      lastErr = e;
      if (i < 5) { console.error(`attempt ${i} failed (${e.message}), retrying`); await new Promise((r) => setTimeout(r, 10_000)); }
    }
  }
  if (text === undefined) die(`could not fetch ${target}: ${lastErr?.message}`);
} else {
  try { text = readFileSync(target, "utf8"); } catch (e) { die(`could not read ${target}: ${e.message}`); }
}

let j;
try { j = JSON.parse(text); } catch (e) { die(`served manifest is not valid JSON: ${e.message}`); }

if (Array.isArray(j.repos)) die("served manifest is the OLD flat shape (a top-level \"repos\" array) — the image is stale or the builder was not run");

const langs = Object.keys(j).filter((k) => k !== "ui");
if (!langs.length) die("served manifest carries no language bundle at all");

for (const l of REQUIRED_LANGS) {
  if (!langs.includes(l)) die(`served manifest has no "${l}" bundle (found: ${langs.join(", ") || "none"})`);
}

for (const l of langs) {
  const n = j[l]?.repos?.length ?? 0;
  if (n < MIN_REPOS) die(`served manifest: bundle "${l}" has ${n} repositories, expected at least ${MIN_REPOS}`);
  const u = Object.keys(j.ui?.[l] ?? {}).length;
  if (u < MIN_UI_STRINGS) die(`served manifest: bundle "${l}" has ${u} interface strings, expected at least ${MIN_UI_STRINGS} — the page would print raw keys`);
  if (!j[l]?.ops?.tiers?.length) die(`served manifest: bundle "${l}" has no operating model`);
  if (!j[l]?.glossary?.length) die(`served manifest: bundle "${l}" has no glossary`);
}

// The bundles must agree on the estate. A deploy that shipped 35 Polish entries
// and 12 English ones is a half-built manifest, and every count on the English
// page would quietly be wrong rather than visibly missing.
const counts = langs.map((l) => j[l].repos.length);
if (new Set(counts).size !== 1) {
  die(`served manifest: the bundles disagree on the estate — ${langs.map((l, i) => `${l}=${counts[i]}`).join(", ")}`);
}

console.log(`served manifest OK — ${langs.map((l) => `${l} (${j[l].repos.length} repos, ${Object.keys(j.ui[l]).length} strings)`).join(", ")}`);
