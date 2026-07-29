"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/admin/categories/delete-category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategories,
  restoreAdminCategory,
  updateAdminCategory,
  type AdminCategoryBody,
} from "@/lib/api/admin/categories.api";
import { getErrorMessage } from "@/lib/api/errors";
import { categoriesQueryKey } from "@/hooks/use-categories";
import { compareDeletedLast } from "@/lib/admin/sort-deleted-last";
import {
  countCategoriesInTree,
  filterFlatCategories,
  flattenCategoryTree,
} from "@/lib/catalog/category-tree";
import type { Category } from "@/lib/api/types";

export const adminCategoriesQueryKey = ["admin", "categories"] as const;

function CategoriesTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

function StatusBadges({ category }: { category: Category }) {
  const isDeleted = Boolean(category.deletedAt);

  return (
    <div className="flex flex-wrap gap-1.5">
      {isDeleted ? (
        <Badge variant="destructive">Deleted</Badge>
      ) : category.isActive === false ? (
        <Badge variant="secondary">Inactive</Badge>
      ) : (
        <Badge>Active</Badge>
      )}
    </div>
  );
}

export function AdminCategoriesClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categoriesQuery = useQuery({
    queryKey: adminCategoriesQueryKey,
    queryFn: listAdminCategories,
  });

  const flatRows = useMemo(() => {
    const roots = categoriesQuery.data ?? [];
    const flat = flattenCategoryTree(roots);
    const filtered = filterFlatCategories(flat, search);
    return [...filtered].sort((a, b) =>
      compareDeletedLast(a.category, b.category, () =>
        a.label.localeCompare(b.label),
      ),
    );
  }, [categoriesQuery.data, search]);

  const totalCount = countCategoriesInTree(categoriesQuery.data ?? []);

  async function invalidateCategoryQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { body: AdminCategoryBody; id?: string }) => {
      if (payload.id) {
        return updateAdminCategory(payload.id, payload.body);
      }
      return createAdminCategory(payload.body);
    },
    onSuccess: async (_data, variables) => {
      await invalidateCategoryQueries();
      setFormOpen(false);
      setEditing(null);
      toast.success(
        variables.id ? "Category updated" : "Category created",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save category"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: async () => {
      await invalidateCategoryQueries();
      setDeleting(null);
      toast.success("Category deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete category"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreAdminCategory,
    onSuccess: async () => {
      await invalidateCategoryQueries();
      toast.success("Category restored");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not restore category"));
    },
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Catalog</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage nested storefront categories. Deleted categories are hidden
            from shoppers but remain visible here.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          New category
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
          aria-label="Search categories"
        />
        {categoriesQuery.data ? (
          <p className="text-sm text-muted-foreground">
            {flatRows.length} of {totalCount} categories
          </p>
        ) : null}
      </div>

      {categoriesQuery.isLoading ? <CategoriesTableSkeleton /> : null}

      {categoriesQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(
              categoriesQuery.error,
              "Could not load categories",
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void categoriesQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {categoriesQuery.data && flatRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? "No categories match your search."
              : "No categories yet."}
          </p>
          {!search.trim() ? (
            <Button type="button" className="mt-4" onClick={openCreate}>
              Create your first category
            </Button>
          ) : null}
        </div>
      ) : null}

      {categoriesQuery.data && flatRows.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatRows.map((row) => {
              const category = row.category;
              const isDeleted = Boolean(category.deletedAt);
              const isBusy =
                (deleteMutation.isPending &&
                  deleting?.id === category.id) ||
                (restoreMutation.isPending &&
                  restoreMutation.variables === category.id);

              return (
                <TableRow
                  key={category.id}
                  className={isDeleted ? "opacity-70" : undefined}
                >
                  <TableCell>
                    <div style={{ paddingLeft: row.depth * 16 }}>
                      <p className="font-medium">{category.name}</p>
                      {row.depth > 0 ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {row.label}
                        </p>
                      ) : null}
                      {category.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {category.sortOrder ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadges category={category} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!isDeleted ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => openEdit(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={isBusy}
                            onClick={() => setDeleting(category)}
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
                          onClick={() => restoreMutation.mutate(category.id)}
                        >
                          {restoreMutation.isPending &&
                          restoreMutation.variables === category.id
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
      ) : null}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (saveMutation.isPending) {
            return;
          }
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
        category={editing}
        categories={categoriesQuery.data ?? []}
        submitting={saveMutation.isPending}
        onSubmit={async (body) => {
          await saveMutation.mutateAsync({
            body,
            id: editing?.id,
          });
        }}
      />

      <DeleteCategoryDialog
        category={deleting}
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
