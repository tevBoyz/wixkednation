# Backend Agent Handoff

> **How to use:** In a new Cursor chat on this repo, send:
> `@backendagent.md Read this first. Continue backend work from where we left off.`
>
> Last updated: 2026-07-21

---

## 1. Project summary

Express.js ecommerce **backend API** for a Next.js frontend.

| Item | Value |
|------|--------|
| Stack | Node.js, Express, Prisma, PostgreSQL (Supabase), Supabase Storage |
| Auth | Express-owned JWT (access + refresh). **Not** Supabase Auth for sessions |
| SMS | Provider abstraction; `mock` locally, `afromessage` in production |
| Payments | COD only |
| Default port | `5000` |
| Entry | `src/server.js` → `src/app.js` |
| ORM | Prisma (`prisma/schema.prisma`) |
| Migrations | `prisma/migrations/` |

**Implementation status:** Stages **1–40 complete**. **74 mounted API routes** (including `GET /`). E2E last known result: **128 passed, 0 failed**.

---

## 2. Architecture decisions (do not revert without explicit approval)

| Topic | Decision |
|-------|----------|
| Auth | Daily: phone or email + PIN. OTP/Google only for new users and forgot-PIN → set PIN. JWT Bearer |
| Notifications | **Polling only** via `GET /api/notifications`. No Supabase Realtime |
| Customer cancel | Allowed from `Pending`, `Confirmed`, `OutForDelivery`. Blocked for `Delivered` / already `Cancelled` |
| Cancel body | Requires `cancelledFromStatus` matching current status (409 if stale) |
| Cancellation toggle | **Removed** — no `PATCH /api/admin/settings/cancellation` |
| Reputation | **Admin-only** on admin orders + `GET /api/admin/customers/:id`. Never on customer auth/order APIs |
| Reputation rules | +1 when admin sets order `Delivered`; −1 on **customer** self-cancel (not admin cancel) |
| Order create body | Uses `addressId` (not `deliveryAddressId`). `paymentMethod` optional, always stored as `COD` |
| Soft delete | Categories, products, addresses use `deletedAt` |
| Storage | Product images uploaded only through Express → Supabase Storage |
| Response shape | Success: `{ success: true, message, data? }`. Error: `{ success: false, message }` |
| Legacy auth/me | `GET /api/auth/me` returns top-level `{ user }`. New `GET /api/users/me` uses `{ data: { user } }` |

---

## 3. Documentation hierarchy

Read in this order before changing anything:

1. **`baseDocs/Backend plan.txt`** — full product/API spec (may need restore from git if missing locally)
2. **`baseDocs/backend imp plan.txt`** — staged execution plan (Stages 1–36 + 37 audit gaps)
3. **`baseDocs/master-plan-checklist.md`** — stage status tracker
4. **`baseDocs/api-endpoints.md`** — living API reference (77 routes)
5. **`baseDocs/backend-postman-collection.json`** — Postman collection (regenerate, don’t hand-edit)
6. **`baseDocs/final-testing-checklist.md`** — manual QA checklist
7. **`baseDocs/notification-polling.md`** — frontend polling guidance (if present)

**Note:** If `baseDocs/` is missing on disk, restore from git history or regenerate Postman via `npm run postman:generate`.

---

## 4. Agent workflow rules

1. Read `master-plan-checklist.md` and this file first.
2. Implement **one stage at a time** unless user requests a specific batch (e.g. audit gaps).
3. Match existing patterns: `routes` → `controller` → `service` under `src/modules/`.
4. Minimize scope; no unrelated refactors.
5. After each stage: smoke test → tell user exact test steps → **wait for confirmation** before next stage.
6. Always update when adding routes:
   - `scripts/generate-postman-collection.js`
   - `scripts/e2e-full-scenario.js` (`LIVE_ROUTES` + scenario steps)
   - `baseDocs/api-endpoints.md`
   - `baseDocs/master-plan-checklist.md`
7. Run `npm run postman:generate` then `npm run test:e2e` before marking done.
8. **Never commit** unless user asks. **Never edit `.env`**. Never commit secrets.
9. For large features: use Plan mode, get approval, then implement. **Do not edit the plan file** during execution.

---

## 5. All mounted routes (78)

Auth header: `Authorization: Bearer <accessToken>` where noted.

### Health (5)

