#!/usr/bin/env node
// Seolyticize call wrapper. Usage:
//   node seo.mjs <tool> ['{"json":"args"}' | @args.json | -]   [--quote] [--idem <key>]
// - clientId is filled from .seo-engine.json; any other clientId is refused (never touch other clients).
// - agency-level writes (keys, team, vendors, branding, webhooks, new clients) are refused.
// - paid tools: quoted with estimate_cost first, capped with maxCostMicros (min of the per-call cap and
//   what is left of this run's cap), refused if the quote is over; SEO_ENGINE_NO_SPEND=1 refuses them all.
// - every call is logged (tool, requestId, costMicros, status) to <state>/calls.jsonl under $SEO_RUN_ID.
// Prints the JSON response; exit 0 ok, 1 API error, 2 usage, 3 refused by a guard.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, stateDir, appendJsonl, readJson, writeJson, runId, die, parseArgs, home } from "./lib.mjs";

const AGENCY_WRITE_ALLOW = new Set(["onboard_site", "page_headers", "page_lab", "get_domain_facts", "explore_ai_prompt", "estimate_cost"]);

const cfg = loadConfig();
const args = parseArgs(process.argv.slice(2));
const [tool, raw] = args._;
if (!tool) die("usage: seo.mjs <tool> [json|@file|-] [--quote] [--idem key]");
const KEY = process.env.SEOLYTICIZE_API_KEY;
if (!KEY) die("SEOLYTICIZE_API_KEY is not set (add its env file to envFiles in .seo-engine.json).");
const BASE = (process.env.SEOLYTICIZE_BASE_URL || "https://seolyticize.com").replace(/\/$/, "");
const clientId = cfg.seolyticize.clientId;
const state = stateDir(cfg);
const callsLog = join(state, "calls.jsonl");

let input = {};
if (raw === "-") input = JSON.parse(readFileSync(0, "utf8"));
else if (raw?.startsWith("@")) input = JSON.parse(readFileSync(raw.slice(1), "utf8"));
else if (raw) input = JSON.parse(raw);
// "${env:NAME}" inside any string is filled from the environment, so secrets never pass through the agent.
input = JSON.parse(JSON.stringify(input).replace(/\$\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, n) => {
  if (process.env[n] === undefined) die(`env ${n} is not set`);
  return JSON.stringify(process.env[n]).slice(1, -1);
}));

const catalog = await tools();
const t = catalog[tool];
if (!t) die(`unknown tool "${tool}" (not in GET /api/v1/tools)`);
const props = t.inputSchema?.properties || {};

// Guards: one client, no agency administration.
if (t.clientScoped) {
  if (!clientId && tool !== "onboard_site") die("seolyticize.clientId is empty in .seo-engine.json: onboard first.", 3);
  if (input.clientId && input.clientId !== clientId) die(`refused: clientId ${input.clientId} is not this site's (${clientId}).`, 3);
  if ("clientId" in props) input.clientId = clientId;
} else if (!t.readOnly && !AGENCY_WRITE_ALLOW.has(tool)) {
  die(`refused: ${tool} changes agency-wide settings. Ask a person.`, 3);
}

// Spend guard.
const mode = process.env.SEO_RUN_MODE || "adhoc";
if (t.spends && input.dryRun !== true) {
  if (process.env.SEO_ENGINE_NO_SPEND === "1" && !args.quote) die(`refused: ${tool} spends and SEO_ENGINE_NO_SPEND=1. Use --quote.`, 3);
  const runCap = cfg.budget.perRunMaxMicros?.[mode] ?? cfg.budget.perRunMaxMicros?.adhoc ?? 0;
  const spent = runSpend();
  const left = Math.max(0, runCap - spent);
  const cap = Math.min(cfg.budget.perCallMaxMicros ?? left, left, input.maxCostMicros ?? Infinity);
  const { maxCostMicros: _drop, ...quoteArgs } = input;
  const quote = await call("estimate_cost", { tool, arguments: quoteArgs });
  const est = quote.body?.data?.estimatedMaxMicros;
  log("estimate_cost", quote, { for: tool, estimatedMaxMicros: est });
  if (args.quote) { print({ quote: quote.body, cap, runSpentMicros: spent, runCapMicros: runCap }); process.exit(quote.ok ? 0 : 1); }
  if (!quote.ok || typeof est !== "number") die(`refused: could not quote ${tool}: ${JSON.stringify(quote.body)}`, 3);
  if (est > cap) die(`refused: ${tool} quotes ${est} micros, over the cap ${cap} (run ${mode}: spent ${spent} of ${runCap}).`, 3);
  // The quote is a ceiling, so it is the tightest safe cap; a cached (0) quote keeps the run cap.
  if ("maxCostMicros" in props) input.maxCostMicros = est > 0 ? est : cap;
} else if (args.quote) {
  print({ quote: "free or dryRun: nothing to quote" }); process.exit(0);
}

