#!/usr/bin/env node
// The collector cannot be exercised against the real API without a token, so its
// thresholds are tested against a stub that serves canned GitHub responses.
// This proves the logic; it does not prove the live call shape.

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const today = new Date();
const iso = (d) => new Date(today.getTime() - d * 86400000).toISOString();

// One healthy repository, and one of each failure the thresholds are meant to catch.
const FIXTURES = {
  // P0 with CI red for 2 days -> breach (P0 threshold is 0)
  "architecture-standards": { private: false, red: 2, bots: 0, humans: 1, oldest: 1, tags: ["v1"], ahead: 3, push: 1 },
  // P0 publishing an image with no tag at all -> breach
  "authservice":            { private: false, red: null, bots: 6, humans: 1, oldest: 9, tags: [], ahead: null, push: 11 },
  // public, 9 of 9 PRs from the bot -> bot-drowning ONLY. Not bot-debt: this repo
  // is P3, whose dependabotPrs threshold is 10, and 9 >= 10 is false. The comment
  // used to promise both, and nothing asserted the second one, so the fixture and
  // the comment disagreed for as long as the file existed. bot-debt is covered by
  // authservice at P0, where the threshold is 5.
  "black-hole-sim":         { private: false, red: null, bots: 9, humans: 0, oldest: 8, tags: ["v2"], ahead: 4, push: 11 },
  // clean P1
  "agent-eval-bench":       { private: false, red: null, bots: 0, humans: 1, oldest: 1, tags: ["v3"], ahead: 2, push: 1 },
  // visibility mismatch: manifest says private, GitHub says public
  "archgate":               { private: false, red: null, bots: 0, humans: 0, oldest: 0, tags: ["v1"], ahead: 1, push: 7 },
};
const DEFAULT = { private: true, red: null, bots: 0, humans: 0, oldest: 0, tags: ["v1"], ahead: 1, push: 5 };

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const m = url.pathname.match(/^\/repos\/konradcinkusz\/([^/]+)(.*)$/);
  const json = (o) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  if (!m) { res.writeHead(404); return res.end("{}"); }
  const [, slug, rest] = m;
  const f = FIXTURES[slug] ?? DEFAULT;

  if (rest === "") return json({ private: f.private, archived: false, default_branch: "main", stargazers_count: 0, pushed_at: iso(f.push) });
  if (rest.startsWith("/pulls")) {
    const prs = [
      ...Array.from({ length: f.bots }, (_, i) => ({ user: { type: "Bot" }, created_at: iso(i === 0 ? f.oldest : 1) })),
      ...Array.from({ length: f.humans }, () => ({ user: { type: "User" }, created_at: iso(f.oldest) })),
    ];
    return json(prs);
  }
  if (rest.startsWith("/actions/runs")) {
    const runs = f.red === null ? [] : [{ status: "completed", conclusion: "failure", workflow_id: 1, updated_at: iso(f.red) }];
    return json({ workflow_runs: runs });
  }
  if (rest.startsWith("/tags")) return json(f.tags.map((name) => ({ name })));
  if (rest.startsWith("/compare")) return json({ ahead_by: f.ahead ?? 0 });
  res.writeHead(404); res.end("{}");
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

// Must be async: execFileSync blocks this process's event loop, so the stub
// server above could never answer and the whole test deadlocked.
let out;
try {
  ({ stdout: out } = await run("node", [join(root, "scripts", "collect-health.mjs"), "--dry"], {
    encoding: "utf8", env: { ...process.env, GH_API: base, GH_TOKEN: "stub" }, maxBuffer: 8 * 1024 * 1024,
  }));
} catch (e) {
  console.error("collect-health.mjs exited non-zero against the stub:\n" + (e.stdout ?? "") + (e.stderr ?? ""));
  server.close(); process.exit(1);
}
server.close();

const errors = [];
const must = (re, why) => { if (!re.test(out)) errors.push(why); };
const mustNot = (re, why) => { if (re.test(out)) errors.push(why); };

// Breaches are matched on the MACHINE key the collector emits, not on a label.
// These assertions used to match Polish prose ("czerwone CI"), which meant the
// suite went red the moment the collector stopped writing sentences — reporting
// five thresholds as broken while all five were firing correctly.
must(/architecture-standards\s+ci-red\b/, "P0 red for 2 days should breach (threshold 0)");
must(/authservice\s+no-tag\b/, "a repo publishing an image with no tag should breach");
must(/authservice\s+bot-debt\b/, "6 bot PRs on P0 should breach (threshold 5)");
must(/black-hole-sim\s+bot-drowning\b/, "9 of 9 PRs from a bot on a public repo should breach");
must(/archgate\s+visibility\b/, "manifest says private, stub says public — should breach");
mustNot(/agent-eval-bench\s+\S/, "the clean P1 repository should produce no breach");
// The tier threshold really is what stops this one, so assert its absence too —
// otherwise a threshold table edit could start firing it and nothing would notice.
mustNot(/black-hole-sim\s+bot-debt/, "9 bot PRs on a P3 repo is under the threshold of 10 and must NOT breach");

// The parameters have to arrive too. A key with an empty params object renders
// as a template full of literal {placeholders} on the page.
must(/architecture-standards\s+ci-red\s+\{"n":1,"days":2,"tier":"P0","threshold":0\}/,
     "the ci-red breach should carry n, days, tier and threshold");
must(/authservice\s+bot-debt\s+\{"n":6,"tier":"P0","threshold":5\}/,
     "the bot-debt breach should carry n, tier and threshold");

// And no breach may carry a pre-formatted sentence again: that is what broke the
// nightly job, because the same Polish string landed in the English bundle.
mustNot(/"detail"/, "a breach carried a pre-formatted detail string instead of { check, params }");

for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) { console.error(`\n${errors.length} threshold(s) did not behave as specified.\n---\n${out}`); process.exit(1); }
console.log("Health collector self-test OK — every threshold fires on its fixture with its parameters, no breach carries prose, and the clean repository stays silent.");
