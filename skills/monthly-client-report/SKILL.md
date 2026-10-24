---
name: monthly-client-report
description: Write and deliver the monthly SEO report a client actually reads - what changed, why, what it earned and what happens next - from Seolyticize evidence (one get_report_data read for the period first), following the agency's report template, saved as a written report, and sent or scheduled. Covers report templates, saved data reports, schedules, sending, and share links (listing and revoking them too) only when asked. Use for "monthly report", "client update", "write up October's results", "send Acme their report" or "make this our report format".
license: MIT
metadata:
  author: Seolyticize
  version: "1.1"
---

# Monthly client report

Outcome: a report written for the client, not for an SEO. It leads with outcomes (enquiries, revenue, visibility), explains each movement and its cause, credits the work that caused it, is straight about what did not move, and ends with next month's plan tied to the client's goal. Every number comes from a tool. Load the seolyticize skill first for the conventions.

Everything in this workflow is free, unless you choose a paid read (backlink history, for example). Quote any paid read first.

## Two kinds of report

- **Written report** (`save_written_report`): Markdown you write from the evidence, saved to the client, readable and printable by the team, and shareable by link on request. This is the report the client reads.
- **Saved data report** (`create_report`): a fixed set of sections (rank-summary, share-of-voice, keyword-movers, backlink-summary, traffic, core-web-vitals, site-health, audit-summary) wired to the client's own data, emailed on a schedule under the agency's branding. Good as a monthly appendix; it does not explain anything.

Most agencies send both: the written report as the story, the data report as the numbers behind it.

## Workflow

