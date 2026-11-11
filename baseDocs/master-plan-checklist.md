# Backend Master Checklist

This file maps the implementation plan to the current backend so future work only covers the missing delta. Status values used here:

- `done`: implemented and broadly aligned
- `partial`: implemented but incomplete
- `replace`: implemented in a conflicting way and should be rewritten
- `missing`: not implemented yet

## Architecture Note

The approved target architecture is:

- Express-owned authentication
- local OTP challenge storage and verification
- Express-issued JWT access and refresh tokens
- provider-abstracted SMS with `AfroMessage` as the temporary first provider
- all writes going through Express

Current divergence to fix early:

- `src/modules/auth/auth.controller.js` uses Supabase OTP
- `src/middleware/auth.middleware.js` uses Supabase Auth token validation
- `prisma/schema.prisma` and `prisma/seed/users.seed.js` currently assume `supabaseUserId`

## Stage Checklist

> Status sync note (2026-07-22): statuses through **Stage 40**. Stage 40 adds default store currency (`defaultCurrency` on admin settings + `GET /api/store/config`). See `baseDocs/api-endpoints.md`.

### Stage 1: Environment setup and health check
- Status: `done`
- Already exists:
  - `src/server.js`
  - `src/app.js`
  - `src/config/env.js`
  - `src/config/supabase.js`
  - `src/modules/health/health.routes.js`
  - `src/middleware/error.middleware.js`
  - `src/middleware/notFound.middleware.js`
  - `GET /`
  - `GET /api/health`
- Still needed:
  - document the current state in `baseDocs/README.md`
  - align response shape over time to consistently prefer `{ success, message, data }`
- Key files likely to change later:
  - `src/app.js`
  - `src/modules/health/health.routes.js`
  - `src/config/env.js`
- Important env/config:
  - `PORT`
  - `NODE_ENV`
  - `FRONTEND_URL`
  - `BACKEND_URL`

### Stage 2: Supabase connection setup
- Status: `partial`
- Already exists:
  - Supabase client setup in `src/config/supabase.js`
  - `GET /api/health/supabase`
- Still needed:
  - add safe storage bucket health check
  - document storage expectations in README and Postman notes
  - ensure checks do not imply frontend direct access is allowed
- Key files likely to change:
  - `src/config/supabase.js`
  - `src/modules/health/health.routes.js`
