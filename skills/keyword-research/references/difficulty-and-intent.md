# Judging difficulty and intent

Read this when difficulty sources disagree, or when you have to decide whether a keyword is worth the client's effort.

## Three difficulty numbers, three questions

| Source                                                         | What it answers                             | Cost                    | Watch for                                                                               |
| -------------------------------------------------------------- | ------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| Difficulty on `keyword_explorer` or `get_keyword_metrics` rows | How hard the keyword is for an average site | Paid with the expansion | A market average. It knows nothing about the client.                                    |
| `explain_keyword_difficulty`                                   | Which first-page results set that number    | Free                    | Results with no link data are unscored. A keyword never captured is unscored, not easy. |
| `get_personal_keyword_difficulty`                              | How hard the keyword is for this site       | Free                    | Each adjustment has a reason. A factor with no data is left out, and that is said.      |

When the generic and personal numbers disagree, trust the personal one and give its reasons, for example "the site already ranks 14th" or "its authority is well below the first page's median". If personal difficulty had too little data to adjust, say so, and fall back to reading the page in `serp_overview`.

## Reading the real page (`serp_overview`)

- **Who ranks.** Five or more results from household brands, government or encyclopaedias usually puts the keyword out of reach for a small site, whatever the score says. Forums, thin affiliate pages or out-of-date posts on page one point to an opening.
- **Strength gap.** Compare the client's domain authority and referring domains with the weakest and the median result, not the strongest.
- **Features.** An AI Overview, featured snippet, map pack, shopping or video carousel above the results takes clicks away. `get_zero_click_estimates` (free) estimates the share of searches that end without a click for queries the site already gets impressions for. Discount the forecast by it.
- **Freshness.** Many results updated recently means the page will need regular refreshes.

## Intent and page type

Google's results decide the intent, not the wording of the keyword.

| What ranks                           | Intent        | Page to build                                                 |
| ------------------------------------ | ------------- | ------------------------------------------------------------- |
| Guides, how-tos, definitions         | Informational | Article or guide                                              |
| "Best X", reviews, comparisons       | Commercial    | Comparison or roundup (see the content-brief-and-write skill) |
| Product and category pages, shopping | Transactional | Product or category page                                      |
| A map pack, local businesses         | Local         | Location or service page                                      |
| One brand's own pages                | Navigational  | Usually skip, unless it is the client's brand                 |
| A mix of the above                   | Mixed         | Fit the dominant type, or pick another keyword                |

If the client cannot or will not build the type that ranks, drop the keyword however attractive its volume. `get_sxo_gap` scores an existing page's type against the results when the question is "why doesn't our page rank here".

## Volume versus value

- A keyword's own volume undersells it. `keyword_traffic_potential` gives what the first result earns across every keyword it ranks for, and that page's parent topic. Plan the page around the parent topic.
- CPC is a rough signal of commercial value. GA4 revenue per session (from `get_search_opportunities`) beats it wherever it exists.
- Seasonality: `forecast_keyword_traffic` shapes clicks by month from stored monthly volumes. `get_google_trends` (paid, about $0.01) checks growth and peaks.

## Clusters from `cluster_keywords`

- Overlap of 7–10 shared top-ten results: one page. 4–6: the same cluster, one page with sections. 2–3: separate pages that link to each other. 0–1: separate topics.
- The commonest domains (Wikipedia, Reddit and the like) are left out before overlap is counted, so a shared Wikipedia result does not glue topics together.
- Navigational keywords are left out of the architecture.
