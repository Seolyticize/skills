# Issue to code-fix patterns

How common audit rules map to code in four stacks. Rule ids are the ones `get_audit_summary` returns.

**Before any fix:** confirm the template in the repository. The same rule can come from a theme, a plugin or a CDN setting rather than the page code. An X-Robots-Tag or a redirect is often set at the host or CDN (Vercel, Netlify, Cloudflare, nginx), not in the app.

## Finding the file for a URL

| Stack                     | Where a URL is rendered                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js, App Router**   | `app/<segments>/page.tsx`. Dynamic segments are `[slug]`, catch-alls are `[...slug]`. Metadata comes from `generateMetadata` or `export const metadata` in the page or a parent `layout.tsx`. Redirects live in `next.config.*` or `middleware.ts`. Sitemaps and robots come from `app/sitemap.ts` and `app/robots.ts`.                                                                                   |
| **Next.js, Pages Router** | `pages/<segments>.tsx`, with `<Head>` from `next/head`, often in a shared `components/Seo*` file. Data comes from `getStaticProps` or `getServerSideProps`.                                                                                                                                                                                                                                               |
| **WordPress**             | A theme template in the hierarchy: `single-{post_type}.php`, `single.php`, `page-{slug}.php`, `archive-*.php`, `taxonomy-*.php`, `index.php`. Block themes use `templates/*.html`. The `<head>` comes from `header.php` and `wp_head()`. Titles, canonicals, robots and schema are usually owned by an SEO plugin (Yoast, Rank Math, AIOSEO), so change its settings or filters rather than the template. |
| **Shopify theme**         | `layout/theme.liquid` holds `<head>`. Pages come from `templates/*.json` or `*.liquid` (product, collection, page, article, blog, index), with sections in `sections/` and snippets in `snippets/` (often `snippets/meta-tags.liquid`). URL structure (/products/, /collections/) and robots defaults are Shopify's. Customise robots through `templates/robots.txt.liquid`.                              |
| **Plain HTML**            | The `.html` file at the matching path, or a shared include or partial if a static generator builds them (Eleventy `_includes/`, Hugo `layouts/`, Jekyll `_layouts/`).                                                                                                                                                                                                                                     |

## Indexability

**`noindex`, `noindex-in-header`, `regression-noindex-added`** on pages meant to rank:

- **Next.js:** look for `robots: { index: false }` in `metadata` or `generateMetadata`, often an environment check that leaked (such as `VERCEL_ENV !== "production"`). Look for an `X-Robots-Tag` in the `headers()` of `next.config.*` or in `middleware.ts`. Fix the condition so it keys on the production host.
- **WordPress:** check Settings → Reading, "Discourage search engines" (the blog_public option). Check the SEO plugin's per-post-type "show in search results" setting, and a wp_robots filter.
- **Shopify:** look for a `<meta name="robots" content="noindex">` in `theme.liquid` guarded by a template check, or an app injecting one. Also check the `seo.hidden` metafield on the resource.
- **Plain HTML:** remove the meta tag, or remove the header rule in the server config (`.htaccess`, nginx add_header).

**`missing-canonical`, `canonicalized-away`, `canonical-to-self-with-parameters`, `regression-canonical-changed`:**

- **Next.js:** set `alternates: { canonical: <absolute url> }` in `generateMetadata`, built from the route params and the production origin (`metadataBase`). Never build it from the request URL, which carries query strings and preview hosts.
- **WordPress:** core and the SEO plugins output a canonical. A wrong one usually comes from a plugin's canonical override field, or from pagination and `?replytocom`. Use the plugin's canonical filter (for example wpseo_canonical) for systematic cases.
- **Shopify:** `{{ canonical_url }}` in `theme.liquid`. Collection-scoped product URLs (/collections/x/products/y) should canonicalise to /products/y, which canonical_url already does. A hard-coded link breaks it.
- **Plain HTML:** add `<link rel="canonical" href="https://example.com/path/">` matching the site's trailing-slash convention (`get_site_conventions` reports it).

**`blocked-by-robots`:**

- **Next.js:** `app/robots.ts` or `public/robots.txt`.
- **WordPress:** a physical `robots.txt` overrides the virtual one. Otherwise use the plugin's editor or the robots_txt filter.
- **Shopify:** `templates/robots.txt.liquid`.
- **Everywhere:** check with `test_robots` before and after.

**`client-error`, `server-error`, `regression-status-error`:** fix the route or data fetch. For a removed page, add a 301 to its replacement (Next.js `redirects()` in `next.config.*`; WordPress the Redirection plugin or server rules; Shopify admin URL redirects; plain HTML server config). `plan_redirect_map` proposes the targets. A real removal with no replacement should return 404 or 410, not a 200 "not found" page (a soft 404).

**`redirect-chain`, `redirect-loop`:** point every internal link and every redirect directly at the final URL. The usual chain is http → https → www → trailing slash. Collapse it into one rule at the edge.

## Titles, descriptions and headings

**`missing-title`, `duplicate-title`, `title-too-long`, `placeholder-title`:**

