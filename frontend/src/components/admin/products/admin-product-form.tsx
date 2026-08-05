"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
const MAX_SKUS = 3;

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

const skuRowSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  volume: z.string(),
  measurementUnit: z.string().trim().min(1, "Unit is required").max(40),
  price: z.string(),
  isVisible: z.boolean(),
});

const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(200, "Name is too long"),
    description: z.string().max(2000, "Description is too long"),
    contactForPrice: z.boolean(),
    categoryId: z.string().min(1, "Category is required"),
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
    skus: z.array(skuRowSchema).max(MAX_SKUS),
  })
  .superRefine((values, ctx) => {
    if (values.contactForPrice) {
      return;
    }

    if (values.skus.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["skus"],
        message: "Add at least one pack SKU, or enable Contact for price.",
      });
      return;
    }

    if (!values.skus.some((sku) => sku.isVisible)) {
      ctx.addIssue({
        code: "custom",
        path: ["skus"],
        message: "At least one SKU must be visible.",
      });
    }

    const seen = new Set<string>();
    values.skus.forEach((sku, index) => {
      const volumeRaw = sku.volume.trim();
      const priceRaw = sku.price.trim();
      const volume = Number.parseFloat(volumeRaw);
      const price = Number.parseFloat(priceRaw);

      if (!volumeRaw || !Number.isFinite(volume) || volume <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["skus", index, "volume"],
          message: "Volume must be greater than 0",
        });
      }

      if (!priceRaw || !Number.isFinite(price) || price <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["skus", index, "price"],
          message: "Price must be greater than 0",
        });
      }

      const unit = sku.measurementUnit.trim().toLowerCase();
      if (Number.isFinite(volume) && volume > 0 && unit) {
        const key = `${volume}|${unit}`;
        if (seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["skus", index, "volume"],
            message: "Volume + unit must be unique across SKUs",
          });
        }
        seen.add(key);
      }
    });
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

function defaultSkuRow(
  overrides?: Partial<ProductFormValues["skus"][number]>,
): ProductFormValues["skus"][number] {
  return {
    id: undefined,
    label: "",
    volume: "1",
    measurementUnit: "g",
    price: "",
    isVisible: true,
    ...overrides,
  };
}

const emptyValues: ProductFormValues = {
  name: "",
  description: "",
  contactForPrice: false,
  categoryId: "",
  productType: "Flower",
  strainType: "",
  thcPercent: "",
  cbdPercent: "",
  flavors: [],
  effects: [],
  isVisible: true,
  isFeatured: false,
  skus: [defaultSkuRow()],
};

function parseOptionalNumber(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return Number.parseFloat(trimmed);
}

function skusFromProduct(product: Product): ProductFormValues["skus"] {
  const apiSkus = product.skus ?? [];
  if (apiSkus.length > 0) {
    return apiSkus.slice(0, MAX_SKUS).map((sku) => ({
      id: sku.id,
      label: sku.label?.trim() || "",
      volume: String(sku.volume),
      measurementUnit: sku.measurementUnit || "g",
      price: String(sku.price),
      isVisible: sku.isVisible !== false,
    }));
  }

  const priced =
    product.price != null &&
    product.price !== "" &&
    product.volume != null &&
    product.volume !== "";

  if (priced) {
    return [
      defaultSkuRow({
        volume: String(product.volume),
        measurementUnit: product.measurementUnit ?? "g",
        price: String(product.price),
        isVisible: true,
      }),
    ];
  }

  return [defaultSkuRow()];
}

