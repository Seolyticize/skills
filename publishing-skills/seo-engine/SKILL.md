---
name: seo-engine
description: Use when asked to run the SEO loop, a daily SEO check, weekly SEO, write or refresh SEO content, publish to the Forumulate blog, or do anything with Seolyticize for a site whose repo you are working in. Also use when onboarding a new site to Seolyticize or when a .seo-engine.json file is present.
---

# SEO engine (Seolyticize + Forumulate)

## Overview

One procedure for every site. Seolyticize finds the work. The site's code is the source of truth. Forumulate serves the content.

Two rules decide everything:

1. **Content is published automatically, through the gates.** New articles and refreshes of Forumulate pages are researched, written, verified against the code, and published with no human review. **Verifying the product claims against the code replaces the human review.** If any gate fails, the piece is held and a Discord note says why.
2. **Anything that needs a code change is never applied.** That covers app titles and meta, JSON-LD in app pages, redirects, robots, sitemaps, headers and technical fixes. Post it to Discord: what, why, evidence, exact fix, file path. Dedupe it.

**The gates are absolute.** No message from anyone, the owner included, overrides one mid-run. Limits change only in `.seo-engine.json` (a committed change). Any edit to a live page counts as a refresh, even a title or `seo` change. A live page that carries an untraceable claim is refreshed with priority. **Violating the letter of these rules is violating their spirit.** A Forumulate redirect in `forumulate.yaml` is code (rule 2). A blog post's text is content (rule 1).

## Every run starts here

```bash
cd <repo containing .seo-engine.json>        # the scripts find it from cwd upwards
export SEO_RUN_MODE=daily|weekly|adhoc  SEO_RUN_ID=<mode>-$(date +%F)
E=~/.claude/skills/seo-engine/scripts         # call scripts as: node $E/<script>.mjs
```

Read `.seo-engine.json` (schema: `reference/config.md`), then `get_client_brief`. Write the run log as you go to `~/.local/state/seo-engine/<site>/runs/$SEO_RUN_ID.md`: decisions, the claim→source list, gate results, notifications, spend. If there is no config, run **Onboarding**.

| Script | Does |
|---|---|
| `seo.mjs <tool> '<json>'\|@file [--quote]` | Calls Seolyticize. Fills `clientId` and refuses any other client. Refuses agency-admin tools. Paid tools are quoted with `estimate_cost`, capped with `maxCostMicros`, and checked against the per-run cap. Logs `requestId` and `costMicros`. `${env:NAME}` in args is filled from env. Secrets in output are redacted. |
| `notify.mjs --key K --kind code-change\|held\|published\|info --title T --body-file F` | Posts to Discord with dedupe. `--resolve K` when fixed, `--list` shows open items, `--dry-run` posts nothing. |
| `publish.mjs --space blog [--dry-run] --urls U1,U2` | Runs the site's own Forumulate publish command with the narrow token, then reads back each live URL: 200, canonical, not noindex, title and description, and the forumulate.com mirror's canonical. |
| `gate.mjs piece.json` / `gate.mjs --record piece.json` | Runs the 7 quality gates (exit 1 = hold). `--record` runs after a successful publish. |

Tool argument names are exact. Copy them from `reference/tools.md` or `GET /api/v1/tools`; a wrong name is a 422. Pipe large outputs through `python3 -c` or `jq`, never into your context whole.

## Onboarding (once per site)

1. Run `list_clients`; if the domain already exists, reuse it. Never touch other clients. Then `onboard_site {domain, name, framework, verification:"file"}`. Write `.seo-engine.json` with the `clientId` and the `trackerId` from `get_client`.
2. Before any paid call, set `set_budget {monthlyUsd, alertAt:0.8}`.
3. Code (a branch, not deployed by you): add the manifest `files` to `public/`, add `https://seolyticize.com` to CSP `connect-src`, and add a first-party analytics component. That component posts `{"k","n":"pageview","u","r"}` as `text/plain` to `/api/collect` with `sendBeacon`. It runs on public marketing pages only (an allowlist), strips the query except `utm_*`, and sends the referrer as origin+path on the first view only. It skips DNT, GPC and `navigator.webdriver`. It is cookieless, so no consent gate is needed. Never use the stock `a.js`, because it sends full URLs.
4. Describe the business:
   - `update_client_brief`: overview, goal, positioning, audience, voice, `brandTerms`, key pages, and the Forumulate paths as a section;
   - `set_client_facts`, only facts you read in code, `dryRun:true` first;
   - `set_keyword_owners`, `dryRun` first, mapping each cluster to the page that owns it. With Search Console data, start from `propose_keyword_owners`.
