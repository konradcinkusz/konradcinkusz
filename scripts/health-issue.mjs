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
    ...byTier.get(tier).map((b) => `| \`${b.slug}\` | ${b.check} | ${b.detail} |`),
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
