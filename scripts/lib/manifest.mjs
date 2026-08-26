// The one place that knows how site/data/portfolio.json is laid out.
//
// It exists because of a real failure, not on principle. The manifest went from
// a flat object to one nested by language:
//
//   before   { meta, clusters, repos: [...], ops, glossary, health }
//   after    { pl: { meta, clusters, repos: [...], ... }, en: { ... },
//              ui: { pl: {...}, en: {...} } }
//
// Two consumers were updated and three were not. `data.repos` became undefined,
// and the failures landed in CI rather than locally — one of them in a script
// that needs a GitHub token and therefore never runs on a developer's machine.
// Spreading the layout across six files meant a shape change had six places to
// be wrong in and no single place to be right in.
//
// So: anything that READS the built manifest imports from here, and the layout
// changes in one file. One deliberate exception, and it is not a loophole:
// scripts/assert-served-manifest.mjs checks a manifest fetched over the network,
// which may be truncated, stale or the wrong shape entirely — loadManifest()
// below throws on exactly those, and throwing is the wrong answer for a script
// whose job is to report them. It still imports NOT_A_LANGUAGE from here rather
// than restating the rule.

import { readFileSync } from "node:fs";
import { join } from "node:path";

// Polish is the source; English is a translation with an enforced parity check.
// A consumer that wants "the repositories" without caring about language wants
// this one, because it is the bundle the other is checked against.
export const SOURCE_LANG = "pl";

// `ui` sits alongside the language bundles but is not one — it is the interface
// strings, keyed by language. Anything enumerating languages must exclude it,
// and forgetting to is the obvious next bug after the one above.
export const NOT_A_LANGUAGE = new Set(["ui"]);

export function manifestPath(root) {
  return join(root, "site", "data", "portfolio.json");
}

// Loads and returns { path, raw, languages, ui, bundle(lang), source }.
//
// It rejects the old flat shape loudly rather than returning undefined for
// everything. A consumer that has not been updated should stop with a message
// naming the fix, not iterate an empty list and report success — a health
// collector that silently visits zero repositories looks exactly like a healthy
// estate.
export function loadManifest(root) {
  const path = manifestPath(root);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`Cannot read or parse ${path}: ${e.message}\nRun: node scripts/build-manifest.mjs`);
  }

  if (Array.isArray(raw.repos)) {
    throw new Error(
      `${path} is in the old flat shape (a top-level "repos" array).\n` +
      `It is now nested by language. Rebuild it: node scripts/build-manifest.mjs`
    );
  }

  const languages = Object.keys(raw).filter((k) => !NOT_A_LANGUAGE.has(k));
  if (!languages.length) throw new Error(`${path} carries no language bundle at all.`);
  if (!languages.includes(SOURCE_LANG)) {
    throw new Error(`${path} has no "${SOURCE_LANG}" bundle, and ${SOURCE_LANG} is the source language.`);
  }
  for (const lang of languages) {
    if (!Array.isArray(raw[lang]?.repos)) {
      throw new Error(`${path}: bundle "${lang}" has no repos array. Rebuild it: node scripts/build-manifest.mjs`);
    }
  }

  return {
    path,
    raw,
    languages,
    ui: raw.ui ?? {},
    bundle: (lang) => {
      const b = raw[lang];
      if (!b) throw new Error(`${path} has no bundle for language "${lang}"`);
      return b;
    },
    source: raw[SOURCE_LANG],
  };
}

// Convenience for the common case: a consumer that reasons about repositories
// and does not care which language the prose is in. Slug, tier, visibility,
// state, deployment and the GitHub numbers are identical across bundles — the
// validator enforces that — so reading them from the source is not a shortcut,
// it is the definition.
export function sourceRepos(root) {
  return loadManifest(root).source.repos;
}
