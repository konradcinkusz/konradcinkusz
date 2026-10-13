#!/usr/bin/env node
// Rewrites the block between <!-- YOUTUBE:START --> and <!-- YOUTUBE:END --> in
// README.md with thumbnails of the channel's latest uploads.
//
// No dependencies: the channel page is fetched to find the channel id (the RSS
// feed does not accept a handle), the public Atom feed is parsed with regular
// expressions, and the README is only rewritten when the block actually changes.
//
//   node scripts/update-readme-videos.mjs                     # live
//   node scripts/update-readme-videos.mjs --feed fixture.xml  # offline, for tests
//
// Options:
//   --handle  @name      YouTube handle          (default: @_dev_insight)
//   --channel UC...      skip the handle lookup   (or env YOUTUBE_CHANNEL_ID)
//   --feed    path       read the Atom feed from a file instead of the network
//   --readme  path       README to rewrite        (default: README.md)
//   --count   n          videos to show           (default: 6)
//   --columns n          thumbnails per row       (default: 3)
//   --check              exit 1 if the README would change; never write

import { readFile, writeFile } from "node:fs/promises";

const START = "<!-- YOUTUBE:START -->";
const END = "<!-- YOUTUBE:END -->";

function parseArgs(argv) {
  const opts = {
    handle: "@_dev_insight",
    channel: process.env.YOUTUBE_CHANNEL_ID || "",
    feed: "",
    readme: "README.md",
    count: 6,
    columns: 3,
    check: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--handle": opts.handle = next(); break;
      case "--channel": opts.channel = next(); break;
      case "--feed": opts.feed = next(); break;
      case "--readme": opts.readme = next(); break;
      case "--count": opts.count = Number(next()); break;
      case "--columns": opts.columns = Number(next()); break;
      case "--check": opts.check = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!opts.handle.startsWith("@")) opts.handle = `@${opts.handle}`;
  if (!Number.isInteger(opts.count) || opts.count < 1) throw new Error("--count must be a positive integer");
  if (!Number.isInteger(opts.columns) || opts.columns < 1) throw new Error("--columns must be a positive integer");
  return opts;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "konradcinkusz-profile-readme (github actions)", "accept-language": "en" },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

export function extractChannelId(html) {
  // The handle page embeds the id in several places; any of them will do.
  const patterns = [
    /"channelId":"(UC[\w-]{22})"/,
    /"externalId":"(UC[\w-]{22})"/,
    /feeds\/videos\.xml\?channel_id=(UC[\w-]{22})/,
    /<meta itemprop="identifier" content="(UC[\w-]{22})"/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parseFeed(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml))) {
    const body = m[1];
    const id = body.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = body.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const published = body.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !title) continue;
    entries.push({ id, title: decodeEntities(title.trim()), published: published ?? "" });
  }
  // The feed is newest-first already, but a sort costs nothing and removes the assumption.
  entries.sort((a, b) => (b.published > a.published ? 1 : b.published < a.published ? -1 : 0));
  return entries;
}

export function renderGrid(videos, columns) {
  if (videos.length === 0) {
    return '<a href="https://www.youtube.com/@_dev_insight">Latest videos on YouTube</a>';
  }
  const width = Math.floor(96 / columns);
  const rows = [];
  for (let i = 0; i < videos.length; i += columns) {
    const cells = videos.slice(i, i + columns).map((v) => {
      const title = escapeHtml(v.title);
      return `<a href="https://youtu.be/${v.id}" title="${title}"><img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${title}" width="${width}%" /></a>`;
    });
    rows.push(cells.join(" "));
  }
  return rows.join("\n<br/>\n");
}

export function replaceBlock(readme, block) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README is missing the ${START} / ${END} markers`);
  }
  return `${readme.slice(0, start + START.length)}\n${block}\n${readme.slice(end)}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let xml;
  if (opts.feed) {
    xml = await readFile(opts.feed, "utf8");
  } else {
    let channel = opts.channel;
    if (!channel) {
      const html = await fetchText(`https://www.youtube.com/${opts.handle}`);
      channel = extractChannelId(html);
      if (!channel) throw new Error(`Could not find a channel id on https://www.youtube.com/${opts.handle}`);
    }
    xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`);
  }

  const videos = parseFeed(xml).slice(0, opts.count);
  if (videos.length === 0) {
    // An empty feed is more likely a parse failure than an empty channel. Leave
    // the README alone rather than replace real thumbnails with a bare link.
    console.error("No videos parsed from the feed; README left unchanged.");
    process.exit(1);
  }

  const before = await readFile(opts.readme, "utf8");
  const after = replaceBlock(before, renderGrid(videos, opts.columns));

  if (after === before) {
    console.log(`README already lists the latest ${videos.length} videos.`);
    return;
  }
  if (opts.check) {
    console.error("README video block is stale.");
    process.exit(1);
  }
  await writeFile(opts.readme, after);
  console.log(`Wrote ${videos.length} videos to ${opts.readme}:`);
  for (const v of videos) console.log(`  ${v.id}  ${v.title}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
