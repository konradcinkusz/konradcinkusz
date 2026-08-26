#!/usr/bin/env node
// Turns data/health.json into ONE issue for the whole estate, and closes it again
// when everything is back under its threshold. One issue per repository would be
// thirty-five notifications, which is a second inbox rather than a signal.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "health.json");
if (!existsSync(path)) { console.log("No health data; nothing to report."); process.exit(0); }
const health = JSON.parse(readFileSync(path, "utf8"));

// A breach carries a key and its numbers, not a sentence, so that the site can
// write it in either language. The issue body is written for the owner, so it
// uses the Polish templates — the same strings the Polish page shows, from the
// same file, rather than a second copy that would drift.
const UI = JSON.parse(readFileSync(join(root, "data", "ui.json"), "utf8"));
const fill = (key, params) => String(UI[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => (params && k in params ? String(params[k]) : m));
const checkName = (b) => UI[`breach.${b.check}.name`] ?? b.check;
const checkDetail = (b) => (b.detail ?? fill(`breach.${b.check}`, b.params));

// A health file older than a couple of days is not the estate's state, it is a
// snapshot someone forgot to refresh. Reporting it as current would put a date
// in the issue title that quietly disagrees with the numbers under it.
const ageDays = Math.floor((Date.now() - Date.parse(health.collectedAt)) / 86_400_000);
if (Number.isFinite(ageDays) && ageDays > 2) {
  console.error(`data/health.json was collected ${ageDays} days ago (${health.collectedAt}). Refusing to report a stale snapshot as current; re-run scripts/collect-health.mjs.`);
  process.exit(1);
}

// The header count and the array are two sources for one number. Trust the array
// — it is the thing the body is built from — and say so if they disagree.
if (health.totals?.breaches !== health.breaches.length) {
  console.error(`data/health.json disagrees with itself: totals.breaches is ${health.totals?.breaches}, breaches[] has ${health.breaches.length}. Using the array.`);
  health.totals.breaches = health.breaches.length;
}

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY ?? "konradcinkusz/konradcinkusz";
if (!token) { console.log("No token; printing instead.\n"); }

const MARKER = "<!-- estate-health -->";
const api = async (path, init) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "estate-health", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
};

const byTier = new Map();
for (const b of health.breaches) {
  if (!byTier.has(b.tier)) byTier.set(b.tier, []);
  byTier.get(b.tier).push(b);
}
const t = health.totals;
const body = [
  MARKER,
  `Zbiórka: **${health.collectedAt}**`,
  "",
  `${t.repositories} repozytoriów · ${t.openPrs} otwartych PR-ów (${t.botPrs} bot, ${t.humanPrs} człowiek) · ${t.ciFailing} z czerwonym CI · **${t.breaches} przekroczeń**`,
  "",
  ...[...byTier.keys()].sort().flatMap((tier) => [
    `### ${tier}`,
    "",
    "| repozytorium | kontrola | szczegół |",
    "|---|---|---|",
    ...byTier.get(tier).map((b) => `| \`${b.slug}\` | ${checkName(b)} | ${checkDetail(b)} |`),
    "",
  ]),
  "---",
  "_Wygenerowane przez `scripts/collect-health.mjs`. Zamknij, gdy progi wrócą pod kreskę — następna zbiórka i tak otworzy nowe zgłoszenie, jeśli będzie co zgłosić._",
].join("\n");

if (!token) { console.log(body); process.exit(0); }

const open = await api(`/repos/${REPO}/issues?state=open&per_page=100`);
const existing = open.find((i) => !i.pull_request && (i.body ?? "").includes(MARKER));

if (!health.breaches.length) {
  if (existing) {
    await api(`/repos/${REPO}/issues/${existing.number}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed", state_reason: "completed" }),
    });
    console.log(`Closed #${existing.number} — every threshold is back under the line.`);
  } else {
    console.log("No breaches, no open report. Nothing to do.");
  }
  process.exit(0);
}

const title = `Zdrowie estate — ${t.breaches} przekroczeń (${health.collectedAt})`;
if (existing) {
  await api(`/repos/${REPO}/issues/${existing.number}`, { method: "PATCH", body: JSON.stringify({ title, body }) });
  console.log(`Updated #${existing.number}.`);
} else {
  const made = await api(`/repos/${REPO}/issues`, { method: "POST", body: JSON.stringify({ title, body }) });
  console.log(`Opened #${made.number}.`);
}
