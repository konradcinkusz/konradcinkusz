#!/usr/bin/env node
// Validates site/data/portfolio.json: shape, required keys, and referential
// integrity between repos, clusters, kernels, duplications, tiers and the glossary.
// No dependencies — it runs on a bare Node 22.
//
// The manifest carries two languages. Every check below runs against BOTH, and a
// final pass compares them: same slugs, same ids, same array lengths, same
// interface keys. That pass is the point of the whole arrangement — a translation
// is trusted to read well and trusted for nothing else, so a dropped array
// element or a renamed id is a build failure rather than a hole a reader finds.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "site", "data", "portfolio.json");

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let bundle;
try {
  bundle = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.error(`Cannot read or parse ${manifestPath}: ${e.message}`);
  process.exit(1);
}

const LANGS = Object.keys(bundle).filter((k) => k !== "ui");
if (!LANGS.includes("pl")) fail("manifest has no \"pl\" bundle — Polish is the source language");
if (!bundle.ui) fail("manifest has no \"ui\" block");

const REPO_KEYS = new Set([
  "slug", "name", "cluster", "visibility", "state", "tier", "oneLiner", "summary",
  "stack", "primaryLanguage", "license", "metrics", "links", "deployment",
  "components", "overlaps", "product", "gaps", "next", "highlights", "risks", "github",
  "tests", "ci", "headline", "headlineTone",
]);
const TONES = new Set(["good", "warn", "bad"]);
const VISIBILITY = new Set(["public", "private"]);
const STATES = new Set(["production", "active", "stable", "prototype", "draft", "dormant", "stub"]);
// effort and severity are machine values, not labels. They were Polish words once,
// which meant a translator had to reproduce "zrobione" exactly or the CSS that keys
// off them stopped matching. The label now lives in ui.json and this stays fixed.
const EFFORTS = new Set(["hours", "days", "weeks", "done"]);
const SEVERITIES = new Set(["low", "medium", "high"]);

