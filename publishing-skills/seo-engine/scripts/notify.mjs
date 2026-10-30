#!/usr/bin/env node
// Discord notifier with dedupe. The webhook URL comes from the env var named in .seo-engine.json (discord.webhookEnv).
//   node notify.mjs --key <stable-id> --kind code-change|held|published|info --title "..." (--body "..." | --body-file f) [--dry-run]
//   node notify.mjs --resolve <key>     the issue is fixed: a recurrence posts again
//   node notify.mjs --list              open items
// An open key is not re-posted until discord.repostAfterDays (default 14) have passed; then once as a reminder.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, stateDir, readJson, writeJson, parseArgs, die } from "./lib.mjs";

const LABEL = { "code-change": "SEO fix needed (code change)", held: "SEO piece held", published: "SEO published (FYI)", info: "SEO" };

const cfg = loadConfig();
const a = parseArgs(process.argv.slice(2));
const file = join(stateDir(cfg), "notified.json");
const db = readJson(file, {});
const now = new Date();

if (a.list) {
  for (const [k, v] of Object.entries(db)) if (!v.resolvedAt) console.log(`${v.lastAt.slice(0, 10)}  ${v.kind}  ${k}  ${v.title}`);
  process.exit(0);
}
if (a.resolve) {
  if (db[a.resolve]) { db[a.resolve].resolvedAt = now.toISOString(); writeJson(file, db); }
  console.log(`resolved ${a.resolve}`);
  process.exit(0);
}

const { key, kind = "info", title } = a;
if (!key || !title || !LABEL[kind]) die("usage: notify.mjs --key k --kind code-change|held|published|info --title t (--body b | --body-file f) [--dry-run]");
const body = a["body-file"] ? readFileSync(a["body-file"], "utf8") : a.body === true ? "" : (a.body || "");

const prev = db[key];
const repostMs = (cfg.discord.repostAfterDays ?? 14) * 864e5;
if (prev && !prev.resolvedAt && now - new Date(prev.lastAt) < repostMs) {
  console.log(JSON.stringify({ posted: false, deduped: true, key, firstAt: prev.firstAt }));
  process.exit(0);
}
const reminder = prev && !prev.resolvedAt ? ` (reminder: first posted ${prev.firstAt.slice(0, 10)})` : "";
let content = `**[${LABEL[kind]}] ${title}**${reminder}\n${body}`.trim();
if (content.length > 1900) content = content.slice(0, 1890) + "\n…";

if (a["dry-run"]) {
  console.log(JSON.stringify({ posted: false, dryRun: true, key, content }, null, 2));
  process.exit(0);
}
const url = process.env[cfg.discord.webhookEnv];
if (!url) die(`${cfg.discord.webhookEnv} is not set (add its env file to envFiles).`);
for (let attempt = 0; ; attempt++) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, username: cfg.discord.username || "SEO engine", allowed_mentions: { parse: [] } }),
  });
  if (r.status === 429 && attempt < 2) {
    const wait = 1000 * Number((await r.json().catch(() => ({}))).retry_after || 2);
    await new Promise((s) => setTimeout(s, wait));
    continue;
  }
  if (!r.ok) die(`Discord answered ${r.status}`, 1);
  break;
}
db[key] = { kind, title, firstAt: prev && !prev.resolvedAt ? prev.firstAt : now.toISOString(), lastAt: now.toISOString(), count: (prev?.count || 0) + 1 };
writeJson(file, db);
console.log(JSON.stringify({ posted: true, key }));
