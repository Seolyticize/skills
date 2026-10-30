#!/usr/bin/env node
// Self-check for gate.mjs and notify.mjs dedupe: node test.mjs  (no network, temp dirs only)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const here = new URL(".", import.meta.url).pathname;
const repo = mkdtempSync(join(tmpdir(), "seo-engine-test-"));
const state = join(repo, "state");
mkdirSync(join(repo, "src"));
mkdirSync(join(repo, "blog"));
writeFileSync(join(repo, ".seo-engine.json"), JSON.stringify({
  site: "t", origin: "https://ex.com", seolyticize: { clientId: "c" }, discord: { webhookEnv: "X_HOOK" },
  budget: { perRunMaxMicros: { adhoc: 1000 } }, cadence: { maxNewPerWeek: 1 }, brand: { neverSay: ["free trial"] },
}));
writeFileSync(join(repo, "src/plans.ts"), "a\nb\n  starter: { price: 29 },\nc\n");
const env = { ...process.env, SEO_ENGINE_CONFIG: join(repo, ".seo-engine.json"), SEO_ENGINE_STATE: state, SEO_RUN_ID: "t1" };
const run = (script, args) => spawnSync("node", [join(here, script), ...args], { env, encoding: "utf8" });

const good = {
  type: "new", keyword: "k", url: "https://ex.com/blog/a", file: "blog/a.md",
  claims: [{ claim: "Starter costs $29 a month", file: "src/plans.ts", line: 3, quote: "price: 29" }],
  score: { value: 80, target: 70 }, cannibalization: { owner: null, conflicts: [] },
  contentProfile: { readable: 6 },
  metadata: { seoTitle: "t", seoDescription: "d", snippetOk: true, schemaValid: true, internalLinks: 2, canonical: "https://ex.com/blog/a", answerReady: true },
};
const write = (name, piece, md) => { writeFileSync(join(repo, "blog/a.md"), md); writeFileSync(join(repo, name), JSON.stringify(piece)); return join(repo, name); };

test("a clean piece passes every gate", () => {
  const r = run("gate.mjs", [write("p.json", good, "---\ntitle: a\n---\nStarter is $29 a month.")]);
  assert.equal(r.status, 0, r.stdout);
});

test("an untraced price, a wrong source line and a forbidden phrase fail gate 1", () => {
  const bad = { ...good, claims: [{ claim: "Starter costs $29", file: "src/plans.ts", line: 1, quote: "price: 39" }] };
  const r = run("gate.mjs", [write("p.json", bad, "Starter is $29, Premium $79. Start a free trial.")]);
  assert.equal(r.status, 1);
  const g1 = JSON.parse(r.stdout).results[0];
  assert.equal(g1.ok, false);
  assert.equal(g1.why.length, 3, JSON.stringify(g1.why)); // wrong line, $79 untraced, free trial
});

test("a keyword owned by another page fails gate 3; cadence fails after the weekly cap", () => {
  let r = run("gate.mjs", [write("p.json", { ...good, cannibalization: { owner: "https://ex.com/x", conflicts: [] } }, "ok $29")]);
  assert.equal(JSON.parse(r.stdout).results.find((g) => g.gate.startsWith("3")).ok, false);
  run("gate.mjs", ["--record", write("p.json", good, "ok $29")]);
  r = run("gate.mjs", [write("p2.json", { ...good, url: "https://ex.com/blog/b", metadata: { ...good.metadata, canonical: "https://ex.com/blog/b" } }, "ok $29")]);
  assert.equal(JSON.parse(r.stdout).results.find((g) => g.gate.startsWith("6")).ok, false);
});

test("notify dedupes an open key and re-posts after resolve (dry run)", () => {
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "notified.json"), JSON.stringify({ k1: { kind: "code-change", title: "x", firstAt: new Date().toISOString(), lastAt: new Date().toISOString(), count: 1 } }));
  let r = run("notify.mjs", ["--key", "k1", "--kind", "code-change", "--title", "x", "--body", "y", "--dry-run"]);
  assert.equal(JSON.parse(r.stdout).deduped, true);
  run("notify.mjs", ["--resolve", "k1"]);
  r = run("notify.mjs", ["--key", "k1", "--kind", "code-change", "--title", "x", "--body", "y", "--dry-run"]);
  assert.equal(JSON.parse(r.stdout).dryRun, true);
});
