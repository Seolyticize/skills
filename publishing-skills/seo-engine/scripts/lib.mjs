// Shared by the seo-engine scripts: find the site's .seo-engine.json, load secrets from env files, keep state.
import { existsSync, readFileSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

export const home = (p) => (p.startsWith("~/") ? join(homedir(), p.slice(2)) : p);

/** The nearest .seo-engine.json from cwd upwards (or $SEO_ENGINE_CONFIG). */
export function loadConfig() {
  let file = process.env.SEO_ENGINE_CONFIG;
  if (!file) {
    for (let d = process.cwd(); ; d = dirname(d)) {
      if (existsSync(join(d, ".seo-engine.json"))) { file = join(d, ".seo-engine.json"); break; }
      if (dirname(d) === d) break;
    }
  }
  if (!file) die("No .seo-engine.json found from here upwards. Run from the site repo, or set SEO_ENGINE_CONFIG.");
  const cfg = JSON.parse(readFileSync(file, "utf8"));
  cfg._file = resolve(file);
  cfg._dir = dirname(cfg._file);
  for (const k of ["site", "origin", "seolyticize", "budget", "discord"]) if (!cfg[k]) die(`${file}: missing "${k}"`);
  loadEnvFiles(cfg.envFiles || []);
  return cfg;
}

/** KEY=VALUE lines into process.env (existing env wins). Values are never printed. */
export function loadEnvFiles(files) {
  for (const f of files) {
    const p = home(f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

export function stateDir(cfg) {
  const d = home(process.env.SEO_ENGINE_STATE || `~/.local/state/seo-engine/${cfg.site}`);
  mkdirSync(join(d, "runs"), { recursive: true });
  return d;
}

export const readJson = (p, dflt) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : dflt);
export const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
export const appendJsonl = (p, v) => appendFileSync(p, JSON.stringify(v) + "\n");
export const runId = () => process.env.SEO_RUN_ID || "adhoc";

export function die(msg, code = 2) {
  process.stderr.write(`seo-engine: ${msg}\n`);
  process.exit(code);
}

/** Tiny flag parser: --a b --flag → {a:"b", flag:true, _:[...]} */
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) out[k] = true;
    else { out[k] = v; i++; }
  }
  return out;
}
