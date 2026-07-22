# Frontend Final Testing Checklist

Manual QA for the complete frontend. Run sections as stages complete, then run **full pass** after Stage 52.

**Prereqs (all tests):**
- Backend: `cd backend && npm run dev` (port 5000)
- Frontend: `cd frontend && npm run dev` (port 3000)
- `SMS_PROVIDER=mock` — OTP from backend console: `[otp-dev] phone=... otp=...`
- Postman reference: [`../backend-postman-collection.json`](../backend-postman-collection.json)

**Test accounts:**
- Admin: `+251911676343`
- Customer: `+251911000000` or `+251922000000`
- QA products: `qa-banana`, `qa-onion` (after `npm run seed:test-products`)

Mark each item: `[ ]` not tested · `[x]` pass · `[!]` fail (note in comments)

---

## 1. Environment and connectivity

- [ ] `GET /api/health` succeeds from frontend (Stage 1)
- [ ] `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] No CORS errors in browser console
- [ ] No backend secrets in frontend bundle or `.env.local` committed

---

## 2. Age gate

- [ ] First visit redirects to `/age-gate` (Stage 6)
- [ ] "Yes" calls `POST /api/age-gate/verify` and stores token
- [ ] After approval, store pages accessible without re-gate
- [ ] "No" calls `POST /api/age-gate/block` and redirects to `/blocked`
- [ ] `/blocked` has no product navigation or bypass

---

## 3. Public catalog

- [x] Homepage shows featured products (Stage 16) — confirmed 2026-07-22
- [x] `/products` lists visible products only (Stage 15) — confirmed 2026-07-21
- [x] No availability/stock text on product cards (Stage 15) — confirmed 2026-07-21; detail Stage 17 confirmed 2026-07-22
- [x] Category filter works; URL reflects filter (Stage 15) — confirmed 2026-07-21
- [x] Product detail `/products/[slug]` loads gallery, price, unit, volume (Stage 17) — confirmed 2026-07-22
- [x] Hidden/deleted products return 404 on public routes (Stage 17) — confirmed 2026-07-22

---

## 4. Authentication — Phone OTP

- [ ] `/login` sends OTP to valid Ethiopian phone (Stage 9)
- [ ] Invalid phone blocked client-side (Stage 9)
- [ ] OTP from console logs user in (Stage 10)
- [ ] Wrong OTP shows error, no crash (Stage 10)
- [ ] Session persists after page reload (Stage 12)
- [ ] Logout clears session and blocks protected routes (Stage 12)
- [ ] Access token refresh on 401 (single retry) (Stage 12)

---

## 5. Authentication — Google OAuth

- [ ] Google button redirects to backend start URL (Stage 11)
- [ ] Callback URL contains `?code=` only — **no tokens in URL** (Stage 11)
- [ ] `POST /api/auth/exchange-code` establishes session (Stage 11)
- [ ] OAuth error `?error=` returns to login safely (Stage 11)

---

## 6. Route guards

- [ ] Guest → `/checkout` → login with redirect back (Stage 13)
- [ ] Guest → `/account/*` → login (Stage 13)
- [ ] Customer → `/admin/*` → denied (Stage 13)
- [ ] Admin → `/admin/*` → allowed (Stage 13)

---

## 7. Guest cart

- [ ] Add to cart as guest — header count updates (Stage 18)
- [ ] Cart persists after reload (Stage 18)
- [ ] Update quantity and remove items on `/cart` (Stage 19)
- [ ] Empty cart state shown (Stage 19)
- [ ] Guest checkout redirects to login (Stage 24)

---

## 8. Server cart and merge

- [ ] Logged-in cart loads from `GET /api/cart` (Stage 20)
- [ ] Add/update/remove syncs to server (Stage 20)
- [ ] Guest items merge after login via `POST /api/cart/merge` (Stage 21) — implemented; leave open until Stage 24 E2E
- [ ] Local guest cart cleared only after successful merge (Stage 21) — implemented; re-confirm with Stage 24
- [ ] **Deferred Stage 21 E2E:** guest → Checkout → login → land on `/checkout` with merged cart (confirm when Stage 24 done)

---

## 9. Profile and addresses

- [ ] Profile shows name, phone, email from `GET /api/users/me` (Stage 22)
- [ ] Profile update via `PATCH /api/users/me` persists (Stage 22)
- [ ] **No reputation** on profile (Stage 22)
- [ ] Add, edit, delete addresses (Stage 23)
- [ ] Default address behavior correct if supported (Stage 23)

---

## 10. Checkout and order creation

- [ ] Checkout requires login (Stage 24)
- [ ] Empty cart cannot checkout (Stage 24)
- [ ] Address selection from saved addresses (Stage 24)
- [ ] **COD only** — no online payment options (Stage 24)
- [ ] **Stage 21 follow-up:** guest cart → Checkout → login → return to `/checkout` with merged items (then mark Stage 21 `done`)
- [ ] `POST /api/orders` with `{ addressId, paymentMethod: "COD" }` succeeds (Stage 25)
- [ ] Double-submit does not create duplicate orders (Stage 25)
- [ ] Success page shows order reference (Stage 25)
- [ ] Cart cleared after successful order (Stage 25)

---

## 11. Customer orders

- [ ] Order history lists own orders only (Stage 26)
- [ ] Order detail shows snapshots (not live product prices) (Stage 27)
- [ ] **No reputation** on customer order views (Stage 26, 27)
- [ ] Cancel visible for Pending | Confirmed | OutForDelivery (Stage 28)
- [ ] Cancel sends `{ cancelledFromStatus }` matching current status (Stage 28)
- [ ] Cancel hidden for Delivered and Cancelled (Stage 28)
- [ ] Stale cancel returns 409 with clear message (Stage 28)
- [ ] **No admin cancellation toggle** anywhere in UI (Stage 28, 47)

---

## 12. Notifications (polling only)

- [ ] Notification list loads (Stage 29)
- [ ] Mark one read updates unread count (Stage 29)
- [ ] Mark all read works (Stage 29)
- [ ] Order notifications link to order detail (Stage 29)
- [ ] After admin status update, badge updates within ~30s without manual refresh (Stage 30)
- [ ] Polling pauses when tab hidden (Stage 30)
- [ ] **No Supabase Realtime** connections in network tab (Stage 30)

---

## 13. Admin — dashboard and catalog

- [ ] Admin dashboard stats match API (Stage 32)
- [ ] Recent orders table loads (Stage 32)
- [ ] Category CRUD + soft delete + restore (Stages 33–35)
- [ ] Product CRUD + visibility toggle (Stages 36–38, 41)
- [ ] Image upload via Express (max 3, multipart `image`) (Stage 39)
- [ ] Cover, reorder, delete images (Stage 40)
- [ ] Hidden product disappears from public catalog (Stage 41)

---

## 14. Admin — orders and customers

- [ ] Order list with filters (Stage 42)
- [ ] Order detail shows **reputation** (admin only) (Stage 43)
- [ ] Status update via `PATCH .../status` including Cancelled (Stage 44)
- [ ] UI does not claim customer SMS sent on status change (Stage 44)
- [ ] Customer list with reputation (Stage 45)
- [ ] Customer detail + order history (Stage 46)
- [ ] Reputation **never** visible when logged in as customer

---

## 15. Admin — settings and SMS

- [ ] General settings load and save (Stage 47)
- [ ] **No cancellation toggle** in settings (Stage 47)
- [ ] Add/remove admin phone numbers (Stage 48)
- [ ] SMS provider metadata saves (no secret token fields) (Stage 48)
- [ ] Test SMS sends successfully (Stage 49)
- [ ] SMS logs table loads; OTP codes not displayed (Stage 49)

---

## 16. SEO and quality (Stages 50–51)

- [ ] Product pages have title, description, Open Graph tags (Stage 50)
- [ ] `/robots.txt` disallows `/admin`, `/account`, `/login` (Stage 50)
- [ ] `/sitemap.xml` includes public product/category URLs (Stage 50)
- [ ] Keyboard navigation works on checkout and main nav (Stage 51)
- [ ] Mobile layout usable at 375px width (Stage 51)
- [ ] `npm run build` succeeds (Stage 51)

---

## 17. Automated tests (Stage 52)

- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Unit tests pass (cart utils, validators)
- [ ] Playwright E2E: public browse
- [ ] Playwright E2E: OTP login (mock)
- [ ] Playwright E2E: guest cart → login → merge
- [ ] Playwright E2E: checkout COD order
- [ ] Playwright E2E: customer order history + cancel
- [ ] Playwright E2E: admin product create/edit
- [ ] Playwright E2E: admin order status update
- [ ] Playwright E2E: notification read flow
- [ ] No `JWT_*`, `SERVICE_ROLE`, or SMS secrets in frontend source

---

## 18. Full customer journey (end-to-end)

Run once after Stages 1–30 complete:

1. [ ] Clear storage → age gate Yes → homepage
2. [ ] Browse products → open detail → add to cart as guest
3. [ ] Go to checkout → login with OTP → cart merged
4. [ ] Add address if needed → place COD order
5. [ ] View order in `/account/orders`
6. [ ] Cancel order if Pending (with `cancelledFromStatus`)
7. [ ] Check notifications inbox + polling badge

---

## 19. Full admin journey (end-to-end)

Run once after Stages 31–49 complete:

1. [ ] Login as admin OTP
2. [ ] Dashboard loads stats
3. [ ] Create category → create product → upload image → set cover
4. [ ] Hide product → confirm absent from public site → restore visibility
5. [ ] View customer list with reputation
6. [ ] Open order → update status to Confirmed → Delivered
7. [ ] Verify customer receives notification (polling)
8. [ ] Send test SMS → check SMS logs
9. [ ] Update admin phone in settings

---

## 20. Security negatives

- [ ] Customer cannot access `/admin/*` (403 or redirect)
- [ ] Customer cannot call admin API endpoints from UI
- [ ] Customer order detail for another user's orderId fails safely
- [ ] Google callback never exposes refresh token in URL
- [ ] No direct Supabase upload from browser DevTools workflow

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Developer tested | | | |
| Product owner approved | | | |

When all sections pass, mark Stage 52 `done` in [`master-plan-checklist.md`](master-plan-checklist.md).
