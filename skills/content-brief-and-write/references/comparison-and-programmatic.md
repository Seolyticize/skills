# Comparison pages and programmatic pages

## `build_comparison_page`

**Page types:**

- **vs:** the client against one rival.
- **alternatives:** alternatives to the first competitor.
- **roundup:** best tools in a `category`.
- **table:** a plain feature table.

**Inputs:**

- `competitors`: up to 10, each `{ name, domain }`.
- `features`: up to 30 to compare.
- `sourceUrls`: pricing or feature pages the tool would not find by itself.
- `instructions`: angle and claims to avoid.

**Honesty rules the output already follows; keep them when editing:**

- Each cell is ✅, ⚠️ partial, ❌ or "Not publicly available", with its source URL. Never fill a cell from memory.
- Every price is dated "as of" the read. Hidden costs (setup fees, per-user pricing, overages, annual-only billing, minimum seats) come from the pricing page.
- Each competitor's strengths are acknowledged. The client's product is named as the client's.
- Calls to action go above the fold, after the table and at the end, never inside a competitor's section.
- JSON-LD uses SoftwareApplication with offers, and ItemList in ranked order for roundups. AggregateRating is used only with real review data.
- The outline runs to at least 1,500 words, with a methodology section and a "Last updated" stamp.

**Searches it targets:** "[a] vs [b]", "[a] vs [b] pricing", "is [a] better than [b]", "[a] alternatives", "[a] review [year]", "best [category] tools". With `demand: true` it adds their volumes (one paid keyword-metrics read).

## `check_programmatic_pages`

**Finding templates.** Template pages share one path with a single variable segment, at `minVariants` or more (default 10). Or name one template with `template`, for example /sms/*.

**Per-variant verdicts:**

- **keep:** the page earns its place.
- **merge:** all but a duplicate of a sibling with more demand. Fold it in and redirect.
- **noindex:** thin or boilerplate, with no demand.

**Thresholds:**

| Check                  | Threshold                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Review gate            | 100+ unreviewed pages is a warning, 500+ says stop                                  |
| Own text               | Under 40% is thin, under 30% fails, under 300 words is flagged                      |
| Near-duplicate records | Title, H1 and description share more than 80% of their words                        |
| Boilerplate            | Over 60% of the copy is shared with most of the template's pages                    |
| URLs                   | Lowercase, hyphens, under 100 characters, no query string, one trailing-slash style |
| Linking                | 3–5 sibling links, self-referencing canonical                                       |
| Review sample          | 5% of the template, thinnest first                                                  |
| Crawl budget           | A notice past 10,000 pages                                                          |

**Sub-scores** (0–100 each): data, template uniqueness, URL, linking, thin risk and index management. A null sub-score is unmeasured.

**Not built yet.** For combinations that do not exist yet, `get_demand_matrix` estimates their demand before anyone builds them.
