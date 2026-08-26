# Secrets — `konrad-portfolio`

**There are none, and that is a property worth keeping.**

The site is static. It reads one file, `site/data/portfolio.json`, which is baked into
the image at build time and contains only information that is already public or that the
owner has chosen to publish. No API keys, no connection strings, no tokens.

The only credential involved is the one CI needs to deploy:

| Name | Where | Used by | Scope |
|---|---|---|---|
| `FLY_API_TOKEN` | GitHub repository secret | `.github/workflows/flyio.yml` | this one Fly app |
| `ESTATE_READ_TOKEN` | GitHub repository secret | `.github/workflows/health.yml` | **read-only across the account** |

`FLY_API_TOKEN`: `fly tokens create deploy -x 8760h -a konrad-portfolio`. Scoped to this one
app; it cannot touch the rest of the estate.

`ESTATE_READ_TOKEN` is the one that needs thought, because it is the only credential here
that reaches outside this repository. The nightly health collector reads every repository
in the estate, including the private ones — the default `GITHUB_TOKEN` cannot, and an
unauthenticated run would report every private repository as deleted, which is worse than
no data at all.

Make it a **fine-grained** personal access token, all repositories, and grant exactly three
read permissions:

| Permission | Access | Why |
|---|---|---|
| Metadata | Read | visibility, archived, default branch, last push |
| Pull requests | Read | open count, author type, age of the oldest |
| Actions | Read | the latest run of each workflow on the default branch |

Nothing else. In particular **no write scope of any kind**: the collector never writes to
another repository, and the commit it produces lands here, through the workflow's own
`GITHUB_TOKEN`. If the token needs `contents: write` to work, something is wrong with the
workflow, not with the token.

Set an expiry and put the renewal date in the quarterly review. A token with no expiry is a
credential nobody will ever revoke.

## What must never end up in `portfolio.json`

Once the site is deployed, the manifest is served to anyone who loads the page. Private
repositories appear in it by name and description because the owner chose to list them —
that is a deliberate disclosure, not an accident. Nothing else about a private repository
belongs there:

- no internal URLs, hostnames or `.internal` addresses
- no customer, employer or client names
- no unreleased commercial terms

**Be exact about what enforces this, because the gap is where a leak fits.** Three
mechanical guards run on every build, and none of them reads the prose:

| Guard | Covers | Does not cover |
|---|---|---|
| the closed key set in `validate-portfolio.mjs` | a new key on a **repository** entry fails the build | `meta`, `clusters`, `consolidation`, `ops`, `glossary`, `ui` — a new key there passes |
| the cross-language parity check | a key added to one language tree and not the other fails | a key added to **both** passes |
| the untranslated-string check | a new Polish string copied into the English tree fails | a string translated in both passes |

So the schema catches a stray *field* on a repository and nothing catches a stray
*sentence* anywhere. Whether a paragraph should be public is a judgement, and it is the
author's, made when it is written. Reviewing what the private entries already say is worth
doing before the first deploy, not after — several of them name file paths, class names and
confirmed security holes in a live paid product.

Today nothing is deployed and the hub repository is private, so none of this has been
published yet. That is the moment to decide, not a reason to skip the decision.
