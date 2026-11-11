import type { Product } from "@/lib/api/types";
import { isSoftDeleted } from "@/lib/admin/sort-deleted-last";
import { Badge } from "@/components/ui/badge";

export function ProductStatusBadges({ product }: { product: Product }) {
  const deleted = isSoftDeleted(product);

  return (
    <div className="flex flex-wrap gap-1.5">
      {deleted ? (
        <Badge variant="destructive">Deleted</Badge>
      ) : product.isVisible === false ? (
        <Badge variant="secondary">Hidden</Badge>
      ) : (
        <Badge>Visible</Badge>
      )}
      {product.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
    </div>
  );
}
