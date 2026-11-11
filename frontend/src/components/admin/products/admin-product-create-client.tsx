"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminProductForm } from "@/components/admin/products/admin-product-form";
import { adminProductsQueryKey } from "@/components/admin/products/admin-products-client";
import { listAdminCategories } from "@/lib/api/admin/categories.api";
import { createAdminProduct } from "@/lib/api/admin/products.api";
import { getErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminProductCreateClient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", "options"],
    queryFn: listAdminCategories,
  });

  const createMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
      toast.success("Product created");
      router.push(`/admin/products/${product.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not create product"));
    },
  });

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

      <div>
        <p className="text-sm text-muted-foreground">Catalog</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          New product
        </h2>
      </div>

      {categoriesQuery.isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl rounded-lg" />
      ) : null}

      {categoriesQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(categoriesQuery.error, "Could not load categories")}
        </p>
      ) : null}

      {categoriesQuery.data ? (
        <AdminProductForm
          categories={categoriesQuery.data}
          submitting={createMutation.isPending}
          submitLabel="Create product"
          onSubmit={async (body) => {
            await createMutation.mutateAsync(body);
          }}
        />
      ) : null}
    </div>
  );
}
