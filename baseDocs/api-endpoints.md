# API Endpoints Reference

Source of truth for manual testing alongside `backend-postman-collection.json` (`npm run postman:generate`) and `npm run test:e2e`.

**Total mounted routes: 78** (including `GET /`).

Auth header where noted: `Authorization: Bearer <accessToken>`.

---

## Health (5)

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | none |
| GET | `/api/health` | none |
| GET | `/api/health/supabase` | none |
| GET | `/api/health/prisma` | none |
| GET | `/api/health/storage` | none | Supabase Storage bucket check |

---

## Auth (12)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/otp/send` | none | `{ phone, purpose?: "register"\|"forgot_pin" }`. Register blocked (409) if PIN already set |
| POST | `/api/auth/otp/verify` | none | `{ phone, otp, purpose? }` → `requiresPinSetup` + `setupToken` OR full tokens |
| POST | `/api/auth/pin/set` | setup Bearer | `{ pin, confirmPin }` (4–6 digits) → full JWT |
| POST | `/api/auth/pin/login` | none | `{ pin, phone? }` **or** `{ pin, email? }` → JWT. Default admin: `admin@gasnation.com` / `072326` |
| POST | `/api/auth/pin/change` | Bearer | `{ currentPin, newPin, confirmPin }` |
| POST | `/api/auth/refresh` | none | Body `{ refreshToken }` |
| POST | `/api/auth/logout` | none | Body `{ refreshToken }` |
| GET | `/api/auth/google/start` | none | Browser redirect to Google |
| GET | `/api/auth/google/callback` | none | Redirects to frontend with handoff `code` |
| POST | `/api/auth/exchange-code` | none | `{ code }` → setup token or full JWT depending on PIN |
| GET | `/api/auth/me` | Bearer | Legacy shape: `{ success, message, user }` |
| GET | `/api/auth/admin-check` | admin | |

**Daily login:** phone or email + PIN (no OTP). OTP/Google only for new users and forgot-PIN.

---

## Age gate (2)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/age-gate/verify` | none | Body `{ accepted: true }` or `{ over21: true }` → `{ data: { approved, ageGateToken, expiresIn: "30d" } }`. Frontend stores token client-side |
| POST | `/api/age-gate/block` | none | Body `{ accepted: false }` or `{ over21: false }` → `{ data: { blocked: true } }` |

Backend does not enforce age gate on catalog routes yet (frontend UX owns gate for MVP).

---

## Public catalog (5)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/categories` | **Nested tree** — roots with `children[]`; each node has `parentId`, `sortOrder` |
| GET | `/api/categories/:slug` | Includes `parentId` + direct `children` |
| GET | `/api/products` | `?category=` id or slug — includes **descendants** (e.g. `flower` → Indica/Sativa/Hybrid/…) |
| GET | `/api/products/featured` | |
| GET | `/api/products/:slug` | |

**Product search** (`GET /api/products?search=`): case-insensitive match on name, description, slug, `strainType`, `productType`, **and category name/slug** (e.g. `search=hybrid` returns all products in the Hybrid category). Same for admin product list search.

Example category tree node:

```json
{
  "id": "…",
  "name": "Flower",
  "slug": "flower",
  "parentId": null,
  "sortOrder": 0,
  "children": [
    { "id": "…", "name": "Indica", "slug": "indica", "parentId": "…", "sortOrder": 10, "children": [] }
  ]
}
```

---

## Store config (1)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/store/config` | none | `{ data: { defaultCurrency, orderContactPhones: [{ id, phone }] } }` — phones with `showOnBanner: true` for storefront order banner |

---

