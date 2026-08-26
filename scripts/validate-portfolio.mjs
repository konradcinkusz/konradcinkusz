#!/usr/bin/env node
// Validates site/data/portfolio.json: shape, required keys, and referential
// integrity between repos, clusters, kernels, duplications, tiers and the glossary.
// No dependencies — it runs on a bare Node 22.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "site", "data", "portfolio.json");

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let data;
try {
  data = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.error(`Cannot read or parse ${manifestPath}: ${e.message}`);
  process.exit(1);
}

const REPO_KEYS = new Set([
  "slug", "name", "cluster", "visibility", "state", "tier", "oneLiner", "summary",
  "stack", "primaryLanguage", "license", "metrics", "links", "deployment",
  "components", "overlaps", "product", "gaps", "next", "highlights", "risks", "github",
  "tests", "ci", "headline", "headlineTone",
]);
const TONES = new Set(["good", "warn", "bad"]);
const VISIBILITY = new Set(["public", "private"]);
const STATES = new Set(["production", "active", "stable", "prototype", "draft", "dormant", "stub"]);

// --- top level -------------------------------------------------------------
for (const key of ["meta", "clusters", "repos", "kernels", "duplications", "boundaries", "distribution", "ops", "glossary"]) {
  if (!(key in data)) fail(`missing top-level key: ${key}`);
}

const clusterIds = new Set((data.clusters ?? []).map((c) => c.id));
const tierIds = new Set((data.ops?.tiers ?? []).map((t) => t.id));
const glossaryIds = new Set((data.glossary ?? []).map((g) => g.id));
const slugs = new Set();

// --- repositories ----------------------------------------------------------
for (const r of data.repos ?? []) {
  const at = `repo ${r.slug ?? "(no slug)"}`;
  for (const k of REPO_KEYS) if (!(k in r)) fail(`${at}: missing key "${k}"`);
  for (const k of Object.keys(r)) if (!REPO_KEYS.has(k)) fail(`${at}: unexpected key "${k}" (schema is closed on purpose — see flyio/SECRETS.md)`);

  if (slugs.has(r.slug)) fail(`${at}: duplicate slug`);
  slugs.add(r.slug);

  if (!clusterIds.has(r.cluster)) fail(`${at}: unknown cluster "${r.cluster}"`);
  if (!tierIds.has(r.tier)) fail(`${at}: unknown tier "${r.tier}"`);
  if (!VISIBILITY.has(r.visibility)) fail(`${at}: visibility must be public|private, got "${r.visibility}"`);
  if (!STATES.has(r.state)) fail(`${at}: unknown state "${r.state}"`);

  if (typeof r.oneLiner !== "string" || r.oneLiner.length === 0) fail(`${at}: oneLiner is empty`);
  if (r.oneLiner && r.oneLiner.length > 180) warn(`${at}: oneLiner is ${r.oneLiner.length} chars; it will wrap badly in a card`);

  if (r.headline && !TONES.has(r.headlineTone)) fail(`${at}: headlineTone must be good|warn|bad, got "${r.headlineTone}"`);

  const expected = `https://github.com/konradcinkusz/${r.slug}`;
  if (r.links?.repo !== expected) fail(`${at}: links.repo should be ${expected}, got ${r.links?.repo}`);

  for (const l of r.links?.live ?? []) {
    if (!/^https:\/\//.test(l.url)) fail(`${at}: live link "${l.label}" is not https`);
  }
  // A private repository must not advertise a link a reader cannot open.
  if (r.visibility === "private") {
    for (const d of r.links?.docs ?? []) {
      if (/github\.com\/konradcinkusz/.test(d.url) && !d.privateOk) {
        warn(`${at}: docs link "${d.label}" points into a private repository; a reader will get a 404`);
      }
    }
  }
}

// --- cross-references ------------------------------------------------------
for (const r of data.repos ?? []) {
  for (const o of r.overlaps ?? []) {
    if (!slugs.has(o.slug)) fail(`repo ${r.slug}: overlaps with unknown slug "${o.slug}"`);
    if (o.slug === r.slug) fail(`repo ${r.slug}: overlaps with itself`);
  }
}
for (const k of data.kernels ?? []) {
  if (!slugs.has(k.sourceSlug)) fail(`kernel ${k.id}: unknown sourceSlug "${k.sourceSlug}"`);
  for (const c of k.consumers ?? []) if (!slugs.has(c)) fail(`kernel ${k.id}: unknown consumer "${c}"`);
  if ((k.consumers ?? []).length < 2 && k.effort !== "zrobione") {
    warn(`kernel ${k.id}: fewer than two consumers — that is a library, not a kernel`);
  }
}
for (const d of data.duplications ?? []) {
  for (const side of [d.sideA, d.sideB]) {
    if (!slugs.has(side?.slug)) fail(`duplication "${d.problem}": unknown slug "${side?.slug}"`);
  }
}
for (const row of data.distribution?.rows ?? []) {
  for (const s of row.artefactSlugs ?? []) if (!slugs.has(s)) fail(`distribution row ${row.step}: unknown slug "${s}"`);
}

// --- operating model: every repo lives in exactly one tier -----------------
const tiered = new Map();
for (const t of data.ops?.tiers ?? []) {
  for (const s of t.slugs ?? []) {
    if (!slugs.has(s)) fail(`tier ${t.id}: unknown slug "${s}"`);
    if (tiered.has(s)) fail(`slug "${s}" appears in two tiers: ${tiered.get(s)} and ${t.id}`);
    tiered.set(s, t.id);
  }
}
for (const s of slugs) {
  if (!tiered.has(s)) fail(`slug "${s}" is in no tier — every repository must have a service level`);
  else if (tiered.get(s) !== data.repos.find((r) => r.slug === s).tier) {
    fail(`slug "${s}": repo.tier is "${data.repos.find((r) => r.slug === s).tier}" but it is listed under tier "${tiered.get(s)}"`);
  }
}

// --- glossary references in prose -----------------------------------------
const prose = JSON.stringify(data);
for (const id of prose.matchAll(/\{\{term:([a-z0-9-]+)\}\}/g)) {
  if (!glossaryIds.has(id[1])) fail(`prose references unknown glossary term "${id[1]}"`);
}
const gIds = new Set();
for (const g of data.glossary ?? []) {
  if (gIds.has(g.id)) fail(`glossary: duplicate id "${g.id}"`);
  gIds.add(g.id);
  if (!g.term || !g.body) fail(`glossary ${g.id}: missing term or body`);
}

// --- report ----------------------------------------------------------------
const counts = {
  repositories: (data.repos ?? []).length,
  clusters: (data.clusters ?? []).length,
  kernels: (data.kernels ?? []).length,
  duplications: (data.duplications ?? []).length,
  glossary: (data.glossary ?? []).length,
  tiers: (data.ops?.tiers ?? []).length,
};
console.log("portfolio.json —", Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", "));
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s). Manifest rejected.`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
