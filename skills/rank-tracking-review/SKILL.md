---
name: rank-tracking-review
description: Review how a Seolyticize client's tracked keywords moved and why. Covers positions and their spread, ranking-URL swaps, SERP features and AI Overviews, Google AI Mode citations, the desktop and mobile split, volatility, Google updates and timeline annotations, with what to do about each pattern. Use for "how are rankings", "what dropped", "rank report", "why did we lose positions", "is it us or Google", "do we show in AI Mode".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Rank tracking review

Outcome: a short account of what moved, the likely cause of each significant move with its evidence, and one action per pattern. It reads stored captures, so it is free. The only paid steps are a fresh capture and AI Mode reads, and both are quoted first.

## Before you start

- Get the `clientId` from `list_clients`. Read `get_client_brief` for the goal, key pages and earlier research notes.
- `list_rank_trackers` gives the tracker ids, with engine, device, cadence and locale. A tracker that reads both devices has two separate series. Review each device on its own; never average them.
- `list_tracked_keywords` shows the terms and competitors. Pinned keywords are the ones the team agreed matter, so they lead the review.

## Workflow

1. **Headline.** `get_rank_summary` counts keywords improved, declined and held, with the average position.

2. **Shape.** `get_position_distribution` over 30 or 90 days, with the device set. Is the 1–3 and 4–10 share growing?
   - Keywords read and not found count as not ranking. Keywords not read that day count as not captured.
   - The average covers ranking keywords only, so a keyword falling out can raise it. Say so when it happens.

3. **Is it us or Google?**
   - `get_serp_volatility` compares the client's daily movement index with an industry-wide one and lists Google updates in the window.
   - `list_annotations` (with Google updates on by default) and `get_search_timeline` put deploys, publishes and campaigns beside traffic.
   - If the whole industry moved on an update day, frame the drop as an update, not as the agency's work. Recommend waiting a week or two before acting unless the drop is concentrated.

4. **Movers.** `get_rank_history` for the biggest movers (`keywordIds`, `days`, `device`). It gives each day's position, the ranking page and the features on the results page.
   - A null position means the page was read and the client was not on it. A missing day means nobody read it. Neither is zero, and neither is position 100.

5. **URL swaps.** `get_url_swaps` lists keywords whose ranking page changed, including pages taking turns and keywords where several pages rank at once.
   - A swap is usually cannibalisation or a canonical or internal-link problem, not a content problem.
   - Confirm with `get_cannibalization` (one snapshot, with the registered owner and shouldOwn) and `get_landing_pages` (which pages carry the rankings).
   - For queries outside the tracker, `get_query_page_swaps` reads Search Console.

6. **SERP features.**
   - `get_serp_features` shows which features appear on each keyword and which the client holds. Its `imagePresence` section lists keywords where the client ranks but has no image in the pack. Features are null when the capture's source did not report them; that is not the same as none.
   - `get_serp_intent_shifts` lists keywords whose results page changed character, such as an AI Overview or shopping arriving.
   - `get_ai_overview_citations` shows whether the client is cited in AI Overviews and who is, from stored captures.
   - A steady position with falling clicks usually means a feature arrived above the result.

7. **AI Mode.** `get_tracker_ai_mode` puts beside each latest position whether Google AI Mode cites the client, and which domains it does cite. It is one paid read per keyword, up to `limit`. Quote it with `estimate_cost`, tell the user the total, then call it with the quote as `maxCostMicros`. Use it for the pinned or money keywords, not the whole tracker.

8. **Who moved in.** `get_serp_newcomers` lists domains new to the top 20 this week. `get_competitor_page_changes` shows what the pages above the client changed (title, H1, length, sections).

9. **Fresh data, only if needed.** If the latest capture is old and the user needs today's positions:
   - `refresh_rankings` is paid, every keyword on every device. Quote it with `estimate_cost`, tell the user, and pass `maxCostMicros`.
   - It runs in the background: poll `get_run_status` with job rank, then re-read.
   - A refusal or a partial capture comes with a reason and a `next` step; follow it.

10. **Annotate.** Ask before writing. If the review uncovered a cause the timeline lacks, such as a deploy or a content change, `add_annotation` records it for the next review. `pin_tracked_keywords` and `tag_keywords` keep the agreed keywords at the top and grouped.

11. **Record.** Call `update_client_brief` with a `research` entry holding the findings. If the user wants it for the client, save it with `save_written_report`. Never create share links (`create_report_link`, `set_report_sharing`) unless asked.

Read `references/movement-patterns.md` for the full pattern → cause → action table, including device splits and local trackers.

## Rules

- Never invent arguments: unknown ones are refused with invalid_input. Follow an error's `next` step. `get_error_catalogue` lists every code.
- Report "not captured" and "not in the results" exactly. Never fill them with a number.
- Say when a cause is likely rather than proven. Volatility and swaps are evidence, not proof.
- Paid steps (`refresh_rankings`, `get_tracker_ai_mode`, `get_serp_history`, `get_ai_mode_answer`, `get_live_serps`) are quoted with `estimate_cost`, or run with `dryRun: true`, first. Check `get_client_costs` if spend looks high.
- REST callers send `Idempotency-Key` on writes.

## What to hand back

1. **Headline:** improved, declined and held counts, the page-one count and its trend, per device.
2. **Context:** whether Google moved (volatility against the industry, any update) and what the client shipped.
3. **Movers,** pinned keywords first, as a table:

| Keyword | Device | Was → now | Ranking page (changed?) | Cause | Evidence | Action |
| ------- | ------ | --------- | ----------------------- | ----- | -------- | ------ |

4. **Features and AI:** features won or lost, AI Overview and AI Mode citation gaps, and who is cited instead.
5. **Next steps:** two or three, with what was spent (if anything) against the quote.
