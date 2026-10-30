# .seo-engine.json

One file at the root of the site repo that holds the Forumulate content (the scripts search from cwd upwards; `SEO_ENGINE_CONFIG` overrides). **No secrets**: only env var names and env file paths. State (call log, dedupe, published pieces, run logs) lives in `~/.local/state/seo-engine/<site>/` (`SEO_ENGINE_STATE` overrides).

| Key | Required | Meaning |
|---|---|---|
| `site` | yes | Short id; names the state dir. |
| `origin` | yes | `https://domain`, no trailing slash. Canonicals must start with it. |
| `envFiles` | yes | `KEY=VALUE` files loaded into env (existing env wins). Holds `SEOLYTICIZE_API_KEY`, the Discord webhook, the Forumulate token. |
| `nodeBin` | no | Prepended to PATH for the publish command. |
| `seolyticize.clientId` / `trackerId` / `siteId` | yes | From `onboard_site` + `get_client`. `seo.mjs` refuses any other clientId. |
| `seolyticize.locationCode` / `languageCode` | no | Market defaults (2840 / en). |
| `budget.monthlyUsd`, `alertAt` | yes | Mirrored into `set_budget`. |
| `budget.perRunMaxMicros.{daily,weekly,adhoc}` | yes | Total paid spend allowed per run (`SEO_RUN_MODE`). 1 USD = 1,000,000. |
| `budget.perCallMaxMicros` | yes | Ceiling for any single paid call. |
| `cadence.maxNewPerWeek`, `maxRefreshesPerWeek`, `minDaysBetweenRefreshesOfOnePage` | yes | Scaled-content caps (gate 6). |
| `quality.minReadableCompetitors` | no (5) | Gate 4. |
| `platformSpecs.{seolyticize,forumulate}` | yes | Where platform bugs are appended. |
| `discord.webhookEnv` | yes | NAME of the env var holding the webhook URL. Never the URL. |
| `discord.repostAfterDays`, `username` | no | Dedupe reminder interval (14), display name. |
| `forumulate.org`, `tokenEnv`, `cwd` | yes | Org slug; env var NAME of the narrow publishing token; dir (relative to the config) the publish command runs in. |
| `forumulate.spaces.<slug>` | yes | `id`, `dir` (Markdown folder, relative to the config), `urlBase`, `publishCmd` (no `--dry-run`; the script appends it), `mirror` (`https://forumulate.com/p/<org>/<space>/{slug}`), `slugMaxChars`, `frontMatterExample`. |
| `forumulate.paths` | no | Path prefixes Forumulate serves (crawl noise there is Forumulate's). |
| `git.contentPaths`, `commitTo`, `push` | yes | What the engine may commit (content only), to which branch, and whether it pushes. |
| `code.repos`, `appPages`, `seoFiles` | yes | Where app SEO lives, for the "File:" line of code-change notes. |
| `facts.sources[] {path, what}` | yes | Files (relative to the config) that are the truth for product claims. `facts.notes[]`: known traps. |
| `brand.name`, `terms`, `voice`, `neverSay[]`, `ctas` | yes | `neverSay` phrases fail gate 1 if they appear in a piece. |

## Narrow Forumulate token

Mint one per site with the wide PAT (never put the wide one in `tokenEnv`):

```bash
POST https://forumulate.com/api/pats {"name":"seo-engine: <site> blog publish",
  "scopes":["blog:read","blog:write","docs:read"], "spaceIds":["<blog space id>"],
  "constraints":{"orgIds":["<org id>"],"spaceIds":["<blog space id>"]}}
# secret = top-level "token"; it expires in 90 days by default: rotate with POST /pats/{id}/rotate
```

`docs:read` is needed because the CLI's `publish` reads the space through a docs route even for a BLOG space.
