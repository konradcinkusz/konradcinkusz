# Working on this repository

This is the hub. It holds the portfolio manifest, the site that renders it, and the
deployment that serves it. Nothing here describes one project — everything here describes
the estate.

## Layout

```
data/                     source of truth, hand-edited. Polish: the source language.
  meta.json               title, subtitle, scope note, external links
  clusters.json           the six substrates
  repos/<slug>.json       one file per repository
  consolidation.json      kernels, duplications, boundaries, open/paid, distribution
  ops.json                principles, tiers, cadence, health checks, WIP, automation, plan
  glossary.json           every term the prose links to
  ui.json                 every string the interface itself says
  en/                     the same tree in English, same shape, same order
    meta.json  clusters.json  repos/<slug>.json  consolidation.json
    ops.json   glossary.json  ui.json
  health.json             collector output; never hand-written, never committed by hand
scripts/
  lib/manifest.mjs        the ONE place that knows the manifest's layout
  build-manifest.mjs      data/ + data/en/ -> site/data/portfolio.json  (--check for drift)
  build-standalone.mjs    everything -> dist/portfolio.html, one self-contained file
  validate-portfolio.mjs  schema, referential integrity, and parity between the languages
  i18n-audit.mjs          no user-visible text outside ui.json; no unknown enum values
  assert-served-manifest.mjs  what a SERVED manifest must contain; used by two workflows
  check-repos.mjs         every slug still exists with the claimed visibility
  smoke-site.mjs          structural check of site/index.html
  render-check.mjs        drives the built site in Chromium: both languages, both themes
  theme-audit.mjs         every colour resolves on bare :root, none only inside a theme block
  collect-health.mjs      nightly: reads every repo in the estate -> data/health.json
  health-selftest.mjs     exercises every collector threshold against a stub API
  health-issue.mjs        one issue for the whole estate, closed again when clean
site/                     the served artefact; never hand-edit site/data/
deploy/nginx.conf         listens on 8080, /healthz outside the SPA fallback, gzip tuned
flyio/portfolio.fly.toml  one app, scale to zero, no secrets
```

### The shape of the built manifest

```
{ pl: { meta, clusters, repos: [...], kernels, kernelsRejected, duplications,
        boundaries, distribution, ops, glossary, health },
  en: { ...the same keys... },
  ui: { pl: { "key": "string", ... }, en: { ... } } }
```

`ui` sits beside the language bundles and is **not** one of them — anything enumerating
languages has to exclude it. Do not read this layout in your own script: import
`scripts/lib/manifest.mjs`. It is there because the last shape change had to be made in six
files, was made in two, and the other four failed in CI.

## The loop

```sh
node scripts/build-manifest.mjs      # regenerate, from data/ AND data/en/
node scripts/validate-portfolio.mjs  # schema, cross-references, language parity
node scripts/i18n-audit.mjs          # no hard-coded interface text
node scripts/smoke-site.mjs          # tabs, panels, local assets
node scripts/render-check.mjs        # real browser: both languages, both themes
npm run check                        # everything CI runs, except the browser
cd site && python3 -m http.server 8000     # then ?lang=en to see the other one
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

**Two** new files: `data/repos/<slug>.json` and `data/en/repos/<slug>.json`. The filename
must equal the `slug` field in both. One file alone fails the build — the validator compares
the trees element for element, and a bundle missing a repository is a page whose counts are
quietly wrong in one language rather than visibly broken.

The validator enforces:

- a **closed** key set — an unexpected key fails the build, because this manifest is served
  publicly and a stray field is a disclosure, not a typo
- `links.repo` equals `https://github.com/konradcinkusz/<slug>`
- every `overlaps[].slug`, kernel consumer and distribution slug resolves to a real entry
- every repository appears in **exactly one** attention tier, and `repo.tier` agrees with it
- every `{{term:id}}` reference resolves to a glossary entry
- the English entry has the **same shape**: same keys, same array lengths, same order
- `slug`, `cluster`, `tier`, `visibility`, `state`, `headlineTone`, `primaryLanguage`,
  `deployment`, `github`, `links.repo` and every `components[].path` are **identical** in
  both — they are identifiers and file paths, not prose
- no English string is byte-identical to its Polish twin while carrying a Polish-only
  diacritic; that is what an untranslated value looks like, and it is a build failure

## Prose conventions

Polish, with full diacritics, and a British English twin at the same position in
`data/en/`. Senior engineer writing for a senior engineer. A concrete number or a named
mechanism beats an adjective every time.

Interface text — anything the page says on its own behalf rather than about a repository —
goes in `data/ui.json` and its English twin, never in `index.html` or `app.js`.
`i18n-audit.mjs` fails the build on a literal that did not make it there.

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

The deploy job creates the app if it does not exist, deploys, and then runs
`scripts/assert-served-manifest.mjs` against the live URL: both language bundles present,
thirty-plus repositories in each, a real interface bundle, and the two bundles agreeing on
the size of the estate. A health check proves nginx is up; it proves nothing about what
nginx is serving.
