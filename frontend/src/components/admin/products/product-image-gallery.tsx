"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CatalogImage } from "@/components/catalog/catalog-image";
import {
  formatImageByteSize,
  prepareProductImageForUpload,
  PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES,
} from "@/lib/catalog/compress-product-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  deleteAdminProductImage,
  reorderAdminProductImages,
  setAdminProductCoverImage,
} from "@/lib/api/admin/products.api";
import {
  isAllowedProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_COUNT,
  uploadAdminProductImageWithProgress,
} from "@/lib/api/admin/product-image-upload";
import { getErrorMessage } from "@/lib/api/errors";
import type { Product, ProductImage } from "@/lib/api/types";

type ProductImageGalleryProps = {
  product: Product;
  disabled?: boolean;
  onProductChange: (product: Product) => void;
};

export function ProductImageGallery({
  product,
  disabled = false,
  onProductChange,
}: ProductImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<ProductImage | null>(null);

  const images = product.images ?? [];
  const coverIndex = Math.min(
    Math.max(product.coverImageIndex ?? 0, 0),
    Math.max(images.length - 1, 0),
  );
  const atMax = images.length >= PRODUCT_IMAGE_MAX_COUNT;
  const uploading = uploadProgress !== null;
  const imageBusyGlobal = uploading || compressing;

  async function runAction<T>(key: string, action: () => Promise<T>) {
    setBusyKey(key);
    try {
      return await action();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update images"));
      throw error;
    } finally {
      setBusyKey(null);
    }
  }

  async function handleFileSelect(file: File) {
    if (!isAllowedProductImageFile(file)) {
      toast.error("Use JPG, PNG, or WebP images only.");
      return;
    }

    if (atMax) {
      toast.error(`Maximum ${PRODUCT_IMAGE_MAX_COUNT} images per product.`);
      return;
    }

    setCompressing(true);
    try {
      const prepared = await prepareProductImageForUpload(file);
      if (prepared.compressed) {
        toast.info(
          `Compressed ${formatImageByteSize(prepared.originalSize)} → ${formatImageByteSize(prepared.finalSize)} before upload`,
        );
      }

      setCompressing(false);
      setUploadProgress(0);

      const updated = await uploadAdminProductImageWithProgress(
        product.id,
        prepared.file,
        { onProgress: setUploadProgress },
      );
      onProductChange(updated);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not upload image"));
    } finally {
      setCompressing(false);
      setUploadProgress(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) {
      return;
    }

    const nextIds = images.map((image) => image.id);
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];

    await runAction(`move-${index}`, async () => {
      const updated = await reorderAdminProductImages(product.id, nextIds);
      onProductChange(updated);
      toast.success("Image order updated");
    });
  }

  async function setCover(imageId: string) {
    await runAction(`cover-${imageId}`, async () => {
      const updated = await setAdminProductCoverImage(product.id, imageId);
      onProductChange(updated);
      toast.success("Cover image updated");
    });
  }

  async function confirmDelete() {
    if (!deletingImage) {
      return;
    }

    await runAction(`delete-${deletingImage.id}`, async () => {
      const updated = await deleteAdminProductImage(
        product.id,
        deletingImage.id,
      );
      onProductChange(updated);
      setDeletingImage(null);
      toast.success("Image deleted");
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium">Images</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to {PRODUCT_IMAGE_MAX_COUNT} images. JPG, PNG, or WebP. Files over{" "}
          {formatImageByteSize(PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES)} are
          compressed before upload.
        </p>
      </div>

      {images.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {images.map((image, index) => {
            const isCover = index === coverIndex;
            const imageBusy = busyKey?.includes(image.id) ?? false;

            return (
              <li
                key={image.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="relative size-20 shrink-0">
                  <CatalogImage
                    src={image.url}
                    alt=""
                    className="size-20 rounded-md border border-border"
                  />
                  {isCover ? (
                    <span className="absolute right-0 bottom-0 left-0 rounded-b-md bg-primary px-1 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                      Cover
                    </span>
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {!isCover ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled || imageBusyGlobal || imageBusy}
                      onClick={() => void setCover(image.id)}
                    >
                      <StarIcon className="size-3.5" />
                      Set cover
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      disabled || imageBusyGlobal || imageBusy || index === 0
                    }
                    aria-label="Move image left"
                    onClick={() => void moveImage(index, -1)}
                  >
                    <ChevronLeftIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      disabled ||
                      imageBusyGlobal ||
                      imageBusy ||
                      index === images.length - 1
                    }
                    aria-label="Move image right"
                    onClick={() => void moveImage(index, 1)}
                  >
                    <ChevronRightIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={disabled || imageBusyGlobal || imageBusy}
                    onClick={() => setDeletingImage(image)}
                  >
                    <Trash2Icon className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor={`product-image-upload-${product.id}`}>
          Upload image
        </Label>
        <input
          ref={inputRef}
          id={`product-image-upload-${product.id}`}
          type="file"
          accept={PRODUCT_IMAGE_ACCEPT}
          className="sr-only"
          disabled={disabled || atMax || imageBusyGlobal}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFileSelect(file);
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || atMax || imageBusyGlobal}
            onClick={() => inputRef.current?.click()}
          >
            {compressing
              ? "Compressing…"
              : uploading
                ? "Uploading…"
                : "Choose image"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {images.length}/{PRODUCT_IMAGE_MAX_COUNT} used
          </span>
        </div>
        {compressing ? (
          <p className="text-xs text-muted-foreground">
            Compressing large image before upload…
          </p>
        ) : null}
        {uploadProgress !== null ? (
          <div className="max-w-xs space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Uploading… {uploadProgress}%
            </p>
          </div>
        ) : null}
        {atMax ? (
          <p className="text-xs text-muted-foreground">
            Remove an image before uploading another.
          </p>
        ) : null}
        {disabled ? (
          <p className="text-xs text-muted-foreground">
            Restore this product before uploading images.
          </p>
        ) : null}
      </div>

      <Dialog
        open={Boolean(deletingImage)}
        onOpenChange={(open) => {
          if (busyKey?.startsWith("delete-")) {
            return;
          }
          if (!open) {
            setDeletingImage(null);
          }
        }}
      >
        <DialogContent showCloseButton={!busyKey?.startsWith("delete-")}>
          <DialogHeader>
            <DialogTitle>Delete image?</DialogTitle>
            <DialogDescription>
              Remove this image from{" "}
              <span className="font-medium text-foreground">{product.name}</span>
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busyKey?.startsWith("delete-"))}
              onClick={() => setDeletingImage(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !deletingImage || Boolean(busyKey?.startsWith("delete-"))
              }
              onClick={() => void confirmDelete()}
            >
              {busyKey?.startsWith("delete-") ? "Deleting…" : "Delete image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
