#!/usr/bin/env node
// Cheap structural smoke test for site/index.html. It is not a browser, so it
// checks the things a broken hand-edit actually breaks: unbalanced tags in the
// shell, missing tab panels, and a data fetch pointing at a path that is not shipped.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "site", "index.html"), "utf8");
const errors = [];

const openTabs = [...html.matchAll(/data-tab="([a-z-]+)"/g)].map((m) => m[1]);
const panels = [...html.matchAll(/id="panel-([a-z-]+)"/g)].map((m) => m[1]);
for (const t of new Set(openTabs)) {
  if (!panels.includes(t)) errors.push(`tab "${t}" has no matching #panel-${t}`);
}
if (new Set(openTabs).size < 2) errors.push("fewer than two tabs found — the app is meant to have at least Portfolio and Operacje");

for (const m of html.matchAll(/fetch\(\s*["']([^"']+)["']/g)) {
  const p = m[1].replace(/^\.?\//, "");
  if (!existsSync(join(root, "site", p))) errors.push(`fetch("${m[1]}") but site/${p} does not exist`);
}

for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|data:|mailto:)([^"]+)"/g)) {
  const p = m[1].replace(/^\.?\//, "").split("?")[0];
  if (p && !existsSync(join(root, "site", p))) errors.push(`local asset "${m[1]}" is missing from site/`);
}

const opens = (html.match(/<(section|main|nav|article|aside)\b/g) ?? []).length;
const closes = (html.match(/<\/(section|main|nav|article|aside)>/g) ?? []).length;
if (opens !== closes) errors.push(`structural tags unbalanced: ${opens} opened, ${closes} closed`);

for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) { console.error(`\n${errors.length} problem(s) in site/index.html.`); process.exit(1); }
console.log(`site/index.html OK — ${new Set(openTabs).size} tabs, ${panels.length} panels.`);
