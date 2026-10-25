# Server-side collection: the protocol

How a server reports visits and later conversions to Seolyticize's first-party analytics, and how orders are credited to the visit they came from. Built from the platform's collect endpoint and its packaged collectors.

## The endpoint

```
POST https://seolyticize.com/api/collect
Authorization: Bearer <server key>      (from issue_server_collect_key; prefix slyc_)
Content-Type: application/json
```

The body is JSON, at most 4 KB. `/api/collect` takes no Idempotency-Key: a repeated event is a repeated event, and the per-visitor rate limit (120 a minute per address per site) answers 429 to a flood.

## Fields

Every field the endpoint takes. **Any other field is refused with 400**, named in the answer's `error` (for example `Unknown field: visitToken`), so a misspelt `visit` or `ip` fails loudly instead of being ignored.

| Field   | Required                    | Meaning                                                                                                                                                                                    | Limit                                     |
| ------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `k`     | yes                         | The site key, from `set_up_web_analytics` or `get_web_analytics_setup`                                                                                                                     | 16 to 64 of A-Z a-z 0-9 _ -               |
| `n`     | yes                         | "pageview", or a custom event's name (what a goal matches)                                                                                                                                 | 64 characters                             |
| `u`     | yes, unless `visit` is sent | The page's full http(s) URL. Its hostname must be one of the setup's hostnames                                                                                                             | 2,048 characters                          |
| `r`     | no                          | The referrer, on a visit's first pageview. Only its origin is used                                                                                                                         | 2,048 characters                          |
| `p`     | no                          | A custom event's properties: string, number or boolean. `value` is what a goal without a fixed worth sums; a ref or order_id property links a Stripe, Shopify or Paddle order to the visit | 10 properties, keys 40, string values 200 |
| `ip`    | server only                 | The visitor's own address, as the proxy reported it (CF-Connecting-IP, X-Real-IP, or the client end of X-Forwarded-For). Hashed under a daily salt, never stored                           | 64 characters                             |
| `ua`    | server only                 | The visitor's User-Agent: the visitor hash, the bot check, browser, OS and device. Never stored whole                                                                                      | 1,024 characters                          |
| `h`     | server only                 | The visitor's Sec-CH-UA client hints                                                                                                                                                       | 512 characters                            |
| `sa`    | server only                 | The Signature-Agent header that signing agents such as ChatGPT send, so an assistant is counted as one                                                                                     | 256 characters                            |
| `c`     | server only                 | The visitor's country, ISO 3166-1 alpha-2 (Cloudflare's CF-IPCountry)                                                                                                                      | 8 characters                              |
| `visit` | server only                 | A visit token from an earlier 202, on an event that happens after the visit                                                                                                                | 128 characters                            |

"Server only" fields are read only from a request carrying the site's server key. From a browser they are ignored, so a page cannot claim to be any visitor. A server request needs no Origin header; the hostname in `u` is still checked.

The query string and fragment of `u` are dropped after the utm_ tags are read. Send URLs without other parameters anyway: a reset token should never travel.

## Answers

| Status                       | Meaning                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 202 with `{"visit": "v1.…"}` | A person's visit, from a server collector: keep the token if a conversion may follow                                                                             |
| 202, no body                 | Accepted from a browser; or quietly dropped as a bot, an AI agent (recorded apart as an agent read), or an excluded path; or a later event credited to its visit |
| 400                          | Not JSON, a field out of bounds, an unknown field (named), a pageview sent with `visit`, or a visit token this site did not issue                                |
| 401                          | A wrong server key (refused, never counted as a browser), or a visit token sent without the key                                                                  |
| 403                          | The page's hostname, or a browser's Origin, is not one of the setup's hostnames                                                                                  |
| 404                          | No setup has that site key, or a visit token's visit was not found                                                                                               |
| 410                          | The visit token is older than 35 days                                                                                                                            |
| 413                          | Body over 4 KB                                                                                                                                                   |
| 429                          | Too many from one visitor (or for one visit)                                                                                                                     |

Only a person's visit gets a token. A bot, an AI agent or an excluded path answers 202 with no body: there is no visit to credit.

## The visit token

1. While the visitor is on the site, the server reports an event for them (sign-up, checkout started) with their `ip` and `ua`. The 202 carries `{"visit": "v1.…"}`.
2. The site keeps the token on its own server, with the account or the order. Never in a browser, a cookie or a page.
3. Later, the server sends the conversion with the token and nothing about the visitor:

```bash
curl -X POST https://seolyticize.com/api/collect \
  -H "Authorization: Bearer $SEOLYTICIZE_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"k":"<site key>","n":"Top-up","p":{"value":25},"visit":"v1.…"}'
```

- The event is credited to the visit's landing page, source, campaign and channel. Goals (`get_goal_report`), funnels and `get_conversions` count it there, as a conversion in the period it happened and never as a visit.
- `n` may not be "pageview" on a credited event; `u` is optional.
- The token holds only the visit's random id and the minute it was issued, signed and bound to the site. It cannot be guessed, edited to name another visit, or used on another site.
- **Lifetime: 35 days.** At `/api/collect` an expired token is refused with 410 and the event is not recorded. Passed to `record_order` as `visit`, an expired token still records the order, unattributed (`attributedBy` none, with a `note`).

## Orders: record_order and record_orders

