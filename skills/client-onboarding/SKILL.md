---
name: client-onboarding
description: Set up a new SEO client in Seolyticize end to end - create the client, write its brief from the website, connect Search Console, GA4 and first-party analytics, add the default alerts, schedule crawls, run the first crawl and start rank tracking, then confirm with get_next_steps. Use when someone says "onboard a new client", "add a client", "set up acme.com", "we just signed X" or "connect their Search Console".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Onboard a client

Outcome: a client that is created, briefed, connected to its data, crawled, tracked and watched, with a list of what still waits on a person. Load the seolyticize skill first for the conventions (money, dryRun, errors, honesty).

Stop and ask whenever a step needs a decision only the person can make: the budget, which competitors matter, which keywords to track, anything that costs money.

## Workflow

1. **Check reach.** `whoami`. Creating a client needs `client:manage` (admin, or site_admin for its own client). Tracking keywords and drafting the brief need `spend:incur`. If the role lacks one, say which and stop at that step.
2. **Is the client already here?** `list_clients`. If the domain is already a client, use it and skip to step 4: never make a duplicate. `create_client` refuses a taken name with duplicate_client.
3. **Create it.** Choose the route:
   - **The agency can deploy to the site** (it builds or hosts it): `onboard_site` with `domain`, `name`, `framework` and `verification` (file, meta or dns). It creates the client, project, site and tracker (or finds the existing client, so it is safe to repeat), issues the IndexNow key and a Google site verification, sets up first-party analytics, and returns one deploy manifest: files to serve, head tags, the analytics snippet and CSP entries. Hand the manifest to whoever deploys. After deploy, `verify_site` checks every item, connects Search Console with its sixteen months of history and starts the first crawl. Its checklist names the fix for anything not done. Then go to step 6.
   - **Otherwise**: `create_client` with `name`, `domain`, and `monthlyBudgetUsd` if the person gave one. It makes the client, a project, the site and one rank tracker, and returns `clientId`, `projectId`, `siteId` and `trackerId`. Keep them. Leave `keywords` out here; choose them in step 8 with the person.
   - Use an `Idempotency-Key` such as `onboard-<domain>-<date>` on REST, so a retry cannot create two clients.
4. **Set the budget.** If the person named a monthly cap or warning level, `set_budget` with `monthlyUsd` and `alertAt` (for example 0.8).
5. **Write the brief from the site.** `get_client_brief` first: fields already written are kept. `draft_client_brief` is a paid model call: quote it with `estimate_cost`, say the figure, then call it with that as `maxCostMicros`. Show the draft. Save only what the person confirms with `update_client_brief`. Leave anything marked "Not stated on the site." for them. Ask for the current goal, the main competitors (the draft never names them) and the brand terms (`brandTerms`: the name, products and misspellings people search for). Brand terms are what split branded from non-branded search.
6. **Connect Search Console and GA4.** `get_client_integrations` shows what is connected. Prefer the route that needs no sign-in:
   - `get_google_service_account` gives the agency's service-account email. Ask the person to have the property owner add it: in Search Console under Settings, Users and permissions (Restricted); in GA4 under Admin, Property access management (Viewer).
   - Then `connect_search_console_service_account` with `clientId` (it tries the Domain property, then https:// and https://www.) and `connect_google_analytics_service_account` with `clientId` and `propertyId`, the numeric GA4 property id, not a G- measurement id.
   - If access is not granted yet, the refusal says exactly what the owner must do. Pass it on and carry on with the other steps.
   - If the owner would rather sign in: `get_connection_link` with `service` search_console or google_analytics (with `ga4PropertyId`) gives a link for a person. An agent cannot complete it.
   - Search Console history backfills over time; `get_client_integrations` shows the backfill's progress. Data that has not arrived is unknown, not zero.
7. **First-party analytics.** Whether or not the site has GA4, `set_up_web_analytics` (with `hostnames` for staging or extra domains and `excludePaths` for signed-in areas) returns the one-line snippet for every page's head. It is cookieless. Give it to whoever deploys. `get_web_analytics_setup` shows `lastEventAt` once the first visit arrives. For server-side collection, goals and orders, load analytics-and-conversions.
8. **Rank tracking.** `list_rank_trackers` shows the tracker `create_client` made. Agree the keywords with the person (keyword-research helps find them). Before adding:
   - quote a month with `estimate_cost`, tool rank_tracker, arguments `clientId` and `trackerId`, and read `monthlyMicros`;
   - every term is a paid lookup on every run, so say the monthly figure and get a yes.
   - Then `add_tracked_keywords` with `terms`, `add_competitors` with the agreed rival domains, and `pin_tracked_keywords` for the handful that matter most (ids from `list_tracked_keywords`). Another market, engine or device is a new tracker: `create_rank_tracker`, with `list_markets` or `search_locations` for the code. Never guess a location code.
9. **Default alerts.** `add_default_alerts` with `clientId` adds four: site down, non-branded clicks down 30% week on week, new critical crawl issues, a tracked keyword down 5 places. Safe to repeat. They go to the agency owner's email until changed; if the person wants Slack, a webhook or other recipients, `update_alert_rule` (see alerts-and-monitoring).
10. **Crawl schedule.** The default is weekly, Monday 02:00 UTC. If the person wants otherwise, `set_crawl_schedule` with `cadence` (off, daily, weekly, monthly), `day` and `hour`. For a large or staging site, check `get_crawl_settings` and adjust with `set_crawl_settings` or `set_crawl_auth` first.
11. **First crawl.** Skip if `verify_site` already started one. Otherwise `start_crawl`, then `wait_for_job` with `jobId` crawl:<crawlId> (call again while it says running), then `get_audit_summary`. Hand the findings to technical-audit or seo-audit-fix rather than fixing them here.
12. **Optional, when the person wants them:**
    - AI visibility: `suggest_ai_visibility_setup` or `suggest_ai_prompts`, then `save_ai_visibility_setup`, quote with `estimate_ai_visibility_cost` before `set_ai_visibility_schedule` (see ai-visibility-audit).
    - Deploy notifications: `create_deploy_hook`, so each release submits new and changed pages to IndexNow.
    - A store: `connect_revenue_source` for Stripe, Shopify or Paddle.
    - Reports and portal: `create_report` and `schedule_report`. Make a portal link (`create_portal_link`) only when the person asks: anyone holding it sees the client's results.
13. **Confirm.** `get_next_steps` lists each onboarding item as done, todo, in progress, failed or blocked, with the exact call for each gap and the optional connections still open. Do every todo you can. Collect the rest for the person.
14. **Record it.** `update_client_brief` with a research entry, "Onboarding", saying what was set up, the ids, what it costs per month, and what waits on whom.

## Decision points

- **No budget given:** ask before adding tracked keywords or scheduling AI checks; these spend every run.
- **Google refuses the connection:** do not retry in a loop. Pass the owner the exact steps from the refusal, and check later with `get_client_integrations`.
- **No GA4 at all:** first-party analytics covers traffic and goals. Say that GA4 figures will be unknown, not zero.
- **Plan limit refused** (plan_limit): `get_billing` shows the allowance. The person decides on an upgrade.

## What to hand back

- The client's name and `clientId`, and the route used.
- A checklist from `get_next_steps`: done; waiting on a person (who, what, the link or steps); not started and why.
- The monthly running cost agreed (tracked keywords, AI checks), and anything spent today.
- The first crawl's headline (health, critical issue count), or that it is still running.
- The next action, with the skill to use: usually technical-audit, then seo-weekly-loop.