- `GET /`
- `GET /api/health`
- `GET /api/health/supabase`
- `GET /api/health/prisma`
- `GET /api/health/storage`

### Auth (12)

- `POST /api/auth/otp/send` — `{ phone, purpose?: "register"|"forgot_pin" }` (register 409 if PIN set)
- `POST /api/auth/otp/verify` — `{ phone, otp, purpose? }` → `requiresPinSetup`+`setupToken` or full tokens
- `POST /api/auth/pin/set` — Bearer **setupToken**; `{ pin, confirmPin }` (4–6 digits) → full JWT
- `POST /api/auth/pin/login` — `{ pin, phone? }` or `{ pin, email? }` → JWT (daily login; no OTP)
- `POST /api/auth/pin/change` — Bearer; `{ currentPin, newPin, confirmPin }`
- `POST /api/auth/refresh` — body `{ refreshToken }`
- `POST /api/auth/logout` — body `{ refreshToken }`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback` — redirects to frontend with one-time `code` (not tokens)
- `POST /api/auth/exchange-code` — `{ code }` → setup token or full JWT depending on PIN
- `GET /api/auth/me` — Bearer; legacy `{ user }` shape
- `GET /api/auth/admin-check` — admin Bearer

**Default admin (seed):** `admin@gasnation.com` / PIN `072326` (override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PIN`). Email+PIN only — no OTP/Google for admin daily login.

### Store config (1)

- `GET /api/store/config` — public; `{ defaultCurrency, orderContactPhones: [{ id, phone }] }` (banner phones)

### Age gate (2)

- `POST /api/age-gate/verify` — body `{ accepted: true }` or `{ over21: true }` → `ageGateToken` in `data`
- `POST /api/age-gate/block` — body `{ accepted: false }` or `{ over21: false }`

### Users (2)

- `GET /api/users/me` — Bearer; `{ data: { user } }`, no reputation
- `PATCH /api/users/me` — Bearer; `{ name?, email? }` only

### Public catalog (5)

- `GET /api/categories` — **nested tree** (`parentId`, `sortOrder`, `children`)
- `GET /api/categories/:slug` — includes direct `children`
- `GET /api/products` — `?category=` matches id/slug **plus descendants**
- `GET /api/products/featured`
- `GET /api/products/:slug`

Product payloads include nullable `price`, plus `productType`, `strainType`, `thcPercent`, `cbdPercent`, `flavors`, `effects`. **Pack pricing:** when `price` is set, `volume` must be set — price is for one pack; qty multiplies charge and effective volume. Max **4** images.

### Admin categories (6) — admin JWT

- `GET/POST /api/admin/categories` — POST/PATCH accept optional `parentId`, `sortOrder`; GET returns tree
- `GET/PATCH/DELETE /api/admin/categories/:id` — DELETE blocked if children or products
- `PATCH /api/admin/categories/:id/restore`

Hierarchy: Indica/Sativa/Hybrid under **Flower**; also Carts→THC Carts, Concentrates, Edibles→THC Edibles/Vegan, Flower extras (Exotics, Oz Deals, Tier 1). Global unique slugs.
### Admin products + images (11) — admin JWT

- `GET/POST /api/admin/products`
- `GET/PATCH/DELETE /api/admin/products/:id`
- `PATCH /api/admin/products/:id/visibility`
- `PATCH /api/admin/products/:id/restore`
- `POST /api/admin/products/:id/images` — multipart `image` (max 4)
- `PATCH /api/admin/products/:id/images/reorder` — `{ imageIds }`
- `PATCH /api/admin/products/:id/images/:imageId/cover`
- `DELETE /api/admin/products/:id/images/:imageId`

Admin create/update: optional strain fields; `price` optional/null. Cart/order reject null-price products (400).

### Cart (6) — customer JWT

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `DELETE /api/cart`
- `POST /api/cart/merge`

### Addresses (4) — customer JWT

- `GET/POST /api/users/me/addresses`
- `PATCH/DELETE /api/users/me/addresses/:addressId`

### Orders (5 customer + 3 admin)

