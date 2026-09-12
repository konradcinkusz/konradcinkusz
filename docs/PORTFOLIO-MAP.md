# Portfolio map

This repository is the hub. It holds a single manifest describing forty-three
repositories — thirty public, thirteen private — what each is, what it is for, what is
finished, what is not, plus the consolidation analysis and the operating model that keeps
them from rotting.

**Forty-three, not all of them.** The account holds considerably more; the map covers the
set that was surveyed end to end, and says so on its own front page rather than implying it
is the whole estate. Repositories join the map when someone has actually read them.

The manifest renders as a small static site with five tabs: the **portfolio map**, the
**consolidation analysis** (kernels, duplications, the open/paid line, the distribution
axis), the **operating model** (attention tiers, cadence, health checks, WIP limits,
automation, quarter plan), a sortable **index** and a searchable **glossary**.

**In Polish and English.** Polish is the source; `data/en/` is a translation with the
same shape. The page switches without a reload — one manifest carries both — and
remembers the choice; `?lang=pl` or `?lang=en` overrides it. A translation is trusted
to read well and trusted for nothing else: the validator checks the two trees element
for element and rejects a dropped list entry, a renamed id, a translated file path, a
missing interface key, a plural with the wrong number of forms, or a string left in
Polish. `scripts/i18n-audit.mjs` rejects a user-visible literal that never made it into
`ui.json` in the first place.

```sh
# run it locally
cd site && python3 -m http.server 8000     # then open http://localhost:8000

# regenerate the manifest after editing data/ or data/en/
node scripts/build-manifest.mjs
node scripts/validate-portfolio.mjs
node scripts/i18n-audit.mjs
```

## How it is maintained

| | |
|---|---|
| **Source of truth** | `data/` — one file per repository under `data/repos/<slug>.json`, plus `clusters`, `consolidation`, `ops`, `glossary`, `ui` |
| **Translation** | `data/en/` — the same tree in English, enforced for structural parity rather than trusted |
| **Generated + committed** | `site/data/portfolio.json`, built by `scripts/build-manifest.mjs` |
| **Guarded by** | `validate-portfolio.mjs` (closed schema, referential integrity, cross-language parity) · `i18n-audit.mjs` (no hard-coded interface text, no unknown enum values) · `assert-served-manifest.mjs` (what a *served* manifest must contain) · `check-repos.mjs` (a repo that vanished or flipped visibility fails the build) · `smoke-site.mjs` · `theme-audit.mjs` · `render-check.mjs` (real Chromium, both languages and both themes) · `health-selftest.mjs` |
| **Drift** | CI runs the builder with `--check`; a stale committed manifest fails the build |
| **The image** | CI builds the container and probes it: non-root, `/healthz` outside the SPA fallback, manifest served, headers on every path |
| **Nightly** | `collect-health.mjs` reads the whole estate into `data/health.json`; the site renders it when it exists |

Adding a repository to the map is two new files — `data/repos/<slug>.json` and its English
twin in `data/en/repos/`. One alone fails the build. Nothing in `site/` is edited by hand,
and no script reads the manifest's layout directly: they all go through
`scripts/lib/manifest.mjs`.

## Deploying

Static nginx image, deployed to Fly.io on a `v*` tag.

```sh
fly tokens create deploy -x 8760h -a konrad-portfolio   # store as FLY_API_TOKEN
git tag -a v1.0.0 -m "portfolio map" && git push origin v1.0.0
```

`flyio/portfolio.fly.toml` scales to zero, checks `/healthz`, and carries no secrets —
see [`flyio/SECRETS.md`](../flyio/SECRETS.md) for why that property is worth keeping.