For orders from any store not connected through Stripe, Shopify or Paddle. REST with an API key (one pinned to the client with `data:write` is enough):

```bash
curl -X POST https://seolyticize.com/api/v1/tools/record_order \
  -H "Authorization: Bearer $SEOLYTICIZE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-inv_1042" \
  -d '{"clientId":"<clientId>","orderId":"inv_1042","amountMinor":4999,"currency":"USD","at":"2026-10-24T09:12:00Z","visit":"v1.…"}'
```

| Field         | Meaning                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `orderId`     | The site's own id. Recording it again replaces the order; an identical replay is answered unchanged            |
| `amountMinor` | Minor units of the currency: 4999 is 49.99 USD, 500 is 500 JPY                                                 |
| `currency`    | ISO 4217, such as USD                                                                                          |
| `at`          | When it was paid, ISO 8601 with an offset                                                                      |
| `visit`       | The visit token, when the site kept one                                                                        |
| `refundOf`    | On a refund: the order it refunds. It nets off revenue in the period it happened, credited where its order was |
| `customerId`  | The site's own customer id, optional                                                                           |

Answer: `{"orderId", "outcome": "recorded" | "updated" | "unchanged" | "refused", "attributedBy": "analytics" | "none", "channel", "landingPath", "note", "code"}`. A token for another site is refused (invalid_visit), never guessed at.

`record_orders` takes `orders`, up to 500, each answered on its own; one refused order does not stop the rest, and refunds may refer to orders earlier in the same batch. Name the Idempotency-Key for the batch (orders-2026-10-24T10), not the attempt: a fresh key per attempt protects nothing. A retry under the same key within 24 hours replays the first answer (Idempotent-Replayed: true).

## The packaged collectors

All three fill `ip`, `ua`, `h`, `sa` and `c` from the request's own headers, drop bots before sending, strip query parameters except the utm_ tags, and never hold up or break the page. With the browser tag also installed, use only agents, or every person is counted twice.

### Node / Next.js: @seolyticize/next/server

```ts
import { addressFrom, createCollector } from "@seolyticize/next/server";

const collector = createCollector({
  siteKey: "<site key>",
  serverKey: process.env.SEOLYTICIZE_SERVER_KEY!, // never in a client bundle
  only: "agents", // "all" when the browser tag is not installed
  // exclude: ["/admin/*"], include, allowParams, endpoint, timeoutMs (default 2000), onError
});

await collector.trackRequest(request); // a page view from a standard Request
await collector.track({ url, userAgent, ip: addressFrom(request.headers), country });

// While the visitor is here: resolves with the token, or null (bot, agent, excluded path, failure).
const visit = await collector.trackForVisit({
  url,
  userAgent,
  ip,
  name: "Checkout started",
});
// store `visit` with the order on your server

// Later, from a webhook or job: resolves true when credited, never rejects.
const credited = await collector.trackLater({
  visit,
  name: "Top-up",
  props: { value: 25 },
});
```

`trackForVisit` sends whatever `only` says. `trackLater` resolves false on 410 (expired), 404 (visit not found) or 400 (not this site's token); `onError` hears why. A 401 means the server key was refused: issue a new one. The package also has `expressCollector` and `collectInMiddleware` for Express and Next.js middleware.

### Python: seolyticize.collect

```python
import os
from seolyticize.collect import Collector, WSGICollector

collector = Collector("<site key>", os.environ["SEOLYTICIZE_SERVER_KEY"], only="agents")
app.wsgi_app = WSGICollector(app.wsgi_app, collector)  # Flask; ASGICollector and django_middleware too

collector.track(url, user_agent=ua, ip=ip, country=country)
visit = collector.track_for_visit(url, "Checkout started", user_agent=ua, ip=ip)  # str or None
credited = collector.track_later(visit, "Top-up", props={"value": 25})           # True or False
```

Never raises. Install with `pip install seolyticize`.

### PHP: Seolyticize\Collector

```php
$collector = new \Seolyticize\Collector('<site key>', getenv('SEOLYTICIZE_SERVER_KEY'), ['only' => 'agents']);
register_shutdown_function(fn () => $collector->trackCurrentRequest()); // reads $_SERVER

$collector->track($url, ['userAgent' => $ua, 'ip' => $ip, 'country' => $country]);
$visit = $collector->trackForVisit($url, 'Checkout started', ['userAgent' => $ua, 'ip' => $ip]); // ?string
$credited = $collector->trackLater($visit, 'Top-up', ['value' => 25]);                             // bool
```

Install: `composer config repositories.seolyticize vcs https://github.com/Seolyticize/site-php`, then `composer require seolyticize/site:dev-main`.

## Checklist for an agent wiring this up

1. `set_up_web_analytics` for the site key; `issue_server_collect_key` for the server key (shown once, into the server's environment).
2. Decide `only`: agents if the browser tag stays, all if not.
3. Add `trackForVisit` at the moment a later conversion becomes possible, and store the token with the account or order.
4. Add `trackLater` (or `record_order` with `visit`) where the conversion is confirmed.
5. Define the goal with `create_goal` (kind event, the same name).
6. After the first events, check `get_web_analytics_setup` (`lastEventAt`), `get_ai_agent_visits`, and `get_goal_report` or `get_seo_revenue` for credited conversions and the match rate.
