---
name: spend-and-costs
description: Control and explain what Seolyticize spends on the agency's own DataForSEO and AI vendor accounts - quote calls before making them, set client budgets and alerts, read a budget and its month-end forecast with get_budget_status, read get_costs and get_client_costs, reconcile the vendor balance with get_vendor_reconciliation and explain any gap, and keep paid calls low. Use for "how much will this cost", "cap this client at $50", "what are we spending", "how much budget is left", "will this client go over", "which client costs most", "why did our DataForSEO balance drop" or "cut our data costs".
license: MIT
metadata:
  author: Seolyticize
  version: "1.1"
---

# Spend and costs

Outcome: the person knows what a piece of work will cost before it runs, what was spent and on what, whether the vendor's bill matches the ledger, and how to spend less. Load the seolyticize skill first; its `references/errors-and-spend.md` has the full quote and refusal rules.

Amounts: quotes and caps are micro-USD (1,000,000 = $1). `get_budget_status`, `get_costs`, `get_client_costs` and `get_vendor_reconciliation` answer in US dollars. Convert before telling the person, and say which you are quoting.

Reading spend needs `cost:view` (manager, admin). Setting budgets needs `client:manage`. Seeing vendor connections needs an admin. Check with `whoami`.

## A. Before a paid call: quote, agree, cap

1. `get_client_brief` for the client's context, including any budget already noted.
2. Quote it. Use `estimate_cost` with `tool` and the exact `arguments`, or call the paid tool with `dryRun: true`. Neither buys anything. For scheduled work:
   - a rank tracker: tool rank_tracker, with `clientId` and `trackerId`; read `monthlyMicros`;
   - AI visibility: `estimate_ai_visibility_cost`. It prices the Claude answers it meters, and counts answers from other assistants, which bill the agency's own accounts at their own prices.
3. Tell the person the ceiling (`estimatedMaxMicros`, a maximum, not an average) and, for schedules, the month. Get a yes for anything beyond a small lookup they asked for.
4. Call with `maxCostMicros` set to the quote. If it is refused with spend_cap_exceeded, nothing was bought: narrow the request or agree a new figure.
5. Report what it cost from the result's `spend` (`spentMicros`, `freeAnswers`) or REST `meta.costMicros` and `meta.cached`.

`get_price_list` shows every paid operation's top price and how long its answer stays free in the shared archive. Use it for "what does X cost" when there are no arguments yet.

## B. Budgets

1. `get_budget_status` with `clientId` first. It is free and buys nothing:
   - `budget`: `monthlyLimitUsd`, `spentThisMonthUsd`, `remainingUsd`, `resetsAt` (the first of next month, UTC) and `alertAtPct`. Null means no budget is set, so paid calls are not capped; `spentThisMonthUsd` is still given beside it.
   - `projection`: an estimate of month-end spend (`projectedMonthEndUsd`) from the paid work already scheduled: each rank tracker's cadence, keywords and devices, AI visibility checks on their cadence, and alert rules with `paidSource` on. Each item is the same ceiling `estimate_cost` quotes for a month, taken pro rata for the days left, so the real month usually ends lower. `overBudget` says whether it passes the budget; `unpriced` lists scheduled work it could not price, with the reason.
   - Always call the projection an estimate. On-demand calls are not in it.
2. `get_client_costs` for the client's last 30 days, to set a realistic figure.
3. `set_budget` with `clientId`, `monthlyUsd` (null removes it) and `alertAt` between 0 and 1 (for example 0.8: a budget.threshold event and alert fire once that month). Leave either out to keep it as it is.
4. A per-call ceiling belongs to a key, not a client: `create_api_key` with `maxCostUsdPerCall`. Suggest it for automations and assistants.
5. If `projection.overBudget` is true, say so before the month runs out: name the items driving it (the dearest come first) and quote the cheaper schedule with `estimate_cost` (tool rank_tracker) or `estimate_ai_visibility_cost`. Paid work past the budget is refused, so late-month captures would be skipped.
6. Purchases claim budget before they are made, so parallel calls cannot overshoot, and a failed vendor call gives its claim back. When a call is refused for budget, report it. Raising the budget is the person's decision.

## C. Reading what was spent

