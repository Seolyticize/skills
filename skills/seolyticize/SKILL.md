---
name: seolyticize
description: The foundation for any work with Seolyticize, the SEO platform for agencies. How to connect (hosted MCP server, API key, CLI, TypeScript/Python/Go SDKs), the rules every call follows (money, dryRun, quotes, idempotency, strict arguments, error codes with next steps, honest nulls), and which task skill to load next. Use whenever a request mentions Seolyticize, an SEO client, "connect to Seolyticize", "which tool do I use", or any SEO job run through it.
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Working with Seolyticize

Seolyticize is one catalogue of tools (rank tracking, audits, Search Console, GA4, backlinks, keyword research, AI visibility, reports) for every client an agency manages. REST, MCP, the SDKs and the CLI all call the same registry, with the same permission checks, validation and error codes. Learn the rules once here, then load the task skill for the job.

## 1. Get connected

Pick the first one that fits:

| You are                                                                                | Use                               | How                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An assistant whose host supports MCP sign-in (Claude, ChatGPT, Codex, Cursor, VS Code) | Hosted MCP server with OAuth      | Add `https://seolyticize.com/api/mcp` as an HTTP MCP server. The person signs in and chooses the agency, a role and which clients. No key to handle.                                              |
| An MCP host that cannot sign in, but can send headers                                  | Hosted MCP server with an API key | Same URL, with the header `Authorization: Bearer <key>`.                                                                                                                                          |
| An MCP host that only launches local commands                                          | The CLI as a stdio relay          | `npm i -g @seolyticize/cli`, then the command `seolyticize mcp` (optionally `--group onboarding`, `weekly`, `technical`, `research` or `reporting`), with SEOLYTICIZE_API_KEY in its environment. |
| A script, CI job or terminal                                                           | The CLI                           | `npm i -g @seolyticize/cli`, then `printf '%s' "$KEY" \| seolyticize login`, or set SEOLYTICIZE_API_KEY.                                                                                          |
| Code you are writing                                                                   | An SDK                            | TypeScript: `npm install @seolyticize/sdk`. Python: `pip install "git+https://github.com/Seolyticize/sdk-python"`. Go: `go get github.com/Seolyticize/sdk-go`.                                    |
| Anything else                                                                          | REST                              | `POST https://seolyticize.com/api/v1/tools/{name}` with the tool's input as the JSON body.                                                                                                        |

Exact setup lines for each host, and the call shapes for REST, SDKs and CLI, are in `references/calling.md`. Read it before writing code or a config file.

Keys are made in the app (Settings, then API keys) or with `create_api_key`. The secret is shown once. Never put a key in a file you commit, in a URL, or in a chat message; keep it in an environment variable. A key pinned to one client can only ever see that client, which is the safe choice for an assistant that works for one customer.

## 2. First calls in any session

1. `whoami`: the agency, the role, every permission it holds, and which clients it can reach. If the task needs a permission the role lacks (for example `client:manage` to create a client, `spend:incur` to buy data, `cost:view` to read spend), say so and stop rather than trying.
2. `list_clients`: client ids and names. Almost every tool takes `clientId`; never guess one. The CLI's `--client` accepts a name.
3. `get_client_brief`: what the agency already knows about the client (goal, audience, voice, competitors, the research log). Every workflow starts here, so the work builds on earlier findings, and ends by recording its conclusions in the research log (section 5).
4. `get_next_steps`: for a client, what is set up, what is missing, and the exact call for each gap.

When you do not know which tool does something:

- `find_tools` with the task in plain words returns the 5 to 10 tools for it, best first, with whether each costs money.
- `get_recipe` returns an ordered plan of calls with the client's arguments filled in. Its recipes are named weekly_review, new_article, technical_audit, site_migration, competitor_teardown and ai_visibility_baseline; call it with no name to list them.
- Discovery (`GET /api/v1/tools`, `seolyticize describe <tool>`, or the MCP tool list) gives each tool's exact JSON Schema. Read it before your first call to an unfamiliar tool.

## 3. The rules every call follows

Full detail, with the error-code table and spend arithmetic, is in `references/errors-and-spend.md`. Read it the first time a call is refused or before any paid work.

**Money.** Most tools are free reads. A tool marked `spends: true` (the `spend:incur` permission) buys data on the agency's own DataForSEO account, or another vendor account it connected. Before any paid call:

