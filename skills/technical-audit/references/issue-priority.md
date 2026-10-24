# Issue priority rubric

Use this to order the fix list. The audit's own severity (critical, warning, notice) is the starting point. This rubric breaks ties and moves an issue up or down by what it costs this site.

## Tiers

Work top to bottom. Inside a tier, order by **pages that earn traffic**, using Search Console clicks or tracked keywords, then by page count.

### P0: pages out of search, or broken

These cost rankings within days. Fix them before anything else, and say plainly when any were caused by a recent release.

- **Regressions since the last crawl:**
  - `regression-noindex-added`
  - `regression-canonical-changed`
  - `regression-title-dropped`
  - `regression-status-error`
  - `regression-hreflang-lost`

  Also check `get_seo_changes` with severity critical.

- **Indexability on pages meant to rank:**
  - `noindex`, `noindex-in-header`, `blocked-by-robots`
  - `canonicalized-away` where the target is wrong
  - `canonical-to-noindex`, `canonical-to-other-domain`, `canonical-chain`
- **Responses:**
  - `server-error`, `client-error` on pages that are linked or in the sitemap
  - `redirect-loop`, `empty-response`
  - `bot-challenge`: a bot wall that answers search engines instead of the page
- **Certificates:** `tls-certificate-expired`, `tls-hostname-mismatch`.
- **Google's view disagrees with the crawl:** pages the crawl finds indexable that Google reports as crawled or discovered but not indexed, or where Google chose another canonical (from `get_index_coverage` and `get_page_indexing_reasons`).
- **Agent readiness P0 failures** (from `get_agent_readiness`): robots.txt returning 5xx, a made-up path that does not return 404, no primary content without JavaScript.

### P1: wasted crawl and lost signals

- **Wasted crawl:**
  - `redirect-chain`, `sitemap-lists-broken-page`, `sitemap-lists-canonicalised-page`, `noindex-in-sitemap`
  - parameter copies from `get_parameter_report`
  - `url-contains-session-id`
- **Broken internal links and orphans:**
  - internal links pointing at 4xx, 5xx or redirects
  - `orphan-page` on pages that should rank
  - `deep-page` (more than three clicks from home) on money pages
- **Duplication:**
  - `duplicate-content`, `near-duplicate-content`
  - `duplicate-title` across many pages of one template
- **Hreflang** that Google will ignore: `hreflang-no-return-link`, `hreflang-to-non-indexable`, `hreflang-invalid-code`.
- **Content that exists only after JavaScript** (from `get_rendering_report`) on pages meant to rank or be cited.
- **Core Web Vitals failing in field data** for the origin or a large template.
- **Mixed content:** `mixed-content`, `insecure-page`.

### P2: what the result looks like and earns

- **Missing or broken titles:** `missing-title`, `placeholder-title`.
- **Weak titles and descriptions** where Search Console shows impressions but a low CTR: `title-too-long`, `missing-meta-description`, `duplicate-meta-description`.
- **Headings:** `missing-h1`, `multiple-h1`.
- **Structured data:**
  - errors on types that still earn rich results: `structured-data-unparseable`, `structured-data-invalid-value`, and the `rich-result-*-incomplete` rules (Product, Article, Breadcrumb, Local business, Event, Video, Job posting, Recipe, Review)
  - `missing-organization-markup` on the homepage
- **Images:** `images-missing-alt` on content images, `hero-image-lazy-loaded`, `images-missing-dimensions` (CLS).
- **Lab-only speed findings** with a large estimated saving: render-blocking requests, unused JavaScript, a heavy LCP image.
- **Thin content:** `thin-content` on templates meant to rank.

### P3: hygiene

Fix these in passing when the template is open anyway, and never lead a report with them:

- URL style: `url-contains-uppercase`, `url-contains-underscores`, `url-too-long`.
- Open Graph and X card gaps.
- Security headers: `missing-hsts`, `missing-content-security-policy` and similar.
- Accessibility rules, unless the client cares about them for their own sake (then lift them to P2).
- Retired markup: `rich-result-howto-retired`, `rich-result-type-retired`. Remove it at leisure, because losing it costs nothing.
- `content-not-updated`, `generic-anchor-text`, `too-many-links`.

## Moving an issue up or down

- **Up a tier:**
  - It appeared in the last crawl and coincides with a deploy (`compare_crawls`, `list_annotations`).
  - It sits on the pages that earn the most clicks, revenue or conversions.
  - One template fix clears hundreds of findings. A quick win is worth doing early even when it is minor.
  - An alert has already fired on it.
- **Down a tier:**
  - It is only on pages that are not meant to rank, such as tag archives, internal search or staging remnants. Consider `accept_issue` instead of fixing.
  - The fix needs a platform the client does not control, such as a hosted docs vendor. Route it with `set_path_owners` and leave it for that owner.
- **Accept rather than fix** when the finding is the intended behaviour. Always give the reason in plain words, and use until for anything temporary, such as a campaign page or a migration window.

## Severity is not impact

- **A critical issue on 3 unlinked pages** can rank below a warning on the product template that earns 60% of revenue. Say why when you reorder.
- **An issue on noindexed or canonicalised pages** is hidden by indexableOnly. It is only worth reporting when it explains why those pages are excluded.
- **Counts are findings, not pages.** One page can carry several rules. When you total across rules, use `get_issue_templates` or say the figures overlap.
