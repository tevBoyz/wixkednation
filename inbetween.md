# Backend ↔ Frontend Handoff (`inbetween.md`)

Shared communication file between backend and frontend.

- **Frontend** writes requests / blockers here.
- **Backend** updates status + notes when done.
- API contract source of truth: [`baseDocs/backend-postman-collection.json`](baseDocs/backend-postman-collection.json) (**74 routes**)

Last backend update: **2026-07-22** — D1 complete

---

## How to use

| Field | Meaning |
|-------|---------|
| `Status` | `open` / `in_progress` / `done` / `wont_fix` |
| `Owner` | `backend` or `frontend` |
| `Updated` | YYYY-MM-DD + short note |

---

## Completed — D1. Default store currency

**Status:** `done`  
**Owner:** backend  
**Completed:** 2026-07-22  
**Migration:** `20260722091407_add_default_currency` (additive `ALTER TABLE ... ADD COLUMN defaultCurrency DEFAULT 'ETB'` — existing data preserved)

### Admin settings (extended)

**`GET /api/admin/settings`** — admin JWT  
`data.settings` now includes:

```json
{
  "defaultMeasurementUnit": "pcs",
  "defaultCurrency": "ETB",
  "adminPhoneNumbers": [],
  "smsProviderConfig": { "provider": "afromessage", "senderId": "..." }
}
```

**`PATCH /api/admin/settings`** — admin JWT

```json
{ "defaultMeasurementUnit": "pcs" }
```

```json
{ "defaultCurrency": "USD" }
```

```json
{ "defaultMeasurementUnit": "kg", "defaultCurrency": "ETB" }
```

Validation:
- `defaultCurrency` — 3-letter uppercase ISO; allowed v1: **`ETB`**, **`USD`**, **`EUR`**, **`GBP`**
- Empty body → `400`: *"Provide defaultMeasurementUnit and/or defaultCurrency to update."*
- Product/order prices stay numeric — **display currency only**

### Public storefront config (new)

**`GET /api/store/config`** — no auth

```json
{
  "success": true,
  "message": "Store config fetched successfully.",
  "data": {
    "defaultCurrency": "ETB"
  }
}
```

Use on catalog, cart, checkout, and orders pages for `formatPrice` / labels.

### Frontend unblocked

1. ~~**Default currency** dropdown on `/admin/settings` (General section)~~ — done 2026-07-22
2. ~~Extend `AdminSettings` types + `updateAdminSettings` body~~ — done
3. ~~Add `getStoreConfig()` + provider/hook for `formatPrice`~~ — done
4. ~~Replace hardcoded `"ETB"` labels~~ — done
5. Manual QA: change currency in admin → storefront reflects new code

---

## Previously completed (reference)

| ID | Item | Status |
|----|------|--------|
| A1 | Age gate API | `done` |
| A2 | Google secure handoff (`POST /api/auth/exchange-code`) | `done` |
| A3 | Postman contract confirmations | `done` |
| C1 | Admin media library (`GET /api/admin/media`) | `done` |
| D1 | Default store currency | `done` |

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

## How to test

```bash
cd backend
npm run postman:generate
npm run test:e2e   # 128 passed (2026-07-22)
```

Manual:
1. `GET /api/store/config` → `defaultCurrency`
2. `PATCH /api/admin/settings` `{ "defaultCurrency": "USD" }` (admin Bearer)
3. `GET /api/store/config` → `"USD"`; patch back to `"ETB"` when done
