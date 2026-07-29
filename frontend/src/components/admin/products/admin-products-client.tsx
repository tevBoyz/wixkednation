"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import {
  AdminProductsFilters,
  adminProductsPaginationHref,
} from "@/components/admin/products/admin-products-filters";
import { DeleteProductDialog } from "@/components/admin/products/delete-product-dialog";
import { ProductStatusBadges } from "@/components/admin/products/product-status-badges";
import { CatalogImage } from "@/components/catalog/catalog-image";
import { listAdminCategories } from "@/lib/api/admin/categories.api";
import {
  deleteAdminProduct,
  listAdminProducts,
  restoreAdminProduct,
  setAdminProductVisibility,
} from "@/lib/api/admin/products.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useStoreCurrency } from "@/components/providers/store-config-provider";
import {
  formatPackPrice,
  getProductCoverUrl,
} from "@/lib/catalog/format";
import { isSoftDeleted } from "@/lib/admin/sort-deleted-last";
import type { Product } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export const adminProductsQueryKey = ["admin", "products"] as const;

function ProductsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function AdminProductsContent() {
  const currency = useStoreCurrency();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [deleting, setDeleting] = useState<Product | null>(null);

  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const search = searchParams.get("search")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const visibility = searchParams.get("visibility")?.trim() || undefined;

  const filters = { category, search, visibility };

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", "options"],
    queryFn: listAdminCategories,
  });

  const productsQuery = useQuery({
    queryKey: [
      ...adminProductsQueryKey,
      { page, search, category, visibility },
    ],
    queryFn: () =>
      listAdminProducts({
        page,
        limit: PAGE_SIZE,
        search,
        category,
        isVisible:
          visibility === "true"
            ? true
            : visibility === "false"
              ? false
              : undefined,
      }),
    staleTime: 0,
  });

  const visibilityMutation = useMutation({
    mutationFn: ({
      productId,
      isVisible,
    }: {
      productId: string;
      isVisible: boolean;
    }) => setAdminProductVisibility(productId, isVisible),
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
      toast.success(
        product.isVisible ? "Product is now visible" : "Product is now hidden",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update visibility"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
      setDeleting(null);
      toast.success("Product deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete product"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
      toast.success("Product restored");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not restore product"));
    },
  });

  const pagination = productsQuery.data?.pagination;
  const products = productsQuery.data?.products ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Catalog</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest visible products first. Hidden and deleted rows appear at the
            bottom.
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          New product
        </Button>
      </div>

      <AdminProductsFilters categories={categoriesQuery.data ?? []} />

      {productsQuery.isLoading ? <ProductsTableSkeleton /> : null}

      {productsQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(productsQuery.error, "Could not load products")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void productsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {productsQuery.data && products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No products match these filters.
          </p>
          <Button
            render={<Link href="/admin/products/new" />}
            nativeButton={false}
            className="mt-4"
          >
            Create a product
          </Button>
        </div>
      ) : null}

      {products.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {pagination?.total ?? products.length} product
            {(pagination?.total ?? products.length) === 1 ? "" : "s"}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pack</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const deleted = isSoftDeleted(product);
                const coverUrl = getProductCoverUrl(product);
                const toggling =
                  visibilityMutation.isPending &&
                  visibilityMutation.variables?.productId === product.id;
                const isBusy =
                  toggling ||
                  (deleteMutation.isPending &&
                    deleting?.id === product.id) ||
                  (restoreMutation.isPending &&
                    restoreMutation.variables === product.id);

                return (
                  <TableRow
                    key={product.id}
                    className={deleted ? "opacity-70" : undefined}
                  >
                    <TableCell>
                      <CatalogImage
                        src={coverUrl}
                        alt=""
                        className="size-10 rounded-md border border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">
                        {product.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category?.name ?? "-"}
                    </TableCell>
                    <TableCell>{formatPackPrice(product, currency)}</TableCell>
                    <TableCell>
                      <ProductStatusBadges product={product} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          render={
                            <Link href={`/admin/products/${product.id}`} />
                          }
                          nativeButton={false}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        {!deleted ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() =>
                                visibilityMutation.mutate({
                                  productId: product.id,
                                  isVisible: product.isVisible === false,
                                })
                              }
                            >
                              {toggling
                                ? "Updating…"
                                : product.isVisible === false
                                  ? "Show"
                                  : "Hide"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={isBusy}
                              onClick={() => setDeleting(product)}
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => restoreMutation.mutate(product.id)}
                          >
                            {restoreMutation.isPending &&
                            restoreMutation.variables === product.id
                              ? "Restoring…"
                              : "Restore"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3"
              aria-label="Admin products pagination"
            >
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  render={
                    <Link
                      href={adminProductsPaginationHref(
                        Math.max(1, pagination.page - 1),
                        filters,
                      )}
                      aria-disabled={pagination.page <= 1}
                      tabIndex={pagination.page <= 1 ? -1 : undefined}
                    />
                  }
                  nativeButton={false}
                  variant="outline"
                  disabled={pagination.page <= 1}
                  className={
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                >
                  Previous
                </Button>
                <Button
                  render={
                    <Link
                      href={adminProductsPaginationHref(
                        Math.min(pagination.totalPages, pagination.page + 1),
                        filters,
                      )}
                      aria-disabled={pagination.page >= pagination.totalPages}
                      tabIndex={
                        pagination.page >= pagination.totalPages ? -1 : undefined
                      }
                    />
                  }
                  nativeButton={false}
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                >
                  Next
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      ) : null}

      <DeleteProductDialog
        product={deleting}
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) {
            return;
          }
          if (!open) {
            setDeleting(null);
          }
        }}
        deleting={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id);
          }
        }}
      />
    </div>
  );
}

export function AdminProductsClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl">
          <ProductsTableSkeleton />
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