// Everything below runs once per language. Nothing here knows which language it
// is looking at beyond labelling its own error messages — that is deliberate: a
// check that only holds for Polish is a check that stopped being a check.
let refCount = 0;
function checkBundle(data, lang) {
  // --- top level -------------------------------------------------------------
  for (const key of ["meta", "clusters", "repos", "kernels", "duplications", "boundaries", "distribution", "ops", "glossary"]) {
    if (!(key in data)) fail(`[${lang}] missing top-level key: ${key}`);
  }

  const clusterIds = new Set((data.clusters ?? []).map((c) => c.id));
  const tierIds = new Set((data.ops?.tiers ?? []).map((t) => t.id));
  const glossaryIds = new Set((data.glossary ?? []).map((g) => g.id));
  const slugs = new Set();

  // --- repositories ----------------------------------------------------------
  for (const r of data.repos ?? []) {
    const at = `repo ${r.slug ?? "(no slug)"}`;
    for (const k of REPO_KEYS) if (!(k in r)) fail(`[${lang}] ${at}: missing key "${k}"`);
    for (const k of Object.keys(r)) if (!REPO_KEYS.has(k)) fail(`[${lang}] ${at}: unexpected key "${k}" (schema is closed on purpose — see flyio/SECRETS.md)`);

    if (slugs.has(r.slug)) fail(`[${lang}] ${at}: duplicate slug`);
    slugs.add(r.slug);

    if (!clusterIds.has(r.cluster)) fail(`[${lang}] ${at}: unknown cluster "${r.cluster}"`);
    if (!tierIds.has(r.tier)) fail(`[${lang}] ${at}: unknown tier "${r.tier}"`);
    if (!VISIBILITY.has(r.visibility)) fail(`[${lang}] ${at}: visibility must be public|private, got "${r.visibility}"`);
    if (!STATES.has(r.state)) fail(`[${lang}] ${at}: unknown state "${r.state}"`);

    if (typeof r.oneLiner !== "string" || r.oneLiner.length === 0) fail(`[${lang}] ${at}: oneLiner is empty`);
    if (r.oneLiner && r.oneLiner.length > 180) warn(`[${lang}] ${at}: oneLiner is ${r.oneLiner.length} chars; it will wrap badly in a card`);

    if (r.headline && !TONES.has(r.headlineTone)) fail(`[${lang}] ${at}: headlineTone must be good|warn|bad, got "${r.headlineTone}"`);

    const expected = `https://github.com/konradcinkusz/${r.slug}`;
    if (r.links?.repo !== expected) fail(`[${lang}] ${at}: links.repo should be ${expected}, got ${r.links?.repo}`);

    for (const l of r.links?.live ?? []) {
      if (!/^https:\/\//.test(l.url)) fail(`[${lang}] ${at}: live link "${l.label}" is not https`);
    }
    // Docs links into a private repository are expected and the renderer greys them
    // out with a reason, so they are not worth a warning. What IS worth one: a public
    // repository promising a document, since that link resolves to a real 404.
    for (const doc of r.links?.docs ?? []) {
      if (/^https?:|^\//.test(doc.path)) fail(`[${lang}] ${at}: docs entry "${doc.label}" must be a repo-relative path, not a URL`);
    }
  }

  // --- cross-references ------------------------------------------------------
  for (const r of data.repos ?? []) {
    for (const o of r.overlaps ?? []) {
      if (!slugs.has(o.slug)) fail(`[${lang}] repo ${r.slug}: overlaps with unknown slug "${o.slug}"`);
      if (o.slug === r.slug) fail(`[${lang}] repo ${r.slug}: overlaps with itself`);
    }
  }
  for (const k of data.kernels ?? []) {
    if (!slugs.has(k.sourceSlug)) fail(`[${lang}] kernel ${k.id}: unknown sourceSlug "${k.sourceSlug}"`);
    for (const c of k.consumers ?? []) if (!slugs.has(c)) fail(`[${lang}] kernel ${k.id}: unknown consumer "${c}"`);
    if (!EFFORTS.has(k.effort)) fail(`[${lang}] kernel ${k.id}: effort must be one of ${[...EFFORTS].join("|")}, got "${k.effort}" — it is a machine value, not a label`);
    if ((k.consumers ?? []).length < 2 && k.effort !== "done") {
      warn(`[${lang}] kernel ${k.id}: fewer than two consumers — that is a library, not a kernel`);
    }
  }
  for (const d of data.duplications ?? []) {
    if (!SEVERITIES.has(d.severity)) fail(`[${lang}] duplication "${d.problem}": severity must be one of ${[...SEVERITIES].join("|")}, got "${d.severity}"`);
    for (const side of [d.sideA, d.sideB]) {
      if (!slugs.has(side?.slug)) fail(`[${lang}] duplication "${d.problem}": unknown slug "${side?.slug}"`);
    }
  }
  for (const row of data.distribution?.rows ?? []) {
    for (const s of row.artefactSlugs ?? []) if (!slugs.has(s)) fail(`[${lang}] distribution row ${row.step}: unknown slug "${s}"`);
  }

  // --- operating model: every repo lives in exactly one tier -----------------
  const tiered = new Map();
  for (const t of data.ops?.tiers ?? []) {
    for (const s of t.slugs ?? []) {
      if (!slugs.has(s)) fail(`[${lang}] tier ${t.id}: unknown slug "${s}"`);
      if (tiered.has(s)) fail(`[${lang}] slug "${s}" appears in two tiers: ${tiered.get(s)} and ${t.id}`);
      tiered.set(s, t.id);
    }
  }
  for (const s of slugs) {
    if (!tiered.has(s)) fail(`[${lang}] slug "${s}" is in no tier — every repository must have a service level`);
    else if (tiered.get(s) !== data.repos.find((r) => r.slug === s).tier) {
      fail(`[${lang}] slug "${s}": repo.tier is "${data.repos.find((r) => r.slug === s).tier}" but it is listed under tier "${tiered.get(s)}"`);
    }
  }

  // --- glossary references in prose -----------------------------------------
  // BOTH forms: {{term:id}} and {{term:id|label}}. Matching only the bare form let
  // two labelled references sit in the manifest pointing at glossary entries that
  // do not exist, while this script printed OK.
  const prose = JSON.stringify(data);
  // counted into the outer total, so the report shows references across both languages
  for (const m of prose.matchAll(/\{\{term:([a-z0-9-]+)(?:\|[^}]*)?\}\}/g)) {
    refCount++;
    if (!glossaryIds.has(m[1])) fail(`[${lang}] prose references unknown glossary term "${m[1]}"`);
  }
  // A term nobody links to is dead weight in a two-column glossary.
  const linked = new Set([...prose.matchAll(/\{\{term:([a-z0-9-]+)/g)].map((m) => m[1]));
  for (const g of data.glossary ?? []) {
    if (!linked.has(g.id)) warn(`[${lang}] glossary entry "${g.id}" is never referenced from any prose`);
  }
  const gIds = new Set();
  for (const g of data.glossary ?? []) {
    if (gIds.has(g.id)) fail(`[${lang}] glossary: duplicate id "${g.id}"`);
    gIds.add(g.id);
    if (!g.term || !g.body) fail(`[${lang}] glossary ${g.id}: missing term or body`);
  }

  // --- health (optional; written by scripts/collect-health.mjs) --------------
  if (data.health) {
    for (const r of data.health.rows ?? []) {
      if (!slugs.has(r.slug)) fail(`[${lang}] health row for unknown slug "${r.slug}"`);
    }
    for (const b of data.health.breaches ?? []) {
      if (!slugs.has(b.slug)) fail(`[${lang}] health breach for unknown slug "${b.slug}"`);
    }
    const age = Math.floor((Date.now() - Date.parse(data.health.collectedAt)) / 86400000);
    if (age > 14) warn(`[${lang}] health data is ${age} days old — the nightly collector has not run`);
  }
}

for (const lang of LANGS) checkBundle(bundle[lang], lang);

// --- parity between the languages -----------------------------------------
// A translation may say anything it likes; it may not change the shape. Every
// list must line up element for element, and every identifier must be the same
// string, or the renderer will key off one language and render another.
function parity(a, b, path, langA, langB) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return fail(`parity ${path}: array in one language, ${Array.isArray(a) ? typeof b : typeof a} in the other`);
    if (a.length !== b.length) return fail(`parity ${path}: ${langA} has ${a.length} entries, ${langB} has ${b.length} — an entry was dropped or merged in translation`);
    a.forEach((x, i) => parity(x, b[i], `${path}[${i}]`, langA, langB));
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a).sort().join(","), kb = Object.keys(b).sort().join(",");
    if (ka !== kb) return fail(`parity ${path}: keys differ — ${langA} has [${ka}], ${langB} has [${kb}]`);
    for (const k of Object.keys(a)) parity(a[k], b[k], `${path}.${k}`, langA, langB);
    return;
  }
  if (typeof a !== typeof b) fail(`parity ${path}: ${langA} is ${typeof a}, ${langB} is ${typeof b}`);
}