- `POST /api/orders` — customer; `{ addressId, paymentMethod? }`; returns `order.risk`; phone burst rate limit
- `POST /api/orders/guest` — **public**; phone + address + items; find/create `User` (`authProvider: guest` when new); `placedAsGuest` / `matchedExistingAccount`; optional `customer.postOrderCta`
- `GET /api/orders/me`
- `GET /api/orders/me/:orderId`
- `POST /api/orders/:orderId/cancel` — customer; `{ cancelledFromStatus, note? }`
- `GET /api/admin/orders` — filters: status, search, dateFrom, dateTo, page, limit; includes guest flags + live `risk`
- `GET /api/admin/orders/:id` — includes `user.reputation` + `risk`
- `PATCH /api/admin/orders/:id/status` — `{ status, note? }`

**Guest registry:** same `User` row keyed by phone (also match via address phone). OTP register/forgot claims `local-guest:{phone}` → `phone` provider.

**Burst limit:** >10 orders/hour → `ORDER_PHONE_BLOCKED` + `orderBlockedUntil` (+48h). Clear message: try again later.

**Soft risk:** `reputationScore < 0` or ≥3 Pending → admin red / SMS prefix; never blocks checkout.
### Notifications (3) — Bearer JWT

- `GET /api/notifications` — includes `unreadCount`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

### Admin settings (5) — admin JWT

- `GET/PATCH /api/admin/settings`
- `POST /api/admin/settings/admin-phones` — `{ phone, showOnBanner? }`
- `PATCH /api/admin/settings/admin-phones/:phoneId` — `{ showOnBanner: boolean }`
- `DELETE /api/admin/settings/admin-phones/:phoneId`
- `PATCH /api/admin/settings/sms` — non-secret provider fields

### Admin SMS (2) — admin JWT

- `POST /api/admin/sms/test` — `{ phone, message? }`
- `GET /api/admin/sms/logs` — query: page, limit, phone, provider, status, dateFrom, dateTo

### Admin media (1) — admin JWT

- `GET /api/admin/media` — query: `page`, `limit`, `search`, `includeArchived`; flatten `Product.images`

### Admin dashboard (2) — admin JWT

- `GET /api/admin/dashboard/stats`
- `GET /api/admin/dashboard/recent-orders` — query: `limit` (default 10, max 50)

### Admin customers (3) — admin JWT

- `GET /api/admin/customers` — paginated; search, reputation, orderCount
- `GET /api/admin/customers/:id` — profile + reputation + 10 recent orders
- `GET /api/admin/customers/:id/orders` — paginated; optional status filter

---

## 6. Key business rules

### Order statuses

`Pending` → `Confirmed` → `OutForDelivery` → `Delivered` | `Cancelled`

### Customer cancel example

```json
POST /api/orders/:orderId/cancel
{
  "cancelledFromStatus": "Confirmed",
  "note": "Optional reason"
}
```

### Reputation shape (admin-only)

```json
{
  "reputationScore": 0,
  "deliveredOrderCount": 0,
  "cancelledOrderCount": 0
}
```

### Admin phones in settings

Stored as array of `{ id, phone }` objects in `admin_settings.adminPhoneNumbers`.

### OTP local dev

With `SMS_PROVIDER=mock`, OTP appears in server console:

```
[otp-dev] phone=+251... otp=123456
```

Mock SMS logs as `[mock-sms] to=... message=...`

---

## 7. Code structure

```
src/
  app.js                    # route mounts
  server.js
  config/
    env.js                  # required env validation
    prisma.js
    supabase.js             # includes testStorageConnection()
  middleware/
    auth.middleware.js      # JWT Bearer → req.user
    admin.middleware.js
    customer.middleware.js
    error.middleware.js
    notFound.middleware.js
    upload.middleware.js
  modules/
    health/
    auth/
    age-gate/
    store/
    users/
    categories/
    products/
    cart/
    addresses/
    orders/
    notifications/
    reputation/
    admin/
      categories/
      products/
      orders/
      settings/
      sms/
      customers/
      dashboard/
      media/
  services/
    auth/                   # otp, token, session, google
    sms/                    # abstraction + mock/afromessage providers
    storage/
  utils/
prisma/
  schema.prisma
  migrations/
  seed.js
  seed/
    users.seed.js
    admin-settings.seed.js
    test.seed.js            # baseline category + fresh-tomato
    test-products.seed.js   # QA catalog (qa- prefix)
scripts/
  e2e-full-scenario.js
  generate-postman-collection.js
  manage-test-products.js
  test-sms-service.js
  test-otp-verify.js
  test-auth-middleware.js
```

