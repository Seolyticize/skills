---
name: seo-weekly-loop
description: Run the weekly SEO check-in for one client with Seolyticize. Covers what moved (rankings, Search Console, analytics and revenue, audit diffs, alerts), why it moved, this week's three to five actions, and a short plain-words note for the client. Starts from get_next_steps and the client brief, and records the week in the brief. Use for "weekly SEO check", "what changed this week", "Monday review", "what should we work on this week", "weekly client update".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Weekly SEO loop

Run this for one client at a time. The output is a short account of what moved and why, three to five actions for this week, and, if asked, a note the client can read.

Everything in steps 1–4 is stored data and free. Paid extras are marked. For each one:

1. Quote it with `estimate_cost`.
2. Tell the person the total.
3. Pass the quote as maxCostMicros.

## Workflow

### 1. Start from the brief and the platform's own to-do list

1. **Find the client.** Use `list_clients` to get the clientId.
2. **Read the brief.** `get_client_brief` gives the goal, the audience, the key pages, and last week's research entry: what was planned, and what to check came true.
3. **Check the setup.** `get_next_steps` lists the onboarding checklist with live status, the connections that unlock more, and then the weekly loop's own calls with their arguments filled in.
   - **If something is failed, blocked or todo** (Search Console not syncing, no crawl, no tracker keywords), raise it first. A week of analysis on missing data is wasted.
   - Fixing it usually needs a person: connecting Google, adding a key.
4. **Check the alerts are set up.** If the client has no alerts, offer `add_default_alerts`. It is safe to repeat.

### 2. What moved

Compare this week with the one before, unless the brief says the client reports monthly.

- **Search Console.** `get_search_changes` with days 7.
  - Run it once by query and once with dimension page.
  - Set brand to non_branded, since that is what SEO work moves. Brand terms are set in the brief.
  - It covers new, lost, gainers and losers.
  - Periods end on the newest day Google has finished counting. Recent days are provisional.
- **Rankings.** `list_rank_trackers`, then for each tracker:
  - `get_rank_summary` for improved, declined and held, with the average position.
  - `get_rank_history` for the movers. Each day carries the page that ranked. A null position means the client was not on the page. A missing day means nobody read it. Neither is a zero.
  - `get_url_swaps`: a "drop" that is really Google swapping one of the client's pages for another is a cannibalisation problem, not a loss.
- **Analytics and revenue.** Use whichever is connected:
  - `get_ga4_overview` for organic sessions, key events and revenue against the previous period;
  - `get_web_analytics_summary` for the first-party analytics;
  - `get_conversions` with channel search for conversions by landing page and query;
  - `get_seo_revenue` for revenue by channel, page and query from imported orders.

  If none is connected, write "not measured". Never write 0.

- **The site.**
  - `compare_crawls` lists issues new, fixed and regressed since the last crawl.
  - `get_seo_changes` lists critical field changes: noindex, canonical, title, status, hreflang.
  - Findings accepted as intentional are already left out.
  - If the last crawl is over a week old, say so. `set_crawl_schedule` fixes it for the future.
- **Alerts.** `list_recent_alerts` since last week's run. These include traffic drops, rank drops, new critical issues, competitors' new pages, AI mention drops and new brand mentions.
- **AI, if tracked.** `get_ai_visibility_trend` for the client's mention rate against the previous period. Give the answer counts, because a few answers are noise.
- **Shortcut.** `preview_weekly_digest` builds the platform's own digest for the last complete Monday-to-Sunday week. It covers what changed, why it probably changed, and the top five actions with estimated clicks. Use it as a cross-check, or as the base when time is short.

### 3. Why it moved

For each notable mover, find the cause. Name a cause only when the data shows it. Otherwise write "unexplained so far".

