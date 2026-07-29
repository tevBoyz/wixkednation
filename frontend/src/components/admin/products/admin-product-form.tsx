"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminProductBody } from "@/lib/api/admin/products.api";
import type { Category, Product } from "@/lib/api/types";
import { useStoreCurrency } from "@/components/providers/store-config-provider";
import { isSoftDeleted } from "@/lib/admin/sort-deleted-last";
import { flattenCategoryTree } from "@/lib/catalog/category-tree";
import { cn } from "@/lib/utils";

const MEASUREMENT_UNITS = [
  "g",
  "oz",
  "kg",
  "pcs",
  "pack",
  "L",
  "ml",
  "bottle",
] as const;

const STRAIN_TYPES = ["Indica", "Sativa", "Hybrid"] as const;

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

const optionalNonNegative = z
  .string()
  .refine(
    (value) => {
      if (!value.trim()) {
        return true;
      }
      const amount = Number.parseFloat(value);
      return Number.isFinite(amount) && amount >= 0;
    },
    { message: "Must be 0 or greater" },
  )
  .optional();

const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(200, "Name is too long"),
    description: z.string().max(2000, "Description is too long"),
    contactForPrice: z.boolean(),
    price: z.string(),
    categoryId: z.string().min(1, "Category is required"),
    measurementUnit: z
      .string()
      .trim()
      .min(1, "Measurement unit is required")
      .max(40),
    volume: z.string(),
    productType: z
      .string()
      .trim()
      .min(1, "Product type is required")
      .max(80),
    strainType: z.string(),
    thcPercent: optionalNonNegative,
    cbdPercent: optionalNonNegative,
    flavors: z.array(z.string()),
    effects: z.array(z.string()),
    isVisible: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.contactForPrice) {
      return;
    }

    const priceRaw = values.price.trim();
    const volumeRaw = values.volume.trim();
    const hasPrice = Boolean(priceRaw);
    const hasVolume = Boolean(volumeRaw);

    if (!hasPrice && !hasVolume) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Set pack price and volume, or enable Contact for price.",
      });
      return;
    }

    if (hasPrice && !hasVolume) {
      ctx.addIssue({
        code: "custom",
        path: ["volume"],
        message:
          "Volume is required when price is set. Price is the fixed charge for that pack size.",
      });
    }

    if (hasVolume && !hasPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message:
          "Price is required when volume is set. Clear both for contact-for-price, or set both as a pack.",
      });
    }

    if (hasPrice) {
      const amount = Number.parseFloat(priceRaw);
      if (!Number.isFinite(amount) || amount <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Price must be greater than 0",
        });
      }
    }

    if (hasVolume) {
      const amount = Number.parseFloat(volumeRaw);
      if (!Number.isFinite(amount) || amount <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["volume"],
          message: "Volume must be greater than 0 for a sellable pack",
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

type AdminProductFormProps = {
  product?: Product | null;
  categories: Category[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (body: AdminProductBody) => void | Promise<void>;
  imagesSection?: ReactNode;
};

const emptyValues: ProductFormValues = {
  name: "",
  description: "",
  contactForPrice: false,
  price: "",
  categoryId: "",
  measurementUnit: "g",
  volume: "1",
  productType: "Flower",
  strainType: "",
  thcPercent: "",
  cbdPercent: "",
  flavors: [],
  effects: [],
  isVisible: true,
  isFeatured: false,
};

function parseOptionalNumber(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return Number.parseFloat(trimmed);
}

function toBody(values: ProductFormValues): AdminProductBody {
  const contact = values.contactForPrice;
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: contact ? null : Number.parseFloat(values.price),
    categoryId: values.categoryId,
    measurementUnit: values.measurementUnit.trim(),
    volume: contact ? null : parseOptionalNumber(values.volume),
    productType: values.productType.trim() || "Flower",
    strainType: values.strainType.trim() || null,
    thcPercent: parseOptionalNumber(values.thcPercent),
    cbdPercent: parseOptionalNumber(values.cbdPercent),
    flavors: values.flavors.map((f) => f.trim()).filter(Boolean),
    effects: values.effects.map((e) => e.trim()).filter(Boolean),
    isVisible: values.isVisible,
    isFeatured: values.isFeatured,
  };
}

function TagListField({
  label,
  values,
  disabled,
  onChange,
}: {
  label: string;
  values: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) {
      return;
    }
    if (values.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, tag]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs disabled:opacity-50"
            onClick={() => onChange(values.filter((v) => v !== tag))}
          >
            {tag}
            <span aria-hidden className="text-muted-foreground">
              ×
            </span>
          </button>
        ))}
      </div>
      <Input
        value={draft}
        disabled={disabled}
        placeholder="Type and press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
      />
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add. Click a tag to remove.
      </p>
    </div>
  );
}

