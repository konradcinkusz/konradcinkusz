# Secrets — `konrad-portfolio`

**There are none, and that is a property worth keeping.**

The site is static. It reads one file, `site/data/portfolio.json`, which is baked into
the image at build time and contains only information that is already public or that the
owner has chosen to publish. No API keys, no connection strings, no tokens.

The only credential involved is the one CI needs to deploy:

| Name | Where | Used by |
|---|---|---|
| `FLY_API_TOKEN` | GitHub repository secret | `.github/workflows/flyio.yml` |

Create it with `fly tokens create deploy -x 8760h -a konrad-portfolio` and store it as a
repository secret. It is scoped to this one app; it cannot touch the rest of the estate.

## What must never end up in `portfolio.json`

The manifest is served to anyone who loads the page. Private repositories appear in it by
name and description because the owner chose to list them — that is a deliberate
disclosure, not an accident. Nothing else about a private repository belongs there:

- no internal URLs, hostnames or `.internal` addresses
- no customer, employer or client names
- no unreleased commercial terms

`.github/workflows/validate-portfolio.yml` fails the build if the manifest gains a key
outside its schema, which is the mechanical half of this rule.
