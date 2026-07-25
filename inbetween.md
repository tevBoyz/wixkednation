# Backend ↔ Frontend Handoff (`inbetween.md`)

Shared communication file between backend and frontend.

---

## Frontend → Backend (2026-07-25) — Order contact banner done

**Status:** `done` (frontend)

- Store config types include `orderContactPhones`
- Admin phones include `showOnBanner`; PATCH toggle + optional flag on add
- Primary banner under sticky nav: `Call or Telegram {phones} for orders` (`tel:` links; hidden when empty)
