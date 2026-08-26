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

The manifest is served to anyone who loads the page. Private repositories appear in it by
name and description because the owner chose to list them — that is a deliberate
disclosure, not an accident. Nothing else about a private repository belongs there:

- no internal URLs, hostnames or `.internal` addresses
- no customer, employer or client names
- no unreleased commercial terms

`.github/workflows/validate-portfolio.yml` fails the build if the manifest gains a key
outside its schema, which is the mechanical half of this rule.
