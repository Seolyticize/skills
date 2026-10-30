# Known platform issues and workarounds (as of 2026-10-30)

Check this list before logging a "new" bug, and update it when a fix ships.

## Seolyticize
| Issue | Workaround |
|---|---|
| The content profile can count unreadable or irrelevant pages (bot-blocked, app stores, social). | Gate 4: at least `minReadableCompetitors` with `readable:true`, else read the top pages yourself. |
| Snapshot tools say `no_snapshots` until a crawl has run after snapshots were added. | Re-crawl. |
| Search Console data appears only after `verify_site`; anomaly and forecast tools need weeks of it. | Skip them until `get_next_steps` shows data. |
| Arguments that look alike have different shapes: `forecast_keyword_traffic` takes objects, `get_personal_keyword_difficulty` takes strings. | Copy them from `reference/tools.md`. |

Fixed 2026-10-30, no workaround needed: quotes match charges and `maxCostMicros` is enforced; `estimate_cost` reports `vendorReady`/`vendorBalanceMicros`; job ids work with `wait_for_job`; `list_crawl_issues` lists pages; read-only tools are marked so; `stripParams` keeps its case; alerts have a `discord` channel; anomalies, AI referrals and link velocity answer; unknown arguments are a 422.

## Forumulate
| Issue | Workaround |
|---|---|
| PATs expire after 90 days by default. | Forumulate warns: `credentials.expiring` on `GET /orgs/{org}/integration-health`, a `pat.expiring` webhook and an owner email 14 days before. The health board needs `settings:manage`, so the daily run still reads `expiresAt` from the env-file comment as a backstop. Rotate with `POST /pats/{id}/rotate`. |
| A slug longer than 120 characters is refused. | Keep `slug` ≤ `slugMaxChars` (120 for CLI ≥ 0.12.1). Never change the slug of a live post; a new address needs a 301 in `forumulate.yaml` (a code-change note). |
| A page edited in the studio stops the CLI with `CONFLICT`. | Pull the change into the file. Never use `--force` in an unattended run; hold and notify instead. |
| The forumulate.com mirror must name our URL as canonical. Its address has a prefix per space type (`/b/<org>/<space>/<slug>` for a blog; `/p/` redirects there). | `publish.mjs` checks it on every read-back. |

Fixed in `@forumulate/cli@0.12.1` (2026-10-30), no workaround needed: blog `publish` works with only `blog:read` + `blog:write`; slugs are kept up to 120 characters (no silent cut at 70); `excerpt:` (or `description:` / `summary:`) is written to the post's `excerpt`; `author: <key>` and `bylines: [{author: <key>}]` credit the registry author and read back as matching; `/blog/author/<key>` answers 200; unknown front-matter keys are named before anything is sent; reader responses carry `x-request-id` (quote it in a spec).
