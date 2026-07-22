# Frontend API Integration Map

Maps UI routes, hooks, and API modules to [`../backend-postman-collection.json`](../backend-postman-collection.json).

**Status:** living map — Stages 1–20 confirmed. Stage 21 merge implemented but left partial until Stage 24 checkout redirect re-test.

Auth header (where noted): `Authorization: Bearer <accessToken>`

Response shapes:
- Standard: `{ success, message, data }`
- Legacy: `GET /api/auth/me` → `{ user }` at top level
- Preferred profile: `GET /api/users/me` → `{ data: { user } }`

---

## Health (5)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/` | none | — | — | — |
| GET | `/api/health` | none | home diagnostic, `health.ts` via `client.ts` | 1, 7 | yes (2026-07-21 Stage 7 client) |
| GET | `/api/health/supabase` | none | optional admin diag | — | — |
| GET | `/api/health/prisma` | none | optional admin diag | — | — |
| GET | `/api/health/storage` | none | optional admin diag | — | — |

---

## Age gate (2)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| POST | `/api/age-gate/verify` | none | `/age-gate`, `age-gate.ts` | 6 | yes (2026-07-21 Stage 6) |
| POST | `/api/age-gate/block` | none | `/age-gate` decline, `age-gate.ts` | 6 | yes (2026-07-21 Stage 6) |

---

## Auth (9)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| POST | `/api/auth/otp/send` | none | `/login`, `auth.api.ts` | 9 | yes (2026-07-21 Stage 9) |
| POST | `/api/auth/otp/verify` | none | `/verify-otp`, `auth.api.ts` | 10 | yes (2026-07-21 Stage 10) |
| POST | `/api/auth/refresh` | none | API client interceptor, `session.ts` | 12 | yes (2026-07-21 Stage 12) |
| POST | `/api/auth/logout` | none | header logout, `auth.api.ts` | 12 | yes (2026-07-21 Stage 12) |
| GET | `/api/auth/google/start` | none | Google button redirect | 11 | yes (2026-07-21 Stage 11) |
| GET | `/api/auth/google/callback` | none | backend only (browser OAuth) | 11 | yes |
| POST | `/api/auth/exchange-code` | none | `/auth/google/callback`, `auth.api.ts` | 11 | yes (2026-07-21 Stage 11) |
| GET | `/api/auth/me` | Bearer | legacy bootstrap fallback | 12 | — |
| GET | `/api/auth/admin-check` | admin | `AdminGuard` verify | 13 | yes (2026-07-21 Stage 13) |

---

## Users (2)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/users/me` | Bearer | `useAuth` bootstrap, `/account/profile` | 12, 22 | yes (2026-07-22 Stage 22) |
| PATCH | `/api/users/me` | Bearer | profile form | 22 | yes (2026-07-22) |

---

## Public catalog (5)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/categories` | none | header nav, `/categories`, homepage | 14, 16 | yes (2026-07-21 Stage 14) |
| GET | `/api/categories/:slug` | none | `/categories/[slug]` | 14 | yes (2026-07-21 Stage 14) |
| GET | `/api/products` | none | `/products` | 15 | yes (2026-07-21 Stage 15) |
| GET | `/api/products/featured` | none | homepage | 16 | yes (2026-07-21 Stage 16) |
| GET | `/api/products/:slug` | none | `/products/[slug]` | 17 | yes (2026-07-21 Stage 17) |

---

## Store config (1) — public

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/store/config` | none | `StoreConfigProvider`, `useFormatPrice` | 50.1 | yes (2026-07-22) |

---

## Cart (6) — customer JWT

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/cart` | customer | cart page (logged in), checkout | 20, 24 | yes (2026-07-22 Stage 20) |
| POST | `/api/cart/items` | customer | add to cart (logged in) | 20 | yes (2026-07-22 Stage 20) |
| PATCH | `/api/cart/items/:itemId` | customer | cart qty update | 20 | yes (2026-07-22 Stage 20) |
| DELETE | `/api/cart/items/:itemId` | customer | remove item | 20 | yes (2026-07-22 Stage 20) |
| DELETE | `/api/cart` | customer | clear cart | 20 | yes (2026-07-22 Stage 20) |
| POST | `/api/cart/merge` | customer | post-login merge | 21 | yes (2026-07-22 Stage 21) |