- **Next.js:** use a `title.template` in the root layout (`"%s | Brand"`) plus a page-specific `title` in `generateMetadata` from the record's own name.
- **WordPress:** the SEO plugin's title template per post type, using the post title variable. Do not hard-code `<title>` in `header.php` (use `add_theme_support('title-tag')`).
- **Shopify:** `{{ page_title }}` with the conditional suffixes from Dawn's `theme.liquid`, and `seo.title` on the resource.
- **Plain HTML:** a unique `<title>` per file.

**`missing-meta-description`, `duplicate-meta-description`, `meta-description-duplicates-title`:**

- Generate the description from the record's own summary or excerpt field, never from a template sentence (`check_templated_metadata` flags stock closers).
- Drafts for the whole crawl: `suggest_meta_tags` (paid). Check the wording with `simulate_serp_snippet`.

**`missing-h1`, `multiple-h1`:** one `<h1>` per page, carrying the page's name. Logos and site names in the header should not be `<h1>`. On Shopify and WordPress themes the culprit is often a header section that wraps the logo in `<h1>` on the home template only, or on every template.

## Structured data

**`structured-data-unparseable`, `structured-data-invalid-value`, the `rich-result-*-incomplete` rules, `missing-organization-markup`, `missing-breadcrumb-markup`:**

- **Next.js:** render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />` in the page component, built from the same data as the page. Escape `<` in strings to avoid breaking the script tag.
- **WordPress:** the SEO plugin's schema graph. Add types through its filters (Yoast wpseo_schema_graph, Rank Math `rank_math/json_ld`) rather than a second hand-written block, which makes `duplicate-structured-data-type`.
- **Shopify:** `{{ product | structured_data }}` (Shopify's own filter) or a JSON-LD snippet in the product section. Prices must be numbers without currency symbols, with `priceCurrency` set (`validate_product_schema` checks this).
- **Plain HTML:** a JSON-LD block in `<head>`.
- **Everywhere:** generate the starting block with `generate_schema` (it never invents fields), and check it with `validate_structured_data` on the live url. Dates must be ISO 8601 and URLs absolute.

**`rich-result-howto-retired`, `rich-result-type-retired`:** safe to remove, and nothing is lost. Low priority.

## Hreflang

**`hreflang-missing-self-reference`, `hreflang-missing-x-default`, `hreflang-invalid-code`, `hreflang-no-return-link`:**

- **Next.js:** `alternates.languages` in `generateMetadata`, with every locale including the page's own and `x-default`, built from one shared locale list so every version names every other.
- **WordPress:** WPML or Polylang output hreflang. Fix the language mapping there (codes like en-GB, not en-uk).
- **Shopify:** Markets with translated domains or subfolders outputs it from `localization`. Hard-coded alternates in `theme.liquid` are the usual bug.
- **Everywhere:** `generate_hreflang` writes the full set, or a sitemap of it for groups of 50 or more.

## Images and speed

**`images-missing-alt`, `image-alt-is-filename`:**

- **Next.js:** `<Image alt=...>` from the CMS's alt field.
- **WordPress:** the attachment's alt text, used by wp_get_attachment_image.
- **Shopify:** `image.alt` in image_tag.
- **Everywhere:** decorative images get `alt=""`. Write alt text from what the image shows and flag it for review.

**`images-missing-dimensions`, `hero-image-lazy-loaded`, `images-not-modern-format`:**

- **Next.js:** `next/image` with width and height, and `priority` (or `fetchPriority="high"`) on the LCP image only.
- **WordPress:** remove `loading="lazy"` from the first content image (wp_omit_loading_attr_threshold).
- **Shopify:** image_url with a width plus image_tag with `loading: 'eager'` for the hero, and `widths` for srcset.
- **Plain HTML:** `width`, `height`, `loading="lazy"` below the fold only, and AVIF or WebP through `<picture>`.

**`render-blocking-scripts`, `no-deferred-scripts`, `too-many-scripts`:** use `defer` or `async`, move third-party tags behind consent or interaction (Next.js `next/script` with `strategy="lazyOnload"`), and remove unused plugins or apps. Shopify apps inject scripts that only uninstalling removes.

**`no-compression`, `no-cache-headers`:** a host or CDN setting more often than code (`next.config.*` `headers()`, `.htaccess`, nginx, Cloudflare).

## Rendering

**Content only after JavaScript** (`get_rendering_report`):

- **Next.js:** move data fetching to the server (server components, `generateStaticParams`, `getStaticProps`) so the HTML carries the words, links, title and canonical. Client-only `useEffect` fetches are the usual cause.
- **WordPress and Shopify:** usually a JavaScript widget or app replacing server-rendered content. Render the content in the template and enhance it with JavaScript.
- Never set titles, canonicals or robots from client-side JavaScript.

## Sitemaps

**`sitemap-lists-broken-page`, `sitemap-lists-canonicalised-page`, `noindex-in-sitemap`, lastmod issues** (from `validate_sitemap`):

- **Next.js:** filter `app/sitemap.ts` to published, indexable, canonical URLs, with `lastModified` from the record's real updated date, not the build time.
- **WordPress:** exclude post types and taxonomies in the SEO plugin's sitemap settings.
- **Shopify:** the sitemap is Shopify's. Unpublish or `seo.hidden` a resource to drop it.
- **Plain HTML:** regenerate in the build. Declare it in robots.txt with a `Sitemap:` line.
