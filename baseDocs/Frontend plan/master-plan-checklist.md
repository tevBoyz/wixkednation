# Frontend Master Checklist

Maps [`frontend imp plan.txt`](frontend%20imp%20plan.txt) to implementation status.

Status values:
- `done` — implemented and you confirmed tests pass
- `partial` — started but incomplete or failing tests
- `missing` — not started

**Sync note:** Created 2026-07-21. Stages 1–20 confirmed done 2026-07-22. Stage 21 merge implemented 2026-07-22 — left `partial` until checkout redirect can be re-verified in Stage 24.

**Follow-up (do not skip):** When Stage 24 (Checkout foundation) is done, remind the user to confirm Stage 21 end-to-end: guest cart → Checkout → login → land on `/checkout` with merged cart → then mark Stage 21 `done`.


API source of truth: [`../backend-postman-collection.json`](../backend-postman-collection.json) (72 routes)

---

## Stage Checklist

### Stage 1: Project scaffold, env, backend health
- Status: `done`
- Endpoints: `GET /api/health`
- Key files: `frontend/`, `.env.local`, `src/config/env.ts`, `src/lib/api/health.ts`, `src/components/dev/BackendHealthCheck.tsx`
- Confirmed: 2026-07-21

### Stage 2: shadcn/ui and foundational packages
- Status: `done`
- Endpoints: none
- Key files: `components.json`, `src/components/ui/*`, `src/lib/utils.ts`, `src/app/dev/ui/page.tsx`
- Confirmed: 2026-07-21

