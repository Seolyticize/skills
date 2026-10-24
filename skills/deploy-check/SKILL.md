---
name: deploy-check
description: Check a release for SEO damage before and after it ships, with Seolyticize. Runs check_deploy against a deploy preview or staging, compare_sites between staging and production (including www/apex redirect behaviour), sets up the GitHub Action that fails a pull request, and watches for rollback signals after release. Use for "will this deploy hurt SEO", "check the preview", "is staging ready to go live", "did the release noindex anything", "SEO check in CI", "should we roll back".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Deploy check

**What you hand back:** a clear go or no-go for a release, and after it ships, a clear "holding" or "roll back".

**How it works:** the checks fetch pages live and compare what they tell search engines with the latest crawl of production. That covers status, robots, canonical, hreflang, title, H1 and structured data, plus meta description, Open Graph, the H2 outline and copy where the crawl recorded them.

**Cost:** `check_deploy` and `compare_sites` cost no vendor money. They fetch pages on the client's behalf, so they need project:manage. Check with `whoami` if a call is refused.

## Before you start

1. **Client.** Call `list_clients`, then `get_client_brief` for the key pages and any earlier release notes.
2. **A baseline.** Call `list_crawls`. `check_deploy` compares against the latest complete crawl of production. If that crawl is old, or predates the last release, it will report long-standing differences as if they were new. Call `start_crawl` and poll `get_crawl_status` first when you can.
3. **Protected previews.** If the preview sits behind basic auth, a bypass header or cookies, call `set_crawl_auth` once. Both tools can then send those credentials to the preview host only.
4. **Help.** Errors carry a `code` and a `next` step, so follow `next`. `get_error_catalogue` lists every code. Unknown arguments are refused, so never invent one.

## Before release

### 1. Check the preview

Call `check_deploy` with clientId and either:

- **previewUrl**, the preview or staging origin. One or more pages per template from the crawl are fetched there, up to maxUrls (default 50, at most 200). Canonicals and hreflang on the preview host are read as if they were on the production host, so only real changes show.
- **urls**, specific addresses on the preview or on production, matched to the crawl by path. Use this when the release touches known pages.

Pick failOn to set how strict the check is:

| failOn             | What makes passed false                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| critical (default) | noindex added, canonical changed, title dropped, a page now 4xx or 5xx, hreflang lost entirely, a page unreachable, or every piece of structured data removed  |
| warning            | the above, plus some structured-data types removed, meta description changed, Open Graph removed, structured-data values changed, some hreflang languages lost |
| notice             | the above, plus structured data added, H2 outline or copy changed                                                                                              |

How to read the result:

1. **passed and summary.** passed is the verdict. summary gives the counts per severity, and checked says how many pages were compared.
2. **Every change, critical first.** Say whether each one was intended. A canonical change on a template whose URLs deliberately changed is expected. A noindex on the product template is not.
3. **markdown** is a ready pull-request comment.

### 2. Compare the whole site (big releases and go-lives)

For a new site, a framework or theme change, a domain move or a staging go-live, call `compare_sites` with:

- **a:** the site under test, such as staging;
- **b:** the reference, such as production.

Paths default to the latest crawl's shallowest pages across templates (or b's homepage links when there is no crawl). Narrow them with paths. sendCrawlAuthTo (default a) says which side gets the crawl credentials.

How to read the result:

1. **Critical differences come first,** followed by a Markdown summary.
2. **www and the apex.** When one side's homepage redirects to the other's host (www to the apex, or the reverse), redirect names the status and the target, and **nothing is diffed**, because that side has no pages of its own. That is not a pass. Decide which host is canonical, then:
   - **Production redirects:** make sure it is a single 301 (not a 302, and not a chain through http) and that the canonical tags name the same host. Then compare the side that serves pages.
   - **Staging redirects to production:** you are not testing staging at all. Point a at the staging host that actually serves pages.
3. **Path-level redirects.** Single paths that redirect across hosts are listed in redirected. Check each one against the intended redirect map. `plan_redirect_map` drafts one for a migration.
4. **Trailing slashes.** `get_site_conventions` checks the trailing-slash convention and HSTS preload readiness on the live host.

### 3. Things the diff will not catch

Check these separately:

- **robots.txt on the new build:** `test_robots` with the key URLs. A staging robots.txt that disallows everything is the classic go-live accident.
- **Sitemap:** `validate_sitemap` after the first crawl of the new build.
- **Speed:** `page_lab` on the preview's key templates. It uses PageSpeed quota and is lab data only. Field data takes weeks to move.

### 4. Go or no-go

- **No-go:** any unintended critical change. Name the URL, the field, the before and after, and the likely file or setting.
- **Go with notes:** warnings that are intended or minor.
- **Re-run after the fix.** The GitHub Action updates its own comment rather than adding another.

