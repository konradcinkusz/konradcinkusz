#!/usr/bin/env node
// Fails if a user-visible string is hard-coded in the page instead of coming
// from ui.json.
//
// This exists because the bilingual switch is silent when it goes wrong. A
// forgotten literal does not throw and does not look broken — it renders one
// Polish sentence in an English page, and only a Polish reader notices, and
// they have no reason to say anything. So the check is mechanical:
//
//   1. index.html carries no text outside a data-t / data-t-ph / data-t-aria hook
//   2. app.js carries no Polish-diacritic string literal outside a comment
//   3. every key the page asks for exists in both ui.json files
//   4. every key in ui.json is actually asked for by someone
//
// Rule 4 is a warning, not an error: a key can legitimately be used by a script
// this audit does not read. Rules 1-3 are errors.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

const html = readFileSync(join(root, "site", "index.html"), "utf8");
const jsDir = join(root, "site", "assets");
const jsFiles = readdirSync(jsDir).filter((f) => f.endsWith(".js"));
const js = jsFiles.map((f) => [f, readFileSync(join(jsDir, f), "utf8")]);

const POLISH = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

// --- 1. index.html: no bare text nodes -------------------------------------
// Strip comments, script, style, and every element that declares a hook. What
// is left should be structure and whitespace.
// <head> is exempt: <title> and <meta name="description"> are pre-hydration
// fallbacks in the source language, and the renderer replaces both from the
// manifest once it loads. A crawler that runs no JavaScript gets the Polish
// version, which is the honest default for a Polish-source document.
let stripped = html
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<head\b[\s\S]*?<\/head>/i, "")
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "");

// data-t-raw marks content that is a glyph or a sample, not language: the
// legend's dotted "abc" reads the same in every language.
stripped = stripped.replace(/<([a-z0-9]+)([^>]*\bdata-t-raw\b[^>]*)>[\s\S]*?<\/\1>/gi, "");

// Remove the *content* of any element carrying data-t, since the renderer
// overwrites it — the literal in the file is only a pre-hydration placeholder.
stripped = stripped.replace(/<([a-z0-9]+)([^>]*\bdata-t=[^>]*)>[\s\S]*?<\/\1>/gi, "<$1$2></$1>");

const textNodes = stripped
  .split(/<[^>]+>/)
  .map((s) => s.replace(/&[a-z]+;|&#\d+;/gi, " ").trim())
  .filter((s) => s.length > 1 && /[A-Za-zĄ-ż]/.test(s));

for (const t of textNodes) {
  errors.push(`index.html: bare text "${t.slice(0, 60)}" — wrap it in an element with data-t and put the string in data/ui.json`);
}

// Attributes a human reads. title/alt/placeholder/aria-label must come from a hook.
for (const m of stripped.matchAll(/\b(placeholder|aria-label|title|alt)="([^"]+)"/g)) {
  const tag = stripped.slice(Math.max(0, m.index - 400), m.index + m[0].length);
  const open = tag.lastIndexOf("<");
  if (!/data-t(-ph|-aria)?=/.test(tag.slice(open))) {
    errors.push(`index.html: hard-coded ${m[1]}="${m[2].slice(0, 50)}" — use data-t-ph / data-t-aria`);
  }
}

// --- 2. app.js: no Polish string literals ----------------------------------
// Comments are exempt: they are for whoever maintains this, not for a reader.
const BOOT_EXEMPT = "BOOT_ERROR";
for (const [name, src] of js) {
  const noComments = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
  // The pre-load error message is the one legitimate literal: it is what the page
  // says when the bundle carrying every other string failed to load.
  const bootAt = noComments.indexOf(BOOT_EXEMPT);
  const bootEnd = bootAt < 0 ? -1 : noComments.indexOf("\n  };", bootAt);

  for (const m of noComments.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    if (!POLISH.test(m[2])) continue;
    if (bootAt >= 0 && m.index > bootAt && m.index < bootEnd) continue;
    errors.push(`${name}: Polish string literal ${JSON.stringify(m[2].slice(0, 55))} — move it to data/ui.json and read it with t("...")`);
  }
}

// --- 3 & 4. keys the page asks for vs keys that exist ----------------------
const LANGS = ["pl", "en"];
const ui = Object.fromEntries(LANGS.map((l) => [
  l, JSON.parse(readFileSync(join(root, "data", l === "pl" ? "" : l, "ui.json"), "utf8")),
]));

const asked = new Set();
const prefixes = new Set();
for (const m of html.matchAll(/\bdata-t(?:-ph|-aria)?="([^"]+)"/g)) asked.add(m[1]);
for (const [, src] of js) {
  for (const m of src.matchAll(/\bt\(\s*"([a-z0-9.]+)"\s*\)/gi)) asked.add(m[1]);
  for (const m of src.matchAll(/\bplural\([^,]+,\s*"([a-z0-9.]+)"\s*\)/gi)) asked.add(m[1]);
  // t("effort." + k.effort) and friends: a computed key. The audit cannot
  // evaluate the expression, so it records the prefix and treats every defined
  // key under that prefix as used. That is deliberately generous — it stops the
  // audit deleting keys it merely cannot see — and rule 3 still catches a prefix
  // with no keys at all behind it.
  for (const m of src.matchAll(/\bt\(\s*"([a-z0-9.]+\.)"\s*\+/gi)) prefixes.add(m[1]);
}

for (const p of prefixes) {
  const under = Object.keys(ui.pl).filter((k) => k.startsWith(p));
  if (!under.length) errors.push(`the page builds keys as "${p}<something>" but no key with that prefix is defined in data/ui.json`);
  for (const k of under) asked.add(k);
}

for (const key of [...asked].sort()) {
  for (const l of LANGS) {
    if (!(key in ui[l])) errors.push(`the page asks for ui key "${key}" but data/${l === "pl" ? "" : l + "/"}ui.json has no such key — it would render the key itself`);
  }
}
for (const key of Object.keys(ui.pl)) {
  if (!asked.has(key)) warnings.push(`ui key "${key}" is defined but nothing in index.html or assets/*.js asks for it`);
}

// --- 5. enum attributes the stylesheet keys off ----------------------------
// A literal that used to be a Polish word and became a machine value is the
// exact bug this catches: `data-sev="niska"` survived the rename, matched no CSS
// rule, and those blocks silently lost their severity colour. Nothing threw and
// nothing looked obviously wrong. So: every enum value the scripts emit must be
// one the stylesheet actually defines.
const css = readFileSync(join(root, "site", "assets", "app.css"), "utf8");
for (const attr of ["data-sev", "data-c", "data-t"]) {
  const known = new Set([...css.matchAll(new RegExp(`\\[${attr}="([^"]+)"\\]`, "g"))].map((m) => m[1]));
  if (!known.size) continue;
  for (const [name, src] of js) {
    for (const m of src.matchAll(new RegExp(`${attr}="([a-zA-Z0-9_-]+)"`, "g"))) {
      if (!known.has(m[1])) {
        errors.push(`${name}: ${attr}="${m[1]}" matches no rule in app.css (defined: ${[...known].sort().join(", ")}) — the element renders unstyled`);
      }
    }
  }
}

// --- report ----------------------------------------------------------------
console.log(`i18n — ${asked.size} key(s) used, ${Object.keys(ui.pl).length} defined, ${LANGS.length} language(s), ${jsFiles.length} script(s) scanned`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s). The page would render untranslated text.`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
