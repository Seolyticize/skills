---
name: keyword-research
description: Research and shortlist keywords for a Seolyticize client. Start from near-misses the site already ranks 4–20 for in Search Console, expand seeds within a quoted budget, judge difficulty for this site from the real results page, check intent, cluster, forecast, then save the shortlist and the page that owns each keyword. Use for "keyword research", "find keywords", "what should we target", "content ideas", "which keywords can we win".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Keyword research

Outcome: a short, prioritised list of keyword clusters. Each cluster has its intent, volume, difficulty for this site, forecast clicks and the page that should rank. The list is saved as a keyword list, and each keyword has a registered owner page. Cheap wins (queries the site nearly ranks for) come first. Paid expansion only happens inside a budget the user has agreed.

## Before you start

- Resolve the client: `list_clients` gives the `clientId` most tools take.
- Read `get_client_brief`. The business, audience, goal and competitors decide which keywords are worth anything. If the overview and audience are null, ask the user for them before spending money.
- Pick one market with `list_markets` (location code) and keep to it. `search_locations` finds a city or region code when the work is local.
- If something below does not fit the request, `find_tools` finds a tool by intent.

## Workflow

1. **Near-misses first (free).** These are queries Search Console already shows the site for at positions 4–20.
   - `striking_distance` groups them by page, with the extra monthly clicks a move to third (and first) would bring. It returns null when the client has no site configured. Say so and move on.
   - `get_search_opportunities` ranks the same pages by what their organic visitors are worth in GA4. Its analytics fields are null where GA4 has no row; that means unknown, not worthless. If `searchConsole` is false, there is no console data. Say so and skip to step 3.
   - `get_long_tail_candidates` finds queries with impressions but no page of their own. `get_questions` with `status: "unanswered"` lists questions people ask that no page answers.
   - Note which existing page each near-miss belongs to. Improving that page usually beats writing a new one.

2. **What the site and its rivals rank for (paid).** `get_ranked_keywords` on the client's domain, or a competitor's domain, subfolder or page. `get_top_pages` shows which of their pages earn the traffic. Both are paid: quote them first (see Money).

3. **Expand seeds within a quote.** Take seeds from the brief, the near-misses and the competitor pages.
   - For each `keyword_explorer` call, run `estimate_cost` with the exact arguments. Add the calls up and tell the user the total. Then call with `maxCostMicros` set to the quote.
   - Modes: ideas (broad), related, suggestions (longer phrasings) and questions.
   - Each expansion is bought once per seed, mode and market. Re-filtering, re-sorting and paging the same seed is free, so refine with `filters` (include, exclude, volumeMin, difficultyMax, intents, questionsOnly, serpFeatures) rather than buying a new seed.
   - `unknownExcluded` counts rows a filter could not judge. Report that count. Never treat those rows as zero.
   - `research_topic` maps a seed into subtopics, People Also Ask questions and the headlines ranking now (paid).
   - `get_keyword_metrics` gives volume, CPC and difficulty for a list you already hold (paid, up to 700 keywords). For AI search, `get_ai_prompt_research` and `get_ai_search_volume` are paid too.

4. **Judge difficulty for this site, from the real page.** Do this for every candidate you would recommend.
   - `get_personal_keyword_difficulty` (free, up to 50 keywords) adjusts difficulty for the client's authority, its topical coverage and any existing ranking. Each adjustment comes with its reason. A factor with no data is left out, and the tool says so: pass that on.
   - `serp_overview` shows who is on page one, how strong they are and which features appear. It is free from a recent capture and bought otherwise.
   - `explain_keyword_difficulty` (free) shows which results set the score. A keyword never captured comes back unscored, not easy.
   - `keyword_traffic_potential` gives what the top result earns across all its keywords, and its parent topic. Use it to choose the topic a page should be about, rather than chasing variants. It may buy data.
   - Read `references/difficulty-and-intent.md` when difficulty sources disagree, or when a keyword looks easy but the page is full of big brands.

5. **Check intent.** The results page is the judge, not the words of the keyword.
   - From `serp_overview` (and the `intent` field `keyword_explorer` returns), decide whether Google wants a guide, a list, a product, a tool, a local page or a comparison.
   - For queries already earning traffic, `get_query_intents` splits the client's Search Console clicks by intent.
   - If the page type Google rewards is not one the client can or will build, drop the keyword. Say why.