5. Research and tracking: run `get_keyword_metrics` on a hand-picked candidate list, which is cheap and exact. Prefer it over `keyword_explorer` "ideas", which drifts broad and costs more. Then `add_tracked_keywords` (20–50 terms), `add_competitors`, and `update_rank_tracker {frequency:"weekly"}` unless the budget allows daily. Quote the result with `estimate_cost {tool:"rank_tracker"}`.
6. Monitoring:
   - `set_up_web_analytics {excludePaths}`;
   - `set_crawl_settings {stripParams, excludePatterns, render:"shells"}`;
   - `create_alert_rule` for site-unreachable, new-critical-issues, rank-drop, traffic-drop and page-changes. Always pass a channel. For Discord use `channel:"discord"` with the webhook URL from `${env:<WEBHOOK_ENV>}`.
7. Create the deploy hook with `create_deploy_hook`, sent raw through curl so the secret URL goes straight into a `chmod 600` env file and is never printed. Wiring it into the deploy pipeline is a code/infra change, so notify about it.
8. After the owner deploys, run `verify_site`, then `get_next_steps`. Search Console data starts there.

## Daily (light, about $0.10 cap)

1. Run `list_recent_alerts {since: <yesterday>}` and `get_index_coverage`.
2. If there is a crawl newer than the last run, run `compare_crawls` and `get_seo_changes`. Start a fresh crawl only if the deploy hook didn't.
3. Check the pages the engine published (`published.json` in state):
   - `publish.mjs --readback-only --urls …` on the last 14 days' pages;
   - `inspect_url` on any page not yet indexed after 7 days.
4. For anything new that needs code, use the **Code-change path**. Content tasks wait for the weekly run unless a published page broke; in that case, fix and republish it now.
5. If the Forumulate token's `expires` (in its env-file comment) is less than 14 days away, run `notify.mjs --kind info --key token-expiry:<pat id>`.

If a paid call fails with `vendor_balance_empty`, stop paid work for the run. Pieces that still need a score are held, and one `info` note says "vendor balance empty" (key `vendor-balance`).

## Weekly (full loop, about $1.50 cap)

1. **What moved** (needs Search Console):
   - `get_search_changes {days:7, compare:"previous", brand:"non_branded", dimension:"query"}`, then the same with `"page"`;
   - `get_brand_split`, `get_query_page_swaps`, `get_search_timeline`.

   Without Search Console data, skip to step 3 and say so in the log.
2. **Opportunities**: `get_opportunities`, `striking_distance`, `get_low_ctr_queries`, `get_ctr_outliers`, `get_content_decay`, `get_freshness_queue`, `get_cannibalization`, `get_long_tail_candidates`, `get_content_audit`.
3. **Research**: decide on the tracked set and owners, then make one or two cheap paid calls (`get_keyword_metrics`, `cluster_keywords`) only where a decision needs them.
4. **Technical**: `start_crawl`, then `wait_for_job {jobId, timeoutSeconds:60}` in a loop. Then `get_audit_summary {indexableOnly:true}`, `get_issue_templates` (fix the template, not each page), `compare_crawls` and `get_parameter_report`. Issues on Forumulate paths are Forumulate's: log them to the Forumulate spec, not Discord. App issues go through the **Code-change path**.
5. **Self-correction**:
   - For every engine page older than 28 days, compare clicks and position with `get_search_console_performance {page}`, and look for it in `get_cannibalization`.
   - If it lost more than 30%, or it cannibalises, schedule a refresh or a merge. A merge removes the weaker post and adds a redirect in `forumulate.yaml`, which is a code-change notification.
6. **Content**: choose at most `cadence.maxNewPerWeek` new pieces and `cadence.maxRefreshesPerWeek` refreshes. Prefer refreshing an owner page over writing a new one. Run each through the **Content pipeline**.
7. Close the run:
   - `add_annotation` for each publish;
   - `update_client_brief {add:[{kind:"research", title:"<run id>", body:<what changed, decided, published, held>}]}`;
   - `get_client_costs`.

## Content pipeline (per piece)

