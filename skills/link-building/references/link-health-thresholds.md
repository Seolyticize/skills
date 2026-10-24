# Link health thresholds

## `get_backlink_health`: seven factors

| Factor               | Weight | Good / critical                                                                                            |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Referring domains    | 20     | Over 100 is good, under 20 critical                                                                        |
| Quality distribution | 20     | Linking sites' authority. One site over 10% of the links warns, over 25% is critical.                      |
| Anchor naturalness   | 15     | Anchor bands, as in `get_anchor_distribution`, against the `industry` ranges                               |
| Toxic ratio          | 20     | The share of sites `get_toxic_link_risk` calls toxic                                                       |
| Velocity             | 10     | A fall in referring domains of over 20% a quarter is critical                                              |
| Follow ratio         | 5      | Over 60% followed is good, under 40% critical                                                              |
| Geographic relevance | 10     | TLD and country mix against the client's market. 80% or more from other countries flags a private network. |

Each factor's weight is scaled by its source's confidence: DataForSEO 1.0, our link index 0.7, Common Crawl 0.5. The tool gives a number only when at least four factors have data, and never from presence-only sources alone. Otherwise it reports insufficient data (X/7) or not assessed. Pass that on as it is.

The toxic signals it lists:

- 50+ directory links;
- linking pages with 10,000+ outbound links;
- more than 50 links from one site;
- linking pages under 100 words;
- reciprocal links.

## Anchor bands (`get_anchor_distribution`, by referring domains)

| Class                | Natural range | Flag      |
| -------------------- | ------------- | --------- |
| Branded              | 30–50%        | Under 15% |
| Bare URL             | 15–25%        |           |
| Generic (click here) | 10–20%        |           |
| Exact match          | 3–10%         | Over 15%  |
| Partial match        | 5–15%         | Over 25%  |

Exact and partial matches are told apart only when `moneyTerms` are passed.

## `get_toxic_link_risk`

**Evidence it uses:**

- the vendor spam score (pass `spamScores`);
- sitewide links (footer, blogroll);
- link-seller neighbourhoods (hundreds of outbound domains from few pages);
- commercial exact-match anchors (brand terms excluded);
- thirty toxic patterns where the data allows.

The thirty patterns include:

- pages with 50+ or 10,000+ outbound links;
- domains registered under 30 days ago with 100+ outbound links, or re-registered after lapsing;
- pharma or casino injections;
- unrelated-niche sitewide and exact-match links;
- foreign-language and parked sites;
- article directories, forum profiles, press-release wires, coupon sites and comment links.

Each pattern is reported flagged, clear or unmeasured. Unmeasured is not clear.

**Verdicts:**

- **healthy:** leave it.
- **review:** a person looks at the site. It does not mean disavow.
- **toxic:** a disavow candidate.

**Disavow advice:**

- Toxic over 10% of linking sites: yes, make a file.
- 2–10%: judgement. Disavow clear spam only, usually at domain level.
- Under 2%: no. Google ignores most of it, and disavowing a good link throws away value the client earned.

## `get_link_velocity` red flags

| Flag                              | Usual meaning                                               | Action                                                     |
| --------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 10× the usual new links in a week | A campaign, a viral piece, or negative SEO                  | Inspect the new domains, and run `get_toxic_link_risk`     |
| Half the links lost in a month    | A network deindexed, a partner redesign, a broken migration | `get_link_checks` and `get_broken_backlinks`, then reclaim |
| No new links for three months     | Stalled promotion                                           | Start a prospecting cycle                                  |
| Every new link from one TLD       | A network or a bought package                               | Inspect, and run `get_referring_networks`                  |
| A spike from one country          | Often spam targeting the site                               | Inspect, and consider disavow if toxic                     |

Losses are only called after `graceDays` unseen, and not at all for a domain no index is still reading.

## Link statuses (`get_link_checks`)

| Status          | Meaning                                                               | Counts as lost?                                                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| live            | The link is on the page                                               | No                                                                      |
| lost            | The page no longer links                                              | Yes. This is the only removal.                                          |
| moved           | The page redirected, and the link is not at the new address (movedTo) | No. Check the new page, then contact the owner if the link really went. |
| unverifiable_js | A JavaScript app shell, so links are not visible without a browser    | No. Verify by hand.                                                     |
| unknown         | The page could not be read                                            | No. Recheck later.                                                      |
