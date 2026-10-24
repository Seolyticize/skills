---
name: seo-audit-fix
description: For a coding agent working inside a website's own repository. It turns a Seolyticize audit into code changes: map each issue to the template and file that renders it, fix it, verify on the preview and the live site with check_deploy and compare_sites, then tell search engines which URLs changed. Covers Next.js, WordPress, Shopify themes and plain HTML. Use for "fix the SEO issues", "fix the audit in the code", "why is this page not indexed", "fix our canonicals/titles/schema".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Audit to fixes, in the codebase

**Who this is for:** an agent with the site's source open. The audit says what is wrong on the live site. This skill turns that into small commits, then proves on a preview and on production that the fix worked and nothing else broke.

**Never mark an issue fixed until a fresh read of the deployed page shows it gone.**

## Before you start

- **Client and site.**
  - Call `list_clients`, then `get_site_status`, to find the client whose domain this repository deploys.
  - If there is no complete crawl, call `start_crawl` and poll `get_crawl_status`.
  - For a staging site behind a login or a bot wall, call `set_crawl_auth` first.
- **Read the brief.** Call `get_client_brief` for the key pages, the voice for any copy, and earlier fix notes, so you do not redo or undo past work.
- **Paid calls.**
  - Quote with `estimate_cost` and tell the person the total.
  - Then pass the quote's estimatedMaxMicros as maxCostMicros, so the call cannot cost more than agreed.
  - Re-reading what is already stored is free, so prefer it to buying again.
- **What the site is built on.** Read the repository: `package.json`, `next.config.*`, `wp-content/`, `layout/theme.liquid`, or plain `.html` files. `get_domain_technologies` shows what the crawler detected on the live domain.
- **Permissions.** `check_deploy` and `compare_sites` need project:manage on the client. `whoami` shows what the key can do.
- **Lost?** `find_tools` finds a tool by intent. Errors carry a `code` and a `next` step, so follow `next`. Unknown arguments are refused (invalid_input), so never invent one.

## Workflow

### 1. Read the audit, by template

1. Call `get_audit_summary` (crawlId latest). It lists issues by rule, with severity, page count and howToFix. Accepted findings are listed apart. **Do not fix those**: someone decided they are intended. Check `list_accepted_issues` if unsure.
2. Call `get_issue_templates` to group each issue's pages by URL pattern. One pattern is usually one file.
3. Order the work:
   1. indexability (noindex, canonical, robots, status codes);
   2. redirects and broken internal links;
   3. titles, descriptions and headings;
   4. structured data;
   5. images and speed;
   6. hygiene.
4. If the site has several owners, `list_path_owners` says who owns which prefix. Only change code this repository actually renders. If a path is owned elsewhere (a hosted docs vendor, a separate shop), say so and leave it.
5. Optional: `create_tasks_from_audit` with dryRun true shows the tasks it would create. Create them, without dryRun, only if the user wants the work tracked on the platform.

### 2. Map each issue to a file

For each template-level issue:

1. **Pages.** `list_issue_pages` with the ruleId gives the URLs (paged; total is the full count).
2. **One page in full.** `get_page_issues` gives every issue on one example page. `get_page_details` shows what the crawler read: outline, structured data as written, redirects in, and what JavaScript changed.
3. **The source.** Search the repository for what renders that path: the route file, page template, layout, theme section or CMS template. The URL-to-file conventions per framework are in `references/fix-patterns.md`.
4. **State it before you edit.** Say which file you think it is and why, for example "`app/products/[slug]/page.tsx` renders /products/\*; `generateMetadata` has no canonical."

**Read `references/fix-patterns.md` now** for the issue-to-fix patterns in Next.js, WordPress, Shopify themes and plain HTML.

### 3. Fix

- **Fix the template, not the instance.** Make the smallest change that clears the rule across the whole template, usually in a shared layout or metadata helper. Do not hand-edit generated output.
- **Do not invent content.** Where a fix needs copy (a description, alt text, a heading), write it from what the page actually says and flag it for a person to review.
  - `suggest_meta_tags` drafts pixel-checked titles and descriptions for the crawl's missing, duplicate or overlong tags. It is a paid Claude call per 25 pages, so quote it with `estimate_cost` first.
  - `simulate_serp_snippet` checks new wording against Google's truncation, and is free.
- **Structured data.**
  - `generate_schema` writes JSON-LD for one page from what the page states, and never invents fields.
  - `validate_structured_data` with a url checks a page live. `validate_product_schema` checks shop products against merchant-listing rules.
  - Do not add FAQPage or HowTo for rich results. Google retired both.
