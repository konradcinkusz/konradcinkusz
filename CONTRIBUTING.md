# Working on this repository

This is the hub. It holds the portfolio manifest, the site that renders it, and the
deployment that serves it. Nothing here describes one project — everything here describes
the estate.

## Layout

```
data/                     source of truth, hand-edited
  meta.json               title, subtitle, external links
  clusters.json           the six substrates
  repos/<slug>.json       one file per repository
  consolidation.json      kernels, duplications, boundaries, open/paid, distribution
  ops.json                principles, tiers, cadence, health checks, WIP, automation, plan
  glossary.json           every term the prose links to
scripts/
  build-manifest.mjs      data/ -> site/data/portfolio.json   (--check for drift)
  build-standalone.mjs    everything -> dist/portfolio.html, one self-contained file
  validate-portfolio.mjs  schema + referential integrity
  check-repos.mjs         every slug still exists with the claimed visibility
  smoke-site.mjs          structural check of site/index.html
  render-check.mjs        drives the built site in Chromium, 3 viewports, both themes
  theme-audit.mjs         every colour resolves on bare :root, none only inside a theme block
  collect-health.mjs      nightly: reads every repo in the estate -> data/health.json
  health-selftest.mjs     exercises every collector threshold against a stub API
  health-issue.mjs        one issue for the whole estate, closed again when clean
site/                     the served artefact; never hand-edit site/data/
deploy/nginx.conf         listens on 8080, serves /healthz outside the SPA fallback
flyio/portfolio.fly.toml  one app, scale to zero, no secrets
```

## The loop

```sh
node scripts/build-manifest.mjs      # regenerate
node scripts/validate-portfolio.mjs  # schema + cross-references
node scripts/smoke-site.mjs          # tabs, panels, local assets
node scripts/render-check.mjs         # real browser, both themes, 3 viewports
npm run check                        # everything CI runs, except the browser
cd site && python3 -m http.server 8000
```

`render-check.mjs` is the one that earns its keep: a static check cannot see a page
that parses perfectly and renders nothing. It has already caught a boot-order bug that
left the page blank, three layout overflows, and a `[hidden]` rule that lost to a class
setting `display`.

For a copy you can open off a disk, attach to a message, or print:

```sh
node scripts/build-standalone.mjs      # dist/portfolio.html, ~600 kB, no server needed
```

`site/data/portfolio.json` is **generated and committed**. It is committed because the site
is static and must not need a build to run; CI regenerates it and fails if the committed
copy has drifted. Never edit it by hand — your change will be silently overwritten by the
next build, which is worse than being rejected.

## Adding a repository

One new file, `data/repos/<slug>.json`. The filename must equal the `slug` field. The
validator enforces:

- a **closed** key set — an unexpected key fails the build, because this manifest is served
  publicly and a stray field is a disclosure, not a typo
- `links.repo` equals `https://github.com/konradcinkusz/<slug>`
- every `overlaps[].slug`, kernel consumer and distribution slug resolves to a real entry
- every repository appears in **exactly one** attention tier, and `repo.tier` agrees with it
- every `{{term:id}}` reference resolves to a glossary entry

## Prose conventions

Polish, with full diacritics. Senior engineer writing for a senior engineer. A concrete
number or a named mechanism beats an adjective every time.

Banned outright: *potężny, nowoczesny, rewolucyjny, w prosty sposób, kompleksowy,
innowacyjny, z łatwością*. If a sentence would fit on a landing page, it does not belong
here.

Inside any string you may use `**bold**`, `` `code` `` and `{{term:id}}` /
`{{term:id|custom label}}`. Nothing else is interpreted; everything else is escaped.

**Never write a number you have not verified.** An empty `metrics` array is better than a
plausible one — the same rule the books in this estate apply to their measurement tables,
for the same reason: a fabricated number looks exactly like a measured one and survives
review.

## The nightly collector

`data/health.json` is written by `scripts/collect-health.mjs` and merged into the manifest
when it exists. The site renders the panel only when it does; on a fresh clone it says so
rather than showing an empty box.

It needs `ESTATE_READ_TOKEN` — a fine-grained, read-only token spanning the account, because
the default `GITHUB_TOKEN` cannot see this account's other repositories and an
unauthenticated run would report every private one as deleted. See
[`flyio/SECRETS.md`](flyio/SECRETS.md) for the exact three permissions.

**Never commit a hand-written `data/health.json`.** It is collector output; a hand-written
one is a fabricated measurement wearing the costume of a real one, which is the single thing
this repository's own operating principles forbid. The collector's thresholds are tested
against a stub instead — `scripts/health-selftest.mjs` asserts each one fires on its own
fixture and stays silent on a clean repository.

## Deploying

Tag-driven, per the estate's own Fly.io guide.

```sh
git tag -a v1.1.0 -m "what changed" && git push origin v1.1.0
```

The deploy job creates the app if it does not exist, deploys, and then verifies that the
manifest is actually served with at least thirty repositories in it — because the health
check proves nginx is up, not that the data shipped.
