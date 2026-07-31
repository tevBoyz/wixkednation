# Backend handoff: Twilio SMS + admin provider switch + dashboard status

## Goal
Ship Twilio as the live SMS provider (OTP + order alerts), let admins switch **mock ↔ twilio** without redeploy, and expose active provider + Twilio health on admin dashboard stats.

## Locked decisions
- Secrets stay in `.env` only (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`). Do **not** store tokens in `AdminSettings`.
- Admin UI / API allow only `mock` | `twilio` for `smsProviderConfig.provider`.
- **DB provider wins** over `SMS_PROVIDER` env. If DB unset, fall back to env, then `mock`.
- If active provider is `twilio` but env creds incomplete: **fail on send** (do not silently fall back to mock).
- Keep `afromessage.provider.js` in repo; do not expose it in admin allowlist.
- No new npm package — use `fetch` + Basic auth like AfroMessage.

## Env vars
```env
SMS_PROVIDER=twilio   # fallback only when AdminSettings has no provider
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

Wire in `backend/src/config/env.js` under `sms`:
- `twilioAccountSid`, `twilioAuthToken`, `twilioFromNumber`

## Files to touch / add
| File | Action |
|------|--------|
| `backend/src/config/env.js` | Add Twilio fields |
| `backend/src/services/sms/providers/twilio.provider.js` | **Create** — `sendSms` + optional `checkAccountHealth` |
| `backend/src/services/sms/sms.service.js` | Resolve from `AdminSettings`; export `getActiveSmsProviderName`, `getSmsStatus` |
| `backend/src/modules/admin/settings/settings.service.js` | Allowlist `mock`\|`twilio`; default seed to twilio-if-configured else mock |
| `backend/src/modules/admin/dashboard/dashboard.service.js` | Add `sms` object to `getDashboardStats()` |
| Seeds (`admin-settings.seed.js`, `test.seed.js`) | Default provider mock/twilio not afromessage |

## Provider contract
Same shape as mock/AfroMessage:

```js
{
  success: boolean,
  provider: "twilio",
  providerRef: string | null,  // Twilio Message SID
  error: string | null,
  raw: object | null
}
```

Twilio send:
- `POST https://api.twilio.com/2010-04-01/Accounts/{Sid}/Messages.json`
- Basic auth: `AccountSid:AuthToken`
- Body (`application/x-www-form-urlencoded`): `To`, `From`, `Body`

## Resolve order (`sms.service.js`)
1. Read `AdminSettings.smsProviderConfig.provider` (first row).
2. Else `env.sms.provider`.
3. Else `mock`.
4. Normalize to lowercase; if not `mock`|`twilio`, treat as unknown → prefer mock with warn **only when resolving for status**; for **send**, if DB explicitly set unknown →  fail; for this handoff only allowlist at PATCH so DB should never have others after migration.

## Settings API
`PATCH /api/admin/settings/sms` body:
```json
{ "provider": "mock" | "twilio" }
```
- `senderId` optional (unused for Twilio; can omit from required validation).
- Reject other providers with **400**.

## Dashboard SMS status payload
Extend `GET /api/admin/dashboard/stats` response `stats` with:

```js
sms: {
  activeProvider: "mock" | "twilio",
  twilio: {
    configured: boolean,       // sid + token + from all set
    reachable: boolean | null, // always attempt light check when configured
    accountStatus: string | null, // e.g. "active"
    error: string | null
  }
}
```

Health check: `GET https://api.twilio.com/2010-04-01/Accounts/{Sid}.json` (~5s timeout). Never return auth token.

## Acceptance criteria
- [ ] OTP / admin test SMS / order alerts use active DB provider.
- [ ] Switching admin to `mock` stops Twilio calls; messages appear as `[mock-sms]` logs.
- [ ] Switching to `twilio` with valid env sends via Twilio Messages API.
- [ ] Incomplete Twilio env + active `twilio` → send returns `success: false` with clear error.
- [ ] Dashboard stats include `sms.activeProvider` and Twilio configured/reachable/status.
- [ ] e2e continues to work with mock (set admin provider mock or env).

## Note for FE (parallel)
- Settings: select Mock | Twilio only.
- Overview: show active provider + Twilio health from `stats.sms`.

## Phone validation note
`isValidEthiopianPhone` is still used for admin banner phones. Store OTP phones for US must already accept E.164 elsewhere — do not block this SMS task on rewriting phone utils unless OTP send rejects US numbers.
