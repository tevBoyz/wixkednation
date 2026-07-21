# Final Backend Testing Checklist (Stage 36)

Use this checklist with:

- `npm run test:e2e` — full automated end-to-end scenario (spawns mock-SMS server, reads `[otp-dev]` / `[mock-sms]` from console)
- `npm run postman:generate` — regenerates `baseDocs/backend-postman-collection.json` for every live route
- Postman collection import for manual spot checks

## Automated coverage (`npm run test:e2e`)

The E2E script already verifies:

- [x] Health (`/`, `/api/health`, supabase, prisma)
- [x] OTP send/verify for admin + customer (OTP read from server console)
- [x] Mock SMS logging for OTP, new-order alerts, and admin test SMS
- [x] `/api/auth/me`, `/api/auth/admin-check`, refresh, logout
- [x] Google OAuth start reachability (full consent callback still needs a real browser)
- [x] Public categories/products
- [x] Admin category CRUD + soft delete/restore
- [x] Admin product CRUD, visibility, soft delete/restore
- [x] Product image upload / reorder / cover / delete (storage)
- [x] Cart add/update/delete/clear/merge
- [x] Address create/list/update
- [x] Admin settings, phones, SMS config
- [x] COD order create + admin SMS alert non-blocking path
- [x] Customer cancel until Delivered (requires `cancelledFromStatus`; no admin toggle)
- [x] Admin-only reputation on deliver (+1) / customer cancel (-1)
- [x] Admin order list/detail/status + `GET /api/admin/customers/:id`
- [x] Notifications list/read/read-all
- [x] Security negatives (customer blocked from admin; missing auth)
- [x] Postman collection completeness (no missing live routes, no `planned` leftovers)

## Manual / environment notes

- [ ] Confirm `.env` has `SMS_PROVIDER=mock` for local OTP console logging (E2E forces mock on its spawned server)
- [ ] Seed data present (`npm run db:seed`) with at least one admin, one customer, and a visible product
- [ ] Google OAuth full login only when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / callback URL are valid
- [ ] AfroMessage live send only when you intentionally leave mock mode (Stage 8 provider path)
- [ ] Reputation is admin-only — never shown on customer `/api/auth/me` or customer order APIs

## Security smoke (manual)

- [ ] Service role key / DB URL / JWT secrets never returned by any endpoint
- [ ] OTP never returned in HTTP responses
- [ ] Frontend cannot write DB/storage directly (all writes via Express)

## Commands

```bash
npm run postman:generate
npm run test:e2e
```

Endpoint reference after cancel/reputation update: `baseDocs/api-endpoints.md`.

Optional:

```bash
E2E_PORT=5055 E2E_ADMIN_PHONE=+251911676343 E2E_CUSTOMER_PHONE=+251911000000 npm run test:e2e
```
