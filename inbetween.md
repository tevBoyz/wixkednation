# Backend ↔ Frontend Handoff (`inbetween.md`)

Shared communication file between backend and frontend.
- **Frontend** writes requests / blockers here.
- **Backend** updates status + notes when done.
- API contract source of truth: [`baseDocs/backend-postman-collection.json`](baseDocs/backend-postman-collection.json) (72 routes)

Last backend update: **2026-07-22** — Default product placeholder image (`/api/assets/default-product.webp`)

---

## Default product image — `done` (2026-07-22)

Static placeholder for products without uploaded images.

| URL | Auth | Notes |
|-----|------|-------|
| `GET /api/assets/default-product.webp` | none | Green `#148547` square with white **G** |

**Regenerate:** `npm run assets:default-product` in `backend/` (writes `backend/assets/default-product.webp`).

**Frontend:** `getProductCoverUrl()` falls back to `{NEXT_PUBLIC_API_URL}/api/assets/default-product.webp`.

Product uploads are stored in Supabase Storage but **served through the API** at `GET /api/assets/product-images/:productId/:imageId.webp` (private bucket proxy). Product API responses return these backend URLs in `images[].url`.

---

## Completed backend work (frontend can proceed)

### A1. Age gate API — `done`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/api/age-gate/verify` | none | `{ "accepted": true }` or `{ "over21": true }` | `{ success, message, data: { approved, ageGateToken, expiresIn: "30d" } }` |
| `POST` | `/api/age-gate/block` | none | `{ "accepted": false }` or `{ "over21": false }` | `{ success, message, data: { blocked: true } }` |

**Frontend integration:**
- On “Yes”: call `/verify`, store `data.ageGateToken` client-side (cookie or localStorage).
- On “No”: call `/block`, redirect to `/blocked`.
- Backend does **not** enforce the token on catalog/auth routes yet (frontend gate UX owns MVP).

---

### A2. Google OAuth secure handoff — `done` (breaking change)

**Old (removed):** redirect with `?accessToken=...&refreshToken=...` in URL.

**New flow:**
1. User hits `GET /api/auth/google/start` (browser redirect).
2. After Google consent, backend callback redirects to:  
   `{FRONTEND_URL}/auth/google/callback?code=<one-time-handoff-code>`
3. Frontend calls `POST /api/auth/exchange-code` with `{ "code": "..." }`.
4. Response: `{ success, message, data: { accessToken, refreshToken, user } }`.

**Rules:** code is single-use, TTL **60s**. Errors redirect with `?error=...` only (no tokens in URL).

---

### A3. Postman / response contract notes — `done` (no new features)

Confirmed in Postman descriptions:

| Topic | Contract |
|-------|----------|
| Create order | `{ "addressId", "paymentMethod"?: "COD" }` — use **`addressId`**, not `deliveryAddressId` |
| Customer cancel | Required `{ "cancelledFromStatus": "Pending"\|"Confirmed"\|"OutForDelivery", "note"?: string }` — 409 if stale |
| OTP verify | Field name is **`otp`** (not `code`) |
| Profile endpoints | `GET /api/auth/me` → top-level `{ user }` (legacy). `GET /api/users/me` → `{ data: { user } }` (preferred) |
| Reputation | **Admin-only** — never on customer auth/order/profile endpoints |
| Notifications | **Polling only** — `GET /api/notifications`; no Supabase Realtime |

---

## Intentional backend decisions (do not re-request)

| Item | Backend truth |
|------|---------------|
| Customer cancellation admin toggle | **Removed** — cancel from Pending \| Confirmed \| OutForDelivery with `cancelledFromStatus` |
| Supabase Realtime | **Polling only** — see `baseDocs/notification-polling.md` |
| Admin cancel route | Use `PATCH /api/admin/orders/:id/status` with `Cancelled` |
| Customer reputation | **Admin-only** |

---

## Frontend setup

- Base URL: `http://localhost:5000` (or `NEXT_PUBLIC_API_URL`)
- Auth: `Authorization: Bearer <accessToken>`
- Only call routes in Postman collection
- OTP dev: `SMS_PROVIDER=mock` → read `[otp-dev]` from backend console

**Previously blocked stages now unblocked:**
- Stage 6 — Age gate (API-backed)
- Stage 11 — Google OAuth (secure handoff)

---

## Open backend work

_None. Frontend may add new requests below._

```text
### Request — YYYY-MM-DD
Status: open
Owner: backend
Why:
Ask:
```

---

## How to test (backend)

```bash
cd backend
npm run postman:generate   # refreshes baseDocs/backend-postman-collection.json
npm run test:e2e           # 114 passed (last run 2026-07-21)
```

**Manual checks:**
- Age gate: `POST /api/age-gate/verify` with `{ "accepted": true }` → returns JWT in `data.ageGateToken`
- Google: complete OAuth in browser → frontend receives `?code=` → exchange via `POST /api/auth/exchange-code`
