---
name: content-brief-and-write
description: Brief, draft, score and fix a page for a Seolyticize client. Profile what ranks, build a content brief for the right page type, draft or rewrite sections, then score the draft for coverage, draft quality, keyword placement, E-E-A-T and page-type fit against the results page. Also covers comparison pages and checks on programmatic template pages. Use for "write a brief", "draft an article", "is this ready to publish", "score this content", "why doesn't this page rank", "write a vs page", "are our location pages thin".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Content brief and write

Outcome: either a writer-ready brief, or a draft that scores at par with the pages that rank, with a short list of what still needs a human (first-hand experience, sources, figures). Every paid step is quoted first and spent within the quote.

## Before you start

- Get the `clientId` from `list_clients`. Read `get_client_brief`: the voice, audience, positioning and key pages shape every draft. If voice and audience are null, ask the user before drafting.
- Check ownership. `list_keyword_owners` shows whether another page already owns the keyword. The brief and draft tools warn in `ownership` ("this already belongs to /x"). If they do, brief a rewrite of the owner (`targetUrl`), not a second page.
- `get_recipe` with name new_article gives the same flow as a filled-in call plan.

## Workflow

1. **What ranks.** `get_serp_content_profile` reads the top results and reports what they share: word-count range, outline themes, terms, questions, media, schema and freshness. Videos, forums, social posts and app listings are listed in `excluded` with their reason, and `targetPages` counts the rest. If `targetPages` is small, say the profile rests on few pages.

2. **Is this the right kind of page?** For an existing page, run `get_sxo_gap` with the `url` before anything else.
   - It classifies the page and the top 10 into page types, says how strongly Google agrees (over 60% strong, 40–60% mixed, under 40% fragmented) and how bad the mismatch is. A blog post where products or tools rank is a critical mismatch.
   - `wireframe` (on by default) gives the target outline and layout.
   - `deep: true` renders the page on a phone and adds its E-E-A-T score. It is free but slower; use it when UX or trust is in doubt.
   - `personas: true` adds 4–7 searcher personas and user stories from one metered Claude call (paid).
   - A critical mismatch means changing the page type, not adding words. Say so before briefing.

3. **Brief.** `build_content_brief` with the `keyword`, `relatedKeywords` for a cluster, and `pageType`.
   - `pageType` is one of: service, blog, case study (written case_study), category, landing, faq, location, about or homepage. It defaults to a guess from intent; set it when you know.
   - Pass `targetUrl` when improving an existing page. Each section is then marked keep, strengthen or add.
   - The brief gives intent and format, target length, outline, must-cover terms, questions, schema (never FAQPage), internal links, competitors scored out of 40 with what each misses, typed gaps with priority, an information-gain statement, the E-E-A-T the page needs, title and description targets, and the featured-snippet section.
   - If `thinCompetition` is set, fewer than 3 real competitors were found. Say so.
   - `save: true` keeps the brief as a research note on the client brief.

4. **Draft or rewrite.**
   - `draft_article` writes a full Markdown draft from the brief, in the client's voice, with a meta title and description. It reports which must-cover terms it used and missed (checked by the tool, not claimed by the writer). Add the angle, product facts and anything to avoid in `instructions`.
   - `rewrite_section` rewrites or extends (mode rewrite or extend) one section to cover missing terms and questions. Pass `missingTerms` and `questions` yourself, from the last score, to avoid paying for another scoring run.
   - `get_entity_coverage` lists the entities the ranking pages name that the draft does not, with about and mentions JSON-LD.
   - `get_snippet_targets` drafts answer-box text for queries where the client ranks 2–10.

5. **Score, then iterate.** `score_content` with a `url`, `html` or `markdown` gives a 0–100 score against the ranking pages, plus:
   - missing terms, sections and questions, and a fix list, most important first;
   - factConflicts, uncitedClaims (a heuristic) and invisibleChars;
   - `draftQuality`: filler, stock AI phrasing, information density, repetition and length. It only detects; it never rewrites;
   - `placement`: the keyword in the first 100 words, the slug and the front of the title; heading stuffing; sentence length; internal links per 1,000 words; a table of contents on long pages.
     Fix, then score again until the draft is at par with the results page. A results page bought for the brief is reused free for a day, so score within the day. Read `references/scoring-rubrics.md` for thresholds and how to read each part.