**Module pattern:** `*.routes.js` → `*.controller.js` → `*.service.js`

---

## 8. Environment variables

Copy `.env.example` → `.env`. Required (see `src/config/env.js`):

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | development / production |
| `FRONTEND_URL` | Primary CORS origin |
| `CORS_ORIGINS` | Optional comma-separated extra CORS origins |
| `BACKEND_URL` | Public API origin; product image URLs are built from it |
| `DATABASE_URL` | Supabase PostgreSQL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (never expose) |
| `SUPABASE_STORAGE_BUCKET` | Product images bucket |
| `JWT_ACCESS_SECRET` | Access token signing |
| `JWT_REFRESH_SECRET` | Refresh token signing |
| `JWT_ACCESS_EXPIRES_IN` | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Default `30d` |

Optional / feature-specific:

- `SMS_PROVIDER=mock` (local) or `afromessage`
- `AFROMESSAGE_*` — SMS provider credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `OTP_*` — OTP timing/attempts
- `INTERNAL_API_KEY`
- Seed overrides: `SEED_ADMIN_PHONE`, `SEED_CUSTOMER_PHONE`, etc.

---

## 9. Seed data & test accounts

### Baseline seed

```bash
npm run db:seed
# or: npx prisma db seed
```

Default users (`prisma/seed/users.seed.js`):

| Role | Default phone | Default email |
|------|---------------|---------------|
| Admin | `+251911000000` | `admin@example.com` |
| Customer | `+251922000000` | `customer@example.com` |

Override via env: `SEED_ADMIN_PHONE`, `SEED_CUSTOMER_PHONE`, etc.

E2E resolves **first admin/customer with a phone** from DB (may differ if you changed seed).

Also seeds:

- Admin settings (admin phone for SMS alerts)
- Users (admin + customer). **Does not** seed vegetables/`fresh-tomato`.

### Client catalog (LeafedOut)

```bash
npm run catalog:wipe     # hard-delete orders/cart items/products/categories + storage (users kept)
npm run catalog:seed     # 3 strain categories + 11 products + Supabase images from baseDocs/images
npm run catalog:reseed   # wipe + seed
```

Manifest: `baseDocs/images/catalog-seed-manifest.json`. Prices are **null** until client sets them.

### QA test catalog (removable)

Slug prefix **`qa-`** — safe to bulk remove.

```bash
npm run seed:test-products          # seed/update 11 products + 4 categories
npm run seed:test-products:list
npm run seed:test-products:clean    # soft-delete all qa-* rows
npm run seed:test-products:restore  # restore + re-seed
node scripts/manage-test-products.js clean --hard   # permanent delete
```

Example products: `qa-banana`, `qa-onion`, `qa-milk`, `qa-rice`, `qa-hidden-item` (not visible).

---