const res = await call(tool, input, args.idem);
const charged = res.body?.meta?.costMicros ?? 0;
const overCap = input.maxCostMicros !== undefined && charged > input.maxCostMicros;
log(tool, res, overCap ? { overCap: true, maxCostMicros: input.maxCostMicros } : {});
// The platform has billed past maxCostMicros before; the run cap counts what was really charged.
if (overCap) process.stderr.write(`seo-engine: PLATFORM BUG: ${tool} charged ${charged} micros over maxCostMicros ${input.maxCostMicros} (requestId ${res.body?.meta?.requestId}). Log it to the platform spec.\n`);
print(res.body);
if (!res.ok) {
  if (res.status >= 500 || res.body?.code === "internal_error")
    process.stderr.write(`seo-engine: platform error. Log it to the platform spec with requestId ${res.body?.requestId}.\n`);
  process.exit(1);
}

// ---
async function call(name, body, idem) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`${BASE}/api/v1/tools/${name}`, {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(idem ? { "idempotency-key": idem } : {}) },
      body: JSON.stringify(body),
    });
    if (r.status === 429 && attempt < 2) { await sleep(1000 * Number(r.headers.get("retry-after") || 5)); continue; }
    const text = await r.text();
    let parsed; try { parsed = JSON.parse(text); } catch { parsed = { error: text.slice(0, 500) }; }
    return { ok: r.ok, status: r.status, body: parsed };
  }
}
function log(name, res, extra = {}) {
  appendJsonl(callsLog, {
    ts: new Date().toISOString(), run: runId(), mode, tool: name, status: res.status,
    code: res.body?.code ?? null, requestId: res.body?.meta?.requestId ?? res.body?.requestId ?? null,
    costMicros: res.body?.meta?.costMicros ?? 0, cached: res.body?.meta?.cached ?? null, ...extra,
  });
}
function runSpend() {
  let n = 0;
  try {
    for (const l of readFileSync(callsLog, "utf8").split("\n")) {
      if (!l) continue;
      const e = JSON.parse(l);
      if (e.run === runId()) n += e.costMicros || 0;
    }
  } catch {}
  return n;
}
async function tools() {
  const p = home("~/.local/state/seo-engine/tools.json");
  try { if (Date.now() - statSync(p).mtimeMs < 864e5) return readJson(p); } catch {}
  const r = await fetch(`${BASE}/api/v1/tools`, { headers: { authorization: `Bearer ${KEY}` } });
  if (!r.ok) die(`GET /api/v1/tools: ${r.status}`);
  const map = Object.fromEntries((await r.json()).tools.map((x) => [x.name, x]));
  writeJson(p, map);
  return map;
}
function print(v) {
  let out = JSON.stringify(v, null, 2);
  // Never echo a secret the response may repeat back (e.g. an alert rule's webhookUrl).
  for (const [k, val] of Object.entries(process.env))
    if (/KEY|TOKEN|SECRET|WEBHOOK|PASSWORD/i.test(k) && val && val.length >= 12) out = out.split(val).join(`<${k}>`);
  out = out.replace(/https:\/\/(discord(app)?\.com\/api\/webhooks|hooks\.slack\.com)\/[^"\s]+/g, "<webhook>");
  process.stdout.write(out + "\n");
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
