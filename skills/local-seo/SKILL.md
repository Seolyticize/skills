---
name: local-seo
description: Audit and improve a business's local search with Seolyticize. Covers the local SEO audit with its Google Business Profile checklist and duplicate listings, map-pack grid scans (sizes, cost, share of local voice), NAP consistency and directory citations, and reviews across Google, Tripadvisor and Trustpilot, with reply drafts that respect healthcare and legal rules. Also changes the listing itself (hours, description, phone, website, categories, attributes) and publishes posts on it, previewed as a dry run first. Use for "local SEO audit", "map pack", "grid scan", "Google Business Profile", "NAP", "citations", "reply to our reviews", "update our opening hours", "post on our Google listing".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Local SEO

The result answers four questions for one location:

1. How complete and healthy is the listing?
2. Where in town does it show in the map pack, and against whom?
3. Do the name, address and phone agree everywhere?
4. What do reviewers say, and which replies are ready to post?

**Local is mostly paid.** Grid points, live listing reads, business searches, directory searches, platform reviews and reply drafts all cost money on the agency's DataForSEO account or its Claude budget. For every paid call:

1. Quote it with `estimate_cost`, passing the tool name and the exact arguments.
2. Tell the person the total.
3. Pass the quote's estimatedMaxMicros as maxCostMicros, so the call cannot cost more than agreed.

Check room in the budget with `get_budget_status` (free). `set_budget` caps the client's monthly spend. Re-reading what is stored (`get_local_visibility`, a collected taskId) is free, so prefer it to buying again.

## Before you start

1. **Client and brief.** Call `list_clients`, then `get_client_brief` for the services, the towns served and any earlier local notes.
2. **Locations.** `list_local_locations` lists them, with their ids. If the branch is missing:
   1. Call `get_business_profile` (paid) to find its placeId, cid and coordinates.
   2. Call `add_local_location` with name, lat, lng and the placeId or cid. That way scans match the listing itself, not any business with the same name. It needs client:manage.
3. **Help.** Errors carry a `code` and a `next` step, so follow `next`. `find_tools` finds a tool by intent. Unknown arguments are refused, so never invent one.

## Workflow

### 1. The local SEO audit

Call `get_local_seo_audit` with clientId and locationId. Choose the paid parts deliberately:

| Option                                  | What it adds                                            | Cost                           |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------ |
| useListing (default true)               | reads the live listing and its Q&A                      | paid                           |
| competitorRadiusKm (default 5; 0 skips) | competitor density in the primary category              | one paid business search       |
| duplicates: true                        | other listings within 1 km at the same address or phone | one paid business search       |
| directories: true                       | directory citations in the NAP part                     | paid searches                  |
| postsTaskId                             | Google posts, from a `get_business_posts` taskId        | collecting is free once queued |

For a free pass, set useListing false and competitorRadiusKm 0. Pass service and city to check the site's titles and H1s for them.

It returns a 0–100 heuristic score from six weighted parts:

| Part                 | Weight |
| -------------------- | ------ |
| Profile              | 25     |
| Reviews              | 20     |
| Site                 | 20     |
| NAP and citations    | 15     |
| LocalBusiness schema | 10     |
| Links                | 10     |

Parts not measured are null and the others are rescaled, so say which parts were missing.

Read these parts of the answer:

1. **gbpChecklist:** the 25-field profile checklist, scored 2/1/0 per field and weighted by vertical, banded at 90/75/50/25.
   - Fields DataForSEO does not return are null and must be reported as unknown, never as missing: verified status, Q&A, videos, products, photo dates.
   - Lead with the primary category against the homepage, the secondary categories, hours, photos and posts.
   - `get_local_categories` (paid) shows which categories rivals in the area use.
2. **Business model.** It detects storefront, service-area business or hybrid. Service-area businesses skip the map and address checks. If the detection looks wrong, pass model.
3. **Duplicates.** Name each duplicate listing at the same address or phone. Merging or removing duplicates is done in Google Business Profile by a person.
4. **Reviews part:** volume, rating, recency, monthly flow and gaps, response rate, and a fake-review flag when two of six patterns match.
   - The flag is a pattern match, not proof. Say "shows patterns associated with…".
   - Reviews come from `sync_local_reviews`. Run that first if the audit says none are stored.
