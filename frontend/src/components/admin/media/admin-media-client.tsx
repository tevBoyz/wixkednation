"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

import { CatalogImage } from "@/components/catalog/catalog-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import { listAdminMedia } from "@/lib/api/admin/media.api";
import { deleteAdminProductImage } from "@/lib/api/admin/products.api";
import { formatImageByteSize } from "@/lib/catalog/compress-product-image";
import type { AdminMediaItem } from "@/lib/api/types";

export const adminMediaQueryKey = ["admin", "media"] as const;

const PAGE_SIZE = 20;

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function buildAdminMediaHref(values: {
  page?: number;
  search?: string;
  includeArchived?: boolean;
}): string {
  const params = new URLSearchParams();
  if (values.search) {
    params.set("search", values.search);
  }
  if (values.includeArchived) {
    params.set("includeArchived", "true");
  }
  if (values.page && values.page > 1) {
    params.set("page", String(values.page));
  }
  const qs = params.toString();
  return qs ? `/admin/media?${qs}` : "/admin/media";
}

function MediaGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-border p-3">
          <Skeleton className="aspect-[4/3] w-full rounded-md" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function AdminMediaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isPendingNav, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<AdminMediaItem | null>(null);

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1,
  );
  const search = searchParams.get("search")?.trim() || undefined;
  const includeArchived = searchParams.get("includeArchived") === "true";

  const filters = useMemo(
    () => ({
      page,
      search,
      includeArchived,
    }),
    [page, search, includeArchived],
  );

  const mediaQuery = useQuery({
    queryKey: [...adminMediaQueryKey, filters],
    queryFn: () =>
      listAdminMedia({
        page: filters.page,
        limit: PAGE_SIZE,
        search: filters.search,
        includeArchived: filters.includeArchived ? true : undefined,
      }),
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (item: AdminMediaItem) =>
      deleteAdminProductImage(item.productId, item.imageId),
    onSuccess: async () => {
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: adminMediaQueryKey });
      toast.success("Image deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete image"));
    },
  });

  function navigate(next: {
    page?: number;
    search?: string;
    includeArchived?: boolean;
  }) {
    startTransition(() => {
      router.push(
        buildAdminMediaHref({
          page: next.page ?? 1,
          search: next.search,
          includeArchived: next.includeArchived,
        }),
      );
    });
  }

  const summary = mediaQuery.data?.summary;
  const pagination = mediaQuery.data?.pagination;
  const items = mediaQuery.data?.items ?? [];
  const dialogOpen = deleting !== null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Media library</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Product images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin view of all uploaded product images. Deletes remove the storage file and unlink from the product.
          </p>
        </div>
        <div className="min-w-[10rem] rounded-lg border border-border bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">Total images</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {summary ? summary.totalImages : "-"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary ? formatImageByteSize(summary.totalBytes) : "-"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:flex-wrap lg:items-end">
        <form
          className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const nextSearch = String(formData.get("search") || "").trim();
            navigate({
              page: 1,
              search: nextSearch || undefined,
              includeArchived,
            });
          }}
        >
          <Label htmlFor="admin-media-search">Search</Label>
          <div className="flex gap-2">
            <Input
              id="admin-media-search"
              name="search"
              type="search"
              placeholder="Product name…"
              defaultValue={searchParams.get("search") || ""}
              disabled={isPendingNav}
            />
            <Button type="submit" disabled={isPendingNav}>
              Search
            </Button>
          </div>
        </form>

        <label className="flex min-w-[12rem] items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-input"
            checked={includeArchived}
            disabled={isPendingNav}
            onChange={(event) => {
              navigate({
                page: 1,
                search,
                includeArchived: event.target.checked,
              });
            }}
          />
          Include hidden + soft-deleted products
        </label>

        {(search || includeArchived) && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPendingNav}
            onClick={() =>
              navigate({
                page: 1,
                search: undefined,
                includeArchived: false,
              })
            }
          >
            Clear filters
          </Button>
        )}
      </div>

      {mediaQuery.isLoading ? <MediaGridSkeleton /> : null}

      {mediaQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(mediaQuery.error, "Could not load media")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void mediaQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!mediaQuery.isLoading && mediaQuery.data && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No images match these filters.
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              return (
                <div
                  key={item.imageId}
                  className="space-y-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="relative">
                    <div className="aspect-[4/3] w-full rounded-md overflow-hidden border border-border bg-muted/20">
                      <CatalogImage
                        src={item.url}
                        alt={`${item.productName} image`}
                        className="h-full w-full"
                        imgClassName="h-full w-full"
                      />
                    </div>
                    {item.isCover ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-primary/90 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                        Cover
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={`/admin/products/${item.productId}`}
                      className="block text-sm font-medium hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatDateTime(item.createdAt)}</span>
                      {!item.productIsVisible ? <Badge variant="outline">Hidden</Badge> : null}
                      <span>{formatImageByteSize(item.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={
                        deleteMutation.isPending ||
                        (dialogOpen && deleting?.imageId !== item.imageId)
                      }
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2Icon className="mr-2 size-4" />
                      Delete
                    </Button>
                    {item.productDeletedAt ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  render={
                    <Link
                      href={buildAdminMediaHref({
                        page: Math.max(1, pagination.page - 1),
                        search: filters.search,
                        includeArchived: filters.includeArchived,
                      })}
                    />
                  }
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  render={
                    <Link
                      href={buildAdminMediaHref({
                        page: pagination.page + 1,
                        search: filters.search,
                        includeArchived: filters.includeArchived,
                      })}
                    />
                  }
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete image?</DialogTitle>
            <DialogDescription>
              Remove this image from{" "}
              <span className="font-medium text-foreground">
                {deleting?.productName}
              </span>
              . This deletes the storage file and unlinks it from the product.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !deleting || deleteMutation.isPending
              }
              onClick={() => {
                if (!deleting) return;
                deleteMutation.mutate(deleting);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

