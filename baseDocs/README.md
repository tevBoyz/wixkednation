# Backend Setup Guide

This guide explains how to run the backend on a local machine, seed predictable test data, and use the Postman collection for staged testing.

## What This Backend Is

Current stack:

- Express.js backend
- Prisma ORM
- Supabase PostgreSQL
- Supabase Storage
- JavaScript CommonJS

Target architecture from the implementation plan:

- Express-owned authentication
- phone OTP login
- JWT access and refresh tokens
- SMS abstraction with `AfroMessage` as the temporary first provider
- all database and storage writes through Express

Important note:

- the current codebase still contains a temporary Supabase-auth-based auth flow
- the master checklist in `baseDocs/master-plan-checklist.md` marks exactly what must be replaced and what is already usable

## Files To Start With

- implementation gap map: `baseDocs/master-plan-checklist.md`
- API endpoint reference: `baseDocs/api-endpoints.md`
- final QA checklist: `baseDocs/final-testing-checklist.md`
- Postman collection: `baseDocs/backend-postman-collection.json` (`npm run postman:generate`)
- full E2E scenario: `npm run test:e2e` (`scripts/e2e-full-scenario.js`)
- primary roadmap: `baseDocs/backend imp plan.txt`
- notification polling guide: `baseDocs/notification-polling.md`
- env template: `.env.example`

## Prerequisites

Install these before running the API:

- Node.js 20 or newer recommended
- npm
- access to the Supabase project used by this backend
- a valid PostgreSQL `DATABASE_URL`

Optional but useful:

- Prisma Studio
- Postman

## Install

From the project root:

```bash
npm install
```

## Environment Setup

Use `.env.example` as the starting point for local development:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Variables In `.env.example`

Current template values:

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `BACKEND_URL`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `COOKIE_SECRET`
- `SMS_PROVIDER`
- `AFROMESSAGE_API_TOKEN`
- `AFROMESSAGE_SENDER_ID`
- `AFROMESSAGE_BASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `OTP_EXPIRES_MINUTES`
- `OTP_LENGTH`
- `OTP_MAX_ATTEMPTS`
- `OTP_RESEND_COOLDOWN_SECONDS`
- `INTERNAL_API_KEY`

Legacy compatibility placeholders kept temporarily during migration:

- `JWT_SECRET`
- `SESSION_SECRET`
- `SMS_API_KEY`
- `SMS_SENDER_ID`
- `AFRO_MESSAGE_API_KEY`

### Variables The Target Architecture Still Needs

The env template now includes the target variable set, while `src/config/env.js` still supports a few legacy names during the migration stage. The remaining work is to remove those legacy aliases once the auth rewrite is complete.

### Recommended Development Values

Example local values:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
DATABASE_URL=your_database_url
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=product-images
SMS_PROVIDER=afromessage
AFROMESSAGE_API_TOKEN=your_afromessage_api_token
AFROMESSAGE_SENDER_ID=MYSHOP
AFROMESSAGE_BASE_URL=https://api.afromessage.com/api
JWT_ACCESS_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
COOKIE_SECRET=replace_with_cookie_secret
```

## Database And Prisma

Generate the Prisma client if needed:

```bash
npm run prisma:generate
```

Run migrations in development:

```bash
npm run prisma:migrate
```

Open Prisma Studio if needed:

```bash
npm run prisma:studio
```

## Seed Data

### Base Seed

The current project seed entrypoint is:

- `prisma/seed.js`

Run it with:

```bash
npm run db:seed
```

Important note:

- the current base seed still depends on Supabase-related user identifiers and reflects the current temporary auth setup

### Dedicated Test Seed

A reusable local QA seed scaffold now exists at:

- `prisma/seed/test.seed.js`

Purpose:

- create default admin settings if they do not exist
- create a reusable `vegetables` category if it does not exist
- create a reusable `fresh-tomato` product if it does not exist
- support future cart, product, and order testing

At the moment this file is intentionally separate from the main seed flow so you can keep baseline seeding and test seeding distinct. When the auth/schema refactor starts, it can be wired into a stronger staged seed strategy.

## Running The API

Development mode:

```bash
npm run dev
```

Standard start:

```bash
npm start
```

If startup succeeds, the current API should expose:

- `GET /`
- `GET /api/health`
- `GET /api/health/supabase`
- `GET /api/health/prisma`

## Testing With Postman

Import this file into Postman:

- `baseDocs/backend-postman-collection.json`

Suggested variables:

- `baseUrl`: usually `http://localhost:5000`
- `accessToken`: fill after login/auth tests
- `refreshToken`: fill after token-based auth is implemented

Collection structure:

- `Implemented Now`
- `Needs Refactor`
- `Planned Next`

This is deliberate so you can test the current backend while also seeing the approved target API shape.

## Accessing The API From Another Device

If you want to test from another laptop or phone on the same network:

1. start the backend on your computer
2. find your local network IP address
3. set `BACKEND_URL` and the Postman `baseUrl` to that IP and port
4. make sure the machine firewall allows incoming connections to the backend port

Example:

```text
http://192.168.1.20:5000
```

Important:

- `localhost` only works on the same machine running the server
- another device must use your computer's LAN IP

Depending on how the server is started in the future, you may also need to bind Express to `0.0.0.0` instead of the default local-only host if remote LAN testing is required.

## Common Errors And Fixes

`Missing required environment variables`

- fill the missing variables listed by `src/config/env.js`
- verify `.env` exists in the project root

`Prisma connection failed`

- verify `DATABASE_URL`
- verify your Supabase/Postgres project is reachable
- run `npm run prisma:generate` if the Prisma client is stale

`Supabase connection failed`

- verify `SUPABASE_URL`
- verify `SUPABASE_SERVICE_ROLE_KEY`
- verify the target project and storage settings are valid

`OTP auth behaves differently from the plan`

- this is expected right now
- the current code still uses the temporary Supabase-auth path
- see `baseDocs/master-plan-checklist.md` for the replacement stages

## Recommended Workflow

1. fill `.env`
2. install dependencies
3. run migrations
4. run the base seed
5. import the Postman collection
6. verify health endpoints
7. follow `baseDocs/master-plan-checklist.md` stage by stage

## Related Files

- `baseDocs/master-plan-checklist.md`
- `baseDocs/backend-postman-collection.json`
- `prisma/seed/test.seed.js`
- `src/config/env.js`
- `src/config/supabase.js`
- `src/config/prisma.js`
