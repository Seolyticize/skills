---
name: analytics-and-conversions
description: Measure what search earns a Seolyticize client - read Search Console and GA4, install the cookieless first-party analytics snippet, define goals and funnels, collect server-side with issue_server_collect_key and visit tokens, record orders from any store with record_order / record_orders, and attribute revenue with get_seo_revenue. Use for "set up tracking", "what did organic earn", "count sign-ups", "which pages make money", "track AI agents server-side", "log orders against visits" or "what is SEO worth".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Analytics and conversions

Outcome: the client's traffic, conversions and revenue are measured from their own sources, credited to the page, query and channel that brought them, and reported honestly where a source is missing. Load the seolyticize skill first for the conventions.

Everything here is free. Setup tools need `data:write` (goals, analytics) or `client:manage` (connections, server keys). Start with `get_client_brief`: the goal it records says which conversion matters.

## 1. See what is connected

1. `get_client_integrations`: Search Console and GA4 status, last sync error, and the Search Console backfill's progress.
2. `get_web_analytics_setup`: whether first-party analytics is installed, its snippet, allowed hostnames and `lastEventAt` (null until the first visit).
3. `list_integrations`: stores (Stripe, Shopify, Paddle) and other connected tools.
4. Anything missing: connect it (step 2), or report its figures as unknown. Never fill a missing source with zero.

## 2. Connect the sources

- **Search Console / GA4:** `get_google_service_account`, the property owner adds that address (Search Console Restricted user; GA4 Viewer), then `connect_search_console_service_account` and `connect_google_analytics_service_account` (`propertyId` is the numeric GA4 property id). Or `get_connection_link` for a person to sign in. Then `sync_search_console` pulls the latest days now.
- **First-party analytics:** `set_up_web_analytics` with `clientId`, plus `hostnames` (staging and extra domains, up to 20), `excludePaths` (signed-in areas, reset and verify pages) or `includePaths`. It returns the one-line, cookieless `<script defer data-site="KEY" src="https://seolyticize.com/a.js">` for every page's head. Safe to repeat: the snippet does not change. Hand it to whoever deploys and check `lastEventAt` afterwards.
- **A store:** `connect_revenue_source` with provider stripe (a restricted rk_ key), shopify (shop plus an Admin API token with read_orders) or paddle; or `get_integration_connect_link` for Stripe Connect or Shopify OAuth. The last 90 days import at once; `import_revenue_now` pulls changes since.
- **Matomo instead of GA4:** `connect_integration` with provider matomo, read with `get_matomo_report`.

## 3. Read search and traffic

| Question                                    | Tool                                                                                                                  | Notes                                                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| What did Google measure                     | `get_search_console_performance`                                                                                      | `from` and `to` are required; dimensions date, query, page, country, device. Days Google is still counting are provisional: say so.              |
| Is non-branded growing                      | `get_brand_split`                                                                                                     | Uses the brief's `brandTerms`. Fix those first if the split looks wrong.                                                                         |
| What is new, lost, up, down                 | `get_search_changes`                                                                                                  | Two periods, by query or page, branded or not.                                                                                                   |
| Why did traffic move                        | `get_search_anomalies`, `get_search_timeline`                                                                         | Causes come with a confidence. Pass it on.                                                                                                       |
| Organic sessions, key events, revenue (GA4) | `get_ga4_overview`, `get_ga4_landing_pages`, `get_ga4_traffic_acquisition`, `get_ga4_key_events`, `get_ga4_ecommerce` | `channel` organic, all or ai. `thresholded` means GA4 withheld small numbers. Ecommerce `activity` none means no ecommerce events, not no sales. |
| Can we trust GA4                            | `get_ga4_measurement_health`                                                                                          | Run it before reporting GA4 figures for a new client. Unread parts are unknown, not fine.                                                        |
| First-party traffic                         | `get_web_analytics_summary`, `get_web_analytics_breakdown`                                                            | `previous` is null when that span was not fully measured.                                                                                        |
| AI assistants                               | `get_ai_referrals` (visits they send), `get_ai_agent_visits` (assistants reading pages for someone)                   | Training crawlers are in `analyse_server_log`, not here.                                                                                         |

