# Frontend handoff: SEO Blog (TipTap blocks + HTML paste + preview)

> **Owner:** Frontend agent only.  
> **Backend:** Separate backend agent owns schema, Express APIs, storage, sanitization, Postman/E2E. Do not change Prisma or `backend/`.  
> **Prerequisite:** Backend blog APIs are implemented (additive migration `20260820140000_blog`, routes under `/api/blog` and `/api/admin/blog`). Run `npx prisma migrate deploy` on the backend if tables are missing. Align fields below with `baseDocs/api-endpoints.md` if anything differs.

## Goal

Ship an admin-managed, SEO-ready blog:

- Block editor (TipTap): text, images, video embeds, links, etc.
- HTML paste tab for content created elsewhere
- Live preview that matches the public post page
- Public `/blog` + `/blog/[slug]` that are **mobile-first with no compromise**
- Sitemap + nav/footer links
- Optional homepage strip: only posts with **Show on homepage** enabled (and published)

## Locked decisions

- Additive backend only (new `blog_posts` / `blog_media` tables). FE must not assume schema edits on products/banners/etc.
- `bodyJson` = TipTap doc (source of truth); `bodyHtml` = sanitized HTML for public render + SEO (returned by API).
- Drafts never appear on public list/detail or sitemap.
- Unpublish clears `publishedAt` (sitemap accurate).
- Cover image + inline media uploads via admin multipart endpoints.
- Video in v1 = URL embeds (YouTube/Vimeo), not file upload.
- Shared `BlogPostBody` component powers **admin preview** and **storefront** (one renderer).
- `showOnHomepage` (boolean, default false): admin toggle. Homepage shows **only** published posts with this flag. If none qualify, **omit the homepage blog section entirely**; all published posts still appear on `/blog`.

## Mobile responsive (no compromise)

Acceptance: usable and correct at ~375px and ~390px width; no horizontal page scroll; content readable without pinch-zoom.

### Public `/blog` and `/blog/[slug]`

- Default **single column**; multi-column card grids only from `md`/`lg` up.
- Content column: centered, `max-w-prose` or `max-w-3xl`, horizontal padding ≥ `px-4`.
- Cover + inline images: `max-w-full h-auto`; never overflow viewport.
- Video embeds: full-width **16:9** responsive wrapper (`aspect-video` or equivalent).
- Typography: comfortable body size on mobile (`text-base`+); headings wrap cleanly.
- Cards/list items: full-width tap targets; spacing that doesn’t crush content.

### Admin `/admin/blog/*`

- Meta form + editor + toolbar must work on a phone-width admin viewport.
- **Preview stacks below the editor on mobile**; side-by-side preview only from `lg:` up (do not squeeze a narrow side panel on small screens).
- TipTap toolbar wraps or scrolls horizontally **without** widening the page.
- Primary actions (Save, Publish, Apply HTML) remain reachable; tap targets ≥ ~44px where practical.

## Frontend changes

### 1. API clients

- `frontend/src/lib/api/admin/blog.api.ts` — admin CRUD + types.
- Cover/media upload helpers (mirror [`frontend/src/lib/api/admin/banner-image-upload.ts`](frontend/src/lib/api/admin/banner-image-upload.ts)): progress, auth refresh on 401.
- Public: `frontend/src/lib/api/blog.api.ts` — list + get by slug (published only).
- Re-export from `frontend/src/lib/api/index.ts` if that barrel is the project norm.

### 2. Admin nav + routes

- Add **Blog** to [`frontend/src/components/admin/admin-nav.ts`](frontend/src/components/admin/admin-nav.ts) (all staff; not superadmin-only).
- Pages (thin App Router shells + clients, same pattern as banners):
  - `/admin/blog` — list (title, status, publishedAt, edit, soft-delete/restore if API supports)
  - `/admin/blog/new` — create draft → redirect to `/admin/blog/[id]`
  - `/admin/blog/[id]` — full editor

### 3. Admin editor UX (`/admin/blog/[id]`)

Layout:

1. **Meta:** title, slug (editable), excerpt, `seoTitle`, `seoDescription`, optional authorName, cover upload, **Show on homepage** checkbox (`showOnHomepage`), status Publish / Unpublish / Save draft.
2. **Tabs:**
   - **Blocks** — TipTap: paragraph, headings, lists, links, image (upload → insert URL from media API), YouTube/Vimeo embed, horizontal rule.
   - **HTML** — large textarea; paste external HTML; **Apply to editor** (parse into TipTap doc or HTML node); client sanitize before apply/save.
