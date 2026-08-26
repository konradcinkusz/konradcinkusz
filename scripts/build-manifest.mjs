#!/usr/bin/env node
// Merges data/ into site/data/portfolio.json.
//
// The generated file is committed and served, because the site is static and must not
// need a build to run. CI regenerates it and fails if the committed copy has drifted —
// the same drift-validator pattern architecture-standards uses for its plugin catalogue.
//
//   node scripts/build-manifest.mjs           writes site/data/portfolio.json
//   node scripts/build-manifest.mjs --check    fails if the committed file is stale

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "data");
const out = join(root, "site", "data", "portfolio.json");

const read = (p) => JSON.parse(readFileSync(join(src, p), "utf8"));

const repoFiles = readdirSync(join(src, "repos")).filter((f) => f.endsWith(".json")).sort();
const repos = repoFiles.map((f) => {
  const r = JSON.parse(readFileSync(join(src, "repos", f), "utf8"));
  const expected = `${r.slug}.json`;
  if (f !== expected) throw new Error(`data/repos/${f} declares slug "${r.slug}"; rename the file to ${expected}`);
  return r;
});

const consolidation = read("consolidation.json");

const manifest = {
  meta: read("meta.json"),
  clusters: read("clusters.json"),
  repos: repos.sort((a, b) => a.name.localeCompare(b.name, "pl")),
  kernels: consolidation.kernels,
  kernelsRejected: consolidation.kernelsRejected,
  duplications: consolidation.duplications,
  boundaries: consolidation.boundaries,
  distribution: consolidation.distribution,
  ops: read("ops.json"),
  glossary: read("glossary.json"),
};

const json = JSON.stringify(manifest, null, 2) + "\n";

if (process.argv.includes("--check")) {
  let current = "";
  try { current = readFileSync(out, "utf8"); } catch { /* not generated yet */ }
  if (current !== json) {
    console.error("site/data/portfolio.json is stale. Run: node scripts/build-manifest.mjs");
    process.exit(1);
  }
  console.log(`site/data/portfolio.json is current (${repos.length} repositories).`);
} else {
  writeFileSync(out, json);
  console.log(`Wrote site/data/portfolio.json — ${repos.length} repositories, ${manifest.glossary.length} glossary entries, ${(json.length / 1024).toFixed(0)} kB.`);
}
