#!/usr/bin/env node
// Every repository named in the manifest must still exist and still be reachable
// with the visibility the manifest claims. Catches the two ways a portfolio page
// rots: a repo renamed, and a repo flipped public->private without the page noticing.
//
// The token decides what this can honestly assert, and that distinction is the
// whole design:
//
//   no token                 nothing is checked; say so and exit 0
//   the Actions GITHUB_TOKEN scoped to THIS repository only. Every other repo
//                            returns 404 whether it exists or not, so a 404 on
//                            one is not evidence — the private half is skipped
//                            and counted, not reported as missing
//   a PAT that can read the account's private repositories: everything checked
//
// Getting this wrong is not a small error. The first version passed
// secrets.GITHUB_TOKEN and reported seventeen private repositories as deleted,
// which is a red build that says something alarming and false. A check that
// cannot tell "gone" from "not visible to me" must not claim to.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sourceRepos } from "./lib/manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Slug, visibility and state are identical in every language bundle — the
// validator enforces that — so this checks the source and covers both.
const repos = sourceRepos(root);

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
if (!token) {
  console.log("No GH_TOKEN; skipping the existence check entirely.");
  console.log("A run with no token can only see public repositories, and a 404 for a private one would be");
  console.log("indistinguishable from a deletion. Set GH_TOKEN to a PAT that can read the account to check all of them.");
  process.exit(0);
}

const API = process.env.GH_API ?? "https://api.github.com";
const headers = {
  authorization: `Bearer ${token}`,
  accept: "application/vnd.github+json",
  "user-agent": "portfolio-check",
  "x-github-api-version": "2022-11-28",
};

// Can this token see the account's private repositories at all? The Actions
// GITHUB_TOKEN cannot: it is scoped to the repository the workflow runs in, and
// answers 403 here. A user PAT with repo scope answers 200.
async function canSeePrivateRepos() {
  try {
    const res = await fetch(`${API}/user/repos?visibility=private&per_page=1`, { headers });
    return res.ok;
  } catch {
    return false;
  }
}

const fullAccess = await canSeePrivateRepos();
if (!fullAccess) {
  console.log("This token cannot list the account's private repositories (it is probably the Actions GITHUB_TOKEN,");
  console.log("which is scoped to this repository alone). Private entries will be SKIPPED rather than reported as");
  console.log("missing, because a 404 from a token that cannot see them means nothing.\n");
}

let bad = 0;
let skipped = 0;
let checked = 0;

for (const r of repos) {
  let res;
  try {
    res = await fetch(`${API}/repos/konradcinkusz/${r.slug}`, { headers });
  } catch (e) {
    console.error(`  ERROR ${r.slug}: request failed (${e.message})`);
    bad++;
    continue;
  }

  if (res.status === 404) {
    // Not visible is not the same as not there. Only claim a repository is gone
    // when the token could have seen it.
    if (!fullAccess && r.visibility === "private") { skipped++; continue; }
    console.error(`  ERROR ${r.slug}: GitHub returned 404 — renamed, deleted, or no longer visible`);
    bad++;
    continue;
  }
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    console.error(`\nRate limit exhausted; resets at ${new Date(reset).toISOString()}. Nothing after this was checked.`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`  ERROR ${r.slug}: GitHub returned ${res.status}`);
    bad++;
    continue;
  }

  checked++;
  const gh = await res.json();
  const actual = gh.private ? "private" : "public";
  if (actual !== r.visibility) {
    console.error(`  ERROR ${r.slug}: manifest says ${r.visibility}, GitHub says ${actual}`);
    bad++;
  }
  if (gh.archived && r.state !== "dormant") {
    console.error(`  ERROR ${r.slug}: archived on GitHub but state is "${r.state}"`);
    bad++;
  }
}

const tail = skipped ? ` (${skipped} private repositor${skipped === 1 ? "y" : "ies"} skipped — token cannot see them)` : "";
if (bad) {
  console.error(`\n${bad} mismatch(es) across ${checked} repositor${checked === 1 ? "y" : "ies"} checked${tail}.`);
  process.exit(1);
}
console.log(`${checked} repositor${checked === 1 ? "y" : "ies"} match the manifest${tail}.`);