6. **Cluster.** `cluster_keywords` groups keywords whose top results overlap, so that one page targets each topic.
   - Pass up to 200 `keywords`, or a `listId`.
   - It buys one results page per keyword unless one was bought in the last day. Quote it with `estimate_cost` first.
   - Use `mode: "head"` to plan pages. Overlap of 7–10 shared results means one page; 4–6 means the same cluster; 2–3 means interlink; 0–1 means separate.
   - `architecture` lays the topics out as a pillar with spokes, and `scorecard` checks the live site against it.

7. **Forecast.** `forecast_keyword_traffic` (free) gives the clicks each cluster is worth at positions 1, 3, 5 and 10, with seasonality and time to rank.
   - Pass `{ term, searchVolume, difficulty }` objects when you already hold the figures.
   - A keyword never looked up comes back with unknown volume. Report it as "not reported".

8. **Save the shortlist.**
   - `create_keyword_list` names the list. Pass the keywords with the metrics you already bought, so the list starts with numbers and nobody pays for them twice. If the name is taken, it returns created false: pick another name, or use `list_keyword_lists` to find the existing list.
   - `add_keywords_to_list` adds more keywords.
   - `tag_list_keywords` tags keywords by cluster or target page.
   - `set_keyword_notes` records why each keyword is there (take ids from `get_keyword_list` or `query_keyword_list`).

9. **Register keyword owners.**
   - `propose_keyword_owners` (free) proposes an owner page per Search Console query cluster, with a confidence of clear, split or thin. Split means cannibalisation: say so.
   - Call `set_keyword_owners` with `dryRun: true` first and show the user `wouldSet`, including any earlier claim each one replaces. Save only after the user confirms. Use source search_console when accepting proposals.
   - Planned new pages can be registered once their URL is agreed.
   - `list_keyword_owners` reads the registry back. `build_content_brief`, `draft_article` and `get_cannibalization` all respect it.

10. **Track only what the user asks for.** `add_tracked_keywords` makes every added term a paid lookup on every future run. Quote the monthly cost with `estimate_cost` (monthlyMicros) and confirm before adding.

11. **Record.** Call `update_client_brief` with a `research` entry. Name the list and give the conclusions, so the next piece of work starts from them.

## Money

- These are paid on the agency's DataForSEO account: `keyword_explorer` (first read of a seed), `get_ranked_keywords`, `get_top_pages`, `research_topic`, `get_keyword_metrics`, `cluster_keywords`, `serp_overview` and `keyword_traffic_potential` (both on a cache miss), and `add_tracked_keywords` (every run).
- Quote every paid call with `estimate_cost`, or pass `dryRun: true` to get the quote back without buying. Then pass the quote as `maxCostMicros`. Cached data is free, so real charges are often lower than the quote.
- Check `get_client_costs` and the client's budget before a large expansion. If a call is refused for budget, follow the error's `next` step. Raise the cap with `set_budget` only if the user asks.
- These are free: `striking_distance`, `get_search_opportunities`, `get_long_tail_candidates`, `get_questions`, `get_personal_keyword_difficulty`, `explain_keyword_difficulty`, `forecast_keyword_traffic`, `get_query_intents`, the list tools and the owner tools.

## Rules

- Never invent arguments: unknown ones are refused with invalid_input. Errors carry a `code` and a `next` step; follow `next`. `get_error_catalogue` explains any code.
- Unknown volume or difficulty is "not reported", never 0. Say when a figure is an estimate, from a sample, or provisional (Search Console days still being counted).
- REST callers send an `Idempotency-Key` header on writes (list creation, owners, brief).
- Never create share links (`create_report_link`, `set_report_sharing`) unless the user asks: anyone holding one can read the report.

## What to hand back

A short answer, best opportunities first:

1. **Quick wins.** Near-miss pages and their queries, with current position, the extra clicks at third place, and what to change.
2. **New clusters.** For each cluster: the parent topic, intent, total volume, difficulty for this site (with its main reason), forecast clicks at the target position, and the target page (an existing URL, or a new one with a working title).
3. **Dropped.** What you rejected, and why (intent mismatch, out of reach, no demand).
4. **Housekeeping.** The keyword list's name and size, owners registered (or proposed and waiting for approval), what was spent against the quote, and any data that was missing.