export function AdminProductForm({
  product,
  categories,
  submitting = false,
  submitLabel,
  onSubmit,
  imagesSection,
}: AdminProductFormProps) {
  const currency = useStoreCurrency();
  const isEdit = Boolean(product);
  const activeCategoryOptions = useMemo(
    () =>
      flattenCategoryTree(categories).filter(
        (option) =>
          !isSoftDeleted(option.category) &&
          option.category.isActive !== false,
      ),
    [categories],
  );
  const defaultCategoryId = activeCategoryOptions[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues,
  });

  const flavors = watch("flavors");
  const effects = watch("effects");
  const contactForPrice = watch("contactForPrice");

  useEffect(() => {
    if (product) {
      const priced =
        product.price != null &&
        product.price !== "" &&
        product.volume != null &&
        product.volume !== "";
      reset({
        name: product.name,
        description: product.description ?? "",
        contactForPrice: !priced,
        price: priced ? String(product.price) : "",
        categoryId: product.categoryId ?? product.category?.id ?? "",
        measurementUnit: product.measurementUnit ?? "g",
        volume: priced ? String(product.volume) : "",
        productType: product.productType?.trim() || "Flower",
        strainType: product.strainType?.trim() || "",
        thcPercent:
          product.thcPercent === null || product.thcPercent === undefined
            ? ""
            : String(product.thcPercent),
        cbdPercent:
          product.cbdPercent === null || product.cbdPercent === undefined
            ? ""
            : String(product.cbdPercent),
        flavors: product.flavors ?? [],
        effects: product.effects ?? [],
        isVisible: product.isVisible !== false,
        isFeatured: Boolean(product.isFeatured),
      });
      return;
    }

    reset({
      ...emptyValues,
      categoryId: defaultCategoryId,
    });
  }, [product, categories, defaultCategoryId, reset]);

  function onContactForPriceChange(checked: boolean) {
    setValue("contactForPrice", checked, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (checked) {
      setValue("price", "", { shouldDirty: true, shouldValidate: true });
      setValue("volume", "", { shouldDirty: true, shouldValidate: true });
    } else {
      setValue("volume", "1", { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
      onSubmit={handleSubmit((values) => void onSubmit(toBody(values)))}
      noValidate
    >
      <section className="grid gap-4 rounded-lg border border-border p-4 sm:p-6">
        <h3 className="text-base font-medium">Product details</h3>

        <div className="space-y-2">
          <Label htmlFor="product-name">Name</Label>
          <Input
            id="product-name"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            disabled={submitting}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        {isEdit && product?.slug ? (
          <div className="space-y-1">
            <Label>Slug</Label>
            <p className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-sm text-muted-foreground">
              {product.slug}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="product-description">Description (optional)</Label>
          <textarea
            id="product-description"
            rows={4}
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

        <div className="space-y-2">
          <Label htmlFor="product-category">Category</Label>
          <select
            id="product-category"
            className={selectClassName}
            disabled={submitting || activeCategoryOptions.length === 0}
            aria-invalid={Boolean(errors.categoryId)}
            {...register("categoryId")}
          >
            <option value="">Select category</option>
            {activeCategoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.categoryId ? (
            <p className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          ) : null}
          {activeCategoryOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Create an active category before adding products.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-type">Product type</Label>
            <Input
              id="product-type"
              autoComplete="off"
              disabled={submitting}
              aria-invalid={Boolean(errors.productType)}
              {...register("productType")}
            />
            {errors.productType ? (
              <p className="text-sm text-destructive">
                {errors.productType.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-strain-type">Strain type (optional)</Label>
            <select
              id="product-strain-type"
              className={selectClassName}
              disabled={submitting}
              {...register("strainType")}
            >
              <option value="">None</option>
              {STRAIN_TYPES.map((strain) => (
                <option key={strain} value={strain}>
                  {strain}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-thc">THC % (optional)</Label>
            <Input
              id="product-thc"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              disabled={submitting}
              aria-invalid={Boolean(errors.thcPercent)}
              {...register("thcPercent")}
            />
            {errors.thcPercent ? (
              <p className="text-sm text-destructive">
                {errors.thcPercent.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-cbd">CBD % (optional)</Label>
            <Input
              id="product-cbd"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              disabled={submitting}
              aria-invalid={Boolean(errors.cbdPercent)}
              {...register("cbdPercent")}
            />
            {errors.cbdPercent ? (
              <p className="text-sm text-destructive">
                {errors.cbdPercent.message}
              </p>
            ) : null}
          </div>
        </div>

        <TagListField
          label="Flavors"
          values={flavors}
          disabled={submitting}
          onChange={(next) =>
            setValue("flavors", next, { shouldDirty: true, shouldValidate: true })
          }
        />

        <TagListField
          label="Effects"
          values={effects}
          disabled={submitting}
          onChange={(next) =>
            setValue("effects", next, { shouldDirty: true, shouldValidate: true })
          }
        />

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              disabled={submitting}
              {...register("isVisible")}
            />
            Visible in storefront
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              disabled={submitting}
              {...register("isFeatured")}
            />
            Featured on homepage
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border p-4 sm:p-6">
        <div className="space-y-1">
          <h3 className="text-base font-medium">Pack pricing</h3>
          <p className="text-sm text-muted-foreground">
            Price is for this amount only. Example: Volume{" "}
            <span className="font-medium text-foreground">1</span>, Unit{" "}
            <span className="font-medium text-foreground">g</span>, Price{" "}
            <span className="font-medium text-foreground">500</span> means{" "}
            <span className="font-medium text-foreground">1 g costs 500</span>.
            If the customer buys qty 2, they get{" "}
            <span className="font-medium text-foreground">2 g for 1000</span>.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input"
            disabled={submitting}
            checked={contactForPrice}
            onChange={(event) => onContactForPriceChange(event.target.checked)}
          />
          <span>
            <span className="font-medium">Contact for price</span>
            <span className="mt-0.5 block text-muted-foreground">
              Clears price and volume together. Product cannot be added to cart
              until a pack is set.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="product-volume">Volume</Label>
            <Input
              id="product-volume"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="e.g. 1"
              aria-invalid={Boolean(errors.volume)}
              disabled={submitting || contactForPrice}
              {...register("volume")}
            />
            {errors.volume ? (
              <p className="text-sm text-destructive">{errors.volume.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-measurement-unit">Unit</Label>
            <select
              id="product-measurement-unit"
              className={selectClassName}
              disabled={submitting}
              aria-invalid={Boolean(errors.measurementUnit)}
              {...register("measurementUnit")}
            >
              {MEASUREMENT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {errors.measurementUnit ? (
              <p className="text-sm text-destructive">
                {errors.measurementUnit.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-price">Price ({currency})</Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="Pack price"
              aria-invalid={Boolean(errors.price)}
              disabled={submitting || contactForPrice}
              {...register("price")}
            />
            {errors.price ? (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      {imagesSection ? (
        <section className="rounded-lg border border-border p-4 sm:p-6">
          {imagesSection}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting || activeCategoryOptions.length === 0}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
