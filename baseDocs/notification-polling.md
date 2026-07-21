# Customer Notification Polling

## Decision

Notifications do **not** use Supabase Realtime.

- Express owns all notification writes (for example when admin updates order status).
- The frontend reads notifications only through the Express API with the customer JWT.
- No frontend Supabase client subscription is required for notifications.

## Existing Endpoints

- `GET /api/notifications`
  - Optional query: `isRead=true|false`, `page`, `limit`
  - Response includes `unreadCount`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Auth: `Authorization: Bearer <accessToken>`

## Frontend Polling Strategy

Recommended approach for Next.js:

1. On authenticated customer pages, poll:
   - `GET /api/notifications?isRead=false&limit=20`
   - or full `GET /api/notifications` if the inbox UI needs history
2. Suggested interval: **20–30 seconds** while the tab is visible.
3. Also refresh when:
   - the route/page gains focus
   - the browser tab becomes visible again (`visibilitychange`)
   - the user opens the notifications panel
4. Pause polling when the tab is hidden to reduce noise.
5. Use `data.unreadCount` for a badge; do not invent a separate Realtime channel.

## Example Poll Loop (conceptual)

```js
async function fetchUnreadNotifications(accessToken) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?isRead=false`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return response.json();
}

// Poll every 30s while mounted / visible
```

## Ownership Rules

- Customers only see their own notifications.
- Admins creating order status changes must not rely on Realtime; the customer app discovers updates via polling.
- Do not insert/update notification rows from the frontend.

## Deferred / Out Of Scope

- Supabase Realtime publication for `notifications`
- Frontend Supabase anon-key subscriptions
- RLS policies for live notification feeds
- SSE / WebSocket push (can be revisited later if product needs true live updates)
