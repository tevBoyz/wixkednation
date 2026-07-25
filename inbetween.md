# FE handoff — Guest checkout + risk + phone rate limit

Backend is ready. Guest cart stays **FE localStorage**; mid-browse login merge is unchanged.

## Do not break

- Guest browse cart → on login / PIN setup / session restore still call **`POST /api/cart/merge`** with local items.
- Guest checkout sends **`items` in the order body**; it does **not** use or clear the authenticated server cart.

---

## Store: guest checkout

1. ~~Allow checkout **without** auth (remove AuthGuard for guest path).~~ **Done**
2. ~~Form: **required phone** (+2519/7…), delivery address fields, COD, cart line items from local guest cart.~~ **Done**
3. ~~Submit: **`POST /api/orders/guest`** (no Bearer).~~ **Done**

```json
{
  "phone": "+2519XXXXXXXX",
  "name": "Optional",
  "paymentMethod": "COD",
  "items": [{ "productId": "uuid", "quantity": 1 }],
  "address": {
    "fullName": "…",
    "phone": "+2519XXXXXXXX",
    "addressLine1": "…",
    "city": "…"
  }
}
```

4. ~~Success `data.customer.postOrderCta` is **optional** only:~~ **Done**
   - `"register"` → soft CTA “Create an account to track this order” → `/register?phone=`
   - `"login"` → soft CTA “Log in to check order status” → `/login?phone=` + Forgot PIN link  
   Never block another guest order because of CTA.
5. ~~Clear **local** guest cart after successful guest order (not the server cart).~~ **Done**

### Signed-in checkout (unchanged path)

- Still **`POST /api/orders`** with `{ addressId, paymentMethod?: "COD" }`.
- Response may include `order.risk` (ignore on store UI).

---

## Rate limit UX (required)

Both guest and signed-in create can return **429**:

```json
{
  "success": false,
  "code": "ORDER_PHONE_BLOCKED",
  "message": "Too many orders from this number. Please try again later.",
  "blockedUntil": "2026-07-27T12:00:00.000Z"
}
```

~~Show that **message** clearly (toast/banner). Optionally format `blockedUntil` as a local time. Do not show a generic “something went wrong”.~~ **Done**

---

## Admin: orders list + detail

API already returns on each admin order:

| Field | Use |
|-------|-----|
| `placedAsGuest` | Label **Guest** vs **Registered** |
| `matchedExistingAccount` | If guest + true → **Guest (existing customer)** |
| `risk.lowReputation` | Soft **red** row/badge when true (`reputationScore < 0`) |
| `risk.pendingPileUp` | Soft **red** when true (≥3 Pending on that customer) |
| `user.reputation` | Existing scores (color red when low-rep) |

~~Do **not** block or hide these orders — visual alert only. Same rules for registered customers.~~ **Done**

Admin SMS may already be prefixed with `[LOW REP]` / `[PENDING PILE-UP]`.

---

## Out of scope for FE (v1)

- Force register after N guest orders  
- Multi-SIM / `clientKey` / IP farm controls (v2)

---

## FE status

**Frontend guest checkout + risk UI is implemented** (checkout open to guests, `createGuestOrder`, 429 UX, order-success soft CTAs, admin guest/risk badges).