Guest cart: **localStorage only** — no API (Stages 18–19).

---

## Addresses (4) — customer JWT

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/users/me/addresses` | customer | `/account/addresses`, checkout | 23, 24 | yes (2026-07-22) |
| POST | `/api/users/me/addresses` | customer | add address form | 23 | yes (2026-07-22) |
| PATCH | `/api/users/me/addresses/:addressId` | customer | edit address | 23 | yes (2026-07-22) |
| DELETE | `/api/users/me/addresses/:addressId` | customer | delete address | 23 | yes (2026-07-22) |

---

## Orders — customer (4)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| POST | `/api/orders` | customer | checkout `{ addressId, paymentMethod: "COD" }` | 25 | yes (2026-07-22) |
| GET | `/api/orders/me` | customer | `/account/orders` | 26 | yes (2026-07-22) |
| GET | `/api/orders/me/:orderId` | customer | `/account/orders/[orderId]` | 27 | yes (2026-07-22) |
| POST | `/api/orders/:orderId/cancel` | customer | cancel dialog `{ cancelledFromStatus, note? }` | 28 | yes (2026-07-22) |

**No reputation** on customer order endpoints.

---

## Notifications (3) — customer JWT, polling only

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/notifications` | customer | inbox, badge, `useNotifications` poll | 29, 30 | yes (2026-07-22) |
| PATCH | `/api/notifications/:id/read` | customer | mark one read | 29 | yes (2026-07-22) |
| PATCH | `/api/notifications/read-all` | customer | mark all read | 29 | yes (2026-07-22) |

Poll interval: 20–30s while tab visible. See [`../notification-polling.md`](../notification-polling.md).

---

## Admin categories (6) — admin JWT

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/categories` | admin | `/admin/categories` | 33 | yes (2026-07-22) |
| POST | `/api/admin/categories` | admin | create form | 34 | yes (2026-07-22) |
| GET | `/api/admin/categories/:id` | admin | edit load | 34 | yes (2026-07-22) |
| PATCH | `/api/admin/categories/:id` | admin | edit save | 34 | yes (2026-07-22) |
| DELETE | `/api/admin/categories/:id` | admin | soft delete | 35 | yes (2026-07-22) |
| PATCH | `/api/admin/categories/:id/restore` | admin | restore | 35 | yes (2026-07-22) |

---

## Admin products + images (11) — admin JWT

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/products` | admin | `/admin/products` | 36 | yes (2026-07-22) |
| POST | `/api/admin/products` | admin | `/admin/products/new` | 37 | yes (2026-07-22) |
| GET | `/api/admin/products/:id` | admin | `/admin/products/[id]` edit load | 38 | yes (2026-07-22) |
| PATCH | `/api/admin/products/:id` | admin | `/admin/products/[id]` edit save | 38 | yes (2026-07-22) |
| PATCH | `/api/admin/products/:id/visibility` | admin | list Hide/Show toggle | 41 | yes (2026-07-22) |
| DELETE | `/api/admin/products/:id` | admin | list soft delete | 41 | yes (2026-07-22) |
| PATCH | `/api/admin/products/:id/restore` | admin | list restore | 41 | yes (2026-07-22) |
| POST | `/api/admin/products/:id/images` | admin | edit gallery upload | 39 | yes (2026-07-22) |
| PATCH | `/api/admin/products/:id/images/reorder` | admin | edit gallery reorder | 40 | yes (2026-07-22) |
| PATCH | `/api/admin/products/:id/images/:imageId/cover` | admin | edit set cover | 40 | yes (2026-07-22) |
| DELETE | `/api/admin/products/:id/images/:imageId` | admin | edit delete image | 40 | yes (2026-07-22) |