## In CI: the GitHub Action

The action (Seolyticize/github-action@v1) calls `check_deploy` on each pull request, writes the result to the job summary, comments on the PR, and sets the outputs passed, critical and checked.

```yaml
on: pull_request
permissions:
  pull-requests: write
jobs:
  seo:
    runs-on: ubuntu-latest
    steps:
      - uses: Seolyticize/github-action@v1
        with:
          api-key: ${{ secrets.SEOLYTICIZE_API_KEY }}
          client-id: <client id>
          preview-url: https://pr-${{ github.event.number }}.example.vercel.app
```

Its inputs:

- **api-key** (required): a key with project:manage on the client, kept in a repository secret, never in the workflow file.
- **client-id** (required).
- **preview-url** or **urls** (newline- or comma-separated).
- **max-urls** (default 50, at most 200).
- **fail-on** (critical, warning or notice; default critical).
- **comment** (default true).
- **github-token** and **api-base** (for a self-hosted install).

### What fails the PR

1. **passed is false.** Anything at or above fail-on changed. Critical changes are also printed as error annotations, up to 20.
2. **The API refused the check.** For example: a missing or wrong key, no project:manage, no crawl to compare against, or an unknown client. The job fails with the API's own reason and its next step.
3. **Bad inputs.** Neither preview-url nor urls, or an invalid fail-on.

What does **not** fail the PR: a comment that cannot be posted, such as a fork's read-only token. That is logged as a warning so the verdict still shows. The preview must be deployed before the job runs. Order the job after the preview deployment, or give it the deployment's URL.

## After release

Watch production for one to two weeks. Before you start, add a timeline note with `add_annotation` (kind deploy) so later charts explain themselves.

1. **Right after deploy:**
   - Call `check_deploy` with urls set to the live key pages. Every intended change should show, and nothing else.
   - Call `submit_indexnow` for changed pages, first with dryRun true.
   - `create_deploy_hook` automates this submission on every deploy.
2. **After the next crawl (or trigger one with `start_crawl`):**
   - `get_seo_changes` between this crawl and the one before. Critical changes also file as regression rules: regression-noindex-added, regression-canonical-changed, regression-title-dropped, regression-status-error, regression-hreflang-lost.
   - `compare_crawls` for new issues by rule.
   - `get_robots_history` to see whether robots.txt or the sitemap changed.
3. **Over the following days:**
   - `get_search_anomalies` for days outside the normal range, with a likely cause. A crawl regression or a deploy is named when the data shows it.
   - `get_search_timeline` shows clicks beside the deploy annotation.
   - `get_index_coverage` and `get_page_indexing_reasons` show pages Google dropped or now canonicalises elsewhere. `inspect_url` checks the most important ones.
   - `list_recent_alerts` for the default alerts: site unreachable, a 30% non-branded click drop, new critical issues, keyword drops of 5 or more places. If the client has no alerts, offer `add_default_alerts`.

### Rollback signals

Recommend a rollback, or an immediate hotfix, when any of these appear on pages that earn traffic:

- **noindex added**, or robots.txt now disallowing key sections.
- **Canonicals pointing at another host**, at staging, or at the homepage.
- **Status errors:** a template now returning 4xx or 5xx, or a redirect loop.
- **A redirect map gone wrong:** mass redirects to the homepage, or chains.
- **Missing content:** a title, H1 or primary content missing from the HTML, because rendering moved to the client side.

Do **not** call a rollback on:

- **Click data alone in the first days.** Search Console lags two to three days, and the newest days are provisional.
- **Ranking moves while the whole results page is shaking.** Check `get_serp_volatility` first.

Say which signal you saw, on how many pages, and since when.

## Honesty rules

- **A pass covers only what was checked.** It means nothing at or above failOn changed on the pages compared, not that the release is safe everywhere. Give checked.
- **Old baselines mislead.** An old baseline crawl makes old differences look new. Say when the crawl predates the last release.
- **Lab is not field.** Lab speed on a preview is not field data.
- **Unknown is not zero.** Null means unknown.

## What to hand back

1. **The verdict:** go, go with notes, or no-go (before release); or holding, watch, or roll back (after release).
2. **The evidence:** pages checked, the critical and warning counts, and each critical change (URL, field, before and after).
3. **Host behaviour:** which host is canonical and whether www/apex redirects are a single 301 to it.
4. **Next steps:** the fixes to make before merge, or what to watch and until when.
5. **Recorded:** call `update_client_brief` with a research entry for the release (date, verdict, anything accepted).
6. **No share links.** Never create share links (`create_report_link`, `set_report_sharing`) unless asked.
