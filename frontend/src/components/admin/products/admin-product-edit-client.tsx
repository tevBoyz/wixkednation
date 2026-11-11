"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminProductForm } from "@/components/admin/products/admin-product-form";
import { adminProductsQueryKey } from "@/components/admin/products/admin-products-client";
import { ProductImageGallery } from "@/components/admin/products/product-image-gallery";
import { ProductStatusBadges } from "@/components/admin/products/product-status-badges";
import { listAdminCategories } from "@/lib/api/admin/categories.api";
import {
  fetchAdminProduct,
  updateAdminProduct,
} from "@/lib/api/admin/products.api";
import { getErrorMessage } from "@/lib/api/errors";
import { isSoftDeleted } from "@/lib/admin/sort-deleted-last";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AdminProductEditClientProps = {
  productId: string;
};

export function AdminProductEditClient({
  productId,
}: AdminProductEditClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ["admin", "products", productId],
    queryFn: () => fetchAdminProduct(productId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", "options"],
    queryFn: listAdminCategories,
  });

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof updateAdminProduct>[1]) =>
      updateAdminProduct(productId, body),
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({
        queryKey: adminProductsQueryKey,
      });
      await queryClient.setQueryData(["admin", "products", productId], product);
      toast.success("Product updated");
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update product"));
    },
  });

  async function handleProductChange(product: NonNullable<typeof productQuery.data>) {
    await queryClient.setQueryData(["admin", "products", productId], product);
    await queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
  }

  const product = productQuery.data;
  const isLoading = productQuery.isLoading || categoriesQuery.isLoading;
  const isDeleted = product ? isSoftDeleted(product) : false;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          render={<Link href="/admin/products" />}
          nativeButton={false}
          variant="outline"
          size="sm"
        >
          Back to products
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-64" />
      ) : product ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Edit product</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {product.name}
            </h2>
          </div>
          <ProductStatusBadges product={product} />
        </div>
      ) : null}

      {productQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(productQuery.error, "Could not load product")}
          </p>
          <Button
            render={<Link href="/admin/products" />}
            nativeButton={false}
            variant="outline"
          >
            Back to products
          </Button>
        </div>
      ) : null}

      {product && categoriesQuery.data ? (
        <AdminProductForm
          product={product}
          categories={categoriesQuery.data}
          submitting={updateMutation.isPending}
          submitLabel="Save changes"
          onSubmit={async (body) => {
            await updateMutation.mutateAsync(body);
          }}
          imagesSection={
            <ProductImageGallery
              product={product}
              disabled={isDeleted}
              onProductChange={(next) => void handleProductChange(next)}
            />
          }
        />
      ) : null}

      {isLoading && !productQuery.isError ? (
        <Skeleton className="h-96 w-full max-w-2xl rounded-lg" />
      ) : null}
    </div>
  );
}