Upload: **Express only** — never direct Supabase from browser.

---

## Admin orders (3) — admin JWT, includes reputation

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/orders` | admin | `/admin/orders` | 42 | yes (2026-07-22) |
| GET | `/api/admin/orders/:id` | admin | `/admin/orders/[orderId]` + `user.reputation` | 43 | yes (2026-07-22) |
| PATCH | `/api/admin/orders/:id/status` | admin | status update dialog | 44 | yes (2026-07-22) |

**No** `PATCH /api/admin/orders/:id/cancel` — use status update.

---

## Admin dashboard (2)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/dashboard/stats` | admin | `/admin` stat cards | 32 | yes (2026-07-22) |
| GET | `/api/admin/dashboard/recent-orders` | admin | `/admin` recent table | 32 | yes (2026-07-22) |

---

## Admin customers + reputation (3) — admin only

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/customers` | admin | `/admin/customers` | 45 | yes (2026-07-22) |
| GET | `/api/admin/customers/:id` | admin | `/admin/customers/[customerId]` | 46 | yes (2026-07-22) |
| GET | `/api/admin/customers/:id/orders` | admin | customer order history | 46 | yes (2026-07-22) |

Reputation fields: **never** on customer-facing pages.

---

## Admin settings (5)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/settings` | admin | `/admin/settings` | 47, 50.1 | yes (2026-07-22) |
| PATCH | `/api/admin/settings` | admin | general settings form (`defaultMeasurementUnit`, `defaultCurrency`) | 47, 50.1 | yes (2026-07-22) |
| POST | `/api/admin/settings/admin-phones` | admin | add admin phone | 48 | yes (2026-07-22) |
| DELETE | `/api/admin/settings/admin-phones/:phoneId` | admin | remove phone | 48 | yes (2026-07-22) |
| PATCH | `/api/admin/settings/sms` | admin | SMS provider metadata | 48 | yes (2026-07-22) |

**Removed:** `PATCH /api/admin/settings/cancellation` — do not integrate.

---

## Admin SMS (2)

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| POST | `/api/admin/sms/test` | admin | test SMS form | 49 | yes (2026-07-22) |
| GET | `/api/admin/sms/logs` | admin | SMS logs table | 49 | yes (2026-07-22) |

Never display OTP codes in log UI.

---

## Admin media library (1 new + 1 reused) — admin JWT

| Method | Path | Auth | Frontend page/hook | Stage | Implemented |
|--------|------|------|-------------------|-------|-------------|
| GET | `/api/admin/media` | admin | `/admin/media` grid + summary | 50 | yes (2026-07-22) |
| DELETE | `/api/admin/products/:id/images/:imageId` | admin | media page delete (reuse Stage 40) | 50 | yes (2026-07-22) |

**Design:** List is DB-first (flatten `Product.images` across products). Do not use Supabase bucket listing as the primary UI. Delete must go through the existing product-image delete route so storage cleanup and product JSON stay in sync.

Query params for `GET /api/admin/media`: `page`, `limit`, `search`, `includeArchived` (hidden + soft-deleted products).

---

## Endpoints NOT in Postman (do not call from frontend)

| Path | Reason |
|------|--------|
| `/api/age-gate/*` before Stage 38 backend | Now implemented — use Postman |
| `PATCH /api/admin/settings/cancellation` | Removed |
| `PATCH /api/admin/orders/:id/cancel` | Use status update |
| Supabase Realtime | Use polling instead |

---

## Planned API module files

```
frontend/src/lib/api/
  client.ts
  types.ts
  health.api.ts
  ageGate.api.ts
  auth.api.ts
  categories.api.ts
  products.api.ts
  cart.api.ts
  users.api.ts
  addresses.api.ts
  orders.api.ts
  notifications.api.ts
  admin/
    categories.api.ts
    products.api.ts
    orders.api.ts
    customers.api.ts
    dashboard.api.ts
    settings.api.ts
    sms.api.ts
    media.api.ts
```

Update **Implemented** column to `yes` + date when stage passes your manual test.
