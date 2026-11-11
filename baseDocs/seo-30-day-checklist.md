# GasNation SEO — Live Audit & 30-Day Checklist

**Audit date:** August 30, 2026  
**Property:** https://gasnationweed.com

---

## Live audit results (passed)

| Check | Result |
|-------|--------|
| HTTP → HTTPS redirect | ✅ `301` to `https://gasnationweed.com/` (nginx) |
| Sitemap | ✅ `https://gasnationweed.com/sitemap.xml` — homepage, delivery areas, products, blog |
| robots.txt | ✅ Blocks admin/account/checkout/age-gate; points to sitemap |
| Googlebot access | ✅ Gets `200` + full HTML (age-gate bypass works) |
| Human age-gate | ✅ Redirects to `/age-gate` without cookie |
| Blog in sitemap | ✅ `/blog` + published posts listed |
| Blog SEO meta | ✅ Title, description, canonical, Article JSON-LD |
| Canonical host | ✅ Pages canonical to `https://gasnationweed.com` (non-www) |

## Issues found & status

| Issue | Severity | Status |
|-------|----------|--------|
| `www.gasnationweed.com` served same site (split signals) | Medium | **Fix in code:** `proxy.ts` now 301s www → apex (deploy to prod) |
| GSC shows old `http://` URLs | Low | Historical — HTTP already 301s; set **Preferred domain** in GSC |
| Google = ~10% of traffic | Info | Normal for new site; not a bug |
| Only 1–2 blog posts | Info | Content volume, not technical |

---

## Week 1 — Google Search Console setup

- [ ] In GSC → **Settings → Crawling → Preferred domain**, confirm **non-www HTTPS** (`gasnationweed.com`)
- [ ] **Indexing → Pages** — fix any “Not indexed” errors (Crawl, Redirect, 404)
- [ ] **Sitemaps** — confirm `https://gasnationweed.com/sitemap.xml` is submitted and “Success”
- [ ] **URL Inspection** — request indexing for:
  - `/`
  - `/delivery/ashburn`
  - `/delivery/manassas` (if page exists)
  - `/blog/complete-cannabis-guide` (or latest published post)
- [ ] After www redirect deploy: **Validate** that `https://www.gasnationweed.com/` returns `301` → apex

## Week 1 — Google Business Profile (highest ROI for local cannabis)

- [ ] Claim/verify GBP listing matches site name **Gas Nation** (or exact legal name)
- [ ] Service areas: Northern Virginia cities + DC
- [ ] Categories, hours, phone, website URL (`https://gasnationweed.com`)
- [ ] 10+ photos (logo, product, delivery, team)
- [ ] Ask happy customers for Google reviews (5–10 in month 1)

## Week 2 — On-page & local pages

- [ ] Each delivery city page: unique H1, 2–3 local paragraphs, link to `/products` and `/blog`
- [ ] Homepage → link to top 5 delivery area pages in footer or body
- [ ] Publish **2nd blog post** targeting one query you already appear for (e.g. “weed delivery Ashburn VA”)
- [ ] Every blog post: fill **SEO title** (≤60 chars) + **SEO description** (≤155 chars) + cover image alt text

## Week 2 — Content & internal links

- [ ] Blog posts link to relevant `/delivery/[city]` and `/categories/[slug]` pages
- [ ] Add “Delivery areas” CTA on blog posts
- [ ] Tag posts with 1–2 SEO tags; verify `/tag/[slug]` pages index in GSC

## Week 3 — Measure & iterate

- [ ] GSC **Performance** — compare last 28 days vs previous 28 (after week 3)
- [ ] Note queries with impressions but 0 clicks → improve SEO title/description for those pages
- [ ] Admin **Analytics → Top sources** — track Google vs Direct vs Instagram weekly
- [ ] Publish **3rd blog post** (how ordering works, same-day delivery FAQ, strain guide)

## Week 4 — Expand & consolidate

- [ ] Publish posts **4–5** (one per week pace)
- [ ] Build or improve **Manassas**, **Sterling**, **Leesburg** delivery pages if not live
- [ ] Instagram bio + posts link to specific landing pages (not only homepage)
- [ ] Re-check GSC for `http://` and `www.` URLs — should trend down after redirect deploy

---

## What NOT to worry about (yet)

- Daily click spikes/dips when total clicks &lt; 20/week — normal noise
- Blog not in “Top pages” until you have 5+ posts and 4–8 weeks index time
- Competing on broad terms like “weed delivery virginia” — focus long-tail + local first

---

## Quick reference — your winning queries today

| Query | Action |
|-------|--------|
| `gasnation` | Brand — keep GBP + social consistent |
| `recreational dispensary dc` | Add DC-focused content + delivery page links |
| `weed delivery ashburn va` | Strengthen `/delivery/ashburn` + blog mention |
| `weed delivery manassas va` | Ensure Manassas delivery page exists & is linked |

---

## Deploy note

After merging **www → apex redirect** in `frontend/src/proxy.ts`, redeploy the frontend. Verify:

```bash
curl -sI "https://www.gasnationweed.com/" | head -5
# Expect: HTTP/1.1 301 ... Location: https://gasnationweed.com/
```