### Stage 3: Theme, typography, dark mode
- Status: `done`
- Endpoints: none
- Key files: `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `globals.css`
- Confirmed: 2026-07-21

### Stage 4: Application providers and global error handling
- Status: `done`
- Endpoints: none
- Key files: `src/components/providers/*`, `src/lib/api/errors.ts`, `app/error.tsx`, `app/not-found.tsx`
- Confirmed: 2026-07-21

### Stage 5: Shared storefront layout
- Status: `done`
- Endpoints: none
- Key files: `src/app/(store)/layout.tsx`, `src/components/layout/*`
- Confirmed: 2026-07-21

### Stage 6: Age gate + blocked page (API-backed)
- Status: `done`
- Endpoints: `POST /api/age-gate/verify`, `POST /api/age-gate/block`
- Key files: `src/app/age-gate/page.tsx`, `src/app/blocked/page.tsx`, `src/middleware.ts`, `src/lib/api/age-gate.ts`
- Confirmed: 2026-07-21

### Stage 7: Central API client
- Status: `done`
- Endpoints: `GET /api/health` (via client)
- Key files: `src/lib/api/client.ts`, `src/lib/auth/token-storage.ts`
- Confirmed: 2026-07-21

### Stage 8: API types and endpoint modules
- Status: `done`
- Endpoints: catalog + all domain API modules (stubs/implementations)
- Key files: `src/lib/api/types.ts`, `src/lib/api/*.api.ts`, `src/lib/api/admin/*`, `CatalogApiSmoke`
- Confirmed: 2026-07-21

### Stage 9: Phone login screen
- Status: `done`
- Endpoints: `POST /api/auth/otp/send`
- Key files: `src/components/auth/login-form.tsx`, `src/lib/phone.ts`, `(store)/login`
- Confirmed: 2026-07-21

### Stage 10: OTP verification
- Status: `done`
- Endpoints: `POST /api/auth/otp/verify`
- Key files: `src/components/auth/verify-otp-form.tsx`, auth session `setSession`
- Confirmed: 2026-07-21

### Stage 11: Google OAuth (secure handoff)
- Status: `done`
- Endpoints: `GET /api/auth/google/start`, `POST /api/auth/exchange-code`
- Key files: `login-form.tsx` Google button, `app/auth/google/callback/*`
- Confirmed: 2026-07-21

### Stage 12: Auth session restore, refresh, logout
- Status: `done`
- Endpoints: `GET /api/users/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- Key files: `src/lib/auth/session.ts`, `src/lib/api/client.ts` (401→refresh), `auth-provider.tsx`, `auth-bootstrap-gate.tsx`, `site-header.tsx` (logout)
- Confirmed: 2026-07-21

### Stage 13: Auth and admin guards
- Status: `done`
- Endpoints: optional `GET /api/auth/admin-check`
- Key files: `src/components/guards/*`, `(store)/account|checkout/layout.tsx`, `app/admin/*`, `(store)/forbidden`
- Confirmed: 2026-07-21

### Stage 14: Public categories
- Status: `done`
- Endpoints: `GET /api/categories`, `GET /api/categories/:slug`
- Key files: `categories.api.ts`, `categories-nav.tsx`, `category-card.tsx`, `app/(store)/categories/**`, `nav-hover-menu.tsx`
- Confirmed: 2026-07-21

### Stage 15: Public product list
- Status: `done`
- Endpoints: `GET /api/products`
- Key files: `products.api.ts`, `product-card.tsx`, `products-filters.tsx`, `products-pagination.tsx`, `lib/catalog/format.ts`, `app/(store)/products/page.tsx`
- Confirmed: 2026-07-21

### Stage 16: Homepage + featured products
- Status: `done`
- Endpoints: `GET /api/products/featured`, `GET /api/categories`
- Key files: `app/(store)/page.tsx`, `catalog-image.tsx`, `hero-featured-stack.tsx`, `product-card.tsx`
- Confirmed: 2026-07-22

### Stage 17: Product detail page
- Status: `done`
- Endpoints: `GET /api/products/:slug`
- Key files: `app/(store)/products/[slug]/page.tsx`, `product-gallery.tsx`, `add-to-cart-button.tsx`, `product-back-button.tsx`
- Confirmed: 2026-07-22

### Stage 18: Guest cart state
- Status: `done`
- Endpoints: none (localStorage)
- Key files: `src/lib/cart/guest-cart.ts`, `src/stores/guest-cart-store.ts`, `cart-provider.tsx`
- Confirmed: 2026-07-22

### Stage 19: Cart UI
- Status: `done`
- Endpoints: none for guest
- Key files: `app/(store)/cart/page.tsx`, `components/cart/*`
- Confirmed: 2026-07-22

### Stage 20: Authenticated server cart
- Status: `done`
- Endpoints: `GET/POST/PATCH/DELETE /api/cart*`
- Key files: `src/lib/api/cart.api.ts`, `cart-provider.tsx` (auth branch)
- Confirmed: 2026-07-22

### Stage 21: Guest cart merge after login
- Status: `done`
- Endpoints: `POST /api/cart/merge`
- Key files: `src/lib/cart/merge-guest-cart.ts`, `cart-provider.tsx`, auth redirect helpers (`lib/auth/redirect.ts`)
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Guest → Checkout → login → `/checkout` with merged cart verified.

### Stage 22: Account layout + profile
- Status: `done`
- Endpoints: `GET/PATCH /api/users/me`
- Key files: `app/(store)/account/layout.tsx`, `app/(store)/account/profile/page.tsx`, `components/account/profile-form.tsx`, `components/account/account-nav.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Account shell with nav (profile, addresses, orders, notifications placeholders). Profile form updates name/email; phone read-only. No reputation fields.

### Stage 23: Address management
- Status: `done`
- Endpoints: `/api/users/me/addresses*`
- Key files: `app/(store)/account/addresses/page.tsx`, `components/account/addresses-manager.tsx`, `components/account/address-form-dialog.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: List/add/edit/delete + set default. Soft-delete with confirm dialog.

### Stage 24: Checkout foundation
- Status: `done`
- Endpoints: `GET /api/cart`, `GET /api/users/me/addresses`
- Key files: `app/(store)/checkout/page.tsx`, `components/checkout/checkout-page-client.tsx`, `components/checkout/checkout-address-picker.tsx`, `components/checkout/checkout-order-summary.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22

### Stage 25: Order creation
- Status: `done`
- Endpoints: `POST /api/orders`
- Key files: `components/checkout/checkout-page-client.tsx`, `app/(store)/order-success/[orderId]/page.tsx`, `components/checkout/order-success-client.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22

### Stage 26: Customer order history
- Status: `done`
- Endpoints: `GET /api/orders/me`
- Key files: `app/(store)/account/orders/page.tsx`, `components/orders/orders-list-client.tsx`, `components/orders/order-status-badge.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22

### Stage 27: Customer order detail
- Status: `done`
- Endpoints: `GET /api/orders/me/:orderId`
- Key files: `app/(store)/account/orders/[orderId]/page.tsx`, `components/orders/order-detail-client.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22

### Stage 28: Customer cancellation
- Status: `done`
- Endpoints: `POST /api/orders/:orderId/cancel`
- Key files: `components/orders/cancel-order-dialog.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22

### Stage 29: Notification list + read actions
- Status: `done`
- Endpoints: `GET/PATCH /api/notifications*`
- Key files: `app/(store)/account/notifications/page.tsx`, `components/notifications/notifications-list-client.tsx`, `components/notifications/notifications-nav-button.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Inbox with mark one/all read. Order notifications link to order detail. Nav bell (logged in only) with unread badge → `/account/notifications`.

### Stage 30: Notification polling (NOT Realtime)
- Status: `done`
- Endpoints: `GET /api/notifications` (poll 25s)
- Key files: `src/hooks/use-notifications.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Poll while tab visible; pauses when hidden; refetch on focus. No Supabase Realtime.
- **Re-test when admin order status UI ships (Stages 42–44):** admin status change → customer bell badge updates within ~25s without manual refresh.

### Stage 31: Admin shell + navigation
- Status: `done`
- Endpoints: none (role guard)
- Key files: `app/admin/layout.tsx`, `components/admin/admin-shell.tsx`, `components/admin/admin-sidebar-nav.tsx`, `components/admin/admin-nav.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Sidebar (Dashboard, Products, Categories, Orders, Customers, Settings). AdminGuard + admin-check. Mobile sheet nav. Header with logout + storefront link. Admin dashboard link in account menu.

### Stage 32: Admin dashboard
- Status: `done`
- Endpoints: `GET /api/admin/dashboard/stats`, `GET /api/admin/dashboard/recent-orders`
- Key files: `app/admin/page.tsx`, `components/admin/admin-dashboard-client.tsx`, `lib/api/admin/dashboard.api.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Stat cards + recent orders table with links to `/admin/orders/[id]` (detail placeholder until Stage 43).

### Stage 33: Admin category list
- Status: `done`
- Endpoints: `GET /api/admin/categories`
- Key files: `app/admin/categories/page.tsx`, `components/admin/categories/admin-categories-client.tsx`, `lib/api/admin/categories.api.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Table with name, slug, status badges (active/inactive/deleted). Search filter. New category button. Deleted rows sorted to bottom via `sortDeletedLast`.

### Stage 34: Admin category create + edit
- Status: `done`
- Endpoints: `POST/PATCH /api/admin/categories*`
- Key files: `components/admin/categories/category-form-dialog.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Dialog form with Zod validation (name, description, isActive). Duplicate slug (409) surfaced via toast.

### Stage 35: Admin category soft delete + restore
- Status: `done`
- Endpoints: `DELETE/PATCH .../restore`
- Key files: `components/admin/categories/delete-category-dialog.tsx`, list restore action
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Confirm modal before delete. Restore button on deleted rows. Invalidates public categories cache for nav refresh.

### Stage 36: Admin product list
- Status: `done`
- Endpoints: `GET /api/admin/products`
- Key files: `app/admin/products/page.tsx`, `components/admin/products/admin-products-client.tsx`, `components/admin/products/admin-products-filters.tsx`, `lib/api/admin/products.api.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Paginated table with search, category, visibility filters. Includes hidden + deleted. Hide/Show, Delete, Restore. Newest visible first; hidden/deleted at bottom.

### Stage 37: Admin product create
- Status: `done`
- Endpoints: `POST /api/admin/products`
- Key files: `app/admin/products/new/page.tsx`, `components/admin/products/admin-product-create-client.tsx`, `components/admin/products/admin-product-form.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Zod form. Redirects to edit page on success. List cache invalidated.

### Stage 38: Admin product edit
- Status: `done`
- Endpoints: `GET/PATCH /api/admin/products/:id`
- Key files: `app/admin/products/[id]/page.tsx`, `components/admin/products/admin-product-edit-client.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Prefilled form + PATCH save. Redirects to list after save.

### Stage 39: Admin product image upload
- Status: `done`
- Endpoints: `POST /api/admin/products/:id/images`
- Key files: `components/admin/products/product-image-gallery.tsx`, `lib/api/admin/product-image-upload.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Multipart upload via XHR with progress bar. JPG/PNG/WebP validation. Max 3 images enforced in UI + API. Client compresses files >1MB before upload.

### Stage 40: Admin product image cover, reorder, delete
- Status: `done`
- Endpoints: cover, reorder, delete image routes
- Key files: `components/admin/products/product-image-gallery.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Set cover, move left/right reorder, delete with confirm modal.

### Stage 41: Admin product visibility, soft delete, restore
- Status: `done`
- Endpoints: visibility, DELETE, restore
- Key files: `components/admin/products/delete-product-dialog.tsx`, list actions in `admin-products-client.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Hide/Show toggle, soft delete confirm, restore on deleted rows.

### Stage 42: Admin order list
- Status: `done`
- Endpoints: `GET /api/admin/orders`
- Key files: `app/admin/orders/page.tsx`, `components/admin/orders/admin-orders-client.tsx`, `components/admin/orders/admin-orders-filters.tsx`, `lib/api/admin/orders.api.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Paginated table, search (order # / customer), status filter, URL query sync, links to detail.

### Stage 43: Admin order detail
- Status: `done`
- Endpoints: `GET /api/admin/orders/:id` (includes reputation)
- Key files: `app/admin/orders/[orderId]/page.tsx`, `components/admin/orders/admin-order-detail-client.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Items snapshot, delivery address, COD total, status history timeline, customer reputation panel (admin-only), link to customer profile.

### Stage 44: Admin order status update
- Status: `done`
- Endpoints: `PATCH /api/admin/orders/:id/status`
- Key files: `components/admin/orders/admin-order-status-dialog.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Status dialog with optional note; confirm step for Cancelled/Delivered; toast clarifies in-app notification only (no SMS).

### Stage 45: Admin customer list
- Status: `done`
- Endpoints: `GET /api/admin/customers`
- Key files: `app/admin/customers/page.tsx`, `components/admin/customers/admin-customers-client.tsx`, `components/admin/customers/admin-customers-filters.tsx`, `lib/api/admin/customers.api.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Paginated table with reputation score, order count, search by name/phone/email, links to detail.

### Stage 46: Admin customer detail
- Status: `done`
- Endpoints: `GET /api/admin/customers/:id`, `GET /api/admin/customers/:id/orders`
- Key files: `app/admin/customers/[customerId]/page.tsx`, `components/admin/customers/admin-customer-detail-client.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Contact info, reputation breakdown, recent orders preview, paginated order history with status filter, links to admin order detail.

### Stage 47: Admin settings (general)
- Status: `done`
- Endpoints: `GET/PATCH /api/admin/settings` (NO cancellation route)
- Key files: `app/admin/settings/page.tsx`, `components/admin/settings/admin-settings-client.tsx`, `components/admin/settings/admin-settings-nav.tsx`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Default measurement unit form; no cancellation toggle.

### Stage 48: Admin phones + SMS provider settings
- Status: `done`
- Endpoints: admin-phones, sms settings routes
- Key files: `components/admin/settings/admin-settings-client.tsx` (phones + SMS sections)
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Add/remove admin alert phones; provider + sender ID metadata only (no API token fields).

### Stage 49: Admin SMS test + logs
- Status: `done`
- Endpoints: `POST /api/admin/sms/test`, `GET /api/admin/sms/logs`
- Key files: `app/admin/settings/sms/page.tsx`, `components/admin/settings/admin-sms-client.tsx`, `lib/admin/sms-log.ts`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Test SMS form; paginated logs with status filter; OTP messages redacted in UI.

### Stage 50: Admin media library (product images)
- Status: `done`
- Endpoints: `GET /api/admin/media` (exists); delete reuses `DELETE /api/admin/products/:id/images/:imageId` (**exists**)
- Key files (implemented):
  - Frontend: `app/admin/media/page.tsx`, `components/admin/media/admin-media-client.tsx`, `lib/api/admin/media.api.ts`
  - Nav: `components/admin/admin-nav.ts` — add **Media** item
- Your confirmation required: yes
- Implemented: 2026-07-22
- Depends on: Stages 39–40 (upload + delete image flows)
- Design (DB-first, not raw bucket browser):
  - **Source of truth:** flatten `Product.images` JSON across all products
  - **List:** paginated grid with thumbnail (proxy URL), product link, size, date, cover badge
  - **Summary bar:** total image count + total storage bytes
  - **Filters:** search by product name; `includeArchived` for hidden/soft-deleted products
  - **Delete:** reuse existing product-image delete endpoint (storage + product JSON in sync)
  - **Out of scope v1:** bucket orphan scan, bulk delete, upload from media page
 - Notes: Default placeholder (`/api/assets/default-product.webp`) not in bucket. See `inbetween.md` for backend contract.

### Stage 50.1: Default store currency (admin + storefront)
- Status: `done`
- Endpoints: `GET/PATCH /api/admin/settings` (`defaultCurrency`); `GET /api/store/config` (public)
- Key files:
  - `lib/catalog/currency.ts`, `lib/api/store-config.api.ts`
  - `components/providers/store-config-provider.tsx` — `useFormatPrice`, `useStoreCurrency`
  - `components/admin/settings/admin-settings-client.tsx` — currency dropdown
  - All price displays via dynamic `formatPrice` (catalog, cart, checkout, orders, admin)
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: User-friendly API error sanitization added (backend + frontend) so Prisma errors never surface in UI.

### Stage 51: Accessibility, performance, responsive QA
- Status: `done`
- Endpoints: none
- Key files:
  - `components/layout/skip-link.tsx`, `components/ui/page-skeletons.tsx`
  - `components/catalog/catalog-image.tsx` (next/image)
  - Route `loading.tsx` for products, cart, checkout, admin
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Skip link, reduced-motion, next/image catalog, route skeletons, dev routes removed/blocked.

### Stage 52: SEO, metadata, sitemap
- Status: `done`
- Endpoints: none (uses public catalog)
- Key files:
  - `lib/seo/site-metadata.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/icon.svg`
  - `public/brand/gasnation-mark.svg`, `public/brand/gasnation-og.svg`
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: Favicon = mark only; OG/Twitter = full GasNation logo asset; admin/account/login noindex.

### Stage 53: Final test suite + production readiness
- Status: `done`
- Endpoints: E2E covers public smoke + optional OTP
- Key files:
  - Unit: `src/lib/**/*.test.ts` (phone, errors, cart, format) via Vitest
  - E2E: `e2e/smoke.spec.ts`, `e2e/guest-cart.spec.ts`, `e2e/otp-login.spec.ts` (Playwright)
  - Scripts: `test`, `test:e2e`, `verify`
  - `.env.example` documented (public env only)
- Your confirmation required: yes
- Implemented: 2026-07-22
- Confirmed: 2026-07-22
- Notes: No JWT/SERVICE_ROLE secrets in frontend. OTP E2E skipped unless `E2E_OTP` is set.

---

## Summary

| Status | Count |
|--------|-------|
| done | 53 |
| partial | 0 |
| blocked | 0 |
| missing | 0 |

## Related files

- Execution plan: [`frontend imp plan.txt`](frontend%20imp%20plan.txt)
- API map: [`api-integration.md`](api-integration.md)
- Manual QA: [`final-testing-checklist.md`](final-testing-checklist.md)
- Backend handoff: [`../../inbetween.md`](../../inbetween.md)
