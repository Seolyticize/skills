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
| CLI `publish` on a BLOG space needs `docs.read`. | Mint the narrow PAT with `blog:read`, `blog:write` and `docs:read`, constrained to the blog space. |
| PATs expire after 90 days by default. | Record `expiresAt` in the env file comment. The daily run warns 14 days before. |
| `/blog/author` links a 404 (`/blog/author/<key>`). | It's Forumulate's: log it, don't notify Discord. |
| Post slugs are cut at 70 characters. | Keep `slug` ≤ `slugMaxChars`. Old long URLs need a redirect in `forumulate.yaml`, which is a code-change note. |
| A page edited in the studio stops the CLI with `CONFLICT`. | Pull the change into the file. Never use `--force` in an unattended run; hold and notify instead. |
| The forumulate.com mirror (`/p/<org>/<space>/<slug>`) must name our URL as canonical. | `publish.mjs` checks it on every read-back. |