1. Quote it: `estimate_cost` with `{tool, arguments}` exactly as you would call it, or call the tool itself with `dryRun: true`. Both buy nothing.
2. Tell the person what it will cost at most (`estimatedMaxMicros`, in micro-USD: 1,000,000 is $1) and get agreement for anything non-trivial.
3. Call it with `maxCostMicros` set to the quote, so it cannot spend more.
4. Respect the client's monthly budget (`set_budget`; the month so far is in each paid result's `spend`). If the budget is the obstacle, say so; do not route round it.

Every paid tool takes `maxCostMicros` (up to $1,000); a purchase that would pass it is refused before anything is bought, with the code spend_cap_exceeded. Always pass it on a paid call.

Fresh answers are reused from a shared archive for a while (a day for live search results, up to 30 days for keyword metrics; `get_price_list` lists each), so a repeat within that window costs nothing. Refining what was already bought (re-filtering or re-sorting an expansion, reading metrics saved on a keyword list with `query_keyword_list`) is free: prefer it to buying again.

**Writes.** Bulk writes (tasks from an audit, keyword owners, client facts, outreach sends, URL submissions) take `dryRun: true`: run that first, show what would change, then run it for real after the person confirms. REST and SDK callers send an `Idempotency-Key` header on every write, named for what the call is for (`onboard-acme-2026-10-24`), so a retry after a timeout cannot do it twice. The TypeScript SDK adds one for you.

**Strict arguments.** A field a tool does not declare is refused with the code invalid_input, naming the field and listing what the tool takes. Never invent parameters. Common spellings are translated for you where the tool has the field: `target` for domain or url, `market` (`us-en`, `GB`), `country`, `cursor`, and `from`/`to` against `days`.

**Errors.** Every refusal carries a stable `code`, a sentence for the person, and often `next`: the call that fixes it. Follow `next` before anything else. `get_error_catalogue` explains any code. Retry a 429 after `Retry-After`; retry a 5xx only for read-only tools, or for a write that carried an `Idempotency-Key`.

**Honesty.** A missing measurement is `null` or absent, never `0`; a zero in an answer is a measured zero. Report nulls and "unmeasured" as unknown. When an answer says `partial`, `provisional`, `heuristic` or carries a `note`, pass that on with the figure. Never invent or round a number to fill a gap: say what is missing and which connection or call would measure it.

**No share links unless asked.** Never create a public link (`create_report_link`, `set_report_sharing`, `create_portal_link`) unless the person explicitly asks: anyone holding one can read the client's data without signing in.

**People-only steps.** Some steps need a human: signing in to a client's Google account, adding the agency's service account in Search Console or GA4, deploying a snippet, paying. Give the person the link or the exact steps, carry on with what you can, and check back later.

## 4. Which skill to load next

| The job                                                               | Skill                     |
| --------------------------------------------------------------------- | ------------------------- |
| A new client from nothing to tracked, crawled and connected           | client-onboarding         |
| The weekly pass over a client: what moved, why, what to do            | seo-weekly-loop           |
| A full technical audit of a site                                      | technical-audit           |
| Turning audit findings into fixes and tasks                           | seo-audit-fix             |
| Checking a release or preview before it ships                         | deploy-check              |
| Finding keywords worth targeting                                      | keyword-research          |
| Finding content gaps and pages to create or refresh                   | content-opportunities     |
| A content brief, then a draft written to it                           | content-brief-and-write   |
| Reading rank tracking: movers, page one, cannibalisation              | rank-tracking-review      |
| Who competes and how to beat them                                     | competitor-analysis       |
| Backlinks, link risk, prospects and outreach                          | link-building             |
| Local search: Business Profile, grids, reviews, NAP                   | local-seo                 |
| How AI assistants describe and cite the brand                         | ai-visibility-audit       |
| Search Console, GA4, first-party analytics, goals, orders and revenue | analytics-and-conversions |
| The monthly report the client reads                                   | monthly-client-report     |
| Budgets, quotes, what was spent, reconciling the vendor bill          | spend-and-costs           |
| Alerts, crawl schedules, change detection, webhooks                   | alerts-and-monitoring     |

If a job is not on this list, use `find_tools` and `get_recipe`.

## 5. Record what you learned

When a piece of work ends with conclusions the next one should start from, add a research entry to the brief with `update_client_brief` (kind research, a title and a short body). Note releases and campaigns on the client's timeline with `add_annotation` so later traffic changes can be read as cause and effect.

## What to hand back

- One or two lines answering the question, then the evidence: the figures, the tool each came from, and the period.
- What is unknown and why (not connected, not crawled yet, partial data), never filled with a guess.
- What anything cost, or that it was free.
- The next steps, in priority order, each with the call that does it and whether it costs money or needs a person.