3. **Live preview** — renders via shared `BlogPostBody` (title/cover/date/body). Updates on debounce as blocks/HTML change.

Deps to add in frontend: `@tiptap/react`, starter-kit, image, link, youtube (or iframe), plus `isomorphic-dompurify` (or equivalent) for paste/HTML.

### 4. Shared body renderer

- `BlogPostBody` (e.g. under `frontend/src/components/blog/`) consumes sanitized `bodyHtml`.
- Styles for prose, images, embeds must satisfy the mobile rules above.
- Used by admin preview **and** `(store)/blog/[slug]`.

### 5. Storefront SEO pages

- `(store)/blog/page.tsx` — published index (cards: title, excerpt, date, cover).
- `(store)/blog/[slug]/page.tsx` — full post:
  - `buildPageMetadata` (`seoTitle` / `seoDescription` fallbacks to title/excerpt)
  - Article JSON-LD + breadcrumbs ([`frontend/src/lib/seo/json-ld.ts`](frontend/src/lib/seo/json-ld.ts))
  - Default author display **Gas Nation** if `authorName` null
- [`frontend/src/app/sitemap.ts`](frontend/src/app/sitemap.ts) — add `/blog` + each published slug from public API.
- Footer + store nav: additive **Blog** link to `/blog`.
- Age gate / robots: no special cases required (`/blog` allowed; crawlers already bypass age gate).

### 5b. Homepage blog section (conditional)

- On [`frontend/src/app/(store)/page.tsx`](frontend/src/app/(store)/page.tsx): fetch `GET /api/blog?showOnHomepage=true` (reasonable `limit`, e.g. 3–6).
- **If the list is empty:** do not render any blog section on the homepage.
- **If one or more posts:** render a mobile-first “From the blog” (or similar) section — single-column cards on mobile, multi-col from `md`/`lg`; each card links to `/blog/[slug]`; include “View all” → `/blog`.
- Only published + flagged posts appear here; drafts with the flag still must not show (API enforces). Unflagged published posts remain on `/blog` only.

### 6. Types

Mirror API fields: `id`, `title`, `slug`, `excerpt`, `bodyJson`, `bodyHtml`, `coverImagePath`, `status`, `publishedAt`, `seoTitle`, `seoDescription`, `authorName`, `showOnHomepage`, `createdAt`, `updatedAt`, media URLs as returned.

## API quick reference

Confirm against backend docs after backend agent ships. Expected contract:

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/admin/blog` | staff | List all non-deleted (or include deleted flag); filter status optional |
| POST | `/api/admin/blog` | staff | Create draft `{ title, slug?, excerpt?, bodyJson?, showOnHomepage?, ... }` |
| GET | `/api/admin/blog/:id` | staff | Full post including `bodyJson` / `bodyHtml` / `showOnHomepage` |
| PATCH | `/api/admin/blog/:id` | staff | Update fields; publish/unpublish via `status`; toggle `showOnHomepage` |
| DELETE | `/api/admin/blog/:id` | staff | Soft delete |
| PATCH | `/api/admin/blog/:id/restore` | staff | Restore |
| POST | `/api/admin/blog/:id/cover` | staff | Multipart image → `coverImagePath` / URL |
| POST | `/api/admin/blog/:id/media` | staff | Multipart inline image → URL for TipTap image node |
| GET | `/api/blog` | public | Published only; pagination `page` / `limit`; optional `showOnHomepage=true` for homepage |
| GET | `/api/blog/:slug` | public | Published only; 404 if draft/missing |
| GET | `/api/assets/blog-images/:postId/:file` | public | Serve cover/inline images |

Envelope: `{ success, message, data }` (same as rest of API).

Save body: send `bodyJson` (required for block editor). Include `bodyHtml` only if backend accepts client HTML; prefer letting backend sanitize/regenerate `bodyHtml` when documented that way.

## Out of scope (FE)

- Prisma / Express / migrations
- Tags, comments, RSS, scheduled publish UI
- Auto-showing newest posts on homepage without `showOnHomepage`
- Video file uploads
- Changing age-gate or analytics

## Suggested first message for frontend agent

```
Read @inbetween.md (Blog handoff). Backend blog APIs should already be live — verify against baseDocs/api-endpoints.md.

Implement the frontend only: admin TipTap + HTML paste + live preview, public /blog pages, sitemap + nav, and a conditional homepage blog section driven by showOnHomepage.

Hard requirement: blog index, post, homepage strip (when present), and admin editor preview are mobile-first with no compromise (see Mobile responsive section). Do not modify backend/ or Prisma.
```