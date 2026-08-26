#!/usr/bin/env node
// Every repository named in the manifest must still exist and still be reachable
// with the visibility the manifest claims. Catches the two ways a portfolio page
// rots: a repo renamed, and a repo flipped public->private without the page noticing.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sourceRepos } from "./lib/manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Slug, visibility and state are identical in every language bundle — the
// validator enforces that — so this checks the source and covers both.
const repos = sourceRepos(root);

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
if (!token) {
  console.log("No GH_TOKEN; skipping the existence check (private repos would 404 anyway).");
  process.exit(0);
}

const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "portfolio-check" };
let bad = 0;

for (const r of repos) {
  const res = await fetch(`https://api.github.com/repos/konradcinkusz/${r.slug}`, { headers });
  if (!res.ok) {
    console.error(`  ERROR ${r.slug}: GitHub returned ${res.status}`);
    bad++;
    continue;
  }
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

console.log(bad ? `\n${bad} mismatch(es).` : `All ${repos.length} repositories match the manifest.`);
process.exit(bad ? 1 : 0);