## Admin categories (6) — admin JWT

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/categories` | Nested tree (`parentId`, `sortOrder`, `children`) |
| POST | `/api/admin/categories` | Body `{ name, slug?, description?, isActive?, parentId?, sortOrder? }` |
| GET | `/api/admin/categories/:id` | Includes direct `children` |
| PATCH | `/api/admin/categories/:id` | Partial; optional `parentId`, `sortOrder` |
| DELETE | `/api/admin/categories/:id` | Soft-delete; **400** if non-deleted children or products remain |
| PATCH | `/api/admin/categories/:id/restore` | |

---

## Admin products + images (11) — admin JWT

| Method | Path |
|--------|------|
| GET | `/api/admin/products` |
| POST | `/api/admin/products` |
| GET | `/api/admin/products/:id` |
| PATCH | `/api/admin/products/:id` |
| DELETE | `/api/admin/products/:id` |
| PATCH | `/api/admin/products/:id/visibility` |
| PATCH | `/api/admin/products/:id/restore` |
| POST | `/api/admin/products/:id/images` | multipart `image` |
| PATCH | `/api/admin/products/:id/images/reorder` | `{ imageIds }` |
| PATCH | `/api/admin/products/:id/images/:imageId/cover` |
| DELETE | `/api/admin/products/:id/images/:imageId` |

**Product fields (public + admin responses):** `price` may be **`null`** (“contact for price”); when priced, **`volume` is required** — price is the fixed charge for one pack of that volume (e.g. 1 g = 2800). Cart/order `lineTotal = price × quantity`; responses include `effectiveVolume = volume × quantity`. Also: `productType`, `strainType`, `thcPercent`, `cbdPercent`, `flavors[]`, `effects[]`. Max **4** images. Cart rejects null-price or missing-volume products (400).

---

## Cart (6) — customer JWT

| Method | Path |
|--------|------|
| GET | `/api/cart` |
| POST | `/api/cart/items` |
| PATCH | `/api/cart/items/:itemId` |
| DELETE | `/api/cart/items/:itemId` |
| DELETE | `/api/cart` |
| POST | `/api/cart/merge` |

---

## Users (2) — Bearer JWT

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/users/me` | Bearer | Profile; `data.user` shape; **no reputation** |
| PATCH | `/api/users/me` | Bearer | `{ name?, email? }` only |

Legacy `GET /api/auth/me` remains available with top-level `user` field.

---

## Addresses (4) — customer JWT

| Method | Path |
|--------|------|
| GET | `/api/users/me/addresses` |
| POST | `/api/users/me/addresses` |
| PATCH | `/api/users/me/addresses/:addressId` |
| DELETE | `/api/users/me/addresses/:addressId` |

---

## Orders (5 customer + 3 admin)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/orders` | customer | Body `{ addressId, paymentMethod?: "COD" }` — use **`addressId`**. COD only. Clears server cart. Returns `order.risk`. Rate-limited per phone (see below). |
| POST | `/api/orders/guest` | **public** | Guest checkout — no Bearer, no OTP. Body below. Find/create customer by phone; does **not** clear authenticated cart. |
| GET | `/api/orders/me` | customer | No reputation |
| GET | `/api/orders/me/:orderId` | customer | No reputation |
| POST | `/api/orders/:orderId/cancel` | customer | See cancel rules below |
| GET | `/api/admin/orders` | admin | Includes `user.reputation`, `placedAsGuest`, `matchedExistingAccount`, live `risk` |
| GET | `/api/admin/orders/:id` | admin | Same + status history |
| PATCH | `/api/admin/orders/:id/status` | admin | `Delivered` → reputation `+1` |

### Guest checkout

```json
POST /api/orders/guest
{
  "phone": "+2519XXXXXXXX",
  "name": "Optional",
  "paymentMethod": "COD",
  "items": [{ "productId": "uuid", "quantity": 1, "volume": 1, "measurementUnit": "g" }],
  "address": {
    "fullName": "Required",
    "phone": "+2519XXXXXXXX",
    "addressLine1": "Required",
    "city": "Required",
    "addressLine2": "Optional",
    "state": "Optional",
    "country": "Ethiopia",
    "latitude": null,
    "longitude": null,
    "label": "Optional"
  }
}
```

Response `data`:

- `order` — includes `placedAsGuest`, `matchedExistingAccount`, `risk`
- `smsAlert` — admin SMS summary (may prefix `[LOW REP]` / `[PENDING PILE-UP]`)
- `customer` — `{ id, phone, isNewUser, matchedExistingAccount, hasPin, postOrderCta }` where `postOrderCta` is `"register"` or `"login"` (**optional UX only**)

