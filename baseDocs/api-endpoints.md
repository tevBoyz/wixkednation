# API Endpoints Reference

Source of truth for manual testing alongside `backend-postman-collection.json` (`npm run postman:generate`) and `npm run test:e2e`.

**Total mounted routes: 72** (including `GET /`).

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

## Auth (9)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/otp/send` | none | Body `{ phone }`. Mock OTP: `[otp-dev] phone=… otp=…` |
| POST | `/api/auth/otp/verify` | none | Body `{ phone, otp }` — field is **`otp`** (not `code`) → `{ data: { accessToken, refreshToken, user } }` |
| POST | `/api/auth/refresh` | none | Body `{ refreshToken }` |
| POST | `/api/auth/logout` | none | Body `{ refreshToken }` |
| GET | `/api/auth/google/start` | none | Browser redirect to Google |
| GET | `/api/auth/google/callback` | none | Google OAuth callback (backend URL). On success redirects to `FRONTEND_URL/auth/google/callback?code=<handoff>` |
| POST | `/api/auth/exchange-code` | none | Body `{ code }` — exchange one-time Google handoff for tokens (60s TTL, single-use). Response `{ data: { accessToken, refreshToken, user } }` |
| GET | `/api/auth/me` | Bearer | Legacy shape: `{ success, message, user }` (top-level `user`, not `data.user`). **No reputation** |
| GET | `/api/auth/admin-check` | admin | |

---

## Age gate (2)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/age-gate/verify` | none | Body `{ accepted: true }` or `{ over21: true }` → `{ data: { approved, ageGateToken, expiresIn: "30d" } }`. Frontend stores token client-side |
| POST | `/api/age-gate/block` | none | Body `{ accepted: false }` or `{ over21: false }` → `{ data: { blocked: true } }` |

Backend does not enforce age gate on catalog routes yet (frontend UX owns gate for MVP).

---

## Public catalog (5)

| Method | Path |
|--------|------|
| GET | `/api/categories` |
| GET | `/api/categories/:slug` |
| GET | `/api/products` |
| GET | `/api/products/featured` |
| GET | `/api/products/:slug` |

---

## Admin categories (6) — admin JWT

| Method | Path |
|--------|------|
| GET | `/api/admin/categories` |
| POST | `/api/admin/categories` |
| GET | `/api/admin/categories/:id` |
| PATCH | `/api/admin/categories/:id` |
| DELETE | `/api/admin/categories/:id` |
| PATCH | `/api/admin/categories/:id/restore` |

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

## Orders (4 customer + 3 admin)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/orders` | customer | Body `{ addressId, paymentMethod?: "COD" }` — use **`addressId`** (not `deliveryAddressId`). Always stored as COD |
| GET | `/api/orders/me` | customer | No reputation |
| GET | `/api/orders/me/:orderId` | customer | No reputation |
| POST | `/api/orders/:orderId/cancel` | customer | See cancel rules below |
| GET | `/api/admin/orders` | admin | Includes `user.reputation` |
| GET | `/api/admin/orders/:id` | admin | Includes `user.reputation` |
| PATCH | `/api/admin/orders/:id/status` | admin | `Delivered` → reputation `+1` |

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
| GET | `/api/admin/settings` | No cancellation flag |
| PATCH | `/api/admin/settings` | e.g. `{ "defaultMeasurementUnit": "pcs" }` |
| POST | `/api/admin/settings/admin-phones` | `{ "phone": "+2519…" }` |
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

## Postman

- Collection: [`backend-postman-collection.json`](./backend-postman-collection.json)
- Regenerate: `npm run postman:generate`
- Variables include `customerId` for admin customer detail
