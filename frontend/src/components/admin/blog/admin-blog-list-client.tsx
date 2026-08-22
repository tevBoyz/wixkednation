"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  deleteAdminBlogPost,
  listAdminBlogPosts,
  restoreAdminBlogPost,
  updateAdminBlogPost,
  type BlogPost,
} from "@/lib/api/blog.api";
import { getErrorMessage } from "@/lib/api/errors";
import { sortDeletedLast } from "@/lib/admin/sort-deleted-last";

export const adminBlogQueryKey = ["admin", "blog"] as const;

function statusBadge(post: BlogPost) {
  if (post.deletedAt) {
    return { label: "Deleted", variant: "destructive" as const };
  }
  if (post.status === "published") {
    return { label: "Published", variant: "default" as const };
  }
  return { label: "Draft", variant: "secondary" as const };
}

export function AdminBlogListClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const listQueryKey = [...adminBlogQueryKey, "list"] as const;

  const postsQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () => listAdminBlogPosts({ includeDeleted: true }),
  });

  const rows = useMemo(() => {
    const list = sortDeletedLast(postsQuery.data ?? [], {
      secondaryCompare: (a, b) =>
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime(),
    });
    const q = search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((post) =>
      [post.title, post.slug, post.excerpt]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [postsQuery.data, search]);

  const homepageMutation = useMutation({
    mutationFn: ({
      id,
      showOnHomepage,
    }: {
      id: string;
      showOnHomepage: boolean;
    }) => updateAdminBlogPost(id, { showOnHomepage }),
    onMutate: async ({ id, showOnHomepage }) => {
      setTogglingId(id);
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<BlogPost[]>(listQueryKey);
      queryClient.setQueryData<BlogPost[]>(listQueryKey, (current) =>
        (current ?? []).map((post) =>
          post.id === id ? { ...post, showOnHomepage } : post,
        ),
      );
      return { previous };
    },
    onSuccess: (_post, { showOnHomepage }) => {
      toast.success(
        showOnHomepage ? "Shown on homepage" : "Removed from homepage",
      );
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listQueryKey, context.previous);
      }
      toast.error(getErrorMessage(error, "Could not update homepage flag"));
    },
    onSettled: async () => {
      setTogglingId(null);
      await queryClient.invalidateQueries({ queryKey: adminBlogQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminBlogPost,
    onSuccess: async () => {
      toast.success("Post deleted");
      await queryClient.invalidateQueries({ queryKey: adminBlogQueryKey });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete post"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreAdminBlogPost,
    onSuccess: async () => {
      toast.success("Post restored");
      await queryClient.invalidateQueries({ queryKey: adminBlogQueryKey });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not restore post"));
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Content</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Blog</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create SEO posts with blocks, HTML paste, and live preview. Toggle
            homepage from the list anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            render={<Link href="/admin/blog/tags" />}
            nativeButton={false}
            variant="outline"
          >
            Manage tags
          </Button>
          <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
            New post
          </Button>
        </div>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search title or slug…"
        className="max-w-sm"
      />

      {postsQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : null}

      {postsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(postsQuery.error, "Could not load blog posts")}
        </p>
      ) : null}

      {postsQuery.data ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Homepage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No posts yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((post) => {
                const badge = statusBadge(post);
                const onHomepage = Boolean(post.showOnHomepage);
                const busy = togglingId === post.id;
                return (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[14rem] sm:max-w-xs">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        /{post.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={onHomepage}
                          disabled={Boolean(post.deletedAt) || busy}
                          aria-label={`Show “${post.title}” on homepage`}
                          onChange={(event) => {
                            homepageMutation.mutate({
                              id: post.id,
                              showOnHomepage: event.target.checked,
                            });
                          }}
                        />
                        <span className="text-muted-foreground">
                          {onHomepage ? "On" : "Off"}
                        </span>
                      </label>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/admin/blog/${post.id}`} />}
                          nativeButton={false}
                        >
                          Edit
                        </Button>
                        {post.deletedAt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            disabled={restoreMutation.isPending}
                            onClick={() => restoreMutation.mutate(post.id)}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete “${post.title}”? You can restore it later.`,
                                )
                              ) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
