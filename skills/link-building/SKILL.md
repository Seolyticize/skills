---
name: link-building
description: Find, win and keep links for a Seolyticize client. Prospects come from competitors' linkers, broken and lost links to reclaim, unlinked mentions, resource pages and journalist requests, with outreach previewed as a dry run before anything is sent. Also checks link health — profile score by industry, toxic links and whether to disavow, velocity red flags and link networks. Use for "link building", "backlink prospects", "outreach", "lost links", "toxic backlinks", "should we disavow", "link profile health", "journalist requests".
license: MIT
metadata:
  author: Seolyticize
  version: "1.0"
---

# Link building

Outcome: a ranked outreach list with a reason and an angle for each prospect, saved to the client's prospect list, plus a link-health verdict with any disavow advice. Nothing is emailed until the user has seen the exact messages. Nothing is disavowed without a person reviewing every line.

## Before you start

- Get the `clientId` from `list_clients`. Read `get_client_brief`: the competitors, key pages and voice feed every pitch.
- Collect the money terms: the commercial phrases the client targets. Several health tools need them to tell exact-match anchors from branded ones.
- Never recommend buying links, private blog networks or link exchanges.

## Part A: prospects

1. **Competitors' linkers.**
   - `get_link_intersect` (free) lists sites linking to competitors but not the client.
   - `get_link_gap` is free with `source: "index"`, and paid when it asks DataForSEO. Use `match: "all"` for sites linking to every rival.
   - Rank prospects by how many rivals they link to and by their authority (`batch_domain_metrics`, free).
   - `get_outbound_domains` (free) shows who a site links out to. A site that already links to rivals is a prospect; one that links to spam is a risk.

2. **Reclaim what was earned.**
   - `get_broken_backlinks` lists links to the client's own dead pages, with the closest live page to redirect each one to. One redirect wins each link back. It is free from the index and paid from the vendor.
   - `get_link_checks` (free) gives what our crawler last saw on each linking page: live, lost, unknown, moved or unverifiable_js.
     - Only lost is a removal.
     - Moved means the page redirected and the link is not at the new address. Check the movedTo page before calling it lost.
     - unverifiable_js means a JavaScript shell that cannot be read without a browser. It is not lost.
     - Unknown means the page could not be read.
   - Run `recheck_links` (free, slow; needs a rank tracker) for a fresh check, then read `get_link_checks` again.

3. **Broken-link building on rivals.**
   - `get_competitor_broken_pages` lists a rival's dead pages that still have links. It is free with `source: "index"`, paid from the vendor.
   - `get_page_backlinks` (paid) on each dead page gives the sites to write to, offering the client's page instead.

4. **Mentions and places that link by design.**
   - `find_unlinked_mentions` (paid) finds pages naming the brand without linking. These are the easiest wins.
   - `search_web_content` (paid) finds who writes about a topic.
   - `find_link_opportunities` (paid, one results page per query) finds resource pages, best-of lists, roundups, podcasts and newsletters for a `topic`.
   - `get_forum_opportunities` finds Reddit, Quora and forum threads ranking for the client's keywords. It is free from tracked captures and paid with `keywords`.
   - For AI visibility, `get_ai_cited_sources` (free) lists the third-party pages assistants cite. Those are prospects twice over.

5. **Journalist requests (free).** `find_journalist_requests` with `keywords`.
   - With no `feeds`, it reads the public #journorequest, #journorequests and #prrequest feeds on Mastodon (mastodon.social and journa.host). It says so in `defaultFeeds`.
   - Source of Sources, Qwoted, Featured and SourceBottle need an email-to-RSS feed passed in `feeds`.
   - Requests come newest first, with deadlines. Flag anything due in under 48 hours.

6. **Save the list.**
   - `add_link_prospects` adds prospects at the identified stage, each with a `reason`. Pass `targetUrl` when the prospect is one page (a dead page, a thread, an article).
   - `find_link_opportunities` and `find_journalist_requests` can do the same with `addToList: true`.
   - Existing prospects keep their stage.

