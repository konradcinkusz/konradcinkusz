#!/usr/bin/env node
// Inlines the stylesheet, the renderer and the manifest into one self-contained
// HTML file. Useful for three things a served site cannot do: opening the map
// straight off a disk with no server, attaching it to a message, and printing it.
//
//   node scripts/build-standalone.mjs [outfile]                default: dist/portfolio.html
//   node scripts/build-standalone.mjs --artifact [outfile]     body-only, for a host
//                                                              that supplies the skeleton

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const artifactMode = process.argv.includes("--artifact");
const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const out = resolve(positional[0] ?? join(root, "dist", artifactMode ? "portfolio-artifact.html" : "portfolio.html"));

const html = readFileSync(join(site, "index.html"), "utf8");
const css = readFileSync(join(site, "assets", "app.css"), "utf8");
const js = readFileSync(join(site, "assets", "app.js"), "utf8");
const data = readFileSync(join(site, "data", "portfolio.json"), "utf8");

// The renderer fetches the manifest. In a single file there is nothing to fetch,
// so hand it a Response over the inlined copy rather than forking the renderer.
const shim = `<script id="portfolio-data" type="application/json">${data.replace(/<\//g, "<\\/")}</script>
<script>
(function () {
  var raw = document.getElementById("portfolio-data").textContent;
  var real = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (/portfolio\\.json$/.test(url)) {
      return Promise.resolve(new Response(raw, { status: 200, headers: { "content-type": "application/json" } }));
    }
    if (real) return real.apply(window, arguments);
    return Promise.reject(new Error("fetch unavailable"));
  };
})();
</script>`;

// Replacer FUNCTIONS, not strings: "$$" in a replacement string means one literal
// "$", which silently turned every $$ helper in the renderer into $ and produced a
// file that parsed as a duplicate declaration. This is the whole reason for the
// parse check below.
const single = html
  .replace('<link rel="stylesheet" href="assets/app.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="assets/app.js"></script>', () => `${shim}\n<script>\n${js}\n</script>`);

if (single.includes('href="assets/') || single.includes('src="assets/')) {
  console.error("An assets/ reference survived inlining — the standalone file would be broken.");
  process.exit(1);
}

// Prove the inlined script still parses, before anyone opens the file.
const inlined = single.slice(single.lastIndexOf("<script>") + 8, single.lastIndexOf("</script>"));
try {
  new Function(inlined);
} catch (e) {
  console.error(`The inlined renderer does not parse: ${e.message}`);
  process.exit(1);
}
if (!inlined.includes("$$")) {
  console.error("The $$ helper vanished during inlining — a replacement string ate it.");
  process.exit(1);
}

let output = single;
if (artifactMode) {
  // Some hosts wrap the file in their own <!doctype>/<head>/<body>. Hand them the
  // page content only, keeping <title>, the font link, the style and the scripts.
  const head = single.slice(single.indexOf("<head>") + 6, single.indexOf("</head>"));
  const body = single.slice(single.indexOf("<body>") + 6, single.lastIndexOf("</body>"));
  const keep = head
    .split("\n")
    .filter((l) => /<title>|fonts\.googleapis|fonts\.gstatic|rel="icon"/.test(l))
    .join("\n");
  const styleStart = head.indexOf("<style>");
  const style = styleStart === -1 ? "" : head.slice(styleStart, head.indexOf("</style>") + 8);
  output = `${keep}\n${style}\n${body}`;
  if (/<\/?(html|head|body)[\s>]/i.test(output)) {
    console.error("A document-skeleton tag survived the artifact strip.");
    process.exit(1);
  }
  if (!output.includes("<title>")) { console.error("The artifact build lost its <title>."); process.exit(1); }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, output);
console.log(`Wrote ${out} — ${(output.length / 1024).toFixed(0)} kB, ${artifactMode ? "body-only (artifact host supplies the skeleton)" : "self-contained"}.`);