- **Hreflang.** `generate_hreflang` writes the tags, or an hreflang sitemap for large groups.
- **Redirects** for moved or deleted URLs: `plan_redirect_map` returns the map as htaccess, an nginx map or CSV, ready to commit.
- **Speed.** `get_audit_performance` names the slow templates and the fixes, ranked by estimated saving. `page_lab` runs Lighthouse on one URL (it uses the agency's PageSpeed quota). Field data (`page_vitals`) only moves weeks after the fix ships, so do not claim a Core Web Vitals win from a lab run.
- **AI agent files.** `generate_llms_txt` and `draft_agent_files` draft llms.txt, robots.txt Content-Signal lines and ai-catalog.json. They are drafts only, nothing is published. Commit them where the framework serves static files.
- **Run the project's own checks** (build, lint, tests) the way the repository runs them. Keep each commit to one template fix with a message that names the rule.

### 4. Verify on the preview, before merge

1. **Check the preview.** Call `check_deploy` with previewUrl set to the deploy preview's origin. It fetches one or more pages per template from the latest crawl on the preview host and compares status, robots, canonical, hreflang, title, H1 and structured data with production's crawl snapshot.
   - passed is false when anything at or above failOn changed. The default failOn is critical: noindex added, canonical changed, title dropped, a page now 4xx or 5xx, hreflang lost, a page unreachable.
   - markdown is a ready pull-request comment.
   - Use urls instead of previewUrl to check only the pages you touched.
2. **Read every change.** The fix you meant should show as a change, and nothing else should. An unexpected critical change is a bug in your fix: revert or correct it before merge.
3. **Compare the whole origin** for a large change (a new layout, a framework upgrade, a migration). Call `compare_sites` with a as the preview and b as production.
   - If a's home redirects to b's host, or between www and the apex, redirect names it and nothing is diffed. Make sure that redirect is the intended canonical host.
4. **A protected preview** gets the client's crawl credentials. `check_deploy` sends them automatically. For `compare_sites`, set sendCrawlAuthTo to a.
5. **CI.** If the repository runs the Seolyticize GitHub Action, it calls `check_deploy` on every pull request. See the deploy-check skill for what fails a PR.

### 5. Verify on production, after deploy

1. **Check the live pages.** Call `check_deploy` with urls set to the live addresses you changed. Then call `get_page_issues` on two or three of them after the next crawl. For an urgent check, call `submit_urls` to queue them for a recrawl.
2. **After the next crawl,** `compare_crawls` should show the issue as fixed, or its count falling. `get_seo_changes` should show no new critical changes.
3. **Indexing.** For a page that matters, `inspect_url` asks Google what it now holds. It uses one of 2,000 inspections a day per property.

### 6. Tell the search engines what changed

Submit only URLs whose content or metadata actually changed. Each engine rations its attention.

- **Bing, Yandex, Seznam and Naver.** Call `submit_indexnow`, first with dryRun true. It needs the IndexNow key published (`get_site_status` shows this). Google does not take IndexNow.
- **Google.** Google picks changes up from the sitemap, so make sure lastmod moved for the changed pages (`validate_sitemap` checks lastmod honesty). Call `submit_sitemap` if the sitemap address itself is new.
- **Job postings and livestreams only.** For pages with JobPosting markup, or a BroadcastEvent inside a VideoObject, call `notify_google_indexing` (URL_UPDATED, or URL_DELETED when a vacancy is filled). Run it with dryRun first. Google refuses it for any other page, so **never use it for ordinary pages.**
- **Seolyticize's own crawler.** `submit_urls` queues the changed URLs to be recrawled sooner. dryRun true previews it.
- **Every deploy.** `create_deploy_hook` gives the pipeline one URL to call after each deploy. It diffs the sitemap and submits new and changed pages to IndexNow by itself.

### 7. Record

Call `update_client_brief` with a research entry: the rules fixed, the files changed, the commit or PR, and what is left. If a finding turned out to be intended, ask the user, then call `accept_issue` with the reason so it stops being flagged. Do not create share links for any report (`create_report_link`, `set_report_sharing`) unless asked, because anyone holding the link can read it.

## Honesty rules

- **A lab score is not field data.** Say "Lighthouse on the preview" or "Chrome UX Report, 28 days", never just "speed improved".
- **A null is unknown, not zero.** If a check could not run (no crawl, no Search Console), say so.
- **Fixed means verified.** A fix is not done until a fresh read of the deployed page shows the rule gone.

## What to hand back

1. **Fixed.** Per rule: the template, the file or files changed, the page count it covers, and the verification. That is the `check_deploy` result (passed, the changes it showed) and, once crawled, the `compare_crawls` delta.
2. **Not fixed, and why.** For example: owned by another team, needs copy from a person, or a platform limit such as a Shopify-controlled URL.
3. **Submitted.** Which URLs went to IndexNow or the Indexing API, with the counts sent and refused.
4. **Needs a person.** Generated copy to review, and redirects or noindex decisions that need someone with authority to sign off.