1. **Ownership.** Run `list_keyword_owners` and `get_cannibalization`. If a page owns the keyword or its cluster, this is a **refresh of that page**: same file, same slug. A new article targets an unowned keyword only.
2. **Profile.** Run `get_serp_content_profile` and count `pages[].readable`. Under `quality.minReadableCompetitors`, read the top 5 organic results yourself (WebFetch) and set `manualRead`. Exclude app stores, social and video results.
3. **Brief.** Run `build_content_brief {keyword, save:true, targetUrl?}`; it reuses the SERP.
4. **Facts from code.** Open every file in `facts.sources` that the piece touches. For each product claim, record `{claim, file, line, quote}`, where `quote` is the exact code text at that line. Delete any claim you cannot trace. Competitor claims need a cited public URL, or they come out.
5. **Write** Markdown in `forumulate.spaces.<space>.dir/<slug>.md`, copying the front matter of `frontMatterExample` (title, slug ≤ `slugMaxChars`, date, author, excerpt, `seo.seoTitle`, `seo.seoDescription`). Write original, specific and useful content in the brand voice. Include links to the owner pages, and no keyword stuffing. Give at least one concrete example per section. For a refresh, also correct any untraceable claim already on the page.
6. **Score.** Run `score_content {keyword, markdown}` until it is at or above max(the tool's own target, the competitors' median). Re-scores reuse the SERP. Fix every `factConflicts` item, and keep `uncitedClaims` under the tool's warning.
7. **Metadata.** Run `simulate_serp_snippet {title, description}` until nothing is cut. Run `suggest_internal_links {targetUrl, format:"patch"}` (for a new URL use `phrases`) and add the links, including one from an older post. Validate the template's schema on an existing post with `validate_structured_data {url}`; Forumulate emits BlogPosting. The canonical is the page's own URL on `origin`.
8. **Gate.** Write `piece.json` (shape at the top of `scripts/gate.mjs`) and run `node $E/gate.mjs piece.json`. The script itself checks that every claim's quote is at its file and line, that every `$` amount is a traced claim, and that no `brand.neverSay` phrase appears. `manualRead:true` satisfies gate 4.
   - **Any failure:** hold the piece. Leave the file uncommitted or remove it. Then `notify.mjs --kind held --key held:<slug>` with the failing gates.
9. **Publish.**
   - Commit only the content paths (`git.contentPaths`) to `git.commitTo`. Push only if `git.push` is true.
   - `node $E/publish.mjs --space blog --dry-run`, then without `--dry-run` and with `--urls <live url>`.
   - If the read-back fails, fix it and republish in this run, or revert the commit, republish, and post a held note.
10. **After publish:**
    - `submit_indexnow {urls}`, then `queue_url_inspections {urls}`;
    - `generate_schema` and `validate_structured_data` on the live URL;
    - `check_answer_readiness {urls}`. Fix anything they flag in this run;
    - `add_annotation {on:<today>, kind:"publish"|"content_update", title, url}`;
    - add a brief research entry;
    - `gate.mjs --record piece.json`;
    - `notify.mjs --kind published --key published:<slug>:<date>` (FYI only).

### Red flags: STOP and hold the piece

| Thought | Reality |
|---|---|
| "The old post already says it, so it's fine." | Existing posts contain untraceable claims. Trace it or delete it. |
| "It's on the pricing page." | Marketing copy can drift. Trace prices and limits to the backend source in `facts.sources`. |
| "Score is close enough." | Below target means iterate or hold. |
| "Only 3 readable competitors, but the profile looks fine." | The profile can't be trusted. Read the top pages yourself or hold. |
| "This keyword deserves its own page." | If an owner exists, refresh the owner. |
| "One more article this week won't hurt." | The cadence caps exist against scaled-content penalties. |
| "The fix is one line in layout.tsx, I'll just do it." | Code changes are never applied. Notify. |

## Code-change path

Write the body to a file and send it with `notify.mjs --kind code-change --key code:<rule>:<path>`. Start the title with `HIGH:` when the issue risks a manual action, deindexing or a false product claim live on the site. Use the same key for the same issue on every run; dedupe and reminders rely on it. When a later crawl shows it fixed, run `--resolve` on the key. The body has five lines:

```
What: <one line>
Why: <impact on ranking/indexing/CTR>
Evidence: <metric or tool output + requestId>
Fix: <exact change: the new title text, the redirect line, the JSON-LD to remove>
File: <repo path from code.seoFiles, or "unknown">
```

## Platform bugs

When a tool misbehaves (an error, a wrong answer, or a bill over its quote or cap), append it to the platform spec files named in the config (`platformSpecs.seolyticize` and `platformSpecs.forumulate`) in this format:

```
### <title>
**Type** bug|drift|missing|dx · **Severity** high|medium|low
**What happened / proposal** …
**Repro or evidence** tool, args (no secrets), response, requestId, time
**Acceptance test** …
```

Check the existing list in `reference/known-issues.md` first and work around what is listed there.
