# Errors and spend: the rules in full

Read this the first time a call is refused, and before any paid work.

## What a refusal looks like

REST: `{"error": "<one sentence for a person>", "code": "<stable code>", "next": "<what to do>", "requestId": "req_…"}`. The SDKs expose the same as `code`, `next` and the request id; MCP returns the sentence and code as the tool's error. Branch on `code`, never on the sentence. Show the sentence to the person.

| Status | Meaning                                                                                | Retry?                                                                                                  |
| ------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 200    | Done; result under `data`, call metadata under `meta`                                  |                                                                                                         |
| 400    | Not JSON, or a value of the wrong type or out of bounds; the message names the field   | No: fix the input                                                                                       |
| 401    | No key, or an unknown, revoked or expired one                                          | No: fix the key                                                                                         |
| 403    | The role does not allow the tool, or the key cannot reach that client                  | No                                                                                                      |
| 404    | No tool by that name for this key                                                      | No                                                                                                      |
| 409    | idempotency_in_progress: the first request under this Idempotency-Key is still running | Yes, when it finishes                                                                                   |
| 422    | Well-formed but declined, with a code (see below)                                      | No, unless something changes                                                                            |
| 429    | Rate limited (600 a minute per key, REST and MCP together)                             | Yes, after `Retry-After`                                                                                |
| 5xx    | Could not be completed; the reason is never included                                   | Reads: yes, with backoff. Writes: only with an Idempotency-Key, otherwise check whether it landed first |

A 403 never says whether a client you cannot reach exists: tenancy is checked first.

## Codes you will meet most

Call `get_error_catalogue` with a code for its meaning, the fix and the tool to call next. With no code it lists them all.

| Code                                                                               | What it means                                                                                    | What to do                                                                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| invalid_input                                                                      | An argument the tool does not take, named in the message with the list of what it does take      | Remove it. Check discovery or `seolyticize describe <tool>`. Never guess a parameter.       |
| unknown_client                                                                     | No such client in this agency (a mistyped id)                                                    | `list_clients`                                                                              |
| client_archived                                                                    | The client is archived                                                                           | Use another client from `list_clients`, or ask the person whether it should be brought back |
| client_not_in_reach, out_of_reach                                                  | The key is pinned to another client                                                              | Use a key that reaches it                                                                   |
| permission_denied                                                                  | The role lacks the permission                                                                    | `whoami`; ask for a key with the right role                                                 |
| spend_cap_exceeded                                                                 | The call's quote is over its `maxCostMicros` (or the key's per-call ceiling). Nothing was bought | Re-quote, narrow the request, or agree a higher cap with the person                         |
| budget_exceeded, over_spend_limit                                                  | The client's monthly budget would be passed                                                      | Tell the person; only they decide to raise it (`set_budget`)                                |
| no_quote                                                                           | The tool has no quote here, so it cannot be dry-run                                              | Ask before calling it for real                                                              |
| no_vendor_account, no_vendor_credentials                                           | The agency has not connected the vendor                                                          | An admin connects it with `save_vendor_credential`; `get_vendor_connections` shows status   |
| vendor_balance_empty                                                               | The DataForSEO account has no money                                                              | The agency tops it up with the vendor                                                       |
| vendor_credentials_rejected, vendor_account_unverified, vendor_product_not_enabled | The vendor refused the agency's account                                                          | Fix it at the vendor, then `save_vendor_credential` again                                   |
| vendor_unavailable                                                                 | The vendor is down or limiting                                                                   | Try again later                                                                             |
| analytics_not_connected, not_connected                                             | GA4 or another source is not connected                                                           | `get_google_service_account`, then the connect tool; or `get_connection_link` for a person  |
| no_search_console_data                                                             | Search Console has no data for the range yet                                                     | `get_client_integrations` for the backfill's progress                                       |
| web_analytics_not_set_up                                                           | First-party analytics has no setup                                                               | `set_up_web_analytics`                                                                      |
| no_crawl, page_not_crawled                                                         | Nothing crawled yet                                                                              | `start_crawl`, then wait                                                                    |
| plan_limit                                                                         | The agency's plan allowance is used up                                                           | `get_billing`; the person decides                                                           |
| no_delivery_target                                                                 | An alert channel was named without its destination                                               | Add the webhook URL, emails or chat id                                                      |
| idempotency_key_reused                                                             | The key was used for a different tool or body                                                    | Use a new key for a new request                                                             |

