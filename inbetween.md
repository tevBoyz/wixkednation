# Backend ↔ Frontend Handoff (`inbetween.md`)

Shared communication file between backend and frontend.
- **Frontend** writes requests / blockers here.
- **Backend** updates status + notes when done.

---

## Frontend → Backend request (2026-07-25) — Nested shop categories

**Priority:** medium  
**Status:** `done` (v1 + v2 category seed)

### What shipped

**Migration:** `20260725220000_category_parent_hierarchy`

- `Category.parentId` (self-relation), `sortOrder`
- Created parent **Flower**; reparented **Indica / Sativa / Hybrid** under it
- Product `categoryId` values unchanged (still on leaf rows)
- Catalog seed also upserts full SHOP tree (Exotics, Oz Deals, Tier 1, Carts→THC Carts, Concentrates, Edibles→THC Edibles / Vegan)

**Keep using** `strainType` / `productType` on products for badges/filters — category is nav/browse only.

### API contracts (FE consume now)

| Endpoint | Behavior |
|----------|----------|
| `GET /api/categories` | **Nested tree** — roots with `children[]`; fields: `id`, `name`, `slug`, `parentId`, `sortOrder`, `isActive`, `children` |
| `GET /api/categories/:slug` | Same fields + **direct** `children` |
| `GET /api/products?category=flower` | Products in Flower **or any descendant** |
| `GET /api/products?category=indica` | Leaf only (that category) |
| `GET /api/admin/categories` | Same tree shape (incl. soft-deleted nested where present) |
| `POST/PATCH /api/admin/categories` | Optional `parentId`, `sortOrder` |
| `DELETE /api/admin/categories/:id` | **400** if children remain or products still assigned |

Example:

```json
{
  "data": {
    "categories": [
      {
        "name": "Flower",
        "slug": "flower",
        "parentId": null,
        "sortOrder": 0,
        "children": [
          { "name": "Indica", "slug": "indica", "sortOrder": 10, "children": [] },
          { "name": "Sativa", "slug": "sativa", "sortOrder": 20, "children": [] },
          { "name": "Hybrid", "slug": "hybrid", "sortOrder": 30, "children": [] }
        ]
      }
    ]
  }
}
```

### FE todos

1. ~~Store **SHOP** nav → render parent → children from `GET /api/categories` (not flat list).~~ **Done**
2. ~~Category / shop pages: parent slug (e.g. `/categories/flower`) can call `GET /api/products?category=flower`.~~ **Done** (routes stay `/categories/[slug]`; index + child links added)
3. ~~Admin category picker: show hierarchy (`Flower → Indica`); send `parentId` when creating subcategories.~~ **Done**
4. ~~Types: add `parentId`, `sortOrder`, `children` on `Category`.~~ **Done**

### Not changed

- Guest checkout / cart merge  
- Product seed prices/images (categories only for v2 extras)