7. **Outreach, previewed first.**
   - `draft_outreach_emails` (a metered Claude call, quote first) writes one short, personal pitch per prospect, with `offer` and `ourUrl`.
   - `get_outreach_mailboxes` lists the connected mailboxes. If none is connected, a person has to connect one; nothing here can.
   - `create_outreach_sequence` saves up to five follow-ups.
   - Call `send_outreach` with `dryRun: true` and show the user `wouldSend`: every address, subject, body and follow-up date, exactly as it would go. It sends real email from a person's mailbox, so send only after an explicit yes.
   - `sync_outreach` picks up replies. `get_outreach_status` and `list_link_prospects` show where each conversation stands.
   - `set_link_prospect_status` with won and the `linkUrl` queues a check that the link is live.

## Part B: link health

1. **Profile score.** `get_backlink_health` with `moneyTerms`, and `industry` (saas, ecommerce, local, publisher or agency) so anchors are judged against that industry's natural ranges.
   - It scores 0–100 from seven factors, each weighted by its source's confidence.
   - With too little data it says insufficient data (X/7) or not assessed. Report exactly that, never a number.
   - Spam scores sharpen it. `get_backlink_spam_scores` is paid (one purchase for up to 1,000 domains): quote it, get a yes, then pass the result as `spamScores` here and in the next step.

2. **Toxic links and disavow.** `get_toxic_link_risk` gives a verdict per linking site (healthy, review or toxic), with each of its patterns reported as flagged, clear or unmeasured.
   - Review means look, not disavow.
   - Its `disavow` advice is yes when toxic sites are over 10%, and no under 2%.
   - It also shows whether the last saved file already names each site, and lists toxic sites new since that file. `get_disavow_history` shows past files.
   - Disavow only on the tool's yes, after a person reviews every line. Prefer domain entries for clear spam and url entries for one bad page on a good site.
   - `save_disavow_file` keeps the file and diffs it against the last one. Nothing is submitted: a person uploads it in Search Console.

3. **Velocity red flags.** `get_link_velocity` (free) compares the client and its rivals against their own baselines. Each red flag comes with its action:
   - 10× the usual new links in a week;
   - half the links lost in a month;
   - no new links for three months;
   - every new link from one TLD;
   - a spike from one country.
     Losses are only called after `graceDays` unseen. A competitor spike may be a campaign worth studying.

4. **Networks.** `get_referring_networks` (paid, one request; quote first) groups links by IP address or subnet. Networks with five or more separate domains are flagged. A flag means look at the sites: shared hosting puts honest sites together too.

Read `references/link-health-thresholds.md` for every factor, band and pattern.

## Money and writes

- These are paid: `get_link_gap`, `get_broken_backlinks`, `get_competitor_broken_pages` and `get_best_pages_by_links` when they reach the vendor; `get_page_backlinks`, `find_unlinked_mentions`, `search_web_content`, `find_link_opportunities`, `get_forum_opportunities` with keywords, `get_backlink_spam_scores`, `get_referring_networks` and `draft_outreach_emails`.
- Quote each with `estimate_cost` (or pass `dryRun: true`). Tell the user the total, then call with the quote as `maxCostMicros`. Prefer `source: "index"` when it answers.
- `send_outreach` takes `dryRun: true`. Always preview first. REST callers send `Idempotency-Key` on writes.
- Never invent arguments: unknown ones are refused with invalid_input. Follow an error's `next` step.

## Record

Call `update_client_brief` with a `research` entry: the prospect list's size and sources, the health verdict, and the disavow decision. Never create share links (`create_report_link`, `set_report_sharing`) unless asked.

## What to hand back

1. **Prospects,** top 10–20, as a table: site or page, source (rival linker, reclaim, broken page, mention, resource or journalist), authority, why they would link, and the angle. Add the total saved to the list.
2. **Reclaims:** dead pages with links and their redirect target, and links truly lost (lost status only). List moved and unverifiable links separately as "to verify".
3. **Health:** the score or "insufficient data (X/7)", the factors at warn or critical, toxic share, the disavow advice and why, velocity red flags and network flags.
4. **Next steps,** and what was spent against the quote. Outreach not yet sent is shown as a draft.