5. **Site and schema:** visible NAP, a tel: link, a map embed, unique location pages (the city-swap test), and LocalBusiness subtype, geo, @id and branchOf.
   - `generate_schema` writes the LocalBusiness block from the saved location, with localBusinessType, openingHours and areaServed as needed. It is free.
6. **grid and mapsHealth:** read back from the latest grid scan, when there is one.

### 2. Grid scans: where in town it ranks

Read first, buy second. `get_local_visibility` with locationId and term is free. If scanned is false, that term has never been scanned there, which means no data, not "invisible".

To scan, call `run_local_grid_scan`. Every grid point is one paid lookup:

| size        | points per term | when                                |
| ----------- | --------------- | ----------------------------------- |
| 3           | 9               | a quick check, or one neighbourhood |
| 5 (default) | 25              | a town or a city district           |
| 7           | 49              | a suburban spread                   |
| 9           | 81              | suburban, or a wide service area    |
| 13          | 169             | rural, or a large metro             |

- **spacingKm** sets the distance between points: 1.5 by default, 0.5 for a dense city centre, 5 for rural areas. Size × spacing should cover the area the business actually serves.
- **moreTerms** (up to two) scans other terms on the same grid, each a full scan of its own. A 7 × 7 with two extra terms is 147 lookups.
- **device** set to mobile asks as a phone, which sees a different pack. It is a separate scan.

Cost and approval:

1. Quote with `estimate_cost`, passing the exact arguments.
2. Get the person's go-ahead.
3. Pass maxCostMicros. A scan whose estimate is over the limit is refused before it starts.

The scan runs in the background, so read the result with `get_local_visibility` a few minutes later.

Then call `get_local_visibility` and read:

- **Share of local voice:** the share of points where the business holds a top-3 slot, with its band (dominant 80+, strong 60+, moderate 40+, weak 20+, then critical). This is the headline number.
- **Visibility points** (3 for a top-3 slot, 1 for 4th to 10th) and the share of points in the top 3 and top 10.
- **Quadrants:** each compass quadrant, and the worst one. "Strong downtown, absent north of the river" is the actionable finding.
- **The competitor table:** every business the grid saw, with its share of local voice, points seen, average position, rating and reviews. The leader's profile is the benchmark. `get_business_profile` on the leader shows what its listing has that the client's lacks.
- **The heatmap:** the grid as rows north to south, with a text version. Use it when the user wants the picture.

For a single spot rather than a grid, `get_maps_results` makes one paid lookup.

### 3. NAP consistency and citations

Call `check_nap_consistency` with locationId:

- **Default:** the listing against the site's homepage and its contact, about and location pages, in text and structured data. useListing reads the live listing, which is paid. With useListing false it uses the saved location for free.
- **directories: true** also searches Google for the business on Yelp, Foursquare, Facebook, Yellow Pages, BBB, Tripadvisor, Apple Maps, Nextdoor and others, plus the trade's own directories. Those are detected automatically, or set with industryDirectories, for example avvo.com or healthgrades.com. Each directory's name, address and phone is compared with the listing.
- **Severity of the worst disagreement:** a different name is critical, the address is a warning, the phone is a notice. A null means the result did not show that field, which is unknown, not wrong.
- **Not read directly:** Bing Places and Apple Business Connect have no self-serve API. Say they were not checked.
- **The fix list:** each directory with the wrong field and the correct value. Directories with no listing found are citation gaps.

### 4. Reviews

1. **Google, stored.** `sync_local_reviews` (paid, runs in the background) collects the latest 50. A second request within the hour lands on the run already going. Read the analysis in `get_local_visibility`. With the Business Profile connected, reviews come from the client's own listing.
2. **Other platforms.** `get_platform_reviews` reads Tripadvisor (business name and town, or a Tripadvisor URL path) or Trustpilot (the domain).
   - The first call is the paid one and returns a taskId.
   - Call again with the taskId to collect the reviews for free. It shows pending until they are ready.
   - Compare the platform's rating, volume and owner response rate with Google's.