### Phone burst rate limit (guest + authenticated)

- More than **10** orders in **1 hour** for the same customer/phone → `429`
- Body: `{ success: false, code: "ORDER_PHONE_BLOCKED", message: "Too many orders from this number. Please try again later.", blockedUntil: "<ISO>" }`
- Cooldown: **48 hours** (`User.orderBlockedUntil`)

### Soft risk (admin — does not block checkout)

Live on admin order payloads:

- `risk.lowReputation` when `reputationScore < 0`
- `risk.pendingPileUp` when customer has **≥3** `Pending` orders

### Customer cancel rules

Allowed current statuses: `Pending`, `Confirmed`, `OutForDelivery`.

Blocked: `Delivered`, already `Cancelled`.

```json
POST /api/orders/:orderId/cancel
{
  "cancelledFromStatus": "Confirmed",
  "note": "Optional"
}
```

- `cancelledFromStatus` **required** and must equal current status (else `409`)
- Creates history + stage-aware notification
- Applies admin-only reputation **−1** (customer self-cancel only)
- Admin setting `allowCustomerCancellation` **removed** (no toggle endpoint)

---

## Notifications (3) — Bearer JWT

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/notifications` | Poll; includes `unreadCount` |
| PATCH | `/api/notifications/:id/read` | |
| PATCH | `/api/notifications/read-all` | |

No Supabase Realtime. See `notification-polling.md`.

---

## Admin settings (5) — admin JWT

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/settings` | Includes `defaultMeasurementUnit`, `defaultCurrency` |
| PATCH | `/api/admin/settings` | `{ defaultMeasurementUnit?, defaultCurrency? }` — currency: `ETB`, `USD`, `EUR`, `GBP` |
| POST | `/api/admin/settings/admin-phones` | `{ "phone": "+2519…", "showOnBanner"?: boolean }` |
| PATCH | `/api/admin/settings/admin-phones/:phoneId` | `{ "showOnBanner": boolean }` — toggle storefront banner |
| DELETE | `/api/admin/settings/admin-phones/:phoneId` | |
| PATCH | `/api/admin/settings/sms` | `{ provider, senderId }` non-secret |

**Removed:** `PATCH /api/admin/settings/cancellation`

---

## Admin SMS (2)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/admin/sms/logs` | admin | Query: `page`, `limit`, `phone`, `provider`, `status`, `dateFrom`, `dateTo` |
| POST | `/api/admin/sms/test` | admin | `{ phone, message? }` |

---

## Admin dashboard (2) — admin JWT

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/dashboard/stats` | Order/product/customer counts |
| GET | `/api/admin/dashboard/recent-orders` | Query: `limit` (default 10, max 50) |

---

## Admin customers + reputation (3)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/admin/customers` | admin | Paginated list + `reputation` + `orderCount`; query `search`, `page`, `limit` |
| GET | `/api/admin/customers/:id` | admin | Profile + `reputation` + recent orders |
| GET | `/api/admin/customers/:id/orders` | admin | Paginated orders; query `page`, `limit`, `status` |

### Reputation shape (admin-only)

```json
{
  "reputationScore": 0,
  "deliveredOrderCount": 0,
  "cancelledOrderCount": 0
}
```

| Event | Effect |
|-------|--------|
| Order transitions to `Delivered` (admin status update) | score +1, deliveredCount +1 |
| Customer cancels own order | score −1, cancelledCount +1 |
| Admin sets status to `Cancelled` | no customer-cancel penalty |

Never returned on `/api/auth/me`, customer orders, or notifications.

---

## Admin media (1) — admin JWT

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/media` | DB-first flatten of `Product.images`. Query: `page`, `limit`, `search` (product name), `includeArchived` (hidden + soft-deleted). Response: `{ items, pagination, summary: { totalImages, totalBytes } }`. Delete via existing `DELETE /api/admin/products/:id/images/:imageId` |

---

## Postman

- Collection: [`backend-postman-collection.json`](./backend-postman-collection.json)
- Regenerate: `npm run postman:generate`
- Variables include `customerId` for admin customer detail
