# Frontend handoff: Multi-SKU product packs

## Goal
Products support **1–3 pack SKUs** (size + price). Customers pick a SKU on the product page (radio), set quantity, and add to cart. Different SKUs of the same product are **separate cart/checkout lines**. Admins can hide individual SKUs without deleting them.

## Locked decisions
- Backend model: `ProductSku` child rows (not JSON on `Product`).
- Max **3** SKUs per product; **≥1 required**.
- Fields: `volume`, `measurementUnit`, `price`, `sortOrder`, `isVisible`, optional `label`.
- Public product `skus[]` = **visible only**, sorted by `sortOrder` ascending.
- **Default radio** = `skus[0]` (first visible / primary).
- Cart add / guest merge / guest order items require **`skuId`** (never trust client `price`).
- Same `skuId` again → bump quantity; different `skuId` → new line.
- Product-level `price` / `volume` / `measurementUnit` remain as **primary denormalized** fields for catalog cards (“from $X / 1 g”).
- Hidden SKU (`isVisible: false`): not in public `skus`; cart add rejects; existing cart lines with that SKU are removed on cart load / blocked at checkout.

## API shapes

### Public / admin product (excerpt)
```json
{
  "id": "…",
  "name": "Blue Dream",
  "price": "100.00",
  "volume": "1.00",
  "measurementUnit": "g",
  "skus": [
    {
      "id": "sku-uuid-1",
      "label": null,
      "volume": "1.00",
      "measurementUnit": "g",
      "price": "100.00",
      "sortOrder": 0
    },
    {
      "id": "sku-uuid-2",
      "label": null,
      "volume": "0.50",
      "measurementUnit": "g",
      "price": "60.00",
      "sortOrder": 1
    }
  ]
}
```
Admin responses also include `isVisible` on each SKU.

### Admin create / update
Prefer nested `skus`:
```json
{
  "name": "Blue Dream",
  "categoryId": "…",
  "measurementUnit": "g",
  "skus": [
    { "volume": 1, "measurementUnit": "g", "price": 100, "sortOrder": 0, "isVisible": true },
    { "volume": 0.5, "measurementUnit": "g", "price": 60, "sortOrder": 1, "isVisible": true }
  ]
}
```
Legacy single-pack still works: `price` + `volume` + `measurementUnit` creates/updates the primary SKU only.

On update, sending `skus` **replaces** the full set (keep existing rows by including their `id`). Removed SKUs drop matching cart lines.

### Cart
```http
POST /api/cart/items
{ "productId": "…", "skuId": "…", "quantity": 2 }
```
```http
PATCH /api/cart/items/:itemId
{ "quantity": 3 }
```
Optional: `{ "skuId": "…" }` to switch pack on a line (409 if another line already has that SKU).

Cart line response includes `skuId`, `sku`, `volume`, `measurementUnit`, `effectiveVolume`, `lineTotal`.

### Guest merge / guest order
```json
{ "items": [{ "productId": "…", "skuId": "…", "quantity": 1 }] }
```

### Order item snapshot
Includes `skuId`, `skuLabel`, `unitPrice`, `volume`, `measurementUnit`, `effectiveVolume`, `lineTotal`.

## FE work checklist
- [ ] Product detail: radio list from `product.skus`; default select `skus[0]`; qty stepper; add-to-cart sends `skuId`.
- [ ] Catalog cards: can keep using top-level `price`/`volume`, or `skus[0]`; multi-SKU hint e.g. “from …”.
- [ ] Cart / checkout / guest cart: pass `skuId`; show pack label (`volume` + `measurementUnit` or `label`); separate lines per SKU.
- [ ] Admin product form: edit 1–3 SKUs; Visible/Hidden toggle per SKU; validate unique volume+unit; require primary.
- [ ] Types in `frontend/src/lib/api/types.ts` and cart guest storage: add `skuId` / `skus`.
- [ ] Remove Ethiopian-only pack assumptions if any remain on product forms.

## Acceptance
- [ ] Opening PDP selects first visible SKU by default.
- [ ] Adding 1g then ½g yields two cart lines for the same product.
- [ ] Adding the same SKU twice increases quantity on one line.
- [ ] Hiding a SKU in admin removes it from public `skus` and blocks new cart adds.
- [ ] Guest checkout with `skuId` places order with correct unit prices.
- [ ] Cards still show a primary price without requiring a full SKU picker.

## Out of scope (FE)
- Inventory per SKU.
- More than 3 SKUs.
- Delivery-report SMS webhooks.
