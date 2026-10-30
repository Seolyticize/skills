#!/usr/bin/env node
// Publish a Forumulate space with the site's own tooling, then read the live pages back on our domain.
//   node publish.mjs --space blog [--dry-run] [--urls https://site/blog/a,https://site/blog/b]
//   node publish.mjs --readback-only --urls ...
// The command is forumulate.spaces.<space>.publishCmd from .seo-engine.json, run in forumulate.cwd, with
// FORUMULATE_TOKEN taken from the env var named by forumulate.tokenEnv (the narrow publishing token).
// Read-back: 200, rel=canonical is exactly the URL, not noindex, a <title> and a meta description;
// and the forumulate.com mirror (spaces.<space>.mirror, "{slug}" filled) must name our URL as canonical too.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { loadConfig, parseArgs, die } from "./lib.mjs";

const cfg = loadConfig();
const a = parseArgs(process.argv.slice(2));
const urls = typeof a.urls === "string" ? a.urls.split(",").filter(Boolean) : [];
const space = cfg.forumulate?.spaces?.[a.space];
const out = { publish: null, readback: [] };

if (!a["readback-only"]) {
  if (!space?.publishCmd) die(`forumulate.spaces.${a.space}.publishCmd is not set in .seo-engine.json`);
  const token = process.env[cfg.forumulate.tokenEnv];
  if (!token) die(`${cfg.forumulate.tokenEnv} is not set (add its env file to envFiles).`);
  const cmd = space.publishCmd + (a["dry-run"] ? " --dry-run" : "");
  const r = spawnSync("bash", ["-lc", cmd], {
    cwd: resolve(cfg._dir, cfg.forumulate.cwd || "."),
    env: { ...process.env, FORUMULATE_TOKEN: token, PATH: `${cfg.nodeBin ? cfg.nodeBin + ":" : ""}${process.env.PATH}` },
    encoding: "utf8",
  });
  out.publish = { cmd, exit: r.status, tail: (r.stdout + r.stderr).trim().split("\n").slice(-15) };
  if (r.status !== 0) { console.log(JSON.stringify(out, null, 2)); process.exit(1); }
}

if (!a["dry-run"]) for (const u of urls) out.readback.push(await readback(u));
console.log(JSON.stringify(out, null, 2));
process.exit(out.readback.every((r) => r.ok) ? 0 : 1);

async function readback(url) {
  let last;
  for (let i = 0; i < 6; i++) {
    last = await check(url);
    if (last.ok) break;
    await new Promise((s) => setTimeout(s, 10000)); // a fresh publish can take a few seconds to reach the CDN
  }
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
  if (last.ok && space?.mirror) {
    const m = await check(space.mirror.replace("{slug}", slug), url);
    last.mirror = { url: m.url, status: m.status, canonical: m.canonical, ok: m.status === 200 && m.canonical === url };
    if (!last.mirror.ok) { last.ok = false; last.problems.push("forumulate.com mirror does not name our URL as canonical"); }
  }
  return last;
}

async function check(url, expectCanonical = url) {
  const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "seo-engine-readback/1", "cache-control": "no-cache" } }).catch((e) => ({ status: 0, text: async () => String(e), headers: new Headers() }));
  const html = await r.text();
  const pick = (re) => html.match(re)?.[1]?.trim() ?? null;
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ?? pick(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const title = pick(/<title[^>]*>([^<]*)<\/title>/i);
  const description = pick(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) || /noindex/i.test(r.headers.get("x-robots-tag") || "");
  const problems = [];
  if (r.status !== 200) problems.push(`status ${r.status}`);
  if (canonical !== expectCanonical) problems.push(`canonical is ${canonical}`);
  if (noindex) problems.push("noindex");
  if (!title) problems.push("no <title>");
  if (!description) problems.push("no meta description");
  return { url, status: r.status, canonical, title, description, ok: problems.length === 0, problems };
}