1. `get_costs` with `sinceDays` (default 30): spend and request counts per client across the agency. Use it for "which clients cost the most".
2. `get_client_costs` with `clientId` and `sinceDays`: one client by operation. Use it for "what are we paying for on this account".
3. To find what is driving it, look at the operations at the top:
   - SERP and rank operations usually come from tracked keywords. `list_rank_trackers` and `list_tracked_keywords` show the cadence and size. A daily tracker of 500 terms costs about seven times a weekly one.
   - AI visibility answers come from the schedule: `get_ai_visibility_setup` shows it.
   - Keyword and domain research is one-off. Check whether the same seeds or domains were bought repeatedly.
   - Paid alert sources (`paidSource` on competitor-new-keywords and web-mentions alerts) buy on each sweep: `list_alert_rules` shows them.
4. Compare with the client's budget and its forecast: `get_budget_status`.

## D. Reconciling the vendor bill

Use when the DataForSEO balance fell by more than `get_costs` shows, or the person asks whether the ledger is complete.

1. `get_vendor_reconciliation` (agency-wide key; a client-pinned key is refused with agency_wide_key_needed). It reads DataForSEO's free account endpoint and sets it beside the ledger:
   - `account`: deposited, balance and spent (deposited less balance) on the vendor's side;
   - `ledger`: what Seolyticize recorded on the same account: `totalUsd`, `thisAgencyUsd`, `unlabelledUsd`, `otherAgenciesOnKeyUsd`, `firstRecordedAt`, and `byOperation`;
   - `differenceUsd`: vendor spent less ledger total. Positive means spend the ledger did not record;
   - `agreesWithinCents`;
   - `today`: the vendor's current day per API beside the ledger since that day began (both from UTC midnight). This is the only place a gap can be pinned to one API;
   - `explanation`: the likely reasons, most likely first.
2. Interpret the gap. Lead with what `explanation` says, then check:
   - **Spend before the ledger began.** If the account is older than `firstRecordedAt`, its lifetime spend includes money spent before Seolyticize recorded anything. A large, stable gap with today agreeing is usually this. It is not a leak.
   - **The same login used outside Seolyticize.** Scripts, another tool or a person using the login show up as vendor spend with no ledger rows. Look for an API in `today.byApi` where the vendor's figure is above the ledger's. Ask the person who else holds the login. A separate DataForSEO login for Seolyticize makes this go away.
   - **Other agencies on the same login.** `otherAgenciesOnKeyUsd` and `agencies` say how much was recorded for others (a sum, never who).
   - **Unlabelled rows.** `unlabelledUsd` is this agency's spend from before the paying account was recorded on each row. It is counted, just not attributed.
   - **Negative difference** (ledger above vendor): usually rows written before the paying account was recorded that were really spent on a different login (the key was changed), or a refund or bonus that DataForSEO counts in its deposits.
   - **Same-day check.** When the lifetime figures disagree but `today` agrees, the gap is historical. When `today` disagrees, it is happening now: name the API.
   - If `account` figures are null, the vendor gave none, so the two cannot be compared. Say so; do not report agreement.
3. On the platform's shared key, only a platform admin may reconcile. Say that rather than guessing.

## E. Keeping paid calls low

- **Reuse the archive.** A repeat within the freshness window is free: about a day for live SERPs, a week for domain overviews and competitors, 30 days for keyword metrics (see `get_price_list`). Batch related questions into one day rather than spreading them out.
- **Refine, do not re-buy.** Re-filter or re-sort what was already bought. Keep bought keyword metrics on a list (`create_keyword_list`, `add_keywords_to_list`) and read them with `query_keyword_list`. Only `refresh_keyword_list_metrics` buys again.
- **Dry-run everything first.** `dryRun: true` costs nothing and shows the bill.
- **Use free first-party data** for the client's own site: Search Console, GA4, first-party analytics and the crawl, before paid estimates.
- **Right-size schedules.** Weekly rather than daily rank tracking for stable terms, fewer AI questions or assistants, `paidSource` off where the free signal will do. Quote the change with `estimate_cost` (tool rank_tracker) to show the saving.
- **Cap automations.** Give every automation its own key with `maxCostUsdPerCall`.

## What to hand back

- The figure first, in dollars, and whether it is a quote (a maximum) or what was actually spent, with the period.
- For spend: the top clients or operations, each with cost and request count, and the one or two changes that would cut it most, with the saving quoted.
- For a budget: what is left, when it resets, and the month-end estimate, labelled as an estimate, with the scheduled work behind it.
- For reconciliation: agrees or not, the difference, the most likely reason from the evidence, and what the person should check (for example who else holds the login). Never call a gap a leak without evidence.
- Anything unknown (vendor gave no figure, no budget set) stated as unknown.
- Record conclusions in the client brief's research log with `update_client_brief` when they concern one client.
