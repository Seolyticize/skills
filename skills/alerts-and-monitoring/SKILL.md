---
name: alerts-and-monitoring
description: Set up and run monitoring for a Seolyticize client - alert rules and where they deliver (email, Slack, webhook, Telegram), the default alerts, crawl schedules, deploy checks and deploy hooks, change detection between crawls, traffic anomalies, signed webhooks for events, and the weekly digest. Use for "tell me when rankings drop", "set up alerts", "this alert is too noisy", "crawl nightly", "did the release break anything", "send events to our system" or "why didn't my webhook fire".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Alerts and monitoring

Outcome: the client is watched for what costs it rankings or traffic, each alert reaches someone who will act on it, and when something fires you can say what changed and why. Load the seolyticize skill first for the conventions.

Permissions: alert rules need `client:manage`; crawl schedules and `check_deploy` need `project:manage`; webhooks need `api:manage`; the digest needs `report:send` to post. Check with `whoami`.

Start every pass with `get_client_brief`, so thresholds fit the client (a shop's revenue pages matter more than its blog).

## A. Set up the watch

1. **Default alerts.** `add_default_alerts` with `clientId` (or `allClients: true` for every live client the key manages). It adds four rules, keeping any kind the client already has:
   - site-unreachable (the site goes down);
   - traffic-drop 30 (non-branded Search Console clicks down 30% or more week on week);
   - new-critical-issues 1 (a crawl finds a critical issue);
   - rank-drop 5 (a tracked keyword falls 5 or more places).
     They go to the agency owner's email until changed.
2. **Check delivery.** `list_alert_rules`. Any rule with `hasDeliveryTarget` false fires into nothing; `undeliverable` lists them with the fix. Route each to where someone will see it with `update_alert_rule`:
   - `channel` slack or webhook with `webhookUrl` (https and public; slack posts in Slack's format, webhook as plain JSON);
   - email with `emailRecipients` (up to ten);
   - telegram with `telegramChatId` (uses the agency's bot from Settings).
     A channel named without its destination is refused with no_delivery_target.
3. **Add what this client needs.** `create_alert_rule` with `kind`, `threshold`, an optional `cooldownHours` and the delivery fields. Kinds and what the threshold counts:

| kind                    | threshold                                                                                                         | Good for                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| rank-drop               | positions fallen                                                                                                  | every client with tracking                        |
| traffic-drop            | percent of clicks lost                                                                                            | every client with Search Console                  |
| new-critical-issues     | count of new critical findings                                                                                    | every client                                      |
| backlinks-lost          | count lost                                                                                                        | link-building clients                             |
| site-unreachable        | (any, use 1)                                                                                                      | every client                                      |
| serp-features           | features lost or won                                                                                              | clients that hold snippets, packs or AI Overviews |
| competitor-new-pages    | new pages in one tracked competitor's sitemap                                                                     | competitive markets                               |
| page-changes            | own pages whose title, meta description, H1 or canonical changed, went noindex or 404 between the last two audits | sites edited by many people                       |
| ai-mention-drop         | percentage points the AI mention or citation rate fell                                                            | clients with AI visibility checks                 |
| competitor-new-keywords | tracked keywords a competitor started ranking for                                                                 | competitive markets                               |
| web-mentions            | new pages naming the brand                                                                                        | PR and digital PR                                 |
| link-velocity           | referring domains gained or lost in a day, far above baseline                                                     | spotting negative SEO or a viral win              |

The watch kinds look back to their last firing (at most a week) and stay silent until there is something to compare.

- `paidSource: true` on competitor-new-keywords or web-mentions buys the signal from DataForSEO on each sweep. It is off by default and needs spend permission. It reuses archived purchases (at most once a week per competitor, once a day for mentions) and is capped by the client's budget. Quote it with `estimate_cost` and tell the person before turning it on.

4. **Crawl schedule.** `get_crawl_settings` shows the schedule and `nextRunAt` (default weekly, Monday 02:00 UTC). Change it with `set_crawl_schedule`, setting `cadence` (off, daily, weekly, monthly), `day` (weekday 0 to 6 for weekly, 1 to 28 for monthly) and `hour` (UTC). Daily suits sites that ship daily; most need weekly. Scheduled crawls never overlap a running one, and a crawl started by hand counts as that slot's.
5. **Silence what is intentional.** Findings kept on purpose (noindexed login pages, legal archives) should not page anyone: `accept_issue` with the `ruleId` from `get_audit_summary`, a `template` or `urls`, a reason and optionally `until`. They then leave the alerts, digest and task lists. `list_accepted_issues` lists them; `unaccept_issue` undoes one.
6. **Route fixes to owners.** On a site split across teams or platforms, `set_path_owners` names who owns each path prefix, so audit issues, tasks and the digest are grouped by owner.

## B. Releases and change detection

- **Before a deploy ships:** `check_deploy` with `previewUrl` (a staging or preview origin) or `urls`, and `failOn` (critical by default). It compares what search engines will read (status, robots, canonical, hreflang, title, H1, structured data) with the latest crawl. `passed` false means a critical change; `markdown` is a ready pull-request comment. It costs no vendor money. For a full release review, load deploy-check.
- **After every deploy:** `create_deploy_hook` gives a secret URL the pipeline calls after each deploy. Each call diffs the sitemap and submits new and changed pages to IndexNow, and notes the deploy on the timeline. The URL is shown once; treat it as a secret. `get_deploy_hook` shows what the last call did; `revoke_deploy_hook` if it leaks.
- **What changed between crawls:** `get_seo_changes` (critical: noindex added, canonical changed, title dropped, 200 to 4xx/5xx, hreflang lost, H1 rewritten) by field and URL template, and `compare_crawls` for issues new, fixed, regressed or improved.
- **robots.txt and sitemaps:** `get_robots_history` for lines added or removed and sitemap sizes per crawl.
- **Competitors:** `get_competitor_page_changes` for pages that outrank the client and changed.
- **Traffic:** `get_search_anomalies` for days outside the normal range, each with its likely cause and a confidence; `get_search_timeline` for clicks beside deploys and Google updates; `get_serp_volatility` for "is it us or is it Google".

## C. Events and webhooks

For a system that should hear about events as they happen (verify the tool list with `find_tools` if anything here is missing):

1. `create_webhook` with an https `url`, `events`, and `clientId` (null for every client). Events: crawl.completed, gsc.synced, rank.moved, backlink.new, backlink.lost, issue.new_critical, ai.citation.gained, ai.citation.lost, competitor.page.new, budget.threshold and alert.fired. The secret is shown once.
2. Tell the receiver to verify each POST: the Seolyticize-Signature header is t=<unix>,v1=<hex HMAC-SHA256 of "<t>.<body>" with the secret>; Seolyticize-Event and Seolyticize-Delivery name the event and the delivery.
3. `send_test_event` queues a test alert.fired within a minute, to check the receiver end to end.
4. Deliveries retry with backoff from a minute to a day until a 2xx. `list_webhooks` shows whether one was switched off after failing too long; `list_webhook_deliveries` gives each delivery's status, attempts and the receiver's last HTTP status; `replay_webhooks` resends one delivery or everything since a time. `delete_webhook` stops one.
5. A poller that cannot receive webhooks reads `list_recent_alerts` with `since`, always set to the last time it read, so nothing is delivered twice.

## D. The weekly digest

`preview_weekly_digest` shows the last full week: what changed, why, and the top five actions with their estimated value. `schedule_weekly_digest` posts it to the client's connected Slack, Discord or Telegram (connect with `connect_integration` first), and `send_weekly_digest_now` posts it at once. `list_digest_schedules` shows where it goes.

## When an alert fires

1. `list_recent_alerts` with `clientId` and `since`.
2. Find the cause with the matching read:
   - rank-drop: `get_rank_history`, `get_serp_volatility`;
   - traffic-drop: `get_search_anomalies`, `get_search_changes`;
   - critical issues or page-changes: `get_seo_changes`, `compare_crawls`;
   - site-unreachable: `get_site_status`, then `start_crawl`;
   - backlinks or link-velocity: `get_backlink_health`, `get_link_velocity`.
3. Say whether it is real, a Google-wide move, or noise. If noisy, raise the threshold or `cooldownHours`, or pause the rule with `update_alert_rule` and `paused: true`. Deleting a rule (`delete_alert_rule`) removes its history too, so prefer pausing.
4. Note what you found with `add_annotation`, and add a research entry with `update_client_brief`.

## What to hand back

- The rules in place: kind, threshold, where each delivers, and any that cannot deliver.
- The crawl schedule and its next run.
- For a fired alert: what happened, the evidence (figures, dates, the tool), the likely cause with its confidence, and the fix or the decision needed.
- Any paid monitoring turned on, with its quoted monthly cost.
- Secrets (webhook secrets, deploy hook URLs) handed over once and never repeated in a summary or log.
