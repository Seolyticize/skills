#!/usr/bin/env node
// Quality gates before an automatic publish. All must pass, or the piece is held.
//   node gate.mjs <piece.json>            check; prints each gate, exit 1 if any fails
//   node gate.mjs --record <piece.json>   after a successful publish + read-back: remember it (cadence, self-correction)
// piece.json (written by the agent during the run; see SKILL.md "piece record"):
// { type: "new"|"refresh", keyword, url, file, publishedOn?,
//   claims: [{claim, file, line, quote}],            // file relative to the repo root holding .seo-engine.json
//   score: {value, target, competitorsMedian?},
//   cannibalization: {owner, conflicts: []},
//   contentProfile: {readable, manualRead},
//   metadata: {seoTitle, seoDescription, snippetOk, schemaValid, internalLinks, canonical, answerReady} }
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadConfig, stateDir, readJson, writeJson, parseArgs, die, runId } from "./lib.mjs";

const cfg = loadConfig();
const a = parseArgs(process.argv.slice(2));
const pieceFile = a.record === true ? a._[0] : a.record || a._[0];
if (!pieceFile) die("usage: gate.mjs [--record] <piece.json>");
const piece = JSON.parse(readFileSync(pieceFile, "utf8"));
const state = stateDir(cfg);
const pubFile = join(state, "published.json");
const published = readJson(pubFile, []);

if (a.record) {
  published.push({ url: piece.url, keyword: piece.keyword, type: piece.type, file: piece.file, at: new Date().toISOString(), run: runId(), score: piece.score?.value ?? null });
  writeJson(pubFile, published);
  console.log(JSON.stringify({ recorded: piece.url }));
  process.exit(0);
}

const results = [];
const gate = (name, ok, why) => results.push({ gate: name, ok: !!ok, ...(ok ? {} : { why }) });
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const md = piece.file && existsSync(resolve(cfg._dir, piece.file)) ? readFileSync(resolve(cfg._dir, piece.file), "utf8") : null;

// 1. Every product claim traced to a file and line in the code.
{
  const bad = [];
  if (!md) bad.push(`article file not found: ${piece.file}`);
  for (const c of piece.claims || []) {
    const p = resolve(cfg._dir, c.file || "");
    if (!c.file || !existsSync(p)) { bad.push(`"${c.claim}": source ${c.file} not found`); continue; }
    const lines = readFileSync(p, "utf8").split("\n");
    const near = lines.slice(Math.max(0, c.line - 4), c.line + 3).join(" ");
    if (!c.quote || !norm(near).includes(norm(c.quote))) bad.push(`"${c.claim}": "${c.quote}" is not at ${c.file}:${c.line}`);
  }
  if (md) {
    const body = md.replace(/^---[\s\S]*?---/, "");
    const claimText = norm((piece.claims || []).map((c) => c.claim).join(" | "));
    // Every money amount in the text must be a traced claim.
    for (const m of new Set(body.match(/\$\s?\d+(?:,\d{3})*(?:\.\d+)?/g) || []))
      if (!claimText.includes(norm(m))) bad.push(`price ${m} in the text has no traced claim`);
    for (const phrase of cfg.brand?.neverSay || [])
      if (norm(body).includes(norm(phrase))) bad.push(`forbidden phrase in the text: "${phrase}"`);
  }
  gate("1 claims traced to code", bad.length === 0, bad);
}

// 2. Content score at par with the ranking pages.
{
  const s = piece.score || {};
  const target = Math.max(s.target ?? 0, s.competitorsMedian ?? 0);
  gate("2 score at par", typeof s.value === "number" && target > 0 && s.value >= target, `score ${s.value} vs target ${target}`);
}

// 3. No cannibalisation: a new piece may not target a keyword another page owns.
{
  const c = piece.cannibalization || {};
  const ownedElsewhere = c.owner && c.owner !== piece.url;
  gate("3 no cannibalisation", c.owner !== undefined && !ownedElsewhere && !(c.conflicts || []).length,
    ownedElsewhere ? `keyword owned by ${c.owner}: refresh that page instead` : c.owner === undefined ? "owner not checked (list_keyword_owners)" : `conflicts: ${JSON.stringify(c.conflicts)}`);
}

// 4. Trustworthy content profile.
{
  const p = piece.contentProfile || {};
  const min = cfg.quality?.minReadableCompetitors ?? 5;
  gate("4 content profile trustworthy", (p.readable ?? 0) >= min || p.manualRead === true, `${p.readable ?? 0} readable competitor pages (< ${min}) and top pages not read manually`);
}

// 5. Metadata.
{
  const m = piece.metadata || {};
  const miss = ["seoTitle", "seoDescription", "snippetOk", "schemaValid", "answerReady"].filter((k) => !m[k]);
  if (!(m.internalLinks >= 1)) miss.push("internalLinks");
  if (m.canonical !== piece.url || !String(piece.url).startsWith(cfg.origin)) miss.push(`canonical (${m.canonical}) must equal the URL on ${cfg.origin}`);
  gate("5 metadata set", miss.length === 0, miss);
}

// 6. Cadence caps against scaled content.
{
  const week = Date.now() - 7 * 864e5;
  const recent = published.filter((p) => new Date(p.at) > week);
  const cad = cfg.cadence || {};
  const why = [];
  if (piece.type === "new" && recent.filter((p) => p.type === "new").length >= (cad.maxNewPerWeek ?? 2)) why.push(`already ${cad.maxNewPerWeek ?? 2} new articles this week`);
  if (piece.type === "refresh" && recent.filter((p) => p.type === "refresh").length >= (cad.maxRefreshesPerWeek ?? 3)) why.push(`already ${cad.maxRefreshesPerWeek ?? 3} refreshes this week`);
  const minDays = cad.minDaysBetweenRefreshesOfOnePage ?? 21;
  const last = published.filter((p) => p.url === piece.url).at(-1);
  if (last && Date.now() - new Date(last.at) < minDays * 864e5) why.push(`${piece.url} was changed ${last.at.slice(0, 10)} (< ${minDays} days)`);
  gate("6 cadence", why.length === 0, why);
}

// 7. Spend within the run cap (seo.mjs quotes and caps each paid call; this checks the total really charged).
{
  let spent = 0;
  try { for (const l of readFileSync(join(state, "calls.jsonl"), "utf8").split("\n")) if (l) { const e = JSON.parse(l); if (e.run === runId()) spent += e.costMicros || 0; } } catch {}
  const cap = cfg.budget.perRunMaxMicros?.[process.env.SEO_RUN_MODE || "adhoc"] ?? 0;
  gate("7 spend within run cap", spent <= cap, `run ${runId()} spent ${spent} micros, cap ${cap}`);
}

const ok = results.every((r) => r.ok);
console.log(JSON.stringify({ ok, url: piece.url, results }, null, 2));
process.exit(ok ? 0 : 1);
