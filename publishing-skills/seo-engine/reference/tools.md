# Seolyticize tools the engine uses

Generated from `GET /api/v1/tools` on 2026-10-30. `*` = required, `$` = can spend (seo.mjs quotes and caps it). Unknown arguments are a 422 `invalid_input`. Re-check a schema with:

```bash
python3 -c "import json,os;t=json.load(open(os.path.expanduser('~/.local/state/seo-engine/tools.json')))['<tool>'];print(json.dumps(t['inputSchema'],indent=1))"
```

## Onboarding

- `list_clients`: (clientId only)
- `get_client`: (clientId only)
- `onboard_site`: domain*, name, framework=nextjs|astro|remix|sveltekit|nuxt|html|wordpress|other, keywords, verification=file|meta|dns
- `verify_site`: (clientId only)
- `get_next_steps`: (clientId only)
- `set_budget`: monthlyUsd, alertAt
- `update_client_brief`: overview, goal, positioning, audience, voice, add, update, remove, brandTerms
- `get_client_brief`: (clientId only)
- `set_client_facts`: facts*, dryRun
- `propose_keyword_owners`: days, limit, seed
- `set_keyword_owners`: owners*, source=manual|search_console, dryRun
- `list_keyword_owners`: url
- `get_keyword_metrics` $: engine=google|bing|amazon|youtube, keywords*, locationCodes, locationName, languageCode, clickstream, maxCostMicros, dryRun
- `keyword_explorer` $: seed*, mode=ideas|suggestions|related|questions, locationCode, languageCode, filters, sort, page, pageSize, format=rows|csv, maxCostMicros, dryRun
- `add_tracked_keywords`: trackerId*, terms*
- `add_competitors`: trackerId*, domains*
- `update_rank_tracker`: trackerId*, name, device=desktop|mobile|both, frequency=daily|weekly|monthly|manual, runHour, runDay, depth, match=domain|subdomains|prefix, urlPrefix
- `set_up_web_analytics`: hostnames, excludePaths, includePaths
- `set_crawl_settings`: stripParams, extractions, render=off|shells|all, renderMaxPages, mode=spider|list|sitemap, listUrls, includePatterns, excludePatterns, userAgent, requestsPerSecond, concurrency, maxDepth, maxPages
- `create_alert_rule`: kind*, threshold*, cooldownHours, webhookUrl, channel=slack|webhook|email|telegram, emailRecipients, telegramChatId, paidSource
- `list_alert_rules`: (clientId only)
- `create_deploy_hook`: sitemapUrl
- `estimate_cost`: tool*, arguments

## Daily

- `list_recent_alerts`: since*
- `get_index_coverage`: (clientId only)
- `inspect_url`: url*
- `compare_crawls`: crawlId, againstCrawlId, sample
- `get_seo_changes`: crawlId, againstCrawlId, fields, severity=critical|warning|notice, template, limit
- `list_crawls`: limit
- `get_crawl_status`: crawlId*

## Weekly: what moved

- `get_search_changes`: days, compare=previous|year, searchType=web|image|video|news|discover|googleNews, dimension=query|page, brand=all|branded|non_branded, country, device=DESKTOP|MOBILE|TABLET, minImpressions, limit
- `get_brand_split`: searchType=web|image|video|news|discover|googleNews, from, to, interval=day|week|month, country
- `get_query_page_swaps`: days, compare=previous|year, searchType=web|image|video|news|discover|googleNews, brand=all|branded|non_branded, minImpressions, limit
- `get_search_timeline`: searchType=web|image|video|news|discover|googleNews, from, to
- `get_search_console_performance`: searchType=web|image|video|news|discover|googleNews, from*, to*, country, device=DESKTOP|MOBILE|TABLET, dimensions, page, query

## Weekly: opportunities

- `get_opportunities`: limit
- `striking_distance`: days, minPosition, maxPosition, minImpressions
- `get_low_ctr_queries`: days, minImpressions, limit
- `get_ctr_outliers`: days, minImpressions, sigma, limit
- `get_content_decay`: (clientId only)
- `get_freshness_queue`: limit
- `get_cannibalization`: (clientId only)
- `get_long_tail_candidates`: days, minImpressions, limit
- `get_content_audit`: verdict=keep|update|merge|review|no_search_data, limit

## Weekly: technical

- `start_crawl`: (clientId only)
- `wait_for_job`: jobId*, timeoutSeconds
- `get_audit_summary`: crawlId, indexableOnly
- `get_issue_templates`: crawlId, ruleId, indexableOnly
- `list_crawl_issues`: crawlId, indexableOnly
- `get_parameter_report`: crawlId
- `suggest_meta_tags` $: crawlId, urls, problems, limit, format=rows|csv, maxCostMicros, dryRun

## Content

- `cluster_keywords` $: keywords, listId, minShared, depth, mode=head|connected, locationCode, languageCode, maxCostMicros, dryRun
- `research_topic` $: seed*, limit, serp, locationCode, languageCode, maxCostMicros, dryRun
- `get_serp_content_profile` $: keyword*, depth, locationCode, languageCode, maxCostMicros, dryRun
- `build_content_brief` $: keyword*, relatedKeywords, targetUrl, pageType, depth, save, locationCode, languageCode, maxCostMicros, dryRun
- `score_content` $: keyword*, url, html, markdown, locationCode, languageCode, maxCostMicros, dryRun
- `simulate_serp_snippet`: url, title, description
- `suggest_internal_links`: crawlId, targetUrl, phrases, limit, format=suggestions|patch, sources
- `generate_schema`: url*, type, localBusinessType, openingHours, areaServed, shipping, returns
- `validate_structured_data`: url, crawlId, limit
- `check_answer_readiness`: urls, topPages

## After publish

- `submit_indexnow` $: urls*, dryRun, maxCostMicros
- `queue_url_inspections`: urls*
- `add_annotation`: on*, kind*=deploy|publish|content_update|campaign|technical|note, title*, detail, url
- `get_client_costs`: sinceDays
