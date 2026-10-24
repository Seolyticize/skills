---
name: competitor-analysis
description: Work out who a Seolyticize client really competes with in search and where each rival wins. Covers search competitors and share of voice, keyword, content and link gaps, what competitors just published or changed, and which brands AI assistants name and cite instead of the client. Use for "competitor analysis", "who are we up against", "why is X beating us", "competitor gap", "what are competitors publishing", "share of voice", "who does ChatGPT recommend".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Competitor analysis

Outcome: one short profile per serious search competitor, covering where they beat the client, why (content, links, page type, brand, AI presence) and the two or three moves that would close the gap. The stored-data reads are free. Paid reads on any domain are quoted first.

## Before you start

- Get the `clientId` from `list_clients`. Read `get_client_brief`. Its competitors are business rivals, and they are often not the sites that compete in search.
- `list_rank_trackers` and `list_tracked_keywords` show which competitors the trackers already measure. Free comparisons only cover those.
- `get_recipe` with name competitor_teardown gives a filled-in call plan for one rival.

## Workflow

1. **Find the search competitors.**
   - `find_serp_competitors` takes the tracked or shortlisted keywords (up to 200) and returns visibility, keyword count and average position per domain. It is one paid purchase: quote with `estimate_cost`. Put the client's own domain in `exclude`.
   - `get_serp_newcomers` (free) lists domains that just entered the top 20.
   - Agree the final set with the user (3–5 sites). Add them to the tracker with `add_competitors` so share of voice and the free gap tools measure them.

2. **Size them up.**
   - `get_share_of_voice` (free) gives the client's share of available clicks against the tracked competitors.
   - `batch_domain_metrics` (free, stored) gives authority, keywords, traffic and referring domains.
   - `get_domain_facts` gives age, popularity and whether the domain was bought and repurposed. It may buy registry data on a cache miss.
   - `get_domain_overview` (paid) gives traffic history and position split. `get_batch_analysis` (paid) compares up to 200 domains in four bulk reads.
   - Traffic figures are modelled from rankings, not measured visits. Say so.

3. **Keyword gap.**
   - `get_keyword_gap` (free) uses the client's own tracked captures.
   - `get_domain_keyword_gap` (paid, one read per competitor) covers every keyword the rivals rank for. Its modes: missing (they rank and the client does not), shared, and weak (the client ranks below them).
   - `get_ranked_keywords` with `change: "new"` on a rival shows what they just started ranking for (paid).
   - Group results by topic and intent. Ignore the rival's branded terms.

4. **Content gap.**
   - `get_content_gap` (free) lists competitor pages owning keyword clusters the client does not cover.
   - `get_top_pages` (paid) shows which of their pages earn the traffic. `get_best_pages_by_links` shows which pages attract links: free from our index with `source: "index"`, paid otherwise.
   - For a page that outranks the client, `get_sxo_gap` on the client's page says whether the rival wins on page type rather than quality.

5. **Link gap.**
   - `get_link_intersect` (free) lists sites linking to competitors but not the client.
   - `get_link_gap` is free with `source: "index"`, and `auto` uses the index when it holds every domain involved. Otherwise it asks DataForSEO (paid). Use `match: "all"` for sites linking to every rival, which are the strongest prospects.
   - `get_link_velocity` (free) shows whether a rival is running a link campaign (spikes in new referring domains).
   - Hand the prospects over to the link-building skill. Do not build an outreach list here.

6. **What they just did.**
   - `get_competitor_new_pages` (free) lists new and updated pages from rivals' sitemaps, grouped by section. For example: "published 14 pages under /guides this week".
   - `get_competitor_page_changes` (free) shows what the pages above the client changed: title, H1, length, sections.
   - `get_keyword_advertisers` (paid) shows who bids on a money keyword and what their ads say.

7. **AI assistants.**
   - `get_ai_visibility` (free) compares how often assistants name the client and its competitors, and what kinds of pages the answers draw on.
   - `get_ai_visibility_results` (free) goes question by question: was the client named, and which brands were named instead, in what order.
   - `get_ai_cited_sources` (free) classes the cited pages as own, competitor (named), user-generated or third party, with each competitor's share.
   - `get_ai_answer_share` gives weekly share by topic. `get_share_of_search` gives one share per engine (Google, Bing, YouTube, AI Overviews, AI Mode, assistants). Both are free.
   - With no tracked questions, `get_ai_brand_mentions` (paid, about $0.10 a call, sampled) gives share of voice in AI answers for the client and up to 9 rivals.
   - `get_ai_citation_gap` says what a cited rival page covers that the client's page does not. It is free from a tracked question (`promptId`) or `citedUrls`, and paid for a live `question`.
   - If AI visibility has never been set up (`get_ai_visibility_setup` shows no questions), say so. Do not report the client as absent.

8. **Record.** Call `update_client_brief` with a `research` entry holding the conclusions. Add or replace competitor entries (kind competitor) only after the user agrees. If the user wants a client report, save it with `save_written_report`. Never create share links (`create_report_link`, `set_report_sharing`) unless asked.

## Money

- These are paid: `find_serp_competitors`, `get_domain_overview`, `get_batch_analysis`, `get_domain_keyword_gap`, `get_ranked_keywords`, `get_top_pages`, `get_keyword_advertisers` and `get_ai_brand_mentions`. So are `get_link_gap` and `get_best_pages_by_links` when they reach the vendor, and `get_ai_citation_gap` with a live question.
- Before each, run `estimate_cost` with the exact arguments (or pass `dryRun: true`). Tell the user the total for the whole analysis, then call each tool with its quote as `maxCostMicros`.
- Prefer the free reading first (`get_keyword_gap` before `get_domain_keyword_gap`, the index before the vendor). Check `get_budget_status` (free) before a five-rival teardown.

## Rules

- Never invent arguments: unknown ones are refused with invalid_input. Follow an error's `next` step. `get_error_catalogue` lists every code.
- Unknown is not zero. A competitor with no data in our index is unmeasured, not weak.
- AI figures from DataForSEO's database are sampled. Say so, and do not compare them directly with tracked-question figures.
- REST callers send `Idempotency-Key` on writes.

## What to hand back

1. **Who competes in search,** as a table with share of voice, visibility, authority and traffic (estimated), noting where the search rivals differ from the brief's business rivals.
2. **Per competitor:**
   - where they win: topics, pages and features;
   - why: content depth, page type, links, brand or AI presence;
   - what they just did;
   - the two or three moves for the client.
3. **AI assistants:** who gets named or cited instead of the client, on which questions, and from which sources.
4. **What was spent** against the quote, and what could not be measured.