3. **Competitors' reviews.** `get_business_reviews` reads a rival's reviews (paid, collected the same way through a taskId), to see what customers complain about there.
4. **Reply drafts.** `draft_review_replies` drafts replies to unanswered reviews. It is a metered Claude call, so quote it with `estimate_cost`.
   - Set voice in a sentence. Pass trade, or let it be detected:
     - **healthcare:** HIPAA rules. Never confirm the reviewer is a patient, and never mention care or treatment.
     - **legal:** client confidentiality. Never confirm a client relationship or discuss the matter.
     - **general:** thanks that name what was praised. For poor reviews, an apology, what will change and an offline route. Never argue, invent facts or stuff keywords.
   - Show every draft. **Any draft carrying a caution must be rewritten or dropped**, never posted as is.
   - canPost says whether the listing is connected for posting.
5. **Posting.** `post_review_reply` posts one reply, or replaces an existing one. It is public and speaks for the business, so only post the exact text the person approved, one review at a time. It needs client:manage and the Business Profile connected.

### 5. Changing the listing and posting on it

With the Business Profile connected (the same connection replies are posted with), the fixes from the audit and the NAP check can be made on the listing itself. Both tools are free and need client:manage. locationId can be left out when the client has one connected listing.

1. **Preview.** Call `update_business_profile` with `dryRun: true` and only the fields to change in `changes`:
   - `regularHours`: the whole week, one entry per open period, 24-hour HH:MM. A day left out is closed. close may be 24:00, and closeDay covers hours past midnight.
   - `specialHours`: holidays and one-off dates, each `closed: true` or open and close. Google needs regular hours on the listing first.
   - `description` (up to 750 characters), `phone` (primary, and up to two additional), `website`.
   - `categories`: Google category ids such as gcid:dentist, the primary and up to nine additional. The audit's primary-category finding goes here.
   - `attributes`: simple yes/no ones by Google id, such as has_wheelchair_accessible_entrance.
   - Phone and category lists not given in full keep the listing's other half.
2. **Show the person the preview.** It has the exact patch and updateMask, each field before and after, and `validation`: "ok", or Google's reason for refusing. Fix anything Google refuses before going on.
3. **Save.** Call it again with the same `changes` and `dryRun: false`, only after an explicit yes. Google may hold a change for review before it shows on Maps.
4. **Posts.** `create_business_post` publishes an update post: `summary` (up to 1,500 characters) and an optional `callToAction` (BOOK, ORDER, SHOP, LEARN_MORE or SIGN_UP with a url, or CALL with none). Preview with `dryRun: true`, show the text, and publish only the approved text. It comes back PROCESSING until Google has reviewed it. `get_business_posts` reads the posts already there.
5. **Refusals.**
   - not_connected: the location has no connection.
   - missing_scope: the connection was not granted permission to manage the listing.
   - For either, `get_connection_link` with service google_business_profile and the locationId gives the link. The listing's owner opens it and approves managing the business. An agent cannot do this step.

## Honesty rules

- **Name the heuristics.** The audit score, mapsHealth and the fake-review flag are heuristics. Say so.
- **No scan is not no visibility.** An unscanned term is unknown. A null checklist field is unknown.
- **Grids are a snapshot.** A grid is one moment from fixed points. Rankings move by hour and by searcher. Give the scan date.
- **Never invent numbers.** That includes ratings, review counts and positions not in the answer.

## What to hand back

1. **The headline.** Share of local voice for the main term (band, scan date, grid size) and the worst quadrant, plus the audit score with its unmeasured parts named.
2. **The top five fixes, in priority order.** Typical ones: primary category, a NAP mismatch (critical first), missing profile fields, review flow or response rate, location-page or schema gaps. Each with its evidence.
3. **Competitors.** Who leads the grid and what their listing has that this one lacks.
4. **Reviews.** Rating and volume per platform, the response rate, and drafts ready for approval (not posted).
5. **Listing changes.** Each change previewed, with its before and after, and whether it was saved. Changes not yet approved are shown as a preview.
6. **Spend.** What this run cost and what any recommended re-scan would cost.
7. **Recorded.** Call `update_client_brief` with a research entry: scores, share of local voice, fixes. The next run compares against it. Never create share links (`create_report_link`, `set_report_sharing`) unless asked.