function toBody(values: ProductFormValues): AdminProductBody {
  const contact = values.contactForPrice;
  const primaryUnit =
    values.skus[0]?.measurementUnit.trim() ||
    values.skus.find((s) => s.isVisible)?.measurementUnit.trim() ||
    "g";

  if (contact) {
    return {
      name: values.name.trim(),
      description: values.description.trim() || null,
      price: null,
      categoryId: values.categoryId,
      measurementUnit: primaryUnit,
      volume: null,
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

  const skus = values.skus.map((sku, index) => ({
    ...(sku.id ? { id: sku.id } : {}),
    label: sku.label.trim() || null,
    volume: Number.parseFloat(sku.volume),
    measurementUnit: sku.measurementUnit.trim(),
    price: Number.parseFloat(sku.price),
    sortOrder: index,
    isVisible: sku.isVisible,
  }));

  const primary =
    skus.find((sku) => sku.isVisible) ?? skus[0] ?? null;

  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: primary?.price ?? null,
    categoryId: values.categoryId,
    measurementUnit: primary?.measurementUnit ?? primaryUnit,
    volume: primary?.volume ?? null,
    skus,
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
    control,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "skus",
  });

  const flavors = watch("flavors");
  const effects = watch("effects");
  const contactForPrice = watch("contactForPrice");

  useEffect(() => {
    if (product) {
      const skus = skusFromProduct(product);
      const hasSellableApi = (product.skus ?? []).some(
        (sku) =>
          sku.isVisible !== false &&
          sku.price != null &&
          sku.volume != null,
      );
      const hasSellableLegacy =
        product.price != null &&
        product.price !== "" &&
        product.volume != null &&
        product.volume !== "";

      reset({
        name: product.name,
        description: product.description ?? "",
        contactForPrice: !(hasSellableApi || hasSellableLegacy),
        categoryId: product.categoryId ?? product.category?.id ?? "",
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
        skus,
      });
      return;
    }

    reset({
      ...emptyValues,
      categoryId: defaultCategoryId,
      skus: [defaultSkuRow()],
    });
  }, [product, categories, defaultCategoryId, reset]);

  function onContactForPriceChange(checked: boolean) {
    setValue("contactForPrice", checked, {
      shouldDirty: true,
      shouldValidate: true,
    });
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
          <h3 className="text-base font-medium">Pack SKUs</h3>
          <p className="text-sm text-muted-foreground">
            Add 1–{MAX_SKUS} pack sizes. Each SKU is a separate cart line.
            Hide a SKU to remove it from the storefront without deleting it.
            Primary catalog price uses the first visible SKU.
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
              Skip pack SKUs. Product cannot be added to cart until packs are
              set.
            </span>
          </span>
        </label>

        {errors.skus?.message || errors.skus?.root?.message ? (
          <p className="text-sm text-destructive">
            {errors.skus.message || errors.skus.root?.message}
          </p>
        ) : null}

        {!contactForPrice ? (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">SKU {index + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input"
                        disabled={submitting}
                        {...register(`skus.${index}.isVisible`)}
                      />
                      Visible
                    </label>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={submitting}
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>

                <input type="hidden" {...register(`skus.${index}.id`)} />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor={`sku-volume-${index}`}>Volume</Label>
                    <Input
                      id={`sku-volume-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      disabled={submitting}
                      aria-invalid={Boolean(errors.skus?.[index]?.volume)}
                      {...register(`skus.${index}.volume`)}
                    />
                    {errors.skus?.[index]?.volume ? (
                      <p className="text-sm text-destructive">
                        {errors.skus[index]?.volume?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sku-unit-${index}`}>Unit</Label>
                    <select
                      id={`sku-unit-${index}`}
                      className={selectClassName}
                      disabled={submitting}
                      aria-invalid={Boolean(
                        errors.skus?.[index]?.measurementUnit,
                      )}
                      {...register(`skus.${index}.measurementUnit`)}
                    >
                      {MEASUREMENT_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {errors.skus?.[index]?.measurementUnit ? (
                      <p className="text-sm text-destructive">
                        {errors.skus[index]?.measurementUnit?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sku-price-${index}`}>
                      Price ({currency})
                    </Label>
                    <Input
                      id={`sku-price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="Pack price"
                      disabled={submitting}
                      aria-invalid={Boolean(errors.skus?.[index]?.price)}
                      {...register(`skus.${index}.price`)}
                    />
                    {errors.skus?.[index]?.price ? (
                      <p className="text-sm text-destructive">
                        {errors.skus[index]?.price?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sku-label-${index}`}>
                      Label (optional)
                    </Label>
                    <Input
                      id={`sku-label-${index}`}
                      autoComplete="off"
                      placeholder="e.g. Eighth"
                      disabled={submitting}
                      {...register(`skus.${index}.label`)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {fields.length < MAX_SKUS ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => append(defaultSkuRow())}
              >
                Add SKU
              </Button>
            ) : null}
          </div>
        ) : null}
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
