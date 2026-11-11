"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

import { BlogBlockStackEditor } from "@/components/admin/blog/blog-block-editor";
import { adminBlogQueryKey } from "@/components/admin/blog/admin-blog-list-client";
import { BlogPostBody, sanitizeBlogHtml } from "@/components/blog/blog-post-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAdminBlogPost,
  listAdminBlogTags,
  updateAdminBlogPost,
  type AdminBlogBody,
  type BlogPostStatus,
} from "@/lib/api/blog.api";
import {
  isAllowedProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
  uploadAdminBlogCoverWithProgress,
} from "@/lib/api/admin/blog-image-upload";
import { getErrorMessage } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/token-storage";
import {
  blocksHaveContent,
  blocksToHtml,
  blocksToTipTapDoc,
  emptyBlock,
  htmlToBlocks,
  tipTapDocToBlocks,
  type BlogEditorBlock,
} from "@/lib/blog/blog-blocks";
import {
  formatImageByteSize,
  prepareProductImageForUpload,
  PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES,
} from "@/lib/catalog/compress-product-image";
import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";
import { getPublicEnv } from "@/config/env";
import { SITE_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";

type AdminBlogEditorClientProps = {
  postId: string;
};

type UploadPhase = "idle" | "compressing" | "uploading" | "ready" | "error";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

type EditorSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  showOnHomepage: boolean;
  status: BlogPostStatus;
  tagIds: string[];
  bodyJson: ReturnType<typeof blocksToTipTapDoc>;
  bodyHtml: string;
};

function buildEditorSnapshot(input: {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  showOnHomepage: boolean;
  status: BlogPostStatus;
  tagIds: string[];
  blocks: BlogEditorBlock[];
}): EditorSnapshot {
  const bodyJson = blocksToTipTapDoc(input.blocks);
  return {
    title: input.title.trim() || "Untitled post",
    slug: input.slug.trim(),
    excerpt: input.excerpt.trim(),
    seoTitle: input.seoTitle.trim(),
    seoDescription: input.seoDescription.trim(),
    authorName: input.authorName.trim(),
    showOnHomepage: input.showOnHomepage,
    status: input.status,
    tagIds: [...input.tagIds].sort(),
    bodyJson,
    bodyHtml: sanitizeBlogHtml(blocksToHtml(input.blocks)),
  };
}

function snapshotKey(snapshot: EditorSnapshot): string {
  return JSON.stringify(snapshot);
}

function snapshotToBody(
  snapshot: EditorSnapshot,
  statusOverride?: BlogPostStatus,
): AdminBlogBody {
  return {
    title: snapshot.title,
    slug: snapshot.slug || undefined,
    excerpt: snapshot.excerpt || null,
    seoTitle: snapshot.seoTitle || null,
    seoDescription: snapshot.seoDescription || null,
    authorName: snapshot.authorName || null,
    showOnHomepage: snapshot.showOnHomepage,
    status: statusOverride ?? snapshot.status,
    tagIds: snapshot.tagIds,
    bodyJson: snapshot.bodyJson,
    bodyHtml: snapshot.bodyHtml,
  };
}

