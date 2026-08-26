#!/usr/bin/env node
// Nightly health collector for the whole estate.
//
// The operating model asks twelve questions about every repository. Ten of them
// have answers only GitHub knows, and no human will check thirty-five
// repositories by hand — so the manifest's hand-entered snapshot goes stale the
// week it is written. This fills that in.
//
//   GH_TOKEN=... node scripts/collect-health.mjs          writes data/health.json
//   GH_TOKEN=... node scripts/collect-health.mjs --dry     prints, writes nothing
//
// It writes ONE file and opens no issues. The workflow decides what to do with
// the breaches, because "one issue listing everything" and "one issue per repo"
// are different amounts of attention and that is a policy choice, not a fact.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sourceRepos } from "./lib/manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Everything this reads — slug, tier, visibility, state, deployment, licence —
// is identical in every language bundle, so the source bundle is the whole
// estate. It is loaded through the shared accessor so that a future shape change
// stops the collector with a message rather than letting it visit zero
// repositories and write a health file that looks like a clean estate.
const repos = sourceRepos(root);
const dry = process.argv.includes("--dry");

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GH_TOKEN is required. This reads private repositories, so an unauthenticated run would report them as deleted.");
  process.exit(1);
}

const OWNER = "konradcinkusz";
const API = process.env.GH_API ?? "https://api.github.com";
const headers = {
  authorization: `Bearer ${token}`,
  accept: "application/vnd.github+json",
  "user-agent": "portfolio-health",
  "x-github-api-version": "2022-11-28",
};

const DAY = 86_400_000;
const now = Date.now();
const days = (iso) => Math.floor((now - Date.parse(iso)) / DAY);

// Thresholds. These mirror the operating model's health checks; the tier decides
// how sharp each one is, because a frozen repository and the foundation cannot
// share a service level and still mean anything.
const THRESHOLDS = {
  ciRedDays:      { P0: 0, P1: 3, P2: 14, P3: 60, P4: null },
  dependabotPrs:  { P0: 5, P1: 5, P2: 10, P3: 10, P4: 20 },
  oldestPrDays:   { P0: 30, P1: 60, P2: 90, P3: 90, P4: null },
  unreleasedCommits: 30,
  botShare:       0.8,   // of open PRs, on a public repository
  staleDays:      { P0: 60, P1: 90, P2: 180, P3: 365, P4: null },
};

async function gh(path, { allow404 = false } = {}) {
  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 404 && allow404) return null;
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    throw new Error(`GitHub rate limit exhausted; resets at ${new Date(reset).toISOString()}`);
  }
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

const rows = [];
const breaches = [];
// A breach carries a machine key and its parameters, never a formatted sentence.
//
// It used to carry Polish prose. That prose was collected once and copied into
// BOTH language bundles, so the validator's untranslated-string check saw an
// identical Polish string in the English bundle and rejected the manifest — which
// meant the nightly job failed on exactly the nights it had something to report,
// and passed on every quiet one. Reproduced before this was changed.
//
// So the collector emits data and the renderer does the words, in whichever
// language the reader picked. Same reasoning as effort and severity.
const note = (slug, tier, check, params = {}) => breaches.push({ slug, tier, check, params });

