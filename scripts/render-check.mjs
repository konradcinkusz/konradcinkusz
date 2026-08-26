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

for (const [theme, width, height] of [["light", 1440, 1000], ["dark", 1440, 1000], ["light", 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, locale: "pl-PL" });
  const page = await ctx.newPage();
  const label = `${theme}/${width}`;

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

  await page.goto(base, { waitUntil: "networkidle" });

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
    const subnavs = await page.locator(".subnav:not([hidden])").count();
    if (subnavs !== 1) errors.push(`[${label}] ${subnavs} sub-navigation rows visible on tab ${t}, expected exactly 1`);

    if (shots) {
      mkdirSync(join(root, ".render"), { recursive: true });
      await page.screenshot({ path: join(root, ".render", `${t}-${theme}-${width}.png`), fullPage: width > 800 });
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

  // Horizontal overflow is the one layout bug a screenshot hides.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) errors.push(`[${label}] page scrolls horizontally by ${overflow}px`);

  await ctx.close();
}

await browser.close();
server.close();

for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) { console.error(`\n${errors.length} rendering problem(s).`); process.exit(1); }
console.log(`Rendered clean in 3 viewports: 5 tabs, drawer, no console errors, no horizontal overflow.${shots ? " Screenshots in .render/" : ""}`);
