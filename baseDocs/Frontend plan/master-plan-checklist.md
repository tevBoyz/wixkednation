# Frontend Master Checklist

Maps [`frontend imp plan.txt`](frontend%20imp%20plan.txt) to implementation status.

Status values:
- `done` — implemented and you confirmed tests pass
- `partial` — started but incomplete or failing tests
- `missing` — not started

**Sync note:** Created 2026-07-21. Stage 1 confirmed done 2026-07-21.

API source of truth: [`../backend-postman-collection.json`](../backend-postman-collection.json) (72 routes)

---

## Stage Checklist

### Stage 1: Project scaffold, env, backend health
- Status: `done`
- Endpoints: `GET /api/health`
- Key files: `frontend/`, `.env.local`, `src/config/env.ts`, `src/lib/api/health.ts`, `src/components/dev/BackendHealthCheck.tsx`
- Confirmed: 2026-07-21

### Stage 2: shadcn/ui and foundational packages
- Status: `missing`
- Endpoints: none
- Key files (planned): `components/ui/*`, `src/lib/utils.ts`
- Your confirmation required: yes

### Stage 3: Theme, typography, dark mode
- Status: `missing`
- Endpoints: none
- Key files (planned): `src/components/theme-provider.tsx`, `globals.css`
- Your confirmation required: yes

### Stage 4: Application providers and global error handling
- Status: `missing`
- Endpoints: none
- Key files (planned): `src/components/providers.tsx`, `app/error.tsx`
- Your confirmation required: yes

### Stage 5: Shared storefront layout
- Status: `missing`
- Endpoints: none
- Key files (planned): `src/components/layout/header.tsx`, `footer.tsx`
- Your confirmation required: yes

### Stage 6: Age gate + blocked page (API-backed)
- Status: `missing`
- Endpoints: `POST /api/age-gate/verify`, `POST /api/age-gate/block`
- Key files (planned): `app/age-gate/page.tsx`, `app/blocked/page.tsx`
- Your confirmation required: yes

### Stage 7: Central API client
- Status: `missing`
- Endpoints: `GET /api/health`
- Key files (planned): `src/lib/api/client.ts`
- Your confirmation required: yes

### Stage 8: API types and endpoint modules
- Status: `missing`
- Endpoints: all Postman domains (stubs)
- Key files (planned): `src/lib/api/*.ts`
- Your confirmation required: yes

### Stage 9: Phone login screen
- Status: `missing`
- Endpoints: `POST /api/auth/otp/send`
- Key files (planned): `app/(auth)/login/page.tsx`
- Your confirmation required: yes

### Stage 10: OTP verification
- Status: `missing`
- Endpoints: `POST /api/auth/otp/verify`
- Key files (planned): `app/(auth)/verify-otp/page.tsx`
- Your confirmation required: yes

### Stage 11: Google OAuth (secure handoff)
- Status: `missing`
- Endpoints: `GET /api/auth/google/start`, `POST /api/auth/exchange-code`
- Key files (planned): `app/auth/google/callback/page.tsx`
- Your confirmation required: yes

### Stage 12: Auth session restore, refresh, logout
- Status: `missing`
- Endpoints: `GET /api/users/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- Key files (planned): `src/lib/auth/*`, `src/hooks/useAuth.ts`
- Your confirmation required: yes

### Stage 13: Auth and admin guards
- Status: `missing`
- Endpoints: optional `GET /api/auth/admin-check`
- Key files (planned): `src/components/guards/*`
- Your confirmation required: yes

### Stage 14: Public categories
- Status: `missing`
- Endpoints: `GET /api/categories`, `GET /api/categories/:slug`
- Key files (planned): `app/(store)/categories/[slug]/page.tsx`
- Your confirmation required: yes

### Stage 15: Public product list
- Status: `missing`
- Endpoints: `GET /api/products`
- Key files (planned): `app/(store)/products/page.tsx`
- Your confirmation required: yes

### Stage 16: Homepage + featured products
- Status: `missing`
- Endpoints: `GET /api/products/featured`, `GET /api/categories`
- Key files (planned): `app/(store)/page.tsx`
- Your confirmation required: yes

### Stage 17: Product detail page
- Status: `missing`
- Endpoints: `GET /api/products/:slug`
- Key files (planned): `app/(store)/products/[slug]/page.tsx`
- Your confirmation required: yes

### Stage 18: Guest cart state
- Status: `missing`
- Endpoints: none (localStorage)
- Key files (planned): `src/lib/cart/guest-cart.ts`, `src/stores/cart-store.ts`
- Your confirmation required: yes

### Stage 19: Cart UI
- Status: `missing`
- Endpoints: none (guest)
- Key files (planned): `app/(store)/cart/page.tsx`
- Your confirmation required: yes

### Stage 20: Authenticated server cart
- Status: `missing`
- Endpoints: `GET/POST/PATCH/DELETE /api/cart*`
- Key files (planned): `src/lib/api/cart.api.ts`
- Your confirmation required: yes

### Stage 21: Guest cart merge after login
- Status: `missing`
- Endpoints: `POST /api/cart/merge`
- Key files (planned): merge hook in auth flow
- Your confirmation required: yes

### Stage 22: Account layout + profile
- Status: `missing`
- Endpoints: `GET/PATCH /api/users/me`
- Key files (planned): `app/account/profile/page.tsx`
- Your confirmation required: yes

### Stage 23: Address management
- Status: `missing`
- Endpoints: `/api/users/me/addresses*`
- Key files (planned): `app/account/addresses/page.tsx`
- Your confirmation required: yes

### Stage 24: Checkout foundation
- Status: `missing`
- Endpoints: `GET /api/cart`, `GET /api/users/me/addresses`
- Key files (planned): `app/(store)/checkout/page.tsx`
- Your confirmation required: yes

### Stage 25: Order creation
- Status: `missing`
- Endpoints: `POST /api/orders` body `{ addressId, paymentMethod: "COD" }`
- Key files (planned): `app/(store)/order-success/[orderId]/page.tsx`
- Your confirmation required: yes

### Stage 26: Customer order history
- Status: `missing`
- Endpoints: `GET /api/orders/me`
- Key files (planned): `app/account/orders/page.tsx`
- Your confirmation required: yes

### Stage 27: Customer order detail
- Status: `missing`
- Endpoints: `GET /api/orders/me/:orderId`
- Key files (planned): `app/account/orders/[orderId]/page.tsx`
- Your confirmation required: yes

### Stage 28: Customer cancellation
- Status: `missing`
- Endpoints: `POST /api/orders/:orderId/cancel` + `cancelledFromStatus`
- Key files (planned): cancel dialog on order detail
- Your confirmation required: yes

### Stage 29: Notification list + read actions
- Status: `missing`
- Endpoints: `GET/PATCH /api/notifications*`
- Key files (planned): `app/account/notifications/page.tsx`
- Your confirmation required: yes

### Stage 30: Notification polling (NOT Realtime)
- Status: `missing`
- Endpoints: `GET /api/notifications` (poll 20–30s)
- Key files (planned): `src/hooks/useNotifications.ts`
- Your confirmation required: yes

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
| done | 1 |
| partial | 0 |
| missing | 51 |

## Related files

- Execution plan: [`frontend imp plan.txt`](frontend%20imp%20plan.txt)
- API map: [`api-integration.md`](api-integration.md)
- Manual QA: [`final-testing-checklist.md`](final-testing-checklist.md)
- Backend handoff: [`../../inbetween.md`](../../inbetween.md)
