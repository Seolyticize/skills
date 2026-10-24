---
name: ai-visibility-audit
description: Audit a client's visibility in AI assistants with Seolyticize. Covers whether ChatGPT, Claude, Perplexity, Gemini, Copilot and Google AI Overviews or AI Mode recommend the client, which rivals and sources they name instead, GEO readiness per engine, agent readiness (llms.txt, AI crawler access) and the brand entity, then what to change. Keeps measured citations apart from readiness heuristics. Use for "AI visibility", "are we in ChatGPT", "GEO audit", "LLM SEO", "why don't assistants recommend us".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# AI visibility audit

The audit answers three questions, kept strictly apart:

1. **Measured:** what assistants actually said and cited. These are stored answers to tracked questions, live answers, logs and referrals.
2. **Readiness:** whether the site is built to be read and cited. These are heuristic scores. They predict, they do not measure.
3. **What to change:** the content, sources, technical fixes and entity work that would move the measured numbers.

**Never present a readiness score as a citation rate, or the reverse.** Label every number with its kind.

**Costs:**

- **Paid:** running questions, live asks, brand-mention lookups and the accuracy check. Claude answers are metered by Seolyticize. Other assistants bill the agency's own accounts at their own prices, so they are counted, not priced.
- **How to quote:**
  1. Quote with `estimate_ai_visibility_cost` (for runs) or `estimate_cost` (for anything else).
  2. Tell the person the total.
  3. Pass the estimate as maxCostMicros. A run whose estimate is over the limit is refused before it starts.
- **Free:** reading stored results. Prefer it to asking again.

## Before you start