1. **Unusual days.** `get_search_anomalies` finds days outside the normal range and names the likely cause with a confidence: a crawl regression, a deploy, a Google update, a lost SERP feature or a page swap.
2. **The timeline.** `get_search_timeline` and `list_annotations` (with includeGoogle) show clicks beside deploys, publishes, campaigns and Google updates.
3. **Us or Google?** `get_serp_volatility` compares the client's keywords with an industry-wide index. If the whole results page is shaking, it is not just us.
4. **The results page changed.** `get_serp_features` shows whether an AI Overview or a snippet appeared, or was lost.
5. **The site changed.** Check the regressions found in step 2, and `get_index_coverage` for pages Google dropped.
6. **Demand changed.** If impressions fell across the board while positions held, demand fell. That is not something to fix.

### 4. This week's three to five actions

- **Gather candidates.**
  - `get_opportunities` returns striking distance, low CTR, content decay and cannibalisation in one call. A part that errors is unread, not empty.
  - For detail, use `striking_distance`, `get_low_ctr_queries`, `get_content_decay` and `get_cannibalization`.
- **Add from the site.** Include regressions and new critical issues from step 2, each as one template-level fix (`get_issue_templates`).
- **Add from local and AI, when relevant.**
  - `get_local_visibility` for a local client's main term (free, reads the last scan).
  - `get_ai_cited_sources` for who assistants cite instead.
- **Pick three to five actions.** Order them:
  1. regressions and anything losing traffic now;
  2. the largest estimated gains for the least work;
  3. last week's unfinished actions, if they still matter.
- **Write each action** with the page, the query or rule, what to change, the evidence (current position, impressions, clicks lost) and the expected effect. State the effect as a direction, not a promise.
- **Paid, optional.** `get_tracker_ai_mode` shows AI Mode citations beside rankings. `get_forum_opportunities` finds threads ranking for the client's keywords. Quote both before running them.
- **Tasks.** If the agency tracks work on the platform:
  - `create_task` for each action;
  - `create_tasks_from_audit` with dryRun true first, for audit items;
  - `list_tasks` to see what is still open from last week.

### 5. Record the week

1. **The research log.** Call `update_client_brief` with a research entry covering what moved, why, this week's actions, and what to check next week. Next week's run starts from it.
2. **The timeline.** Use `add_annotation` for anything that happened this week and is not already on the timeline, such as a publish, a campaign or a technical change, so later charts explain themselves.

### 6. The client note (only if asked)

Write it in plain words for a non-specialist, in about 150–250 words:

1. **Wins first,** with one or two numbers.
2. **What dipped and why,** or "we are watching it" when the cause is unexplained.
3. **What we are doing this week.**

Leave out jargon, rule ids and internal tooling.

To save it, use `save_written_report`, which stays private. Never create share links (`create_report_link`, `set_report_sharing`) unless the person asks, because anyone holding one can read the report. `send_weekly_digest_now` and `schedule_weekly_digest` send the platform's own digest. Only use them when the person asks.

## Platform conventions

- **Errors** carry a `code` and a `next` step. Follow `next`, and use `get_error_catalogue` for the full list.
- **Unknown arguments** are refused, so never invent one.
- **Finding tools.** `find_tools` finds a tool by intent. `get_recipe` with name weekly_review gives this loop's plan with the client's arguments filled in.
- **Writes.** Writes that take dryRun get a preview first. REST callers send an Idempotency-Key header.

## Honesty rules

- **Null, "not reported" and "not measured"** are unknown, never zero.
- **Provisional data is labelled.** Say when the newest Search Console days are provisional, and when a comparison rests on few clicks or few answers.
- **Causes need evidence.** Name a cause only when the data shows it.
- **Never invent numbers.** Every figure quoted comes from a tool answer.

## What to hand back

1. **Setup gaps,** if any, at the top, with the call or person needed to fix each one.
2. **What moved.** Three to six bullets across search, rankings, traffic or revenue, the site, alerts and AI. Each bullet has its number and comparison period.
3. **Why.** The cause per mover, with the evidence, or "unexplained so far".
4. **This week.** Three to five actions in order, each with the page, the change, the evidence and the expected effect.
5. **The client note,** if asked, ready to paste.
6. **Recorded:** confirm that the research entry was saved.
