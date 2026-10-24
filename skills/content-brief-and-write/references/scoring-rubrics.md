# Scoring rubrics

How each scoring tool counts, so you can explain a score and know which fix moves it. All of these are heuristics. Null parts are unmeasured, and the rest is rescaled; never report them as zero.

## `score_content`: content score (0–100)

Scored against the pages that rank for the keyword:

| Part      | Weight | What it measures                                                                                           |
| --------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Terms     | 40%    | Coverage of the terms the ranking pages use, at the frequency they use them                                |
| Outline   | 20%    | Themes most ranking pages cover. A section counts when its heading shares enough key terms with the theme. |
| Questions | 15%    | People Also Ask and the ranking pages' questions answered                                                  |
| Length    | 15%    | Within the ranking pages' word-count range. Longer than the range is capped, not rewarded.                 |
| Structure | 10%    | Tables, lists, images and video, where most ranking pages have them                                        |

The parts come back as sub-scores. Fixes come most important first, typed terms, outline, length, media or schema.

The aim is par with the results page, not 100. Iterate on the top fix, re-score, and stop when further changes would only stuff terms.

Also returned:

- **factConflicts.** Sentences whose price, limit or date contradicts the client's registered facts (`list_client_facts`). Always fix these.
- **uncitedClaims and uncitedRatio.** Percentages, money, large numbers, "according to X" and "3x" figures with no link or source within 200 characters. A ratio above 0.4 is a warning. Add sources; never delete true figures just to lower the ratio.
- **invisibleChars.** Zero-width, bidi and tag characters, by codepoint. Strip them.

### draftQuality (detects only, never rewrites)

| Signal                                            | Flag when               |
| ------------------------------------------------- | ----------------------- |
| Filler phrases (26 patterns, per 1,000 tokens)    | Score 50 or more        |
| Stock AI phrasing (46 patterns, per 1,000 tokens) | Score 40 or more        |
| Information density                               | Under 0.20              |
| Bigram repetition                                 | Score 30 or more        |
| Length                                            | Under 300 tokens (thin) |

The overall score is weighted: filler 25%, AI phrasing 25%, density 25%, repetition 15%, length 10%. Higher is better. A flag is the actionable part: name it and quote one offending passage.

### placement

- The keyword appears in the first 100 words, the URL slug and the front of the title.
- No heading stuffing: no more than two subheadings repeating the keyword.
- Average sentence length is near 15–20 words.
- Internal links run at 3–5 per 1,000 words.
- Pages of 1,500 words or more have a table of contents.

## `score_eeat`: E-E-A-T (0–100)

| Dimension         | Points |
| ----------------- | ------ |
| Experience        | 20     |
| Expertise         | 25     |
| Authoritativeness | 25     |
| Trust             | 30     |

Each sub-criterion is graded Strong, Moderate, Weak or None, with the evidence and the fix.

Bands: 90 excellent, 70 good, 50 fair, 30 poor, below 30 very poor. Each band comes with next steps:

- **Very poor:** contact and about pages, named authors, HTTPS, remove deceptive elements.
- **Poor:** author bios with credentials, first-hand experience, testimonials.
- **Fair:** original research, topic clusters, documented methods.
- **Good:** freshness, authors' presence elsewhere, media.

Flags:

- **atRisk:** weak on who, how and why.
- **YMYL without credentials:** health, finance, legal, news or civic pages. Expertise is capped at Weak.
- **Generic AI-style:** one heading template, no author, stock phrasing.
- **Stale on a fast-moving topic.**
- **Reading ease outside 60–70:** information only.

`judge: true` regrades Experience with a metered Claude call. Use it when the heuristic and the text plainly disagree.

## `get_sxo_gap`: page type and gap (0–100)

- **Types**, in order of precedence: tool, local, comparison, product, landing, service, hybrid, else blog.
- **Consensus:** the share of the top 10 of one type. Over 60% is strong, 40–60% mixed, under 40% fragmented. With fragmented consensus a mismatch matters less.
- **Mismatch severity:** a blog where products, tools, local pages or landing pages rank is critical. A blog against comparisons is high. A landing page where tools rank is high.
- **Gap score parts:** page type, depth, UX, schema, media and authority at 15 each, and freshness at 10.
- **`deep: true`:** reads UX from a phone render (H1 and call to action above the fold, tap targets, font size, overlays) and authority from E-E-A-T.
- **Personas** (paid): each is scored on relevance, clarity, trust and action, 25 each. 80 or more is excellent, 60 good, 40 needs work, and below 40 is a critical mismatch.

## `get_geo_readiness`: AI citation readiness (0–100)

| Part       | Points | Looks for                                                                                                         |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| Citability | 25     | An answer in the first 40–60 words of each H2, self-contained 130–170-word passages, definitions, sourced figures |
| Structure  | 20     | Heading hierarchy, question headings, short paragraphs, tables and lists                                          |
| Multimodal | 15     | Images, video with VideoObject markup, charts, interactive elements                                               |
| Authority  | 20     | Author, dates and recency, primary sources, brand presence on Wikipedia, Wikidata, Reddit, YouTube and LinkedIn   |
| Technical  | 20     | Server-side rendering, AI search crawlers allowed, snippets allowed                                               |

A per-engine readiness score is readiness, not measured citations. An engine whose crawler is blocked scores 0.