When `next` is present, do that first. It is usually the exact tool to call.

## Spend

### Who pays

There is no shared vendor account. Paid calls run on the vendor accounts the agency connected (DataForSEO for search and keyword data; the AI assistant keys it added). A charge lands on the agency's own bill with that vendor. `get_vendor_connections` (admin) says which are connected.

### Which calls cost money

- Permission `spend:incur`: the call can buy data. Only manager, site_admin and admin keys can make it.
- `spends: true` in discovery: the call can cost money. It includes the `spend:incur` tools and a few readers that buy on a cache miss, such as `get_domain_facts`.
- Everything else is free. Tool descriptions end in "Free." when they are.

### Quote, agree, cap

1. Quote: `estimate_cost` with `{"tool": "<name>", "arguments": {…exact arguments…}}`. It is free and refuses arguments the target tool would refuse, so the quote is for a call that can actually run. Or call the paid tool itself with `dryRun: true`, which buys nothing and returns the same quote (a tool with its own dry run also returns what it would do).
2. Read `estimatedMaxMicros`: a ceiling, never an average, in micro-USD (1,000,000 = $1). `purchases` lists each purchase with its own ceiling; `monthlyMicros` is the cost of a month of scheduled work, or null.
3. Agree: tell the person the figure in dollars before anything non-trivial. A few cents for a lookup they asked for is fine to mention in passing; a batch, a schedule or anything over about a dollar needs a yes first.
4. Cap: call with `maxCostMicros` set to the quote. A purchase that would take the call past it is refused before it is bought. A key can also carry a per-call ceiling (`create_api_key` maxCostUsdPerCall); the lower one wins.

Rank trackers and AI visibility checks spend on a schedule. Quote a tracker with `estimate_cost` and `{"tool": "rank_tracker", "arguments": {"clientId", "trackerId"}}` and read `monthlyMicros`; quote AI visibility with `estimate_ai_visibility_cost`. Every keyword added to a tracker is a paid lookup on every future run.

### What a paid result tells you

A paid result carries `spend`: `spentMicros`, `purchases`, `freeAnswers` (answered from the archive), `oldestAnswerAt`, and for a client with a budget `monthToDateMicros`, `monthlyBudgetMicros` and `remainingMicros`. REST `meta` adds `costMicros`, `cached` (true when nothing was bought) and `cachedFrom`. Report what it actually cost.

### Spending less

- The shared archive answers a repeat for free while it is fresh: about a day for live SERPs and Chrome UX data, a week for domain overviews and competitors, 30 days for keyword volumes, ideas and backlink spam scores. `get_price_list` gives the price and freshness of every operation.
- Refining what was bought is free: re-filter or re-sort what you already have, store bought metrics on a keyword list and read it with `query_keyword_list`, rather than buying the expansion again.
- Prefer free first-party sources (Search Console, GA4, the crawl, first-party analytics) over paid estimates for the client's own site.
- Narrow requests: fewer seeds, a smaller limit, one market.

### Budgets

A client can carry a monthly budget (`set_budget` with `monthlyUsd`, and `alertAt` 0 to 1 for a one-off warning that month; or `monthlyBudgetUsd` on `create_client` / `update_client`). Each purchase claims its share before it is made, so concurrent calls cannot slip past it, and a failed vendor call releases its claim. A refusal for budget is the person's decision, not something to work round. Spend reading and vendor reconciliation are in the spend-and-costs skill.
