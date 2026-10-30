# Seolyticize agent skills

SEO workflows for coding and chat agents, over the [Seolyticize](https://seolyticize.com) MCP server. Every skill is a folder with a `SKILL.md` in the open [Agent Skills](https://agentskills.io) format, so the same files work in Claude, Codex, Cursor, GitHub Copilot, Gemini and Antigravity, Kiro, Cline, OpenCode, Goose and any other agent that reads them.

## Skills

| Skill | Use it for |
| --- | --- |
| [`ai-visibility-audit`](skills/ai-visibility-audit/SKILL.md) | Audit a client's visibility in AI assistants with Seolyticize. Covers whether ChatGPT, Claude, Perplexity, Gemini, Copilot and Google AI Overviews or AI Mode recommend the client, which rivals and sources they name instead, GEO readiness per engine, agent readiness (llms.txt, AI crawler access) and the brand entity, then what to change. Keeps measured citations apart from readiness heuristics. Use for "AI visibility", "are we in ChatGPT", "GEO audit", "LLM SEO", "why don't assistants recommend us". |
| [`alerts-and-monitoring`](skills/alerts-and-monitoring/SKILL.md) | Set up and run monitoring for a Seolyticize client - alert rules and where they deliver (email, Slack, webhook, Telegram), the default alerts, crawl schedules, deploy checks and deploy hooks, change detection between crawls, traffic anomalies, signed webhooks for events, and the weekly digest. Use for "tell me when rankings drop", "set up alerts", "this alert is too noisy", "crawl nightly", "did the release break anything", "send events to our system" or "why didn't my webhook fire". |
| [`analytics-and-conversions`](skills/analytics-and-conversions/SKILL.md) | Measure what search earns a Seolyticize client - read Search Console and GA4, install the cookieless first-party analytics snippet, define goals and funnels, collect server-side with issue_server_collect_key and visit tokens, record orders from any store with record_order / record_orders, and attribute revenue with get_seo_revenue. Use for "set up tracking", "what did organic earn", "count sign-ups", "which pages make money", "track AI agents server-side", "log orders against visits" or "what is SEO worth". |
| [`client-onboarding`](skills/client-onboarding/SKILL.md) | Set up a new SEO client in Seolyticize end to end - create the client, write its brief from the website, connect Search Console, GA4 and first-party analytics, add the default alerts, schedule crawls, run the first crawl and start rank tracking, then confirm with get_next_steps. Use when someone says "onboard a new client", "add a client", "set up acme.com", "we just signed X" or "connect their Search Console". |
| [`competitor-analysis`](skills/competitor-analysis/SKILL.md) | Work out who a Seolyticize client really competes with in search and where each rival wins. Covers search competitors and share of voice, keyword, content and link gaps, what competitors just published or changed, and which brands AI assistants name and cite instead of the client. Use for "competitor analysis", "who are we up against", "why is X beating us", "competitor gap", "what are competitors publishing", "share of voice", "who does ChatGPT recommend". |
| [`content-brief-and-write`](skills/content-brief-and-write/SKILL.md) | Brief, draft, score and fix a page for a Seolyticize client. Profile what ranks, build a content brief for the right page type, draft or rewrite sections, then score the draft for coverage, draft quality, keyword placement, E-E-A-T and page-type fit against the results page. Also covers comparison pages and checks on programmatic template pages. Use for "write a brief", "draft an article", "is this ready to publish", "score this content", "why doesn't this page rank", "write a vs page", "are our location pages thin". |
| [`content-opportunities`](skills/content-opportunities/SKILL.md) | Decide which content work to do first for a Seolyticize client. Covers pages close to the top three, decaying and stale pages, pages cannibalising each other, competitor topic gaps, topical authority and templated meta descriptions. Ends in a prioritised plan of updates, merges and new pages. Use for "content plan", "what should we write or update", "quick wins", "content audit", "why is this page losing traffic", "what to refresh this month". |
| [`deploy-check`](skills/deploy-check/SKILL.md) | Check a release for SEO damage before and after it ships, with Seolyticize. Runs check_deploy against a deploy preview or staging, compare_sites between staging and production (including www/apex redirect behaviour), sets up the GitHub Action that fails a pull request, and watches for rollback signals after release. Use for "will this deploy hurt SEO", "check the preview", "is staging ready to go live", "did the release noindex anything", "SEO check in CI", "should we roll back". |
| [`keyword-research`](skills/keyword-research/SKILL.md) | Research and shortlist keywords for a Seolyticize client. Start from near-misses the site already ranks 4–20 for in Search Console, expand seeds within a quoted budget, judge difficulty for this site from the real results page, check intent, cluster, forecast, then save the shortlist and the page that owns each keyword. Use for "keyword research", "find keywords", "what should we target", "content ideas", "which keywords can we win". |
| [`link-building`](skills/link-building/SKILL.md) | Find, win and keep links for a Seolyticize client. Prospects come from competitors' linkers, broken and lost links to reclaim, unlinked mentions, resource pages and journalist requests, with outreach previewed as a dry run before anything is sent. Also checks link health — profile score by industry, toxic links and whether to disavow, velocity red flags and link networks. Use for "link building", "backlink prospects", "outreach", "lost links", "toxic backlinks", "should we disavow", "link profile health", "journalist requests". |
| [`local-seo`](skills/local-seo/SKILL.md) | Audit and improve a business's local search with Seolyticize. Covers the local SEO audit with its Google Business Profile checklist and duplicate listings, map-pack grid scans (sizes, cost, share of local voice), NAP consistency and directory citations, and reviews across Google, Tripadvisor and Trustpilot, with reply drafts that respect healthcare and legal rules. Also changes the listing itself (hours, description, phone, website, categories, attributes) and publishes posts on it, previewed as a dry run first. Use for "local SEO audit", "map pack", "grid scan", "Google Business Profile", "NAP", "citations", "reply to our reviews", "update our opening hours", "post on our Google listing". |
| [`monthly-client-report`](skills/monthly-client-report/SKILL.md) | Write and deliver the monthly SEO report a client actually reads - what changed, why, what it earned and what happens next - from Seolyticize evidence (one get_report_data read for the period first), following the agency's report template, saved as a written report, and sent or scheduled. Covers report templates, saved data reports, schedules, sending, and share links (listing and revoking them too) only when asked. Use for "monthly report", "client update", "write up October's results", "send Acme their report" or "make this our report format". |
| [`rank-tracking-review`](skills/rank-tracking-review/SKILL.md) | Review how a Seolyticize client's tracked keywords moved and why. Covers positions and their spread, ranking-URL swaps, SERP features and AI Overviews, Google AI Mode citations, the desktop and mobile split, volatility, Google updates and timeline annotations, with what to do about each pattern. Use for "how are rankings", "what dropped", "rank report", "why did we lose positions", "is it us or Google", "do we show in AI Mode". |
| [`seo-audit-fix`](skills/seo-audit-fix/SKILL.md) | For a coding agent working inside a website's own repository. It turns a Seolyticize audit into code changes — map each issue to the template and file that renders it, fix it, verify on the preview and the live site with check_deploy and compare_sites, then tell search engines which URLs changed. Covers Next.js, WordPress, Shopify themes and plain HTML. Use for "fix the SEO issues", "fix the audit in the code", "why is this page not indexed", "fix our canonicals/titles/schema". |
| [`seo-weekly-loop`](skills/seo-weekly-loop/SKILL.md) | Run the weekly SEO check-in for one client with Seolyticize. Covers what moved (rankings, Search Console, analytics and revenue, audit diffs, alerts), why it moved, this week's three to five actions, and a short plain-words note for the client. Starts from get_next_steps and the client brief, and records the week in the brief. Use for "weekly SEO check", "what changed this week", "Monday review", "what should we work on this week", "weekly client update". |
| [`seolyticize`](skills/seolyticize/SKILL.md) | The foundation for any work with Seolyticize, the SEO platform for agencies. How to connect (hosted MCP server, API key, CLI, TypeScript/Python/Go SDKs), the rules every call follows (money, dryRun, quotes, idempotency, strict arguments, error codes with next steps, honest nulls), and which task skill to load next. Use whenever a request mentions Seolyticize, an SEO client, "connect to Seolyticize", "which tool do I use", or any SEO job run through it. |
| [`spend-and-costs`](skills/spend-and-costs/SKILL.md) | Control and explain what Seolyticize spends on the agency's own DataForSEO and AI vendor accounts - quote calls before making them, set client budgets and alerts, read a budget and its month-end forecast with get_budget_status, read get_costs and get_client_costs, reconcile the vendor balance with get_vendor_reconciliation and explain any gap, and keep paid calls low. Use for "how much will this cost", "cap this client at $50", "what are we spending", "how much budget is left", "will this client go over", "which client costs most", "why did our DataForSEO balance drop" or "cut our data costs". |
| [`technical-audit`](skills/technical-audit/SKILL.md) | Run and triage a technical SEO audit of a client's site with Seolyticize. Crawl, rank issues by impact, check index coverage, URL inspection, sitemaps, Core Web Vitals (field and lab), JavaScript rendering, structured data, hreflang and agent readiness, then accept the intentional findings, route fixes to owners and turn the rest into tasks grouped by template. Use for "audit the site", "technical SEO audit", "why isn't it indexed", "what is broken on the site", "crawl the site". |

## Publishing skills

Skills that take Seolyticize's findings all the way to published pages, together with [Forumulate](https://forumulate.com). The same skill is in [Forumulate/skills](https://github.com/forumulate/skills).

| Skill | Use it for |
| --- | --- |
| [`seo-engine`](publishing-skills/seo-engine/SKILL.md) | For a coding agent working inside a site's repo. It runs a daily check and a weekly SEO loop with Seolyticize, then writes and refreshes posts and publishes them to a Forumulate blog with no human in the loop. Every product claim is traced to a file and line in the repo, drafts are scored against the pages that rank, and gates cover cannibalisation, spend and cadence. Changes that need code are never applied automatically: they go to a Discord webhook. Configured per site with `.seo-engine.json`. Use for "run the SEO loop", "weekly SEO", "daily SEO check", "write SEO content", "publish to the Forumulate blog". |

Publishing skills sit outside `skills/`, so install them by path:

```sh
npx skills add https://github.com/Seolyticize/skills/tree/main/publishing-skills/seo-engine
```

## Connect the server

The skills call Seolyticize's tools, so the agent needs the server: `https://seolyticize.com/api/mcp` (Streamable HTTP). The first call opens a browser to sign in and choose which agency, role and clients the agent may use. Where a browser is not available (CI, a headless box), use an API key from Settings → API keys as `Authorization: Bearer $SEOLYTICIZE_API_KEY`, or the CLI's stdio bridge: `npx -y @seolyticize/cli mcp`.

## Install

### Any agent: `npx skills`

```sh
npx skills add Seolyticize/skills            # pick the agents to install for
npx skills add Seolyticize/skills -g --all   # every skill, every agent, for your user
```

### Claude Code

```
/plugin marketplace add Seolyticize/skills
/plugin install seolyticize@seolyticize
```

The plugin brings the skills and the server. Skills only: copy `skills/*` into `~/.claude/skills/`, and add the server with `claude mcp add --transport http seolyticize https://seolyticize.com/api/mcp`.

### Claude (claude.ai, Desktop) and the Claude API

Download a skill's zip from the [latest release](https://github.com/Seolyticize/skills/releases/latest) — for example [`seolyticize.zip`](https://github.com/Seolyticize/skills/releases/latest/download/seolyticize.zip) — and upload it under Customize → Skills (+), or Settings → Capabilities → Upload skill in older apps; custom skills need a paid plan with code execution on. Add Seolyticize as a custom connector (`https://seolyticize.com/api/mcp`) under Settings → Connectors. On the API, upload the same zip through the Skills API (`/v1/skills`, shared across the workspace) and pass the server as an MCP connector.

### OpenAI Codex

```sh
codex mcp add seolyticize --url https://seolyticize.com/api/mcp && codex mcp login seolyticize
npx skills add Seolyticize/skills -a codex
```

Or, in a session opened in a clone of this repository, install the plugin from `/plugins` (`.agents/plugins/marketplace.json`).

### Cursor

[Add the server](cursor://anysphere.cursor-deeplink/mcp/install?name=seolyticize&config=eyJ1cmwiOiJodHRwczovL3Nlb2x5dGljaXplLmNvbS9hcGkvbWNwIn0=), then `npx skills add Seolyticize/skills -a cursor`, or import this repository as a team marketplace (`.cursor-plugin/`) to get the skills, the rule and the server together.

### GitHub Copilot (VS Code, Copilot CLI, cloud agent)

```sh
npx skills add Seolyticize/skills -a github-copilot
```

That puts the skills in `.github/skills/` (project) or `~/.copilot/skills/` (`-g`). Add the server to `.vscode/mcp.json`:

```json
{ "servers": { "seolyticize": { "type": "http", "url": "https://seolyticize.com/api/mcp" } } }
```

### Gemini CLI and Antigravity CLI

```sh
gemini extensions install https://github.com/Seolyticize/skills
agy plugin import gemini        # Antigravity: brings installed Gemini extensions across
```

The extension carries the skills, the server and a `GEMINI.md`. For Antigravity alone, `npx skills add Seolyticize/skills -a antigravity` (skills in `.agents/skills/`) and add the server to its MCP config.

### Kiro, Cline, OpenCode, Goose, Windsurf and others

`npx skills add Seolyticize/skills -a <agent>` (`kiro-cli`, `cline`, `opencode`, `goose`, `windsurf`, …; `npx skills add --help` lists them), then add `https://seolyticize.com/api/mcp` in the agent's MCP settings. Any agent without skills support can read `AGENTS.md` here.

## Also

- [TypeScript SDK](https://github.com/Seolyticize/sdk-typescript) (`npm i @seolyticize/sdk`), [Python](https://github.com/Seolyticize/sdk-python), [Go](https://github.com/Seolyticize/sdk-go), [CLI](https://github.com/Seolyticize/cli) (`npm i -g @seolyticize/cli`).
- [Docs](https://seolyticize.com/docs) · [llms-full.txt](https://seolyticize.com/llms-full.txt)

The skills are generated from the Seolyticize monorepo, where a test checks that every tool a skill names exists. License: MIT.