try {
for (const entry of repos) {
  const { slug, tier, visibility } = entry;
  process.stderr.write(`  ${slug}\n`);

  const repo = await gh(`/repos/${OWNER}/${slug}`, { allow404: true });
  if (!repo) {
    note(slug, tier, "missing");
    rows.push({ slug, tier, gone: true });
    continue;
  }

  const actual = repo.private ? "private" : "public";
  if (actual !== visibility) {
    note(slug, tier, "visibility", { claimed: visibility, actual });
  }
  if (repo.archived && entry.state !== "dormant") {
    note(slug, tier, "archived", { state: entry.state });
  }

  // Open pull requests, split by author. 100 is the page size and also far past
  // the point where the number stops meaning anything.
  const prs = (await gh(`/repos/${OWNER}/${slug}/pulls?state=open&per_page=100`)) ?? [];
  const bots = prs.filter((p) => p.user?.type === "Bot");
  const humans = prs.length - bots.length;
  const oldest = prs.length ? Math.max(...prs.map((p) => days(p.created_at))) : 0;

  // CI on the default branch: the latest run of any workflow, newest first.
  const runsUrl = `/repos/${OWNER}/${slug}/actions/runs?branch=${encodeURIComponent(repo.default_branch)}&per_page=20`;
  const runs = (await gh(runsUrl, { allow404: true }))?.workflow_runs ?? [];
  const finished = runs.filter((r) => r.status === "completed");
  const latestByWorkflow = new Map();
  for (const r of finished) if (!latestByWorkflow.has(r.workflow_id)) latestByWorkflow.set(r.workflow_id, r);
  const failing = [...latestByWorkflow.values()].filter((r) => r.conclusion === "failure");
  const redSince = failing.length ? Math.min(...failing.map((r) => days(r.updated_at))) : null;

  // Commits since the last tag. No tags at all is its own finding: a repository
  // that publishes an image or a package and has never tagged has published
  // nothing, whatever its README says.
  const tags = (await gh(`/repos/${OWNER}/${slug}/tags?per_page=1`, { allow404: true })) ?? [];
  let unreleased = null;
  if (tags.length) {
    const cmp = await gh(`/repos/${OWNER}/${slug}/compare/${encodeURIComponent(tags[0].name)}...${encodeURIComponent(repo.default_branch)}`, { allow404: true });
    unreleased = cmp?.ahead_by ?? null;
  }

  const stale = days(repo.pushed_at);

  const row = {
    slug, tier, visibility: actual,
    archived: repo.archived,
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count,
    openPrs: prs.length, botPrs: bots.length, humanPrs: humans,
    oldestPrDays: oldest,
    ciFailing: failing.length, ciRedDays: redSince,
    latestTag: tags[0]?.name ?? null, unreleasedCommits: unreleased,
    lastPushDays: stale,
    lastPush: repo.pushed_at.slice(0, 10),
  };
  rows.push(row);

  // --- thresholds ---------------------------------------------------------
  const t = (k) => THRESHOLDS[k][tier];
  if (redSince !== null && t("ciRedDays") !== null && redSince >= t("ciRedDays")) {
    note(slug, tier, "ci-red", { n: failing.length, days: redSince, tier, threshold: t("ciRedDays") });
  }
  if (bots.length >= t("dependabotPrs")) {
    note(slug, tier, "bot-debt", { n: bots.length, tier, threshold: t("dependabotPrs") });
  }
  if (t("oldestPrDays") !== null && oldest >= t("oldestPrDays")) {
    note(slug, tier, "old-pr", { days: oldest, tier, threshold: t("oldestPrDays") });
  }
  if (actual === "public" && prs.length >= 5 && bots.length / prs.length >= THRESHOLDS.botShare) {
    note(slug, tier, "bot-drowning", { pct: Math.round(100 * bots.length / prs.length) });
  }
  if (unreleased !== null && unreleased >= THRESHOLDS.unreleasedCommits) {
    note(slug, tier, "unreleased", { n: unreleased, tag: tags[0].name });
  }
  if (!tags.length && (entry.deployment?.ghcr || entry.deployment?.packages)) {
    note(slug, tier, "no-tag");
  }
  if (t("staleDays") !== null && stale >= t("staleDays")) {
    note(slug, tier, "stale", { days: stale, tier, threshold: t("staleDays") });
  }
  if (actual === "public" && !entry.license.startsWith("MIT") && !entry.license.startsWith("Apache") && !entry.license.startsWith("CC")) {
    note(slug, tier, "licence", { licence: entry.license });
  }
}

} catch (e) {
  console.error(`\nCollection stopped: ${e.message}`);
  console.error("Nothing was written. Re-run when the cause is fixed; a partial health file is worse than none,");
  console.error("because the rows it is missing look exactly like rows with nothing wrong.");
  process.exit(1);
}

const totals = {
  repositories: rows.length,
  openPrs: rows.reduce((a, r) => a + (r.openPrs ?? 0), 0),
  botPrs: rows.reduce((a, r) => a + (r.botPrs ?? 0), 0),
  humanPrs: rows.reduce((a, r) => a + (r.humanPrs ?? 0), 0),
  ciFailing: rows.filter((r) => r.ciFailing > 0).length,
  breaches: breaches.length,
};

const out = { collectedAt: new Date().toISOString().slice(0, 10), totals, breaches, rows };

console.log(`\n${totals.repositories} repositories · ${totals.openPrs} open PRs (${totals.botPrs} bot, ${totals.humanPrs} human) · ${totals.ciFailing} with red CI · ${breaches.length} breach(es)`);
for (const b of breaches) console.log(`  ${b.tier}  ${b.slug.padEnd(38)} ${b.check}${Object.keys(b.params).length ? " " + JSON.stringify(b.params) : ""}`);

if (!dry) {
  writeFileSync(join(root, "data", "health.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("\nWrote data/health.json");
}
