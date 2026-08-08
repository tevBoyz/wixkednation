"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminBannersQueryKey } from "@/components/admin/banners/admin-banners-client";
import {
  PromoBannerSlide,
  type PromoBannerSlideView,
} from "@/components/catalog/promo-banner-slide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAdminBanner,
  updateAdminBanner,
  type AdminBannerBody,
} from "@/lib/api/admin/banners.api";
import {
  isAllowedProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
  uploadAdminBannerImageWithProgress,
} from "@/lib/api/admin/banner-image-upload";
import { listAdminProducts } from "@/lib/api/admin/products.api";
import { getErrorMessage } from "@/lib/api/errors";
import { formatSkuLabel, getProductCoverUrl } from "@/lib/catalog/format";
import type { Product, PromoBanner, PromoBannerImageMode } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

type FormState = {
  imageMode: PromoBannerImageMode;
  title: string;
  subtitle: string;
  productId: string;
  skuId: string;
  salePrice: string;
  compareAtPrice: string;
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

function initialForm(banner?: PromoBanner | null): FormState {
  return {
    imageMode: banner?.imageMode === "uploaded" ? "uploaded" : "composed",
    title: banner?.title || "Deal of the Day",
    subtitle: banner?.subtitle || "",
    productId: banner?.productId || "",
    skuId: banner?.skuId || "",
    salePrice:
      banner?.salePrice != null ? String(Number(banner.salePrice)) : "",
    compareAtPrice:
      banner?.compareAtPrice != null
        ? String(Number(banner.compareAtPrice))
        : "",
    sortOrder: banner?.sortOrder != null ? String(banner.sortOrder) : "0",
    isActive: banner?.isActive !== false,
    startsAt: toDatetimeLocalValue(banner?.startsAt),
    endsAt: toDatetimeLocalValue(banner?.endsAt),
  };
}

type AdminBannerFormClientProps = {
  mode: "create" | "edit";
  banner?: PromoBanner | null;
};

export function AdminBannerFormClient({
  mode,
  banner,
}: AdminBannerFormClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initialForm(banner));
  const [productSearch, setProductSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    banner?.imageUrl || null,
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!imageFile) {
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const productsQuery = useQuery({
    queryKey: ["admin", "products", "banner-picker", productSearch],
    queryFn: () =>
      listAdminProducts({
        search: productSearch || undefined,
        limit: 50,
        includeDeleted: false,
      }),
  });

  const products = useMemo(
    () =>
      (productsQuery.data?.products ?? []).filter(
        (product) => !product.deletedAt && product.isVisible !== false,
      ),
    [productsQuery.data],
  );

  const selectedProduct: Product | null =
    products.find((product) => product.id === form.productId) || null;

  const skus = useMemo(() => {
    if (selectedProduct?.skus?.length) {
      return selectedProduct.skus.filter((sku) => sku.isVisible !== false);
    }
    if (banner?.sku && banner.productId === form.productId) {
      return [
        {
          id: banner.sku.id,
          label: banner.sku.label,
          volume: banner.sku.volume,
          measurementUnit: banner.sku.measurementUnit,
          price: banner.sku.price,
          sortOrder: 0,
          isVisible: true,
        },
      ];
    }
    return [];
  }, [banner?.productId, banner?.sku, form.productId, selectedProduct]);

  const selectedSku = skus.find((sku) => sku.id === form.skuId) ?? null;

  useEffect(() => {
    if (!form.productId || skus.length === 0) {
      return;
    }
    if (!skus.some((sku) => sku.id === form.skuId)) {
      setForm((prev) => ({ ...prev, skuId: skus[0]?.id || "" }));
    }
  }, [form.productId, form.skuId, skus]);

  const coverUrl = selectedProduct
    ? getProductCoverUrl(selectedProduct)
    : banner?.product?.coverImageUrl || null;

  const previewProductName =
    selectedProduct?.name || banner?.product?.name || "Select a product";

  const preview: PromoBannerSlideView = {
    title: form.title || "Deal of the Day",
    subtitle: form.subtitle || null,
    productName: previewProductName,
    salePrice: form.salePrice || "0",
    compareAtPrice: form.compareAtPrice || "0",
    imageUrl:
      imagePreviewUrl ||
      (form.imageMode === "composed" ? coverUrl : null) ||
      null,
    imageMode: form.imageMode,
    skuLabel: selectedSku
      ? formatSkuLabel({
          label: selectedSku.label,
          volume: selectedSku.volume,
          measurementUnit: selectedSku.measurementUnit,
        })
      : null,
  };

  function buildBody(): AdminBannerBody {
    const salePrice = Number.parseFloat(form.salePrice);
    const compareAtPrice = Number.parseFloat(form.compareAtPrice);
    if (!form.title.trim()) {
      throw new Error("Please enter a title.");
    }
    if (!form.productId || !form.skuId) {
      throw new Error("Please choose a product and pack size.");
    }
    if (!Number.isFinite(salePrice) || !Number.isFinite(compareAtPrice)) {
      throw new Error("Please enter valid sale and before prices.");
    }
    if (salePrice >= compareAtPrice) {
      throw new Error("Sale price must be less than the before price.");
    }
    if (form.imageMode === "uploaded" && mode === "create" && !imageFile) {
      throw new Error("Please upload a finished banner image.");
    }
    if (
      form.imageMode === "uploaded" &&
      mode === "edit" &&
      !imageFile &&
      !banner?.imagePath &&
      !banner?.imageUrl
    ) {
      throw new Error("Please upload a finished banner image.");
    }

    return {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      productId: form.productId,
      skuId: form.skuId,
      salePrice,
      compareAtPrice,
      imageMode: form.imageMode,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive,
      startsAt: fromDatetimeLocalValue(form.startsAt),
      endsAt: fromDatetimeLocalValue(form.endsAt),
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = buildBody();
      let saved: PromoBanner;
      if (mode === "create") {
        saved = await createAdminBanner(body);
      } else if (banner?.id) {
        saved = await updateAdminBanner(banner.id, body);
      } else {
        throw new Error("Banner not found.");
      }

      if (imageFile) {
        setUploadProgress(0);
        saved = await uploadAdminBannerImageWithProgress(
          saved.id,
          imageFile,
          {
            onProgress: setUploadProgress,
          },
        );
        setUploadProgress(null);
      }

      return saved;
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: adminBannersQueryKey });
      toast.success(mode === "create" ? "Banner created" : "Banner saved");
      router.push("/admin/banners");
      router.refresh();
      return saved;
    },
    onError: (error) => {
      setUploadProgress(null);
      toast.error(getErrorMessage(error, "Could not save banner"));
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "Create banner" : "Edit banner"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the deal details. Preview updates as you type — no design
          skills needed.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              1. What kind of banner?
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    mode: "composed" as const,
                    title: "Build with product photo",
                    desc: "We layout the deal using the product image and your text.",
                  },
                  {
                    mode: "uploaded" as const,
                    title: "Upload a finished image",
                    desc: "Use a designer-made PNG or JPG for the whole banner.",
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    form.imageMode === option.mode
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, imageMode: option.mode }))
                  }
                >
                  <p className="font-medium">{option.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              2. Which product?
            </h2>
            <div className="space-y-2">
              <Label htmlFor="product-search">Find product</Label>
              <Input
                id="product-search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search by name…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <select
                id="productId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.productId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    productId: event.target.value,
                    skuId: "",
                  }))
                }
              >
                <option value="">Select a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
                {form.productId &&
                banner?.product &&
                banner.productId === form.productId &&
                !products.some((p) => p.id === form.productId) ? (
                  <option value={banner.productId}>
                    {banner.product.name}
                  </option>
                ) : null}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skuId">Size / pack</Label>
              <select
                id="skuId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.skuId}
                disabled={!form.productId || skus.length === 0}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, skuId: event.target.value }))
                }
              >
                <option value="">Select a pack…</option>
                {skus.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {formatSkuLabel(sku)} — ${Number(sku.price).toFixed(2)}{" "}
                    catalog
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              3. What should it say?
            </h2>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Deal of the Day"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (optional)</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subtitle: event.target.value }))
                }
                placeholder="Happy hour — 50% off this strain"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              4. Prices
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale price ($)</Label>
                <Input
                  id="salePrice"
                  inputMode="decimal"
                  value={form.salePrice}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      salePrice: event.target.value,
                    }))
                  }
                  placeholder="19"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Was / before price ($)</Label>
                <Input
                  id="compareAtPrice"
                  inputMode="decimal"
                  value={form.compareAtPrice}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      compareAtPrice: event.target.value,
                    }))
                  }
                  placeholder="30"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              5. When is it on?
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active (show on homepage when schedule allows)
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start (optional)</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      startsAt: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End (optional)</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      endsAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to run until you turn it off.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              6. Image
            </h2>
            {form.imageMode === "composed" ? (
              <p className="text-sm text-muted-foreground">
                Uses the product photo by default. Optionally upload a different
                photo for this deal.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload the finished banner image (JPG, PNG, or WebP).
              </p>
            )}
            <Input
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (!file) {
                  setImageFile(null);
                  return;
                }
                if (!isAllowedProductImageFile(file)) {
                  toast.error("Use a JPG, PNG, or WebP image.");
                  event.target.value = "";
                  return;
                }
                setImageFile(file);
              }}
            />
            {uploadProgress != null ? (
              <p className="text-sm text-muted-foreground">
                Uploading… {uploadProgress}%
              </p>
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              7. Show order
            </h2>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="sortOrder">Order (1 shows first)</Label>
              <Input
                id="sortOrder"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: event.target.value,
                  }))
                }
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => {
                try {
                  buildBody();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Check the form fields.",
                  );
                  return;
                }
                saveMutation.mutate();
              }}
            >
              {saveMutation.isPending ? "Saving…" : "Save banner"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={() => router.push("/admin/banners")}
            >
              Cancel
            </Button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Live preview
          </p>
          <PromoBannerSlide banner={preview} compact />
        </aside>
      </div>
    </div>
  );
}
