# Diagnosing a page that is losing traffic

Work out the cause before you prescribe a content fix. Most "decay" is not a content problem.

| What you see                                         | Check with                                                        | Likely cause                                                              | Action                                                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Clicks fall, position steady                         | `get_serp_features`, `get_serp_intent_shifts`                     | An AI Overview, snippet, video or shopping block arrived above the result | Win the feature (answer format, schema, video) or accept the lower ceiling. Do not rewrite the page for it.                    |
| The query now lands on another of the client's pages | `get_query_page_swaps`, `get_url_swaps`, `get_cannibalization`    | Two pages competing                                                       | Pick the owner, merge or re-target the other, fix internal links, then `set_keyword_owners` (dry run first)                    |
| Position falls, newer pages above                    | `get_freshness_queue`, `get_competitor_page_changes`              | The results page moved to fresher content, or a rival improved            | Refresh: update the years, figures and examples, add what the rival added                                                      |
| Position falls with the whole site                   | `get_search_anomalies`, `get_serp_volatility`, `list_annotations` | A Google update, a deploy or a crawl regression                           | Not content. Hand over to technical work or wait out the volatility.                                                           |
| Page went 404, noindex or canonical elsewhere        | `get_search_anomalies`, `get_page_details`                        | A technical regression                                                    | Fix the page's status first                                                                                                    |
| Impressions fall, clicks rate unchanged              | `get_search_changes` with `dimension: "page"`                     | Demand fell (seasonal or market)                                          | Check `get_google_trends` (paid). Often nothing to do.                                                                         |
| Thin page, little demand                             | `get_content_audit` (review verdict)                              | Never had a reason to rank                                                | Improve it, fold it into a stronger page, or noindex it, after checking its links and conversions. Never delete on this alone. |

## Priority

Rank fixes by clicks at risk (from `get_freshness_queue`) or clicks lost (from `get_content_decay`), weighted by conversions where GA4 is connected (`get_ga4_landing_pages`). Cheap technical or cannibalisation fixes on a high-value page come before any rewrite.
