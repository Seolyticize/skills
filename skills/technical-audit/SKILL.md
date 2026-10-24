---
name: technical-audit
description: Run and triage a technical SEO audit of a client's site with Seolyticize. Crawl, rank issues by impact, check index coverage, URL inspection, sitemaps, Core Web Vitals (field and lab), JavaScript rendering, structured data, hreflang and agent readiness, then accept the intentional findings, route fixes to owners and turn the rest into tasks grouped by template. Use for "audit the site", "technical SEO audit", "why isn't it indexed", "what is broken on the site", "crawl the site".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Technical audit

The result is a short, ranked fix list. Each fix names one template, the pages it affects, the change to make and how to check it. Everything you accept as intentional, or route to another team, is recorded on the platform, so the next crawl, the digest and the alerts agree with you.

Nearly everything here is free stored data. The exceptions are `page_lab` and `run_audit_performance_sample` (they draw on the agency's PageSpeed quota) and `suggest_meta_tags` (a metered Claude call). Say so before you run them.

## Before you start

- **Find the client.** Use `list_clients`, then `get_site_status` (verified site, Search Console connected, latest crawl). If Search Console is not connected, index coverage and URL inspection will refuse. Say that rather than reporting zero indexed pages.
- **Read the brief.** Call `get_client_brief` for the goal, the key pages and earlier audit notes. Build on them, and do not repeat triage already recorded.
- **Paid calls.**
  - Quote with `estimate_cost` and tell the person the total.
  - Then pass the quote's estimatedMaxMicros as maxCostMicros, so the call cannot cost more than agreed.
  - Re-reading stored results costs nothing, so prefer it to buying again.
- **Something unclear?** `get_recipe` with name technical_audit returns this plan with the client's own arguments filled in. `find_tools` finds a tool by intent.
- **Errors.** Every error carries a `code` and a `next` step. Follow `next`. `get_error_catalogue` explains every code. Unknown arguments are refused, so only pass the arguments documented for each tool.

## Workflow

### 1. Get a crawl you can trust

1. Call `list_crawls`. If the latest complete crawl is recent, under a week old and taken after the last release, use it.
2. Otherwise call `start_crawl`, which needs client:manage because it puts load on the client's server. Poll `get_crawl_status` with the crawl id until it shows complete or failed. Small sites take minutes. Large sites can take hours.
3. **If the crawl failed, or found almost nothing,** read the failure reason before anything else:
   - A bot wall (the bot-challenge rule) or a login: call `set_crawl_auth` with a bypass header or basic auth, then crawl again.
   - The crawl is full of ?sort= and ?filter= copies: call `get_parameter_report`, then `set_crawl_settings` with stripParams.
   - A JavaScript app shell: call `set_crawl_settings` with render set to shells or all.
   - `get_crawl_settings` shows what the crawler is currently doing.
4. **If nobody crawls this site on a schedule,** propose `set_crawl_schedule` (weekly is the default cadence). Then `compare_crawls` has something to compare against next week.

### 2. Read the issues by impact

1. Call `get_audit_summary` with crawlId latest. It returns issues by rule with severity, page count and howToFix, accepted findings listed apart, and owner splits when path owners are set.
   - indexableOnly defaults to true, which hides findings on pages that search engines will not index anyway. Leave it on for prioritising. Pass false only to explain a page that is excluded.
2. Call `get_issue_templates` to see each issue's pages grouped by URL template. "4,000 pages" is often one template and one fix. Count fixes, not pages.
3. Rank the work with the rubric in `references/issue-priority.md`. **Read it before writing the fix list.** In short: anything that keeps pages out of the index or breaks a page comes first, then wasted crawl and broken links, then metadata, structured data and speed, then hygiene.
4. Call `compare_crawls` for issues that are new, fixed or regressed since the crawl before. A regression that started with a release outranks an old issue with the same severity.
5. Call `get_seo_changes` for the critical field changes between crawls: noindex added, canonical changed, title dropped, 200 turning into an error, hreflang lost.
6. For detail on one rule, call `list_issue_pages` with the ruleId; it is paged, and total gives the whole count. For one page, call `get_page_issues` and `get_page_details`.
7. Optional extra views:
   - `get_seo_scorecard`: a 0–100 heuristic with quick wins and a phased plan. Useful for a client summary, but it never replaces the issue list.
   - `check_templated_metadata`: descriptions written in bulk by a template (a heuristic).
   - `get_internal_link_graph`: orphan pages and pages buried deep.
   - `get_security_report`: security headers and mixed content.
   - `get_site_conventions`: trailing-slash duplicates and HSTS preload readiness.

### 3. Check what Google actually did

The crawler can only say what the site serves. These calls show what Google made of it.

- **Index coverage.** `get_index_coverage` shows URL Inspection verdicts for the pages inspected so far. It reports how many pages that covers and how many are still queued. Always say it covers inspected pages only.
- **Why pages are not indexed.** `get_page_indexing_reasons` rebuilds the Page indexing report per template, with the main reason and a fix for each. Pages not yet inspected are filled in from the crawl and marked as such.
- **Inspecting pages.** `inspect_url` inspects one page now. It uses one of the property's 2,000 inspections a day, so keep it for pages that matter. `queue_url_inspections` queues up to 500 pages to run in the background within that allowance.
- **The key finding.** A page the crawler finds fine but Google has not indexed is usually the most important finding in the audit. Report it first.
- **Sitemaps.**
  - `list_sitemaps` shows what Google, Bing and Yandex each report. Google's count of indexed pages per sitemap is always null. Say "not reported", not zero.
  - `validate_sitemap` covers entries that are not 200 or not indexable, indexable pages missing from the sitemap, lastmod honesty and file limits.
  - `get_robots_history` shows when robots.txt or the sitemaps changed.
  - `test_robots` says which robots.txt line blocks a given bot from a given address.

### 4. Speed: field before lab

- **Field data.** Field data is what Google ranks on.
  - `get_audit_performance` gives the origin's Chrome UX Report pass or fail per phone and desktop, plus a Lighthouse run per large template, with fixes ranked by estimated saving.
  - `get_vitals_history` gives 25 weeks of field data with regressions and the LCP subparts.
  - `page_vitals` gives field data for one address.
- **Lab data.** Use `page_lab` (one Lighthouse run, spends PageSpeed quota) when a page is too quiet to have field data, or to find where the time goes. If the audit's sample failed or predates a PageSpeed key, call `run_audit_performance_sample`.
- **Always label which is which.** A lab score is one synthetic load, not what visitors experienced. A missing field figure means too few visits or no key, not a pass.

### 5. Rendering, structured data and hreflang

- **Rendering.** `get_rendering_report` lists words, links, titles, canonicals or structured data that exist only after JavaScript runs. Search engines that skip JavaScript, and every AI crawler, never see them. It needs rendering turned on in the crawl settings.
- **Structured data.** `validate_structured_data` checks markup against Google's requirements, per type for the whole crawl or live for one url. `get_search_appearance` shows whether rich results actually earn clicks. FAQ and HowTo no longer earn rich results, so losing them is not a regression.
- **Hreflang.** Use these only when the site has language or market versions:
  - `get_hreflang_report` validates the clusters: return links, x-default, invalid codes and canonical conflicts.
  - `get_hreflang_parity` checks whether the translations are real. It is a heuristic and says so.
  - `generate_hreflang` writes the tags, or a sitemap of them.

### 6. Agent readiness

- **The checks.** `get_agent_readiness` runs the P0–P3 checks for AI assistants and browsing agents. Report every P0 failure. No fix below P0 is recommended while a measured P0 fails, so fix those first.
- **Unmeasured is not passed.** A check that comes back unmeasured is unknown, not a pass.
- **AI crawler access.** `get_ai_crawler_access` gives a per-crawler verdict (GPTBot, ClaudeBot, PerplexityBot and others) for the top pages, covering robots.txt, CDN blocks and pages that need JavaScript.
- **Going further.** For whether assistants actually cite the client, hand over to the ai-visibility-audit skill.

### 7. Triage: accept, route, then task

Do triage in this order, so tasks are created only for real work.

1. **Accept the intentional findings.** Examples: login pages noindexed by design, legal archives, sort variants that are canonicalised on purpose.
   - Call `accept_issue` with the ruleId, either a template (/login, /legal/\*, /docs/\*?sort=\*) or a list of urls, a reason, and optionally until (YYYY-MM-DD) for a temporary state.
   - **Preview a template first.** Call `accept_issue` with dryRun true. It saves nothing and returns matchedNow (the latest crawl's findings it covers), rulePages (all of that rule's findings) and a sample of the covered addresses. Read the sample before saving.
   - Read warning, on the preview and on the saved acceptance. It is set when the template matches nothing (usually a typo) or covers more than half the rule's pages (usually too broad: it hides the issue rather than its exceptions). Fix the template rather than accept on a warning.
   - **Ask the user before accepting anything** that is not obviously by design. Accepting a finding hides it from the scorecard, the digest, the tasks and the alerts.
   - `list_accepted_issues` shows what is already accepted. Pass includeLapsed to see acceptances whose until date has passed. `unaccept_issue` reverses an acceptance.
2. **Route by owner.** Do this when the site runs on several platforms or several teams own it, for example docs on one vendor, the shop on another and the blog in-house.
   - Call `set_path_owners` with prefix, owner and optional contact. By default (mode replace) the list you send **replaces** the whole list. To add or change a few prefixes and keep the rest, use mode merge, with remove for prefixes to drop.
   - Run it with dryRun true first. It saves nothing and returns the list that would result and the changes: added, updated (with the old owner), removed and kept. Check removed before saving a replace.
   - A URL belongs to the longest prefix it falls under, and / is the catch-all.
   - From then on, `get_audit_summary` and `list_issue_pages` split issues by owner, and each task names its owner.
3. **Make the tasks.**
   1. Call `create_tasks_from_audit` with dryRun true. It creates nothing and returns wouldCreate (each task's title, notes, assignee and due date) and skipped (issues that already have an open task, or are covered entirely by an acceptance).
   2. Show the user the list.
   3. On their go-ahead, call it again with the same arguments and without dryRun.
   - Narrow it with ruleIds, or with severities (the default is critical and warning).
   - If the agency works in Jira, Linear or GitHub, `push_tasks_to_tracker` takes dryRun too. Use the same preview-then-confirm pattern.
   - REST callers send an Idempotency-Key header on these writes.

### 8. Group the fix list by template

Write one entry per template-level fix, not one per URL. Each entry has:

- **Problem:** the rule's label and what it costs, such as "not indexed" or "split ranking signals".
- **Where:** the template (for example /products/\*), the page count, and two or three example URLs.
- **Owner:** taken from the path owners, when they are set.
- **Fix:** the howToFix, made concrete for this site.
- **Verify:** how to check the fix. Usually that means `get_page_issues` on an example after deploy, then `compare_crawls` after the next crawl showing the count fall.

Missing or duplicate titles and descriptions across a template are covered by `suggest_meta_tags`. It is a paid Claude call per 25 pages, so quote it with `estimate_cost` first. `simulate_serp_snippet` checks where Google will cut the wording. For a migration, `plan_redirect_map` drafts the 301s.

### 9. After fixes ship

- **Speed up recrawling.** `submit_indexnow` covers Bing, Yandex, Seznam and Naver. It needs the client's IndexNow key published (`get_site_status` says whether it is). Run it with dryRun true first, and submit only pages that changed.
- **Google.** Google does not take IndexNow. Use `submit_sitemap`, or `inspect_url` for the few pages that matter most.
- **Re-crawl changed pages.** `submit_urls` queues changed pages for Seolyticize's own crawler. Preview it with dryRun.
- **Record the work.** Call `update_client_brief` with a research entry: what was found, what was accepted and why, and what is left. Save a client-facing write-up with `save_written_report` only when asked.
- **No share links.** Never create share links (`create_report_link`, `set_report_sharing`) unless the person asks for one, because anyone holding the link can read the report.

## Honesty rules

- **Unknown is not zero.** Null, unmeasured or "not inspected" means unknown. Never write 0 or "passed" for it.
- **Name the heuristics.** The scorecard, the template-metadata check and hreflang parity are heuristics. Say so when you quote them.
- **Coverage is partial.** Index coverage covers inspected pages only. Give the count it rests on.
- **Data stays as reported.** Never round a page count into a claim like "the whole site". Never invent a cause the data does not show.

## What to hand back

1. **The headline.** Two or three sentences covering the crawl date, pages crawled, how much of the site is indexed (with the number of inspected pages it rests on), and the single most important problem.
2. **The fix list.** Five to ten template-level fixes in priority order, each with problem, where, owner, fix and verify, plus the evidence: the rule id, the counts and an example URL.
3. **Speed.** Pass or fail on the field data per device, then the top lab fixes. Label which is field data and which is lab data.
4. **Triage done.** Acceptances made, with their reasons. Owners set. Tasks created, or the dry-run list still waiting for approval.
5. **Unknowns.** For example: Search Console not connected, no Chrome UX Report key, rendering off.