/** Best-effort PATCH that can finish during tab close / client navigation. */
function keepalivePatchBlogPost(postId: string, body: AdminBlogBody): void {
  try {
    const { apiUrl } = getPublicEnv();
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    void fetch(`${apiUrl}/api/admin/blog/${postId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // Leave-path saves are best-effort.
  }
}

function UploadProgressBar({
  label,
  phase,
  progress,
  readyUrl,
}: {
  label: string;
  phase: UploadPhase;
  progress: number | null;
  readyUrl?: string | null;
}) {
  if (phase === "idle") {
    return null;
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {phase === "compressing"
            ? "Compressing…"
            : phase === "uploading"
              ? `${progress ?? 0}%`
              : phase === "ready"
                ? "Ready in storage"
                : "Failed"}
        </span>
      </div>
      {(phase === "compressing" || phase === "uploading") && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-[width] duration-150",
              phase === "compressing" && "w-1/3 animate-pulse",
            )}
            style={
              phase === "uploading"
                ? { width: `${Math.max(4, progress ?? 0)}%` }
                : undefined
            }
          />
        </div>
      )}
      {phase === "ready" && readyUrl ? (
        <p className="break-all text-[11px] leading-snug text-muted-foreground">
          Bucket URL ready to save with the post:
          <br />
          <span className="text-foreground/80">{readyUrl}</span>
        </p>
      ) : null}
    </div>
  );
}

export function AdminBlogEditorClient({ postId }: AdminBlogEditorClientProps) {
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const postQuery = useQuery({
    queryKey: [...adminBlogQueryKey, "detail", postId],
    queryFn: () => fetchAdminBlogPost(postId),
  });

  const tagsQuery = useQuery({
    queryKey: [...adminBlogQueryKey, "tags"],
    queryFn: () => listAdminBlogTags({ includeInactive: false }),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showOnHomepage, setShowOnHomepage] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState("");
  const [status, setStatus] = useState<BlogPostStatus>("draft");
  const [blocks, setBlocks] = useState<BlogEditorBlock[]>([
    emptyBlock("paragraph"),
  ]);
  const [htmlPaste, setHtmlPaste] = useState("");
  const [editorTab, setEditorTab] = useState<"blocks" | "import">("blocks");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [blocksBusy, setBlocksBusy] = useState(false);

  const [coverPhase, setCoverPhase] = useState<UploadPhase>("idle");
  const [coverProgress, setCoverProgress] = useState<number | null>(null);

  const savedSnapshotKeyRef = useRef<string | null>(null);
  const latestSnapshotRef = useRef<EditorSnapshot | null>(null);
  const dirtyRef = useRef(false);
  const autosaveInFlightRef = useRef(false);
  const hydratedRef = useRef(false);
  const htmlPasteRef = useRef("");

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    htmlPasteRef.current = htmlPaste;
  }, [htmlPaste]);

  useEffect(() => {
    if (!postQuery.data || hydrated) {
      return;
    }
    const post = postQuery.data;
    const nextTitle = post.title === "Untitled post" ? "" : post.title;
    const nextSlug = post.slug.startsWith("untitled-post") ? "" : post.slug;
    const storedHtml = (post.bodyHtml || "").trim();
    const htmlLooksEmpty =
      !storedHtml ||
      storedHtml === "<p></p>" ||
      storedHtml === "<p><br></p>" ||
      storedHtml === "<p><br /></p>";
    let nextBlocks = tipTapDocToBlocks(
      post.bodyJson as Record<string, unknown>,
    );
    // bodyHtml can be the source of truth when bodyJson is empty (e.g. seeded HTML).
    // Without this, empty blocks autosave and wipe the HTML.
    if (!blocksHaveContent(nextBlocks) && !htmlLooksEmpty) {
      nextBlocks = htmlToBlocks(storedHtml);
    }
    setTitle(nextTitle);
    setSlug(nextSlug);
    setSlugTouched(!post.slug.startsWith("untitled-post"));
    setExcerpt(post.excerpt || "");
    setSeoTitle(post.seoTitle || "");
    setSeoDescription(post.seoDescription || "");
    setAuthorName(post.authorName || "");
    setShowOnHomepage(Boolean(post.showOnHomepage));
    setTagIds((post.tags ?? []).map((tag) => tag.id));
    setStatus(post.status);
    setBlocks(nextBlocks);
    setHtmlPaste(storedHtml || blocksToHtml(nextBlocks));
    const resolved =
      resolveCatalogAssetUrl(post.coverImageUrl) ||
      resolveCatalogAssetUrl(post.coverImagePath) ||
      null;
    setCoverUrl(resolved);
    if (resolved) {
      setCoverPhase("ready");
    }

    const baseline = buildEditorSnapshot({
      title: nextTitle,
      slug: nextSlug,
      excerpt: post.excerpt || "",
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      authorName: post.authorName || "",
      showOnHomepage: Boolean(post.showOnHomepage),
      status: post.status,
      tagIds: (post.tags ?? []).map((tag) => tag.id),
      blocks: nextBlocks,
    });
    latestSnapshotRef.current = baseline;
    savedSnapshotKeyRef.current = snapshotKey(baseline);
    dirtyRef.current = false;
    setHydrated(true);
  }, [postQuery.data, hydrated]);

  const previewHtml = useMemo(
    () => sanitizeBlogHtml(blocksToHtml(blocks)),
    [blocks],
  );

  const previewCover = useMemo(
    () => resolveCatalogAssetUrl(coverUrl),
    [coverUrl],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const snapshot = buildEditorSnapshot({
      title,
      slug,
      excerpt,
      seoTitle,
      seoDescription,
      authorName,
      showOnHomepage,
      status,
      tagIds,
      blocks,
    });
    latestSnapshotRef.current = snapshot;
    dirtyRef.current =
      savedSnapshotKeyRef.current !== null &&
      snapshotKey(snapshot) !== savedSnapshotKeyRef.current;
  }, [
    hydrated,
    title,
    slug,
    excerpt,
    seoTitle,
    seoDescription,
    authorName,
    showOnHomepage,
    status,
    tagIds,
    blocks,
  ]);

  function markSnapshotSaved(snapshot: EditorSnapshot) {
    latestSnapshotRef.current = snapshot;
    savedSnapshotKeyRef.current = snapshotKey(snapshot);
    dirtyRef.current = false;
  }

  /** Persist current editor state when leaving without an explicit save. */
  function flushAutosaveDraft() {
    if (
      !hydratedRef.current ||
      !dirtyRef.current ||
      autosaveInFlightRef.current
    ) {
      return;
    }
    let snapshot = latestSnapshotRef.current;
    if (!snapshot) {
      return;
    }

    // Never let empty blocks overwrite a non-empty HTML paste on leave-autosave.
    const html = (htmlPasteRef.current || "").trim();
    const htmlLooksEmpty =
      !html ||
      html === "<p></p>" ||
      html === "<p><br></p>" ||
      html === "<p><br /></p>";
    if (!blocksHaveContent(tipTapDocToBlocks(snapshot.bodyJson)) && !htmlLooksEmpty) {
      const recovered = htmlToBlocks(html);
      snapshot = {
        ...snapshot,
        bodyJson: blocksToTipTapDoc(recovered),
        bodyHtml: sanitizeBlogHtml(blocksToHtml(recovered)),
      };
    }

    dirtyRef.current = false;
    autosaveInFlightRef.current = true;
    // Unpublished work is always stored as draft. Published stays published so
    // leave-autosave does not silently unpublish.
    const nextStatus: BlogPostStatus =
      snapshot.status === "published" ? "published" : "draft";
    const body = snapshotToBody(snapshot, nextStatus);
    markSnapshotSaved({ ...snapshot, status: nextStatus });
    keepalivePatchBlogPost(postId, body);
    void queryClient.invalidateQueries({ queryKey: adminBlogQueryKey });
    autosaveInFlightRef.current = false;
  }

  useEffect(() => {
    const onPageHide = () => {
      flushAutosaveDraft();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushAutosaveDraft();
      }
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      flushAutosaveDraft();
    };
    // Intentionally postId-only: flush reads latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const coverBusy =
    coverPhase === "compressing" || coverPhase === "uploading";
  const imageBusy = coverBusy || blocksBusy;
  const saveMutation = useMutation({
    mutationFn: async (nextStatus?: BlogPostStatus) => {
      const snapshot = buildEditorSnapshot({
        title,
        slug,
        excerpt,
        seoTitle,
        seoDescription,
        authorName,
        showOnHomepage,
        status: nextStatus || status,
        tagIds,
        blocks,
      });
      const post = await updateAdminBlogPost(
        postId,
        snapshotToBody(snapshot, nextStatus || status),
      );
      return { post, snapshot };
    },
    onSuccess: async ({ post, snapshot }, nextStatus) => {
      markSnapshotSaved({
        ...snapshot,
        status: post.status,
        title: post.title || snapshot.title,
        slug: post.slug || snapshot.slug,
        bodyHtml: post.bodyHtml || snapshot.bodyHtml,
      });
      toast.success(
        nextStatus === "published"
          ? "Post published"
          : nextStatus === "draft" && status === "published"
            ? "Post unpublished"
            : "Draft saved",
      );
      await queryClient.invalidateQueries({ queryKey: adminBlogQueryKey });
      setStatus(post.status);
      if (Array.isArray(post.tags)) {
        setTagIds(post.tags.map((tag) => tag.id));
      }
      setCoverUrl(
        resolveCatalogAssetUrl(post.coverImageUrl) ||
          resolveCatalogAssetUrl(post.coverImagePath) ||
          coverUrl,
      );
      if (post.bodyHtml) {
        setHtmlPaste(post.bodyHtml);
      }
      if (post.title && !title.trim()) {
        setTitle(post.title === "Untitled post" ? "" : post.title);
      }
      if (post.slug) {
        setSlug(post.slug);
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save post"));
    },
  });

  async function onCoverSelected(file: File | null) {
    if (!file) {
      return;
    }
    if (!isAllowedProductImageFile(file)) {
      toast.error("Use a JPG, PNG, WebP, or GIF image.");
      return;
    }

    setCoverPhase("compressing");
    setCoverProgress(null);
    try {
      const prepared = await prepareProductImageForUpload(file);
      if (prepared.compressed) {
        toast.info(
          `Compressed ${formatImageByteSize(prepared.originalSize)} → ${formatImageByteSize(prepared.finalSize)}`,
        );
      }
      setCoverPhase("uploading");
      setCoverProgress(0);
      const post = await uploadAdminBlogCoverWithProgress(
        postId,
        prepared.file,
        { onProgress: setCoverProgress },
      );
      const url =
        resolveCatalogAssetUrl(post.coverImageUrl) ||
        resolveCatalogAssetUrl(post.coverImagePath) ||
        null;
      setCoverUrl(url);
      setCoverPhase("ready");
      setCoverProgress(100);
      toast.success("Cover uploaded to storage");
      await queryClient.invalidateQueries({
        queryKey: [...adminBlogQueryKey, "detail", postId],
      });
    } catch (error) {
      setCoverPhase("error");
      toast.error(getErrorMessage(error, "Cover upload failed"));
    } finally {
      setCoverProgress(null);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  }

  function importHtmlToBlocks() {
    const clean = sanitizeBlogHtml(htmlPaste);
    if (!clean.trim()) {
      toast.error("Paste some HTML first.");
      return;
    }
    const next = htmlToBlocks(clean);
    setBlocks(next);
    toast.success("HTML imported as blocks");
    setEditorTab("blocks");
  }

  if (postQuery.isLoading || !hydrated) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (postQuery.isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {getErrorMessage(postQuery.error, "Could not load post")}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/blog" className="hover:underline">
              Blog
            </Link>
            <span aria-hidden> / </span>
            Edit
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Edit blog post
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add text, image, video, and other blocks as separate containers.
            Images compress to ≤1MB and upload while you write. Unsaved changes
            autosave as a draft when you leave this page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={saveMutation.isPending || imageBusy}
            onClick={() => {
              setStatus("draft");
              saveMutation.mutate("draft");
            }}
          >
            Save draft
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={saveMutation.isPending || imageBusy}
            onClick={() => {
              setStatus("published");
              saveMutation.mutate("published");
            }}
          >
            Publish
          </Button>
          {status === "published" ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              disabled={saveMutation.isPending || imageBusy}
              onClick={() => saveMutation.mutate("draft")}
            >
              Unpublish
            </Button>
          ) : null}
          <Button
            render={<Link href="/admin/blog" />}
            nativeButton={false}
            variant="ghost"
            className="min-h-11"
            aria-label="Close and return to blog list"
          >
            <XIcon className="size-4" />
            Close
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-4 rounded-xl border border-border p-4 sm:p-5">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  if (!slugTouched) {
                    setSlug(slugify(next));
                  }
                }}
                placeholder="Weed delivery in north Virginia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-slug">Slug</Label>
              <Input
                id="blog-slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blog-seo-title">SEO title</Label>
                <Input
                  id="blog-seo-title"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-author">Author</Label>
                <Input
                  id="blog-author"
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  placeholder={SITE_NAME}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-seo-description">SEO description</Label>
              <Textarea
                id="blog-seo-description"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                rows={2}
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={showOnHomepage}
                onChange={(event) => setShowOnHomepage(event.target.checked)}
              />
              Show on homepage
            </label>

            <div className="space-y-2">
              <Label htmlFor="blog-tag-filter">Tags</Label>
              <p className="text-xs text-muted-foreground">
                Assign SEO tags for public `/tag/[slug]` pages. Selected:{" "}
                {tagIds.length}.{" "}
                <Link
                  href="/admin/blog/tags"
                  className="underline-offset-4 hover:underline"
                >
                  Manage tags
                </Link>
              </p>
              <Input
                id="blog-tag-filter"
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                placeholder="Filter tags…"
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {tagsQuery.isLoading ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    Loading tags…
                  </p>
                ) : null}
                {tagsQuery.isError ? (
                  <p className="px-1 py-2 text-xs text-destructive" role="alert">
                    Could not load tags
                  </p>
                ) : null}
                {(tagsQuery.data ?? [])
                  .filter((tag) => {
                    const q = tagFilter.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      tag.name.toLowerCase().includes(q) ||
                      tag.slug.toLowerCase().includes(q)
                    );
                  })
                  .map((tag) => {
                    const checked = tagIds.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          className="size-4 shrink-0"
                          checked={checked}
                          onChange={() => {
                            setTagIds((current) =>
                              checked
                                ? current.filter((id) => id !== tag.id)
                                : [...current, tag.id],
                            );
                          }}
                        />
                        <span className="min-w-0 truncate">{tag.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-cover">Cover image</Label>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP, or GIF. Files over{" "}
                {formatImageByteSize(PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES)}{" "}
                are compressed to ≤1MB before upload.
              </p>
              <Input
                ref={coverInputRef}
                id="blog-cover"
                type="file"
                accept={PRODUCT_IMAGE_ACCEPT}
                disabled={coverBusy || saveMutation.isPending}
                onChange={(event) => {
                  void onCoverSelected(event.target.files?.[0] ?? null);
                }}
              />
              <UploadProgressBar
                label="Cover upload"
                phase={coverPhase}
                progress={coverProgress}
                readyUrl={previewCover}
              />
              {previewCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewCover}
                  alt=""
                  className="mt-2 max-h-40 w-full rounded-lg border border-border object-cover"
                />
              ) : null}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="min-h-10"
                variant={editorTab === "blocks" ? "default" : "outline"}
                onClick={() => setEditorTab("blocks")}
              >
                Blocks
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-10"
                variant={editorTab === "import" ? "default" : "outline"}
                onClick={() => setEditorTab("import")}
              >
                Import HTML
              </Button>
            </div>

            <div className={cn(editorTab !== "blocks" && "hidden")}>
              <BlogBlockStackEditor
                postId={postId}
                blocks={blocks}
                onChange={setBlocks}
                onBusyChange={setBlocksBusy}
                disabled={saveMutation.isPending}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Each block is its own container. On save they become one article
                on the public post page.
              </p>
            </div>

            <div className={cn("space-y-3", editorTab !== "import" && "hidden")}>
              <p className="text-xs text-muted-foreground">
                Paste HTML from another editor. Import converts it into discrete
                blocks (text, headings, images, lists, etc.).
              </p>
              <Textarea
                value={htmlPaste}
                onChange={(event) => setHtmlPaste(event.target.value)}
                rows={14}
                placeholder="Paste HTML from another editor…"
                className="font-mono text-xs sm:text-sm"
              />
              <Button
                type="button"
                className="min-h-11"
                onClick={importHtmlToBlocks}
              >
                Import HTML as blocks
              </Button>
            </div>
          </section>
        </div>

        <aside className="min-w-0 rounded-xl border border-border bg-muted/20 p-4 sm:p-5 lg:sticky lg:top-24 lg:self-start">
          <h3 className="text-sm font-semibold">Live preview</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Same renderer as the public post page.
          </p>
          <div className="mt-4 max-h-[70vh] overflow-y-auto overflow-x-clip rounded-lg border border-border bg-background py-4">
            <BlogPostBody
              title={title || "Untitled post"}
              excerpt={excerpt}
              bodyHtml={previewHtml}
              coverImageUrl={previewCover}
              authorName={authorName || SITE_NAME}
              compact
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