// Fields a translation must reproduce byte for byte, because something keys off
// them: a CSS selector, a lookup, a URL, or the reader's own git checkout.
// NOT on this list, deliberately: "tests" and "ci" read like metadata and are
// prose — they describe what the suite covers and what the workflows do, in
// sentences. Freezing them left every English repo card with two Polish
// paragraphs in the middle of it.
const FROZEN_REPO = ["slug", "cluster", "tier", "visibility", "state", "headlineTone", "primaryLanguage", "deployment", "github"];

const source = bundle.pl;
for (const lang of LANGS.filter((l) => l !== "pl")) {
  const other = bundle[lang];
  parity(source, other, lang, "pl", lang);

  const bySlug = new Map(other.repos.map((r) => [r.slug, r]));
  for (const r of source.repos) {
    const o = bySlug.get(r.slug);
    if (!o) { fail(`[${lang}] repo "${r.slug}" is missing from the translation`); continue; }
    for (const k of FROZEN_REPO) {
      if (JSON.stringify(r[k]) !== JSON.stringify(o[k])) {
        fail(`[${lang}] repo ${r.slug}: "${k}" was translated but must be copied verbatim — pl ${JSON.stringify(r[k])}, ${lang} ${JSON.stringify(o[k])}`);
      }
    }
    if (r.links.repo !== o.links.repo) fail(`[${lang}] repo ${r.slug}: links.repo differs`);
    const pc = r.components.map((c) => c.path).join("|"), oc = o.components.map((c) => c.path).join("|");
    if (pc !== oc) fail(`[${lang}] repo ${r.slug}: component paths differ — they are file paths, not prose`);
  }

  const ids = (xs, f) => (xs ?? []).map(f).join("|");
  if (ids(source.glossary, (g) => g.id) !== ids(other.glossary, (g) => g.id)) fail(`[${lang}] glossary ids differ or are reordered`);
  if (ids(source.clusters, (c) => c.id) !== ids(other.clusters, (c) => c.id)) fail(`[${lang}] cluster ids differ or are reordered`);
  if (ids(source.kernels, (k) => k.id) !== ids(other.kernels, (k) => k.id)) fail(`[${lang}] kernel ids differ or are reordered`);
  if (ids(source.ops?.tiers, (t) => t.id) !== ids(other.ops?.tiers, (t) => t.id)) fail(`[${lang}] tier ids differ or are reordered`);

  // Untranslated strings. A value that is byte-identical to the Polish AND carries
  // a Polish-only diacritic was not translated — it was copied. Both halves of the
  // test matter: "MIT", "C#" and every URL are identical and fine, while an English
  // sentence quoting a Polish filename has diacritics but is not identical.
  const POLISH = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  const strings = (o, path, into) => {
    if (typeof o === "string") { if (o) into.push([path, o]); return into; }
    if (Array.isArray(o)) { o.forEach((v, i) => strings(v, `${path}[${i}]`, into)); return into; }
    if (o && typeof o === "object") { for (const k of Object.keys(o)) strings(o[k], `${path}.${k}`, into); return into; }
    return into;
  };
  const sa = strings(source, "", []), sb = strings(other, "", []);
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    if (sa[i][1] === sb[i][1] && POLISH.test(sb[i][1])) {
      fail(`[${lang}] left untranslated at ${sb[i][0]}: ${JSON.stringify(sb[i][1].slice(0, 90))}`);
    }
  }

  // Glossary references have to survive verbatim on both sides of the pipe:
  // {{term:id}} and {{term:id|label}} — the label translates, the id never does.
  const refs = (d) => [...JSON.stringify(d).matchAll(/\{\{term:([a-z0-9-]+)/g)].map((m) => m[1]).sort().join(",");
  if (refs(source) !== refs(other)) fail(`[${lang}] the set of {{term:...}} references differs from Polish — an id was translated or a reference dropped`);
}

// --- interface strings -----------------------------------------------------
const uiKeys = Object.fromEntries(LANGS.map((l) => [l, new Set(Object.keys(bundle.ui[l] ?? {}))]));
for (const lang of LANGS.filter((l) => l !== "pl")) {
  for (const k of uiKeys.pl) if (!uiKeys[lang]?.has(k)) fail(`[${lang}] ui.json is missing key "${k}" — the page would print the key itself`);
  for (const k of uiKeys[lang] ?? []) if (!uiKeys.pl.has(k)) warn(`[${lang}] ui.json has key "${k}" that Polish does not`);
  for (const [k, v] of Object.entries(bundle.ui[lang] ?? {})) {
    if (typeof v !== "string" || !v.trim()) fail(`[${lang}] ui key "${k}" is empty`);
    // A plural key carries its forms separated by a pipe; the wrong count silently
    // renders the singular for every number.
    if (k.startsWith("plural.")) {
      const want = lang === "pl" ? 3 : 2;
      const got = v.split("|").length;
      if (got !== want) fail(`[${lang}] plural key "${k}" has ${got} form(s); ${lang} needs ${want}`);
    }
  }
}

// --- report ----------------------------------------------------------------
const counts = {
  languages: LANGS.length,
  repositories: (source.repos ?? []).length,
  clusters: (source.clusters ?? []).length,
  kernels: (source.kernels ?? []).length,
  duplications: (source.duplications ?? []).length,
  glossary: (source.glossary ?? []).length,
  tiers: (source.ops?.tiers ?? []).length,
  "interface strings": uiKeys.pl.size,
};
counts["glossary references"] = refCount;  // across all languages
console.log("portfolio.json —", Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", "));
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s). Manifest rejected.`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