- Important env/config:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET`

### Stage 3: Prisma and Supabase PostgreSQL setup
- Status: `done`
- Already exists:
  - `prisma/schema.prisma`
  - `src/config/prisma.js`
  - `prisma.config.ts`
  - `GET /api/health/prisma`
- Still needed:
  - none for the base setup
  - future env naming cleanup in stage 6/7 work
- Key files likely to change later:
  - `src/config/prisma.js`
  - `prisma/schema.prisma`
- Important env/config:
  - `DATABASE_URL`

### Stage 4: Base database schema migration
- Status: `done`
- Already exists:
  - `User`
  - `Address`
  - `Category`
  - `Product`
  - `Cart`
  - `CartItem`
  - `Order`
  - `Notification`
  - `AdminSettings`
  - `OrderStatusHistory`
- Still needed:
  - add `auth_accounts`
  - add `otp_challenges`
  - add `refresh_tokens`
  - add `sms_logs`
  - review whether `supabaseUserId` remains in the user model
- Key files likely to change:
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
- Important env/config:
  - `DATABASE_URL`

### Stage 5: Seed protocol
- Status: `done`
- Already exists:
  - `prisma/seed.js`
  - `prisma/seed/users.seed.js`
- Still needed:
  - stop relying on Supabase-auth user IDs long term
  - add settings seed
  - add dedicated reusable test seed flow
  - document seed usage in README
- Key files likely to change:
  - `prisma/seed.js`
  - `prisma/seed/users.seed.js`
  - `prisma/seed/test.seed.js`
- Important env/config:
  - seed-specific user/admin variables

### Stage 6: JWT token service
- Status: `done`
- Already exists:
  - no local token service yet
- Still needed:
  - sign access token
  - sign refresh token
  - verify access token
  - verify refresh token
  - hash refresh token
  - refresh token rotation helpers
- Key files likely to change:
  - `src/services/auth/token.service.js`
  - `src/utils/*`
  - `src/config/env.js`
- Important env/config:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `JWT_ACCESS_EXPIRES_IN`
  - `JWT_REFRESH_EXPIRES_IN`

### Stage 7: Auth middleware and role structure
- Status: `done`
- Already exists:
  - `src/middleware/auth.middleware.js`
  - `src/middleware/admin.middleware.js`
- Still needed:
  - replace Supabase token validation with local JWT validation
  - preserve deleted-user rejection
  - keep admin guard
  - add ownership-rule helpers/foundation
- Key files likely to change:
  - `src/middleware/auth.middleware.js`
  - `src/middleware/admin.middleware.js`
  - `src/services/auth/token.service.js`
- Important env/config:
  - JWT secrets and expiry variables

### Stage 8: SMS provider abstraction
- Status: `partial`
- Already exists:
  - `sms.service.js`
  - `providers/afromessage.provider.js`
  - `providers/mock.provider.js`
  - SMS logs table/writes
  - `SMS_PROVIDER=mock` working path for local OTP
- Still needed:
  - finish reliable AfroMessage production path (identifier/sender/API response issues)
  - keep provider swappable
- Key files likely to change:
  - `src/services/sms/sms.service.js`
  - `src/services/sms/providers/afromessage.provider.js`
  - `src/services/sms/providers/mock.provider.js`
  - `prisma/schema.prisma`
- Important env/config:
  - `SMS_PROVIDER`
  - `AFROMESSAGE_API_TOKEN`
  - `AFROMESSAGE_SENDER_ID`
  - `AFROMESSAGE_BASE_URL`

### Stage 9: Phone OTP send endpoint
- Status: `done`
- Already exists:
  - `POST /api/auth/otp/send`
  - phone normalization in `src/utils/phone.js`
- Still needed:
  - local OTP generation
  - OTP hashing
  - OTP persistence
  - expiry and resend rules
  - send through SMS abstraction
  - never expose the OTP
- Key files likely to change:
  - `src/modules/auth/auth.routes.js`
  - `src/modules/auth/auth.controller.js`
  - `src/services/sms/*`
  - `src/services/auth/*`
  - `prisma/schema.prisma`
- Important env/config:
  - `OTP_EXPIRES_MINUTES`
  - `OTP_LENGTH`
  - `OTP_MAX_ATTEMPTS`
  - `OTP_RESEND_COOLDOWN_SECONDS`

### Stage 10: Phone OTP verify endpoint
- Status: `done`
- Already exists:
  - no local OTP verify route
- Still needed:
  - `POST /api/auth/otp/verify`
  - validate OTP challenge
  - expiry and attempts checks
  - create/find user
  - create/update auth account
  - issue access and refresh tokens
- Key files likely to change:
  - `src/modules/auth/auth.routes.js`
  - `src/modules/auth/auth.controller.js`
  - `src/services/auth/*`
  - `prisma/schema.prisma`
- Important env/config:
  - JWT and OTP variables

### Stage 11: `/api/auth/me` endpoint
- Status: `done`
- Already exists:
  - `GET /api/auth/me`
- Still needed:
  - rebind it to local JWT auth instead of Supabase Auth
  - normalize response shape
- Key files likely to change:
  - `src/modules/auth/auth.controller.js`
  - `src/middleware/auth.middleware.js`
- Important env/config:
  - JWT secrets

### Stage 12: Refresh and logout
- Status: `done`
- Already exists:
  - no refresh/logout endpoints
- Still needed:
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - refresh token rotation and revocation
- Key files likely to change:
  - `src/modules/auth/auth.routes.js`
  - `src/modules/auth/auth.controller.js`
  - `src/services/auth/*`
  - `prisma/schema.prisma`
- Important env/config:
  - refresh token variables

### Stage 13: Google OAuth start/callback endpoints
- Status: `done`
- Already exists:
  - env placeholders only
- Still needed:
  - `GET /api/auth/google/start`
  - `GET /api/auth/google/callback`
  - local user linking
  - auth account provider linkage
- Key files likely to change:
  - `src/modules/auth/*`
  - `src/services/auth/*`
  - `prisma/schema.prisma`
- Important env/config:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`

### Stage 14: Public categories endpoints
- Status: `done`
- Already exists:
  - `Category` model only
- Still needed:
  - `GET /api/categories`
  - `GET /api/categories/:slug`
  - active and non-soft-deleted filtering
- Key files likely to change:
  - `src/modules/categories/*`
  - `src/app.js`
- Important env/config:
  - none beyond DB access

### Stage 15: Admin category CRUD endpoints
- Status: `done`
- Already exists:
  - model and admin middleware foundation
- Still needed:
  - admin category CRUD + restore endpoints
  - slug handling
  - soft delete
- Key files likely to change:
  - `src/modules/admin/categories/*` or equivalent
  - `src/app.js`
- Important env/config:
  - JWT auth and admin role

### Stage 16: Public products endpoints
- Status: `done`
- Already exists:
  - `Product` model only
- Still needed:
  - `GET /api/products`
  - `GET /api/products/featured`
  - `GET /api/products/:slug`
  - visible-only and non-deleted filtering
  - avoid exposing availability text
- Key files likely to change:
  - `src/modules/products/*`
  - `src/app.js`

### Stage 17: Admin product CRUD endpoints
- Status: `done`
- Already exists:
  - model and admin middleware foundation
- Still needed:
  - admin product CRUD
  - category validation
  - image metadata handling hooks
- Key files likely to change:
  - `src/modules/admin/products/*`
  - `src/app.js`

### Stage 18: Product visibility endpoint
- Status: `done`
- Already exists:
  - `Product.isVisible` field
- Still needed:
  - `PATCH /api/admin/products/:id/visibility`
  - verify public filtering behavior
- Key files likely to change:
  - `src/modules/admin/products/*`

### Stage 19: Product soft delete and restore endpoints
- Status: `done`
- Already exists:
  - `Product.deletedAt` field
- Still needed:
  - `DELETE /api/admin/products/:id`
  - `PATCH /api/admin/products/:id/restore`
  - public hiding behavior
- Key files likely to change:
  - `src/modules/admin/products/*`

### Stage 20: Product image upload to Supabase Storage
- Status: `done`
- Already exists:
  - `Product.images`
  - `Product.coverImageIndex`
- Still needed:
  - upload route through Express
  - compression and limits
  - max 3 images
  - max 3MB after compression
  - upload metadata management
- Key files likely to change:
  - `src/modules/admin/products/*`
  - `src/services/storage/*`
  - `src/config/supabase.js`
- Important env/config:
  - `SUPABASE_STORAGE_BUCKET`

### Stage 21: Product image delete and bucket cleanup
- Status: `done`
- Already exists:
  - no delete flow
- Still needed:
  - image delete endpoint
  - storage cleanup
  - metadata removal
- Key files likely to change:
  - `src/modules/admin/products/*`
  - `src/services/storage/*`

### Stage 22: Product cover image update
- Status: `done`
- Already exists:
  - `coverImageIndex` field
- Still needed:
  - set cover endpoint
  - optional reorder endpoint
  - cover validity checks
- Key files likely to change:
  - `src/modules/admin/products/*`

### Stage 23: Cart endpoints
- Status: `done`
- Already exists:
  - `Cart` and `CartItem` models
- Still needed:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/:itemId`
  - `DELETE /api/cart/items/:itemId`
  - `DELETE /api/cart`
  - customer-only ownership rules
- Key files likely to change:
  - `src/modules/cart/*`
  - `src/app.js`

### Stage 24: Guest cart merge endpoint
- Status: `done`
- Already exists:
  - no merge logic
- Still needed:
  - `POST /api/cart/merge`
  - validate local cart payload
  - ignore hidden/deleted products
  - merge duplicates
- Key files likely to change:
  - `src/modules/cart/*`

### Stage 25: Address endpoints
- Status: `done`
- Already exists:
  - `Address` model
- Still needed:
  - customer address CRUD
  - soft delete
  - customer ownership enforcement
- Key files likely to change:
  - `src/modules/addresses/*`
  - `src/app.js`

### Stage 26: Order creation endpoint
- Status: `done`
- Already exists:
  - `Order` model with COD support
- Still needed:
  - `POST /api/orders`
  - create from cart
  - snapshot items and address
  - clear cart
  - admin SMS alert without failing order if SMS fails
- Key files likely to change:
  - `src/modules/orders/*`
  - `src/services/sms/*`
  - `src/modules/cart/*`

### Stage 27: Customer order history endpoints
- Status: `done`
- Already exists:
  - `Order` model
- Still needed:
  - `GET /api/orders/me`
  - `GET /api/orders/me/:orderId`
  - ownership filtering
- Key files likely to change:
  - `src/modules/orders/*`

### Stage 28: Admin order list/detail endpoints
- Status: `done`
- Already exists:
  - no admin order routes
- Still needed:
  - `GET /api/admin/orders`
  - `GET /api/admin/orders/:id`
  - admin-only filters and detail views
- Key files likely to change:
  - `src/modules/admin/orders/*`

### Stage 29: Admin order status update endpoint
- Status: `done`
- Already exists:
  - `OrderStatusHistory` model
  - `Notification` model
- Still needed:
  - status patch endpoint
  - save history
  - create customer notification
  - do not SMS customer
- Key files likely to change:
  - `src/modules/admin/orders/*`
  - `src/modules/notifications/*`

### Stage 30: Notification creation and read endpoints
- Status: `done`
- Already exists:
  - `Notification` model
- Still needed:
  - `GET /api/notifications`
  - `PATCH /api/notifications/:id/read`
  - `PATCH /api/notifications/read-all`
  - user ownership enforcement
- Key files likely to change:
  - `src/modules/notifications/*`

### Stage 31: Customer notification polling (no Supabase Realtime)
- Status: `done`
- Decision:
  - Supabase Realtime is **out of scope** for notifications
  - Frontend should poll Express APIs instead
- Already exists:
  - `GET /api/notifications`
  - `PATCH /api/notifications/:id/read`
  - `PATCH /api/notifications/read-all`
  - admin status updates create notification rows in Express
- Delivered:
  - polling strategy documented in `baseDocs/notification-polling.md`
  - README pointer added
- Key files:
  - `baseDocs/notification-polling.md`
  - `baseDocs/README.md`
  - `baseDocs/backend imp plan.txt` (Stage 31 wording updated)

### Stage 32: Admin settings endpoints
- Status: `done` (updated: cancellation toggle removed)
- Already exists:
  - `AdminSettings` model
  - `prisma/seed/admin-settings.seed.js`
- Delivered:
  - `GET /api/admin/settings`
  - `PATCH /api/admin/settings` (`defaultMeasurementUnit` only for general patch)
  - `POST /api/admin/settings/admin-phones`
  - `DELETE /api/admin/settings/admin-phones/:phoneId`
  - `PATCH /api/admin/settings/sms`
  - admin phones stored as `{ id, phone }` JSON entries (legacy string entries auto-normalized)
  - SMS config patch limited to non-secret fields (`provider`, `senderId`)
  - **Removed:** `PATCH /api/admin/settings/cancellation` and `allowCustomerCancellation`
- Key files:
  - `src/modules/admin/settings/*`
  - `src/app.js`
  - `prisma/seed/admin-settings.seed.js`

### Stage 33: Customer cancellation endpoint
- Status: `done` (updated: cancel until Delivered + stage ack + reputation)
- Delivered:
  - `POST /api/orders/:orderId/cancel`
  - ownership check
  - allowed from `Pending` | `Confirmed` | `OutForDelivery`
  - blocked for `Delivered` / already `Cancelled`
  - required body field `cancelledFromStatus` (must match current status; stale → `409`)
  - status history + stage-aware customer notification
  - customer cancel applies admin-only reputation penalty (`-1`)
- Related (reputation, admin-only):
  - `User.reputationScore`, `deliveredOrderCount`, `cancelledOrderCount`
  - `+1` when admin transitions order to `Delivered`
  - reputation embedded on admin order list/detail as `user.reputation`
  - `GET /api/admin/customers/:id`
- Key files:
  - `src/modules/orders/*`
  - `src/modules/reputation/reputation.service.js`
  - `src/modules/admin/customers/*`

### Stage 34: SMS admin alert setup
- Status: `done`
- Already exists:
  - `sendSms` + mock/AfroMessage providers
  - `SmsLog` model
  - order creation already called admin alert helper
- Delivered:
  - finalize new-order admin SMS alert using `admin_settings.adminPhoneNumbers`
  - purpose-tagged SMS logs (`admin_new_order`, and OTP redaction for `otp`)
  - resilient logging (DB log failure does not break send path)
  - SMS failure never fails order creation (outer + inner guards)
  - order response includes `smsAlert` summary (`attempted`/`sent`/`failed`/`results`)
- Key files:
  - `src/services/sms/sms.service.js`
  - `src/modules/orders/orders.service.js`
  - `src/services/auth/otp.service.js`

### Stage 35: Test SMS endpoint
- Status: `done`
- Already exists:
  - `sendSms` + SMS logging
- Delivered:
  - `POST /api/admin/sms/test`
  - admin-only auth
  - validates Ethiopian phone
  - optional custom `message` (default test copy)
  - logs with purpose `test`
- Key files:
  - `src/modules/admin/sms/*`
  - `src/app.js`

### Stage 36: Final backend testing checklist
- Status: `done`
- Delivered:
  - `scripts/e2e-full-scenario.js` — full end-to-end scenario
    - spawns isolated server with `SMS_PROVIDER=mock`
    - reads OTP from `[otp-dev]` console lines
    - asserts `[mock-sms]` for OTP / new-order / test SMS
    - covers auth, catalog, admin CRUD, images, cart, addresses, orders, notifications, settings, SMS, security negatives
    - regenerates + validates Postman coverage every run
  - `scripts/generate-postman-collection.js` — complete Postman collection generator
  - `baseDocs/backend-postman-collection.json` — all live routes marked implemented
  - `baseDocs/final-testing-checklist.md`
  - npm scripts: `test:e2e`, `postman:generate`
- Key files:
  - `scripts/e2e-full-scenario.js`
  - `scripts/generate-postman-collection.js`
  - `baseDocs/backend-postman-collection.json`
  - `baseDocs/final-testing-checklist.md`
  - `package.json`

### Stage 37: Audit gap endpoints
- Status: `done`
- Delivered:
  - `GET /api/health/storage` — Supabase Storage bucket connectivity
  - `GET /api/users/me` — profile read (`data.user`, no reputation)
  - `PATCH /api/users/me` — update `name` / `email` only
  - `GET /api/admin/dashboard/stats` — order/product/customer counts
  - `GET /api/admin/dashboard/recent-orders` — latest admin orders
  - `GET /api/admin/customers` — paginated customer list with reputation
  - `GET /api/admin/customers/:id/orders` — paginated customer orders
  - `GET /api/admin/sms/logs` — paginated SMS log read API
  - Updated `baseDocs/api-endpoints.md`, Postman generator, E2E coverage
- Key files:
  - `src/modules/users/*`
  - `src/modules/admin/dashboard/*`
  - `src/modules/admin/customers/*`
  - `src/modules/admin/sms/*`
  - `src/modules/health/health.routes.js`
  - `src/config/supabase.js`
  - `scripts/generate-postman-collection.js`
  - `scripts/e2e-full-scenario.js`

### Stage 38: Frontend handoff gaps (inbetween A1–A3)
- Status: `done`
- Delivered:
  - `POST /api/auth/exchange-code` — secure Google OAuth handoff (one-time code, 60s TTL)
  - Google callback redirect changed: frontend receives `?code=` only (tokens no longer in URL)
  - `POST /api/age-gate/verify` — returns signed `ageGateToken` (30d TTL)
  - `POST /api/age-gate/block` — records decline ack
  - Postman descriptions updated for order body, cancel body, OTP field, auth/me vs users/me, reputation, notifications polling
  - Updated `baseDocs/api-endpoints.md`, Postman generator, E2E coverage, `inbetween.md` handoff
- Key files:
  - `src/services/auth/google.service.js`
  - `src/modules/auth/*`
  - `src/modules/age-gate/*`
  - `src/app.js`
  - `scripts/generate-postman-collection.js`
  - `scripts/e2e-full-scenario.js`

### Stage 39: Admin media library list
- Status: `done`
- Delivered:
  - `GET /api/admin/media` — DB-first flatten of `Product.images` with pagination, search, includeArchived, summary totals
  - No schema/seed changes (read-only aggregation)
  - Updated Postman generator, E2E coverage, `api-endpoints.md`, `inbetween.md`
- Key files:
  - `src/modules/admin/media/*`
  - `src/app.js`
  - `scripts/generate-postman-collection.js`
  - `scripts/e2e-full-scenario.js`

### Stage 40: Default store currency (inbetween D1)
- Status: `done`
- Delivered:
  - Migration `20260722091407_add_default_currency` — additive `defaultCurrency` column on `admin_settings` (default `ETB`)
  - `GET/PATCH /api/admin/settings` — includes `defaultCurrency` (allowed: ETB, USD, EUR, GBP)
  - `GET /api/store/config` — public storefront display currency read
  - Updated Postman, E2E, `api-endpoints.md`, `inbetween.md`
- Key files:
  - `prisma/schema.prisma`, `prisma/migrations/20260722091407_add_default_currency/`
  - `src/modules/admin/settings/settings.service.js`
  - `src/modules/store/*`
  - `src/app.js`

## Recommended Next Execution Order

1. Auth architecture correction and env alignment
2. Missing auth schema tables and seed adjustments
3. JWT/refresh token service
4. Auth middleware rewrite
5. SMS abstraction with temporary `AfroMessage` provider
6. OTP send rewrite
7. OTP verify
8. Refresh/logout
9. Dedicated test seed flow
10. Categories and products
11. Product image handling
12. Cart and guest cart merge
13. Addresses
14. Orders
15. Notifications and polling guidance
16. Admin settings
17. Customer cancellation (until Delivered) + admin-only reputation
18. SMS test/admin alert hardening
19. Final API and security verification

## Test Seed Strategy

Create a dedicated seed file at:

- `prisma/seed/test.seed.js`

Recommended role:

- populate reusable local QA data
- create or refresh a predictable admin user and customer user
- seed minimal categories and products for cart/order testing
- seed admin settings defaults needed for SMS behavior
- remain safe to run repeatedly through upserts or idempotent checks

Recommended usage later:

- keep `prisma/seed.js` as the baseline seed entrypoint
- let `prisma/seed/test.seed.js` be optional for deeper local testing and Postman workflows