## 4. Goals and funnels (first-party analytics)

1. `list_conversion_goals`: the custom events the site already sends, most-sent first.
2. `create_goal` with `name`, `kind` pageview (match a path such as /thanks or /signup/*) or event (match its name), and optionally `valueMinor` (2500 = 25.00). Without a fixed value, an event's own `value` property is summed. It counts every visit since the tag went in. `list_goals` shows them.
3. Custom events come from the site: from the browser tag, or from a server collector (step 5).
4. `create_funnel` with 2 to 8 ordered steps. Funnels are measured within one visit, because the cookieless visitor id resets daily.
5. Read them:
   - `get_goal_report` by channel, landing page, source, campaign, AI referrer or query cluster;
   - `get_conversions` by landing page, source or referrer, with source web_analytics or ga4 (GA4 key events on organic sessions), and `channel` search or ai;
   - `get_funnel_report` for drop-off per step.

## 5. Server-side collection and visit tokens

Use it when the browser tag cannot see everything: AI agents that never run scripts, server-rendered frameworks, and conversions that happen after the visitor has left (a payment confirmed later, a trial converting next week). Read `references/server-side-collection.md` before writing any collector code. It has the request fields, the answers, the token rules and the Node, Python and PHP collectors.

1. `issue_server_collect_key` with `clientId` (`client:manage`). The key is shown once; issuing another revokes the last. It goes in the server's environment, never in a page or a client bundle. Tell the person that.
2. The server reports with the visitor's own `ip` and `ua` to `/api/collect`, with the key as a bearer token. With the browser tag also installed, report only AI agents (`only: "agents"`), or every person is counted twice.
3. While the visitor is on the site, report the event that may lead to a later conversion (sign-up, checkout started). The 202 answer carries a visit token. The site keeps it on its own server with the account or order, never in a cookie or a page.
4. Later, send the conversion with the token and nothing about the visitor. It is credited to that visit's landing page, source and channel. Tokens last 35 days. An expired one is refused by `/api/collect` with 410.

## 6. Orders from any store

For a business on neither Stripe, Shopify nor Paddle (crypto, invoices, a custom checkout):

1. `record_order` for one, `record_orders` for up to 500 per call. Fields: `orderId` (the site's own), `amountMinor` (minor units: 4999 is 49.99 USD; 500 JPY is 500), `currency`, `at` (when paid, ISO with offset), `visit` (the token, when kept), `refundOf` for a refund, and `customerId`.
2. On REST, send an `Idempotency-Key` named for the order or batch (order-inv_1042 style), so a retried push never double-counts. Recording an `orderId` again replaces it; an identical replay is answered unchanged.
3. Read each answer: `attributedBy` analytics means the token matched (with `channel` and `landingPath`); none with a `note` means the token had expired or its visit was not found. The order still counts in revenue, unattributed. A token for another site is refused (invalid_visit). In a batch each order is answered on its own, and one refusal does not stop the rest.
4. A pinned key with `data:write` is enough for a server pushing orders. Suggest one rather than an agency-wide key.

## 7. Revenue attribution

`get_seo_revenue` with `by` channel, landing_page, query_cluster, campaign, source, ai_referrer or provider, and `days`. It returns orders, revenue net of refunds and customers, per currency, never converted. It also reports how many orders were matched to their visit. Always report that match rate beside the revenue. Unattributed revenue is real revenue whose source is unknown, not "direct".

## Decision points

- **No GA4 and no snippet:** set up first-party analytics before anything else. There is no traffic or goal data to read until it runs.
- **Both GA4 and first-party:** figures will differ (cookies, consent, bot filtering). Report each with its source; do not add them together.
- **Revenue in several currencies:** report each currency separately.
- **Low match rate:** the site is not keeping visit tokens, or not sending a ref or order_id property. Point to section 5.

## What to hand back

- The headline: conversions or revenue from organic search (and AI assistants) for the period, against the period before, with the source of each figure.
- Top pages and queries by conversions or revenue, with the match rate and anything provisional, thresholded or unmeasured.
- What is not measured yet and the one step that would measure it.
- Any setup done, and any secrets handed over once (server key).
- Record the conclusions in the brief's research log with `update_client_brief`.
