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
  validate-portfolio.mjs  schema + referential integrity
  check-repos.mjs         every slug still exists with the claimed visibility
  smoke-site.mjs          structural check of site/index.html
site/                     the served artefact; never hand-edit site/data/
deploy/nginx.conf         listens on 8080, serves /healthz outside the SPA fallback
flyio/portfolio.fly.toml  one app, scale to zero, no secrets
```

## The loop

```sh
node scripts/build-manifest.mjs      # regenerate
node scripts/validate-portfolio.mjs  # schema + cross-references
node scripts/smoke-site.mjs          # tabs, panels, local assets
cd site && python3 -m http.server 8000
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

## Deploying

Tag-driven, per the estate's own Fly.io guide.

```sh
git tag -a v1.1.0 -m "what changed" && git push origin v1.1.0
```

The deploy job creates the app if it does not exist, deploys, and then verifies that the
manifest is actually served with at least thirty repositories in it — because the health
check proves nginx is up, not that the data shipped.
