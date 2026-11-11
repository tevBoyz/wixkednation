"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/api/types";
import type { AdminCategoryBody } from "@/lib/api/admin/categories.api";
import { parentCategoryOptions } from "@/lib/catalog/category-tree";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  description: z.string().max(500, "Description is too long"),
  isActive: z.boolean(),
  parentId: z.string(),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => value === "" || /^-?\d+$/.test(value), {
      message: "Sort order must be an integer",
    }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  /** Full category tree roots for parent picker. */
  categories: Category[];
  submitting?: boolean;
  onSubmit: (body: AdminCategoryBody) => void | Promise<void>;
};

const emptyValues: CategoryFormValues = {
  name: "",
  description: "",
  isActive: true,
  parentId: "",
  sortOrder: "0",
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
  submitting = false,
  onSubmit,
}: CategoryFormDialogProps) {
  const isEdit = Boolean(category);

  const parentOptions = useMemo(
    () => parentCategoryOptions(categories, category?.id),
    [categories, category?.id],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (category) {
      reset({
        name: category.name,
        description: category.description ?? "",
        isActive: category.isActive !== false,
        parentId: category.parentId ?? "",
        sortOrder: String(category.sortOrder ?? 0),
      });
      return;
    }

    reset(emptyValues);
  }, [open, category, reset]);

  async function submit(values: CategoryFormValues) {
    const sortRaw = values.sortOrder.trim();
    const body: AdminCategoryBody = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      isActive: values.isActive,
      parentId: values.parentId.trim() ? values.parentId.trim() : null,
      sortOrder: sortRaw === "" ? 0 : Number.parseInt(sortRaw, 10),
    };
    await onSubmit(body);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update name, parent, sort order, or visibility."
              : "Add a category for organizing products. The URL slug is generated from the name."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="category-form"
          className="grid gap-3"
          onSubmit={handleSubmit((values) => void submit(values))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              disabled={submitting}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          {isEdit && category?.slug ? (
            <div className="space-y-1">
              <Label>Slug</Label>
              <p className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground">
                {category.slug}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="category-parent">Parent category</Label>
            <select
              id="category-parent"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              disabled={submitting}
              {...register("parentId")}
            >
              <option value="">None (top level)</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-sort-order">Sort order</Label>
            <Input
              id="category-sort-order"
              inputMode="numeric"
              aria-invalid={Boolean(errors.sortOrder)}
              disabled={submitting}
              {...register("sortOrder")}
            />
            {errors.sortOrder ? (
              <p className="text-sm text-destructive">
                {errors.sortOrder.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first among siblings.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description (optional)</Label>
            <textarea
              id="category-description"
              rows={3}
              disabled={submitting}
              aria-invalid={Boolean(errors.description)}
              className={cn(
                "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm",
                errors.description &&
                  "border-destructive ring-3 ring-destructive/20",
              )}
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              disabled={submitting}
              {...register("isActive")}
            />
            Active (visible in store when not deleted)
          </label>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={submitting}>
            {submitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save category"
                : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
