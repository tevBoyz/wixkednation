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
- Status: `missing`
- Endpoints: none (role guard)
- Key files (planned): `app/admin/layout.tsx`
- Your confirmation required: yes

### Stage 32: Admin dashboard
- Status: `missing`
- Endpoints: `GET /api/admin/dashboard/stats`, `GET /api/admin/dashboard/recent-orders`
- Key files (planned): `app/admin/page.tsx`
- Your confirmation required: yes

### Stage 33: Admin category list
- Status: `missing`
- Endpoints: `GET /api/admin/categories`
- Key files (planned): `app/admin/categories/page.tsx`
- Your confirmation required: yes

### Stage 34: Admin category create + edit
- Status: `missing`
- Endpoints: `POST/PATCH /api/admin/categories*`
- Key files (planned): category form components
- Your confirmation required: yes

### Stage 35: Admin category soft delete + restore
- Status: `missing`
- Endpoints: `DELETE/PATCH .../restore`
- Key files (planned): category list actions
- Your confirmation required: yes

### Stage 36: Admin product list
- Status: `missing`
- Endpoints: `GET /api/admin/products`
- Key files (planned): `app/admin/products/page.tsx`
- Your confirmation required: yes

### Stage 37: Admin product create
- Status: `missing`
- Endpoints: `POST /api/admin/products`
- Key files (planned): `app/admin/products/new/page.tsx`
- Your confirmation required: yes

### Stage 38: Admin product edit
- Status: `missing`
- Endpoints: `GET/PATCH /api/admin/products/:id`
- Key files (planned): `app/admin/products/[id]/page.tsx`
- Your confirmation required: yes

### Stage 39: Admin product image upload
- Status: `missing`
- Endpoints: `POST /api/admin/products/:id/images`
- Key files (planned): image upload component
- Your confirmation required: yes

### Stage 40: Admin product image cover, reorder, delete
- Status: `missing`
- Endpoints: cover, reorder, delete image routes
- Key files (planned): image gallery manager
- Your confirmation required: yes

### Stage 41: Admin product visibility, soft delete, restore
- Status: `missing`
- Endpoints: visibility, DELETE, restore
- Key files (planned): product list actions
- Your confirmation required: yes

### Stage 42: Admin order list
- Status: `missing`
- Endpoints: `GET /api/admin/orders`
- Key files (planned): `app/admin/orders/page.tsx`
- Your confirmation required: yes

### Stage 43: Admin order detail
- Status: `missing`
- Endpoints: `GET /api/admin/orders/:id` (includes reputation)
- Key files (planned): `app/admin/orders/[id]/page.tsx`
- Your confirmation required: yes

### Stage 44: Admin order status update
- Status: `missing`
- Endpoints: `PATCH /api/admin/orders/:id/status`
- Key files (planned): status update form
- Your confirmation required: yes

### Stage 45: Admin customer list
- Status: `missing`
- Endpoints: `GET /api/admin/customers`
- Key files (planned): `app/admin/customers/page.tsx`
- Your confirmation required: yes

### Stage 46: Admin customer detail
- Status: `missing`
- Endpoints: `GET /api/admin/customers/:id`, `GET .../orders`
- Key files (planned): `app/admin/customers/[id]/page.tsx`
- Your confirmation required: yes

### Stage 47: Admin settings (general)
- Status: `missing`
- Endpoints: `GET/PATCH /api/admin/settings` (NO cancellation route)
- Key files (planned): `app/admin/settings/page.tsx`
- Your confirmation required: yes

### Stage 48: Admin phones + SMS provider settings
- Status: `missing`
- Endpoints: admin-phones, sms settings routes
- Key files (planned): settings phone/SMS sections
- Your confirmation required: yes

### Stage 49: Admin SMS test + logs
- Status: `missing`
- Endpoints: `POST /api/admin/sms/test`, `GET /api/admin/sms/logs`
- Key files (planned): `app/admin/settings/sms/page.tsx`
- Your confirmation required: yes

### Stage 50: SEO, metadata, sitemap
- Status: `missing`
- Endpoints: none (uses public catalog)
- Key files (planned): `app/sitemap.ts`, `app/robots.ts`
- Your confirmation required: yes

### Stage 51: Accessibility, performance, responsive QA
- Status: `missing`
- Endpoints: none
- Key files (planned): loading states, a11y fixes
- Your confirmation required: yes

### Stage 52: Final test suite + production readiness
- Status: `missing`
- Endpoints: E2E covers full flows
- Key files (planned): `e2e/*`, `package.json` scripts
- Your confirmation required: yes

---

## Summary

| Status | Count |
|--------|-------|
| done | 11 |
| partial | 0 |
| missing | 41 |

## Related files

- Execution plan: [`frontend imp plan.txt`](frontend%20imp%20plan.txt)
- API map: [`api-integration.md`](api-integration.md)
- Manual QA: [`final-testing-checklist.md`](final-testing-checklist.md)
- Backend handoff: [`../../inbetween.md`](../../inbetween.md)
