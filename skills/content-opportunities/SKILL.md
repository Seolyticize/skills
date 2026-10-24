---
name: content-opportunities
description: Decide which content work to do first for a Seolyticize client. Covers pages close to the top three, decaying and stale pages, pages cannibalising each other, competitor topic gaps, topical authority and templated meta descriptions. Ends in a prioritised plan of updates, merges and new pages. Use for "content plan", "what should we write or update", "quick wins", "content audit", "why is this page losing traffic", "what to refresh this month".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Content opportunities

Outcome: a ranked list of content jobs (update, consolidate, refresh, rewrite the snippet, create). Each job names the page, the target query, the evidence and the expected gain. Free stored data is read first. Paid reads are only for validating new topics.

## Before you start

- Get the `clientId` from `list_clients`. Read `get_client_brief` for the goal, voice, key pages and competitors.
- Most of what follows reads Search Console and the latest crawl. If a tool reports no console data or no crawl, say which part could not be judged. Do not present it as "nothing found".

## Workflow

1. **Overview in one call (free).** `get_opportunities` returns four sections: strikingDistance, lowCtr, contentDecay and cannibalization. Each section carries data or an error. An unread section is not an empty one, so report it as unread.

2. **Pages near the top three: update before you write.**
   - `get_search_opportunities` ranks pages at positions 4–20 by projected revenue, then key events, then extra clicks, from GA4. Analytics fields are null where GA4 has no row; that means unknown, not worthless.
   - Without GA4, `striking_distance` ranks the same pages by extra clicks at third place.
   - For the top few pages, the content-brief-and-write skill shows how to brief the improvement (`build_content_brief` with `targetUrl` gives keep, strengthen or add per section).

3. **Decaying and stale pages: stop the bleeding.**
   - `get_content_decay` lists pages losing the clicks they used to earn.
   - `get_freshness_queue` ranks pages by clicks at risk from going stale. Its signals: the results page moved to newer content, a past year in the title, outdated years in the text, or a price that contradicts the client's registered facts. Each page comes with its reasons.
   - Before blaming the content of a decaying page, check two things. First, `get_query_page_swaps`: did Google start sending the query to another of the client's pages? That is a cannibalisation or internal-link problem. Second, `get_serp_features` on the tracker (`list_rank_trackers` gives the id): did an AI Overview or another feature arrive above the result? Then the position may be steady while clicks fall.
   - `get_content_audit` gives every crawled page a verdict: keep, update, merge, review (no demand in six months; never delete on this alone) or no search data (unknown, not dead).
   - Read `references/diagnosing-decline.md` when the cause is unclear.

4. **Snippets that lose clicks.**
   - `get_low_ctr_queries` lists page-one queries clicking at under half the expected rate.
   - `get_ctr_outliers` does the same against the site's own curve, by position, device and results-page shape. Its "over" rows show titles worth copying.
   - Check `get_serp_features` first. A map pack or AI Overview above the result also lowers clicks, and no rewrite fixes that.
   - `simulate_serp_snippet` (free) previews a new title and description in pixels.

5. **Cannibalisation.**
   - `get_cannibalization` lists queries where several of the client's pages compete. It names the registered owner and the page that should win (shouldOwn).
   - Recommend one of: keep one page and point internal links at it, merge and redirect, or re-target the weaker page to a different query.
   - Once the user agrees, register the winner with `set_keyword_owners`. Call it with `dryRun: true` first, show `wouldSet`, then save.

6. **Competitor topic gaps.**
   - `get_content_gap` (free, from tracked captures) lists competitor pages that own clusters the client does not cover. Prefer it over `get_keyword_gap` when planning content.
   - For domains the trackers do not watch, `get_domain_keyword_gap` reads DataForSEO's index. It is paid, one read per competitor: quote with `estimate_cost` first.
   - Validate demand for the best gaps before recommending a new page. The keyword-research skill covers expansion within a quoted budget.

7. **Topical authority.**
   - `get_topical_authority` (free) scores each topic 0–100 from coverage × rankings × internal links. It gives the next three pages that would raise the score most: write, improve or link.
   - `get_topic_map` with method search_console (free) maps topics to pages: no page, one page, or several pages (split impressions). The default serp-overlap method buys one results page per keyword, so quote it first.

8. **Templated metadata.**
   - `check_templated_metadata` (free, heuristic) finds descriptions that restate their title and close on a stock call to action, echo the title, or paste the brand suffix. Site risk is high when 3 or more pages, and at least 30% of those checked, are templated.
   - It makes no claim that Google penalises the pattern. Say the same.
   - The rewrite itself is paid: `suggest_meta_tags` writes pixel-checked titles and descriptions (one paid Claude call per 25 pages). Quote it first.

9. **Weight by what converts.** `get_ga4_landing_pages` and `get_ga4_key_events` with `by: "landingPage"` show which pages convert. A smaller gain on a page that converts beats a bigger gain on one that does not.

10. **Schedule (optional).**
    - `plan_content` turns the gaps and refreshes into a month-by-month calendar. It respects keyword owners: a keyword another page owns becomes a refresh of that page. It is paid only with `trends: true`.
    - Read it back with `list_content_plan` and change items with `update_content_plan_item`.

11. **Record.** Call `update_client_brief` with a `research` entry holding the prioritised plan. If the user wants it for the client, save it with `save_written_report`.

## Rules

- Paid calls (`get_domain_keyword_gap`, `get_topic_map` by serp overlap, `suggest_meta_tags`, `plan_content` with trends): quote with `estimate_cost`, tell the user the total, then call with the quote as `maxCostMicros` so it cannot cost more than agreed. Re-reading what was already bought is free; prefer it to buying again.
- Never create share links (`create_report_link`, `set_report_sharing`) unless the user asks: anyone holding one can read the report.
- Never invent arguments: unknown ones are refused with invalid_input. Follow an error's `next` step. `get_error_catalogue` lists every code.
- Estimates are estimates. Extra clicks come from a click curve, and the tools say which curve (measured or published). Quote the source.
- Unknown is not zero. A page with no search data has unknown demand.
- REST callers send `Idempotency-Key` on writes.
- If a job is not covered here, `find_tools` or `get_recipe` will find a fitting tool or call plan.

## What to hand back

A prioritised table of 5–15 jobs, cheapest high-value work first:

| #   | Job | Page | Target query | Evidence | Expected gain | Effort |
| --- | --- | ---- | ------------ | -------- | ------------- | ------ |

Job is one of: update, refresh, snippet rewrite, consolidate, create or fix metadata. Under the table, add:

- which sources could not be read (no GA4, no crawl, a section that errored);
- which numbers are estimates;
- one line on what to do this week.