1. **Context.** `get_client_brief`: audience, voice, the current goal, and the research log, which records the work done this month. `list_report_templates` with `clientId`: if a template fits, follow its sections, guidance, tone and sign-off exactly, and note its id. `list_written_reports`: last month's report. Read it for the plan you promised and the figures you reported. If one already exists for this month, update it instead of writing a duplicate.
2. **Fix the period.** The last full calendar month, against the month before. Add the same month last year where seasonality matters. Use the same dates in every call. Search Console's newest days may be provisional. If the month's last days are, say so or wait.
3. **Read the period in one call.** `get_report_data` with `clientId`, `from` and `to` (YYYY-MM-DD, inclusive) and `compareTo` (previous_period, the default, or previous_year for seasonality; call it twice for both). It is free and returns every section for exactly those days:
   - `searchConsole`: clicks, impressions, CTR and position in total, branded and non-branded, with the non-branded queries and pages that moved most;
   - `analytics`: GA4 organic sessions, key events and revenue, or the first-party web analytics' visits when GA4 is not connected (`source` says which);
   - `revenue`: imported orders per currency, by channel, with attribution coverage;
   - `rankings`: each tracker's summary and keyword movers between the period's ends;
   - `audit`: the latest crawl in the period, its health, and new and fixed issues against the last crawl before it;
   - `backlinks` (gained and lost), `aiVisibility` (mention rate against the comparison), `annotations` (the timeline with Google's updates) and `alerts` fired.
     Each section is `data`, or null with `unavailableReason`. A null section is "not measured" in the report, with that reason; never a zero. Read each section's `note` and the top-level `notes` for provisional days, partial comparisons and thresholding.
4. **Go deeper only where the story needs it.** Use the single tools below for a section that matters this month or that `get_report_data` cannot cover, with the same dates:
   - **Outcomes:** `get_seo_revenue` (by channel and landing_page; report the order match rate), `get_goal_report` or `get_conversions`, and `get_ga4_overview` with `get_ga4_landing_pages` for organic sessions, key events and revenue.
   - **Search:** `get_brand_split` (non-branded clicks are the number SEO work moves), `get_search_console_performance`, and `get_search_changes` for queries and pages won and lost.
   - **Rankings:** `list_rank_trackers`, then `get_rank_summary`, `get_position_distribution` (page-one count) and `get_share_of_voice`.
   - **Causes:** `get_search_timeline` and `list_annotations` (deploys, publishes, Google updates), `get_search_anomalies`, and `compare_crawls` or `get_seo_changes` for site changes.
   - **Site health:** `get_audit_summary` or `get_seo_scorecard` for the latest crawl; `compare_crawls` for what the month fixed.
   - **AI visibility** (if tracked): `get_ai_visibility_trend`, and `get_ai_referrals` for visits assistants sent.
   - **Links** (if part of the work): `get_backlink_health`; `get_backlink_history` is paid, so quote it first.
   - **Work done:** the brief's research log, `list_tasks` (done this month), and `list_written_reports` for last month's promises.
5. **Decide the story before writing.** Three to five points, in order of what the client cares about (their goal in the brief):
   - **What changed:** each with the figure, the previous figure and the change.
   - **Why:** the cause from the timeline, anomalies or crawl changes, with its confidence. If the tool says the cause is likely or heuristic, write "likely". Separate the agency's work from outside causes (seasonality, a Google update, a campaign).
   - **What it earned:** conversions or revenue from organic and AI, and the share of orders attributed. If revenue is not measured, say "not measured" and say what would measure it.
   - **What did not move or got worse:** said plainly, with the plan.
6. **Write it** in Markdown, in the template's sections or this default:
   1. Summary: three sentences on outcome, cause and next step.
   2. Results: a small table (metric, this month, last month, change, source).
   3. What we did and what it changed.
   4. What did not go to plan.
   5. Next month: three to five actions tied to the goal, each with what it should move.
      Rules:
   - Plain words for the client's audience (from the brief), in the brief's voice.
   - Every number from a tool, for the stated period. Missing figures are "not measured" or "not yet available", never zero and never estimated.
   - Mark provisional, thresholded, partial or heuristic figures as such.
   - No jargon without a one-line meaning (for example, non-branded search means people who did not search for the client by name).
7. **Show the draft to the person** before saving or sending. Correct what they change.
8. **Save it.** `save_written_report` with `clientId`, a `title` (for example "October 2026 SEO report"), the `markdown`, and `templateId` if a template was followed. Pass `reportId` to replace an existing report; its share link, if any, keeps working.
9. **Deliver it, only as the person asks:**
   - **Share link:** only on an explicit request, because anyone with the link can read it without an account. `set_report_sharing` with `shared: true` returns the link for a written report; `shared: false` breaks it at once. For a saved data report, `create_report_link` makes a signed, expiring branded page (default 14 days, at most 90) plus an HTML download, and a `linkId`. The address is shown only then and is never stored, so hand it over straight away. `list_report_links` (with `clientId`, or none for every client) shows the live links: report, period, who made each, when it expires and when it was last opened. Use it for "has the client opened the report". `revoke_report_link` with `linkId` stops one link and leaves the others; `revoke_report_links` stops every link made for a report. To resend a lost link, make a new one and revoke the old.
   - **Email the data report:** `list_reports` and `list_report_schedules`. A report is sent only to its schedules' recipients. If there is none, `create_report` (if needed), then `schedule_report` with `recipients` and `cadence` monthly, then `send_report` for this month. Pass an `idempotencyKey` (for example report-<reportId>-2026-10) so a retry cannot email the client twice. `list_reports` shows whether it went out and why a delivery failed.
   - **Portal:** an existing portal link shows the client their live dashboard. Make one (`create_portal_link`) only when asked.
   - Check `get_branding` if the person asks how it will look to the client.
10. **Make it the format, only if asked.** If the person wants this structure every month, `save_report_template` with the sections and guidance, tone and sign-off (with `clientId` for this client only, or without it agency-wide).
11. **Record it.** `update_client_brief` with a research entry: the report's title and id, the headline, and next month's promised actions, so next month's report starts from them. `add_annotation` for any cause you established that is not yet on the timeline.

## Decision points

- **A source is not connected:** `get_report_data` returns that section as null with the reason. Leave it out or mark it "not measured", and add connecting it to next month's actions. Do not substitute a paid estimate for the client's own data without saying so.
- **Rankings up, traffic down (or the reverse):** check `get_brand_split`, seasonality (the same month last year) and `get_search_anomalies` before explaining it. Say which.
- **A bad month:** lead with it, the cause and the plan. Do not bury it under vanity metrics.
- **The template asks for a figure you cannot measure:** keep the heading, write "not measured", say why.

## What to hand back

- The report's title and id, and whether it was saved, sent (to whom, by which schedule) or shared (only if asked).
- The three-sentence summary and the results table, so the person can check them without opening the report.
- Anything unmeasured or provisional, and the actions promised for next month.