1. **Client and brief.** Call `list_clients`, then `get_client_brief` for positioning, competitors and earlier AI notes.
2. **Setup.** Call `get_ai_visibility_setup`. It shows the questions (branded or neutral, by topic), the brands (exactly one should be marked as the client's), the schedule and which assistants this agency can ask.
   - **Nothing tracked yet?** Use `suggest_ai_visibility_setup`, which is paid and drafts brands, competitors and real questions from the client's data. With apply false it saves nothing. Or use `suggest_ai_prompts`, a metered Claude call.
   - **Saving.** Show the drafts, then save the chosen ones with `save_ai_visibility_setup`, first with dryRun true, then for real. Questions must not name a brand. Neutral questions are the honest measure.
   - **No brand marked as the client's?** Then mentionRate is null. Fix that before reading any rates.
3. **Help.** Errors carry a `code` and a `next` step, so follow `next`. `find_tools` finds a tool by intent. `get_recipe` with name ai_visibility_baseline gives the baseline plan. Unknown arguments are refused.

## Workflow

### 1. Measured: do assistants recommend the client?

1. **Latest run.** `get_ai_visibility_runs` lists the checks so far. Lead with neutralMentionRate, the rate on questions that name no brand, because branded questions flatter. If the last run is stale or there is none, run a check:
   1. Call `estimate_ai_visibility_cost`.
   2. Get the person's go-ahead.
   3. Call `run_ai_visibility_check` with maxCostMicros.
   4. Poll `get_ai_visibility_runs`. Results arrive within minutes.
2. **Answer by answer.** `get_ai_visibility_results` has one row per question and assistant: whether the client was named, how early in the answer, whether its site was cited, its sentiment, and which other brands were named, in order.
   - Filter by topic, or set segment to neutral.
   - summary gives the rates overall, neutral against branded, and per topic.
3. **Read the actual words.** Pick a few answers where the client is missing or described badly. `get_ai_visibility_answer` returns the full text and the cited pages. Answers are kept 13 months, and found false means the answer was never captured, which is not a finding.
4. **Direction and topics.**
   - `get_ai_visibility_trend` compares the last N days with the N before, per assistant, with how many answers each side rests on. A move on a handful of answers is noise. Say so.
   - `get_ai_answer_share` gives share of answers and share of voice per topic, week by week.
5. **How assistants describe the brand.** `get_ai_visibility_sentiment` shows net sentiment per brand and the latest negative and positive descriptions. Answers that were never judged are unknown, not neutral.
   - `check_ai_brand_accuracy` (paid) checks each claim assistants make against the client's facts: supported, contradicted or unverified.
   - Facts come from `set_client_facts` (use dryRun first), and failing those from the brief.
6. **Google's AI surfaces.**
   - `get_ai_overview_citations` (free, from captured results pages) shows whether the client is cited in AI Overviews for tracked keywords, and who is.
   - `get_tracker_ai_mode` (one paid read per keyword) puts AI Mode citations beside each ranking. "Ranked but not cited" is the gap.
7. **One question, live.** `explore_ai_prompt` asks a question now on the chosen engines (claude, chatgpt, gemini, perplexity, google-aio, copilot, google-ai-mode and others the agency has keys for). Nothing is stored, so treat it as anecdote, not a rate.
8. **Untracked brands, any market.** `get_ai_brand_mentions` (paid, sampled from DataForSEO's AI answer database) gives share of voice in AI Overviews or ChatGPT for the client and up to nine rivals, with no tracking needed. Say it is sampled.
9. **Traffic and reads, also measured.**
   - `get_ai_referrals`: visits and conversions from assistants.
   - `get_ai_agent_visits`: assistants reading pages for a user.
   - `get_ai_crawler_activity`: training, search and user fetches from connected logs.
   - Where nothing is connected, say "not measured".

### 2. Which rivals and which sources

1. **Who owns the cited pages.** `get_ai_cited_sources` classes them as own, competitor (named), ugc (Reddit, YouTube, forums) or third_party, with each class's share and the domains in order. A high share for third_party or ugc means the citations are won off-site, so the route is PR, listings and community, not page edits.
2. **Rivals.** In `get_ai_visibility_results`, count the brands named instead of the client, and on which questions.
3. **Off-site targets on a topic.** `get_ai_top_cited_domains` (paid, sampled) lists the domains AI answers cite most for a topic. These are the outreach targets.
4. **Why a rival's page is cited instead of ours.** Call `get_ai_citation_gap` with ourUrl and a tracked promptId. It is free with a promptId or citedUrls, and paid for a live question. It returns what the cited pages cover that ours does not, with a coverage score and fixes.

### 3. Readiness: could assistants cite the client?

These are heuristics. Report them under their own heading.

- **GEO readiness per page and per engine.** `get_geo_readiness` scores the top pages, or the urls given, 0–100:

  | Part       | Weight |
  | ---------- | ------ |
  | Citability | 25     |
  | Structure  | 20     |
  | Multimodal | 15     |
  | Authority  | 20     |
  | Technical  | 20     |
  - It also gives a readiness score per engine (Google AI Overviews, AI Mode, ChatGPT, Perplexity, Claude, Bing Copilot), set to 0 where that engine's crawler is blocked.
  - **These are readiness scores, not measured citations.** The tool says so, and you must too.
  - brandMentions true adds five paid results pages. Quote it first.

- **Answer readiness per page.** `check_answer_readiness` checks for a direct answer up front, definitions, sourced claims, an author, dates and schema, and gives fixes.
- **Agent readiness.** `get_agent_readiness` runs the P0–P3 checks:
  - P0: real 404s, robots.txt answers, content without JavaScript, CLS.
  - P1: Content-Signal lines, llms.txt, Markdown delivery.
  - P2: the API catalog, WebMCP and the accessibility tree.
  - P3: ai-catalog.json, agent-card.json and UCP.

  Fix every measured P0 failure first, because nothing below it is recommended while one fails. Unmeasured checks are unknown, not passes.

- **AI crawler access.** `get_ai_crawler_access` gives a per-crawler verdict (open, partial or blocked) for the top pages: robots.txt, CDN refusals and pages that need JavaScript. Training crawlers (GPTBot, CCBot) and search or user crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User) serve different purposes. Blocking training is a business choice. Blocking search crawlers removes the client from answers.
  - `test_robots` names the robots.txt line that decides for any bot and URL.
- **Brand entity.** `check_brand_entity` (free) checks whether Google's Knowledge Graph holds an entity for the brand. The result is matched, ambiguous or absent, with what to do about each: Organization schema with sameAs, a Wikidata item, one consistent name.
- **Trust.** `get_trust_signals` checks the about, contact, policies, authors and Organization markup. `score_eeat` adds a deeper per-page E-E-A-T heuristic.

### 4. What to change

Rank the recommendations. Each one should say which measured gap it addresses, or which readiness failure it fixes.

1. **Blockers first.** Search and user crawlers blocked, P0 agent-readiness failures, content only after JavaScript (see the technical-audit skill), nosnippet or max-snippet:0 on pages that should be cited.
2. **Missing from neutral questions the client should win.** For each such question, find the page that should answer it and run `get_ai_citation_gap`. Add the answer in the first 40–60 words of a section, self-contained passages, sourced figures and an author with dates. If no page exists, recommend one (the content-brief tools build it).
3. **Off-site sources.** Recommend the third-party and UGC domains assistants cite for the client's topics. Earn a mention or listing there.
4. **Accuracy.** Fix contradicted claims at their source: the client's own pages, its facts (`set_client_facts`) and its listings.
5. **Entity.** Organization schema with sameAs (`generate_schema` on the homepage), a Wikidata item, and one consistent brand name.
6. **Agent files.** These are low weight, so say so. `generate_llms_txt` drafts llms.txt. `draft_agent_files` drafts Content-Signal lines, ai-catalog.json and WebMCP stubs. Nothing is published by either tool. llms.txt carries weight 0 in GEO readiness, and no engine has confirmed using it.
7. **Keep measuring.** Use `set_ai_visibility_schedule` (weekly by default). Show `estimate_ai_visibility_cost` first, because every scheduled run asks every question on every chosen assistant.

## Honesty rules

- **Label every number** as measured (with how many answers it rests on) or heuristic.
- **Unmeasured and null are unknown,** not zero. An answer never captured is not an absence. An unjudged answer is not neutral.
- **Sampled lookups and live asks are not tracking.** `get_ai_brand_mentions`, `get_ai_top_cited_domains` and `explore_ai_prompt` give indications, not trends.
- **Never claim a cause.** Do not say a fix "will" get the client cited. Say which gap it closes, and re-measure after.

## What to hand back

1. **Measured.** The neutral mention rate and citation rate per assistant (with answer counts and run date), the trend, the top rivals named instead, and who owns the cited sources.
2. **Readiness.** The GEO readiness per engine, the agent-readiness P0 and P1 failures, AI crawler verdicts, and the entity status, all labelled as heuristics.
3. **What to change.** Five to eight ranked actions, each tied to a measured gap or a readiness failure, with the page or source it concerns.
4. **Spend.** What this audit cost, and the monthly cost of the proposed schedule.
5. **Recorded.** Call `update_client_brief` with a research entry, the baseline the next audit compares against. Never create share links (`create_report_link`, `set_report_sharing`) unless asked.
