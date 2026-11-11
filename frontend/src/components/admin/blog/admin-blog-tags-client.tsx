"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminBlogQueryKey } from "@/components/admin/blog/admin-blog-list-client";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminBlogTag,
  listAdminBlogTags,
  updateAdminBlogTag,
  type AdminBlogTagBody,
  type BlogTag,
} from "@/lib/api/blog.api";
import { getErrorMessage } from "@/lib/api/errors";

export const adminBlogTagsQueryKey = ["admin", "blog", "tags"] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

type TagFormState = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
};

const emptyForm: TagFormState = {
  name: "",
  slug: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  isActive: true,
};

function formFromTag(tag: BlogTag): TagFormState {
  return {
    name: tag.name,
    slug: tag.slug,
    description: tag.description || "",
    seoTitle: tag.seoTitle || "",
    seoDescription: tag.seoDescription || "",
    isActive: tag.isActive !== false,
  };
}

function formToBody(form: TagFormState): AdminBlogTagBody {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim() || null,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
    isActive: form.isActive,
  };
}

export function AdminBlogTagsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogTag | null>(null);
  const [form, setForm] = useState<TagFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const tagsQuery = useQuery({
    queryKey: adminBlogTagsQueryKey,
    queryFn: () => listAdminBlogTags({ includeInactive: true }),
  });

  const rows = useMemo(() => {
    const list = [...(tagsQuery.data ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const q = search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((tag) =>
      [tag.name, tag.slug, tag.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [tagsQuery.data, search]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }
    if (editing) {
      setForm(formFromTag(editing));
      setSlugTouched(true);
      return;
    }
    setForm(emptyForm);
    setSlugTouched(false);
  }, [dialogOpen, editing]);

  async function invalidateTagQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminBlogTagsQueryKey }),
      queryClient.invalidateQueries({ queryKey: adminBlogQueryKey }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = formToBody(form);
      if (!body.name) {
        throw new Error("Name is required.");
      }
      if (editing) {
        return updateAdminBlogTag(editing.id, body);
      }
      return createAdminBlogTag(body);
    },
    onSuccess: async (_data, _vars, context) => {
      void context;
      await invalidateTagQueries();
      const wasEdit = Boolean(editing);
      setDialogOpen(false);
      setEditing(null);
      toast.success(wasEdit ? "Tag updated" : "Tag created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save tag"));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminBlogTag(id, { isActive }),
    onSuccess: async (_tag, { isActive }) => {
      await invalidateTagQueries();
      toast.success(isActive ? "Tag activated" : "Tag deactivated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update tag"));
    },
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(tag: BlogTag) {
    setEditing(tag);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/blog" className="hover:underline">
              Blog
            </Link>
            <span aria-hidden> / </span>
            Tags
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Blog tags
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create SEO tags here, then assign them on each post. Public pages:
            `/tag/[slug]`.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          New tag
        </Button>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search name or slug…"
        className="max-w-sm"
      />

      {tagsQuery.isLoading ? <Skeleton className="h-48 w-full" /> : null}

      {tagsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(tagsQuery.error, "Could not load blog tags")}
        </p>
      ) : null}

      {tagsQuery.data ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No tags yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((tag) => {
                const active = tag.isActive !== false;
                return (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      /tag/{tag.slug}
                    </TableCell>
                    <TableCell>{tag.postCount ?? 0}</TableCell>
                    <TableCell>
                      {active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(tag)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={toggleActiveMutation.isPending}
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: tag.id,
                              isActive: !active,
                            })
                          }
                        >
                          {active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit tag" : "New tag"}</DialogTitle>
            <DialogDescription>
              Tags power public `/tag/[slug]` SEO pages and post grouping.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: slugTouched ? current.slug : slugify(name),
                  }));
                }}
                placeholder="Live Rosin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-slug">Slug</Label>
              <Input
                id="tag-slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setForm((current) => ({
                    ...current,
                    slug: slugify(event.target.value),
                  }));
                }}
                placeholder="live-rosin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-description">Description</Label>
              <Textarea
                id="tag-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-seo-title">SEO title</Label>
              <Input
                id="tag-seo-title"
                value={form.seoTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    seoTitle: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-seo-description">SEO description</Label>
              <Textarea
                id="tag-seo-description"
                value={form.seoDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    seoDescription: event.target.value,
                  }))
                }
                rows={2}
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending || !form.name.trim()}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
