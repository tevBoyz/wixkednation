# Frontend handoff: Superadmin + Team management

## Goal
Add a **`superadmin`** role above **`admin`**. Both can use existing admin dashboard APIs. Only superadmins manage staff via a **Team** page (create admins with email + PIN, list, disable, restore/demote).

Multi-SKU packs are already live on the backend (see prior handoff history / product APIs). This handoff is **staff roles + Team UI only**.

## Locked decisions
- Roles: `customer` | `admin` | `superadmin`.
- Staff = `admin` **or** `superadmin` → existing `/api/admin/*` (products, orders, settings, etc.) and `GET /api/auth/admin-check`.
- Team APIs (`/api/admin/team`) = **superadmin only**.
- Create admins with **email + PIN** (4–6 digits). No password system.
- API create always sets `role: "admin"` (cannot create/promote to `superadmin` via API).
- Soft-disable via `deletedAt` (blocks PIN login). Restore supported.
- Cannot disable/demote yourself; cannot disable the last active superadmin.
- Seeded accounts (after `npm run db:seed` on backend):

| Email | PIN | Role |
|-------|-----|------|
| `superadmin1@gasnationweed.com` | `199183` | `superadmin` |
| `superadmin2@gasnationweed.com` | `199183` | `superadmin` |
| `admin@gasnation.com` | `072326` (or `SEED_ADMIN_PIN`) | `admin` |

## Frontend changes

### 1. Role helpers + types
- Extend `UserRole` with `"superadmin"`.
- `isStaffRole(role)` → `admin || superadmin` (replace every `role === "admin"` gate for dashboard access).
- `isSuperAdminRole(role)` → `role === "superadmin"`.
- Touch typically: [`frontend/src/lib/auth/redirect.ts`](frontend/src/lib/auth/redirect.ts), [`frontend/src/components/guards/admin-guard.tsx`](frontend/src/components/guards/admin-guard.tsx), any admin nav visibility.

### 2. Admin shell / nav
- Keep existing admin nav for all staff.
- Add **Team** nav item only when `isSuperAdminRole(user.role)`.
- Route suggestion: `/admin/team`.

### 3. Team page (`/admin/team`)
- **List** `GET /api/admin/team` → `data.items[]` with `id`, `name`, `email`, `role`, `isDisabled` / `deletedAt`, `createdAt`.
- **Create** form: email, PIN (4–6 digits), optional name → `POST /api/admin/team`.
  - On success show **one-time** `data.credentials: { email, pin }` with copy-to-clipboard (PIN is not returned on list).
- **Disable** → `DELETE /api/admin/team/:userId` (confirm).
- **Restore** → `PATCH /api/admin/team/:userId` `{ restore: true }`.
- **Demote** (optional UI) → `PATCH` `{ role: "customer" }`.
- Hide self-actions; surface API error messages (403/400) for last-superadmin / self.

### 4. Auth UX
- Staff login remains email + PIN on existing login flow.
- After login, if `superadmin` or `admin`, send to admin home (same as today for admin).
- Soft-disabled staff: PIN login fails → show generic invalid credentials.

## API quick reference

| Method | Path | Auth | Body / notes |
|--------|------|------|----------------|
| GET | `/api/auth/admin-check` | staff | Confirms admin **or** superadmin |
| GET | `/api/admin/team` | superadmin | `{ items, total }` |
| POST | `/api/admin/team` | superadmin | `{ email, pin, name? }` → `{ user, credentials }` |
| PATCH | `/api/admin/team/:userId` | superadmin | `{ role?: "admin"\|"customer", restore?: true }` |
| DELETE | `/api/admin/team/:userId` | superadmin | Soft-disable |

Create response excerpt:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "…",
      "email": "ops@example.com",
      "role": "admin",
      "isDisabled": false
    },
    "credentials": {
      "email": "ops@example.com",
      "pin": "654321"
    }
  }
}
```

## Out of scope (FE)
- Creating additional superadmins in UI (seed only).
- Force change-PIN on first login.
- Password auth.
