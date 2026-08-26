#!/usr/bin/env node
// Loads the built site in a real browser and asserts it actually rendered.
// The smoke test proves the HTML parses; this proves the JavaScript ran and the
// manifest reached the DOM — which is the failure mode a static check cannot see.
//
//   node scripts/render-check.mjs            headless, exits non-zero on any problem
//   node scripts/render-check.mjs --shots     also writes PNGs to .render/

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");
const shots = process.argv.includes("--shots");

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };

const server = createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/healthz") { res.writeHead(200, { "content-type": "text/plain" }); return res.end("ok\n"); }
  const p = join(siteDir, url === "/" ? "index.html" : url.replace(/^\//, ""));
  if (!existsSync(p)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const errors = [];
const browser = await chromium.launch();

// Both languages, because a translation that renders is not the same claim as a
// translation that exists. The manifest is one file carrying both, so an English
// reader hits exactly the same JavaScript — what can differ is a string long
// enough to overflow a card, a plural form that came out wrong, or a key the
// English bundle is missing and the page prints raw.
const CASES = [
  ["pl", "light", 1440, 1000],
  ["pl", "dark", 1440, 1000],
  ["pl", "light", 390, 844],
  ["en", "light", 1440, 1000],
  ["en", "dark", 390, 844],
];

for (const [lang, theme, width, height] of CASES) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, locale: lang === "pl" ? "pl-PL" : "en-GB" });
  const page = await ctx.newPage();
  const label = `${lang}/${theme}/${width}`;

  // The Google Fonts stylesheet is progressive enhancement: every family in the CSS
  // has a real system fallback, so a blocked font host is not a page defect. It is
  // blocked in the build sandbox, and would be blocked on some corporate networks too.
  const external = (u) => /^https?:\/\/(?!127\.0\.0\.1|localhost)/.test(u);
  page.on("pageerror", (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/fonts\.(googleapis|gstatic)\.com|ERR_CONNECTION|ERR_NAME_NOT_RESOLVED/.test(m.text())) return;
    errors.push(`[${label}] console: ${m.text()}`);
  });
  page.on("requestfailed", (r) => { if (!external(r.url())) errors.push(`[${label}] request failed: ${r.url()}`); });

    // ?lang= wins over the stored preference and over the browser's own locale, so
  // the case under test is the case that renders.
  await page.goto(`${base}/?lang=${lang}`, { waitUntil: "networkidle" });

  const htmlLang = await page.getAttribute("html", "lang");
  if (htmlLang !== lang) errors.push(`[${label}] <html lang> is "${htmlLang}", expected "${lang}"`);

  if (await page.locator("#boot").count()) errors.push(`[${label}] boot placeholder still present — the manifest never loaded`);

  const tabs = ["portfolio", "konsolidacja", "operacje", "indeks", "slownik"];
  for (const t of tabs) {
    await page.click(`.tabrow button[data-tab="${t}"]`);
    await page.waitForTimeout(120);
    const panel = page.locator(`#panel-${t}`);
    if (!(await panel.isVisible())) { errors.push(`[${label}] panel ${t} did not become visible`); continue; }
    const text = (await panel.innerText()).trim();
    if (text.length < 400) errors.push(`[${label}] panel ${t} rendered only ${text.length} characters`);
    if (/undefined|\[object Object\]|NaN|\{\{term:/.test(text)) {
      errors.push(`[${label}] panel ${t} contains an unrendered value: ${text.match(/undefined|\[object Object\]|NaN|\{\{term:[a-z-]+\}\}/)[0]}`);
    }
    // A missing ui key renders as the key itself — "stat.reposOnMap" sitting in
    // the page. It looks like a label, so only this pattern catches it.
    const rawKey = text.match(/\b[a-z]{2,12}\.[a-z][a-zA-Z]{2,20}(\.[a-z]+)?\b(?!\w)/);
    if (rawKey && !/\.(json|mjs|js|tex|py|yml|yaml|md|css|html|net|io|com|sh|cs|ts|toml|lock|txt|pdf|png|svg|xml|csproj|http)\b/.test(rawKey[0])) {
      errors.push(`[${label}] panel ${t} appears to print a raw ui key: "${rawKey[0]}"`);
    }
    // The English page must not carry Polish-only letters outside quoted names.
    if (lang === "en" && /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/.test(text)) {
      const around = text.match(/.{0,40}[ąćęłńśźżĄĆĘŁŃŚŹŻ].{0,40}/)[0].replace(/\s+/g, " ");
      errors.push(`[${label}] panel ${t} still shows Polish text: "…${around}…"`);
    }
    const subnavs = await page.locator(".subnav:not([hidden])").count();
    if (subnavs !== 1) errors.push(`[${label}] ${subnavs} sub-navigation rows visible on tab ${t}, expected exactly 1`);

    if (shots) {
      mkdirSync(join(root, ".render"), { recursive: true });
      await page.screenshot({ path: join(root, ".render", `${t}-${lang}-${theme}-${width}.png`), fullPage: width > 800 });
    }
  }

  // Cards must exist and open the drawer.
  await page.click('.tabrow button[data-tab="portfolio"]');
  const cards = await page.locator("#clusters .card").count();
  if (cards < 30) errors.push(`[${label}] only ${cards} repository cards rendered`);
  await page.locator("#clusters .card").first().click();
  await page.waitForTimeout(300);
  if (!(await page.locator("#drawer").isVisible())) errors.push(`[${label}] clicking a card did not open the drawer`);
  const dtext = await page.locator("#drawer-body").innerText();
  if (dtext.trim().length < 300) errors.push(`[${label}] drawer body rendered only ${dtext.trim().length} characters`);
  await page.keyboard.press("Escape");

  // The toggle must actually swap the page, not just the button.
  if (lang === "pl") {
    const before = await page.locator("#panel-portfolio").innerText();
    await page.click("#lang");
    await page.waitForTimeout(250);
    const after = await page.locator("#panel-portfolio").innerText();
    if (after === before) errors.push(`[${label}] clicking the language button changed nothing`);
    if (await page.getAttribute("html", "lang") !== "en") errors.push(`[${label}] the toggle did not set <html lang="en">`);
    const counts = await page.locator(".tabrow button .n").allInnerTexts();
    if (counts.length !== 5) errors.push(`[${label}] after the toggle there are ${counts.length} tab counters, expected 5 — the re-render duplicated or dropped them`);
    await page.click("#lang");
    await page.waitForTimeout(250);
    if (await page.getAttribute("html", "lang") !== "pl") errors.push(`[${label}] the toggle did not switch back to Polish`);
  }

  // Horizontal overflow is the one layout bug a screenshot hides.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) errors.push(`[${label}] page scrolls horizontally by ${overflow}px`);

  await ctx.close();
}

await browser.close();
server.close();

for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) { console.error(`\n${errors.length} rendering problem(s).`); process.exit(1); }
console.log(`Rendered clean in ${CASES.length} cases (${[...new Set(CASES.map((c) => c[0]))].join(", ")}): 5 tabs, drawer, language toggle, no console errors, no horizontal overflow.${shots ? " Screenshots in .render/" : ""}`);
