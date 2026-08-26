#!/usr/bin/env node
// The classic unreadable-artifact bug: a colour whose ONLY definition sits inside
// a @media or [data-theme] block. The viewer's default is "system", which stamps
// nothing on the root — so such a colour never applies there, and the page renders
// one theme's text on the other theme's ground.
//
// This checks the property mechanically: every custom property used anywhere must
// be defined on bare :root, and no component rule may carry a raw colour literal.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "site", "assets", "app.css"), "utf8");
const errors = [];

// 1. Collect the tokens defined on bare :root (the first block, outside any at-rule).
const bare = css.match(/(^|\n):root\s*\{([\s\S]*?)\n\}/);
if (!bare) { console.error("No bare :root block found."); process.exit(1); }
const defined = new Set([...bare[2].matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

// 2. Every var() referenced anywhere must resolve to one of those.
for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g)) {
  if (!defined.has(m[1])) errors.push(`var(${m[1]}) is used but never defined on bare :root`);
}

// 3+4. Walk the stylesheet brace by brace. Regexes cannot match nested at-rules
// reliably, and getting this wrong the first time is what made the check pass
// while every dark token sat outside the blocks it claimed to check.
const blank = (str, from, to) => str.slice(0, from) + " ".repeat(to - from) + str.slice(to);
let rest = css;
// An explicit cursor, not lastIndexOf("}"): blanking a block leaves its SELECTOR
// text in place, and searching backwards for a brace then swallows that selector
// into the next rule's. That made "@media print" leak forward and silently
// exempt the rule after it — which is how this check passed a raw #ff0000.
let cursor = 0;
while (cursor < rest.length) {
  const open = rest.indexOf("{", cursor);
  if (open === -1) break;
  const selector = rest.slice(cursor, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
  let depth = 0, close = open;
  for (; close < rest.length; close++) {
    if (rest[close] === "{") depth++;
    else if (rest[close] === "}") { depth--; if (depth === 0) break; }
  }
  const body = rest.slice(open, close + 1);
  const isThemeBlock = /:root/.test(selector) || /prefers-color-scheme/.test(selector);
  const isPrint = /@media\s+print/.test(selector);

  if (isThemeBlock) {
    for (const t of body.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
      if (!defined.has(t[1])) errors.push(`${t[1]} is defined only inside "${selector.slice(0, 60)}" — it will not apply to a viewer on "system"`);
    }
  }
  if (isThemeBlock || isPrint) rest = blank(rest, cursor, close + 1);
  cursor = close + 1;
}
for (const m of rest.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)) {
  const line = css.slice(0, m.index).split("\n").length;
  errors.push(`raw colour "${m[0]}" at line ${line} sits outside the token blocks — it cannot follow the theme`);
}

// 5. body must paint its own ground, or it borrows the host's.
if (!/body\s*\{[^}]*background:\s*var\(--/.test(css)) {
  errors.push("body does not set background from a token — a transparent body borrows the host's theme");
}

for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) { console.error(`\n${errors.length} theming problem(s).`); process.exit(1); }
console.log(`Theming OK — ${defined.size} tokens, all defined on bare :root, no raw colours outside them, body paints its own ground.`);