## 10. NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (nodemon) |
| `npm start` | Production start |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:studio` | DB GUI |
| `npm run db:seed` | Baseline seed (users + settings) |
| `npm run catalog:wipe` | Wipe catalog/orders (preserve users) |
| `npm run catalog:seed` | Client catalog + images |
| `npm run catalog:reseed` | Wipe + client catalog |
| `npm run seed:test-products` | QA catalog seed |
| `npm run postman:generate` | Regenerate Postman JSON |
| `npm run test:e2e` | Full E2E (spawns server on port 5055, mock SMS) |

### Docker

From `backend/`:

```bash
docker compose up --build -d
docker compose logs -f api
docker compose down
```

Uses `Dockerfile` + `docker-compose.yml`. Loads secrets from `.env` (not baked into the image). On start: `prisma migrate deploy`, then the API on port **5000**. Health: `GET /api/health`.

DB remains your existing Postgres (`DATABASE_URL`, e.g. Supabase) — Compose does not start a database container.

---

## 11. Testing workflow

### E2E

```bash
npm run test:e2e
```

- Spawns isolated server with `SMS_PROVIDER=mock` on port **5055**
- Captures OTP from `[otp-dev]` in server stdout
- Regenerates Postman and asserts **Postman ↔ LIVE_ROUTES parity**
- Exercises auth, catalog, admin CRUD, cart, addresses, orders, cancel, reputation, notifications, settings, SMS, dashboard, customers, users/me, security negatives

Optional env:

- `E2E_PORT`, `E2E_BASE_URL`, `E2E_ADMIN_PHONE`, `E2E_CUSTOMER_PHONE`, `E2E_KEEP_SERVER=1`

### Postman

```bash
npm run postman:generate
```

Output: `baseDocs/backend-postman-collection.json`

Variables: `baseUrl`, `accessToken`, `refreshToken`, `adminPhone`, `customerPhone`, `otpCode`, `categoryId`, `productId`, `orderId`, `customerId`, etc.

### Manual OTP login flow

1. Admin: `POST /api/auth/pin/login` with `{ "email": "admin@gasnation.com", "pin": "072326" }`
2. New customer: `POST /api/auth/otp/send` → verify → `POST /api/auth/pin/set` with setupToken
3. Returning customer: `POST /api/auth/pin/login` with `{ "phone", "pin" }`
4. Use `data.accessToken` as Bearer

---

## 12. Database migrations

| Migration | Purpose |
|-----------|---------|
| `20260707131753_init` | Base schema |
| `20260709122013_add_auth_sms_foundation` | Auth + SMS tables |
| `20260711185000_cancel_reputation` | User reputation fields; dropped `allowCustomerCancellation` |
| `20260722091407_add_default_currency` | `defaultCurrency` on `admin_settings` (default ETB) |

Deploy: `npx prisma migrate deploy`

---

## 13. Completed stages (summary)

| Stage | Topic |
|-------|--------|
| 1–7 | Env, Supabase, Prisma, schema, seed, JWT, auth middleware |
| 8 | SMS abstraction (mock + AfroMessage) |
| 9–13 | OTP send/verify, auth/me, refresh/logout, Google OAuth |
| 14–22 | Categories, products, admin CRUD, images, storage |
| 23–24 | Cart + guest merge |
| 25 | Addresses |
| 26–29 | Orders, admin orders, status updates |
| 30–31 | Notifications + polling decision |
| 32 | Admin settings |
| 33 | Stage-aware cancel + admin reputation |
| 34–35 | Admin SMS alerts + test SMS |
| 36 | E2E + Postman generator + checklists |
| 37 | Audit gap endpoints (users/me, dashboard, customers list/orders, SMS logs, health/storage) |
| 38 | Frontend handoff gaps: Google one-time code exchange, age gate API, Postman contract notes |
| 39 | Admin media library list (`GET /api/admin/media`) |
| 40 | Default store currency (`defaultCurrency` + `GET /api/store/config`) |

---

## 14. Known issues / ops notes

- **DB unreachable:** `P1001 Can't reach database server` on OTP send = Supabase pooler/network/env issue, not necessarily code regression.
- **AfroMessage SMS:** Can be flaky in dev; use `SMS_PROVIDER=mock` locally.
- **Google OAuth:** E2E only checks start endpoint reachability; full flow needs real Google credentials.
- **`prisma/seed.js` log:** May still reference removed `allowCustomerCancellation` field in console output — cosmetic only.
- **`baseDocs/` folder:** May be absent if not committed; restore from git or regenerate artifacts.
- **SSH push:** User had `Permission denied (publickey)` at one point — local git/SSH config issue.

---

## 15. What is NOT in scope (backend done for v1)

- Frontend (Next.js) — separate repo/session
- Supabase Realtime for notifications
- Payment gateways beyond COD
- Customer-facing reputation
- Admin cancellation toggle

---

## 16. Suggested first message for new backend agent

```
Read @backendagent.md and @baseDocs/master-plan-checklist.md (if present).

Backend Stages 1–37 are complete. I need help with: [describe task].

Rules:
- One focused change at a time
- Update Postman + E2E + api-endpoints.md if routes change
- Run npm run test:e2e before marking done
- Do not commit unless I ask
```

---

## 17. Prisma models (quick reference)

`User`, `AuthAccount`, `OtpChallenge`, `RefreshToken`, `Address`, `Category`, `Product`, `Cart`, `CartItem`, `Order`, `OrderStatusHistory`, `Notification`, `AdminSettings`, `SmsLog`

Order stores `items` and `deliveryAddress` as JSON snapshots. Product stores `images` as JSON array.

---

## 18. Security reminders

Never log or return: service role key, DB URL, JWT secrets, OTP codes, refresh token hashes.

Customer must not access admin routes (403). Users can only access own cart, addresses, orders, notifications.

All DB and storage writes go through Express — frontend must not write directly to Supabase DB/Storage.