6. **Trust and AI readiness (published pages).**
   - `score_eeat` grades Experience, Expertise, Authoritativeness and Trust with evidence and a fix per sub-criterion. It flags YMYL pages with no credentials and generic AI-style pages. It is free; `judge: true` regrades Experience with a metered Claude call (paid).
   - `get_geo_readiness` scores how citable the pages are in AI answers. It is free; `brandMentions: true` is paid.
   - `audit_page` (free) checks on-page basics: title and description length, H1, Open Graph tags, images, word-count floor for the page type, internal links.

7. **Titles.** `simulate_serp_snippet` (free) previews a title and description in pixels on desktop and mobile. For a whole site, `suggest_meta_tags` (paid, per 25 pages).

8. **Comparison pages.** `build_comparison_page` with `pageType` (vs, alternatives, roundup or table) and `competitors` as `{ name, domain }`.
   - It reads each product's pricing and feature pages and fills a sourced feature matrix with "as of" prices and hidden costs. The outline acknowledges each competitor's strengths and puts no call to action inside a competitor's section.
   - The outline is a metered Claude call, and `demand: true` (the default) adds a paid keyword-metrics read.
   - Cells marked "Not publicly available" stay that way. Never fill them from memory.

9. **Programmatic pages.** `check_programmatic_pages` (free) finds template pages (or one `template` glob such as /locations/*). For each variant it gives a verdict: keep, merge or noindex, from unique text share, nearest-sibling similarity, thinness and demand.
   - Its gate: 100+ unreviewed pages is a warning, 500+ says stop.
   - Report the sub-scores that are null as unmeasured.
   - Read `references/comparison-and-programmatic.md` for the thresholds.

10. **Record.** Call `update_client_brief` with a `research` entry: the keyword, the page, the final scores and what is left for a human. For a planned piece, move it on with `update_content_plan_item` (briefed, drafting or published). After publishing, `add_annotation` with kind publish or content_update, so later traffic can be read against it.

## What is paid

| Tool                                                                                      | Paid part                                                                                                        |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `get_serp_content_profile`, `build_content_brief`, `score_content`, `get_entity_coverage` | The results page, unless anyone bought it in the last day. The ranking pages are fetched free.                   |
| `draft_article`, `rewrite_section`                                                        | A metered Claude call, plus the results page (and a scoring run if you pass a draft or url to `rewrite_section`) |
| `get_sxo_gap`                                                                             | The results page unless recent. `personas: true` adds a Claude call. `deep` is free.                             |
| `build_comparison_page`                                                                   | A Claude call. `demand: true` adds a keyword-metrics read.                                                       |
| `score_eeat`, `get_geo_readiness`                                                         | Free unless `judge: true` or `brandMentions: true`                                                               |
| `suggest_meta_tags`, `get_snippet_targets` with drafts                                    | A Claude call per batch                                                                                          |
| `check_programmatic_pages`, `audit_page`, `simulate_serp_snippet`                         | Free                                                                                                             |

- Before any paid call, run `estimate_cost` with the exact arguments (or pass `dryRun: true`), tell the user the total, then call with the quote as `maxCostMicros` so it cannot cost more than agreed.
- Check what is left with `get_budget_status` (free) before a long rewrite loop. If a call is refused for budget, follow the error's `next` step.

## Rules

- Never invent arguments: unknown ones are refused with invalid_input. `get_error_catalogue` explains error codes.
- Scores are heuristics, and the tools say so. Pass that on. Null parts are unmeasured, not zero.
- Never invent first-hand experience, figures, quotes, credentials or prices to lift a score. Mark where a person must supply them.
- Never create share links (`create_report_link`, `set_report_sharing`) unless the user asks.
- REST callers send `Idempotency-Key` on writes.

## What to hand back

- **For a brief:** the keyword and page type, intent, target length, outline, must-cover terms, questions, schema, internal links, the information gain to aim for, and any ownership warning.
- **For a draft or page:** the Markdown, then a score card (content score against the results page, draftQuality overall and flags, placement misses, E-E-A-T band, SXO mismatch if any), and a short list of fixes still open, marking which ones need a person.
- Always state what was spent against the quote.
