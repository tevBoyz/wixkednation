"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoldIcon,
  CopyIcon,
  ItalicIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isAllowedProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
  uploadAdminBlogMediaWithProgress,
} from "@/lib/api/admin/blog-image-upload";
import { getErrorMessage } from "@/lib/api/errors";
import {
  ADDABLE_BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  createBlockId,
  emptyBlock,
  normalizeVideoSrc,
  type BlogBlockType,
  type BlogEditorBlock,
} from "@/lib/blog/blog-blocks";
import {
  formatImageByteSize,
  prepareProductImageForUpload,
  PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES,
} from "@/lib/catalog/compress-product-image";
import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";
import { cn } from "@/lib/utils";

type UploadPhase = "idle" | "compressing" | "uploading" | "ready" | "error";

type BlogBlockStackEditorProps = {
  postId: string;
  blocks: BlogEditorBlock[];
  onChange: (blocks: BlogEditorBlock[]) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  className?: string;
};

function BlockShell({
  label,
  index,
  total,
  disabled,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  children,
}: {
  label: string;
  index: number;
  total: number;
  disabled?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="min-h-9 min-w-9"
            aria-label="Move up"
            disabled={disabled || index === 0}
            onClick={onMoveUp}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="min-h-9 min-w-9"
            aria-label="Move down"
            disabled={disabled || index >= total - 1}
            onClick={onMoveDown}
          >
            <ArrowDownIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="min-h-9 min-w-9"
            aria-label="Duplicate block"
            disabled={disabled}
            onClick={onDuplicate}
          >
            <CopyIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="min-h-9 min-w-9 text-destructive hover:text-destructive"
            aria-label="Remove block"
            disabled={disabled || total <= 1}
            onClick={onRemove}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-3 p-3 sm:p-4">{children}</div>
    </div>
  );
}

function ParagraphBlockEditor({
  content,
  disabled,
  onChange,
}: {
  content: JSONContent[];
  disabled?: boolean;
  onChange: (content: JSONContent[]) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Write a paragraph…",
      }),
    ],
    content: {
      type: "doc",
      content: [{ type: "paragraph", content }],
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "min-h-[4.5rem] max-w-none px-2 py-2 text-base leading-relaxed focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      const doc = current.getJSON();
      const paragraph = doc.content?.[0];
      onChange(
        paragraph?.type === "paragraph" && Array.isArray(paragraph.content)
          ? paragraph.content
          : [],
      );
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = JSON.stringify(editor.getJSON().content?.[0]?.content || []);
    const next = JSON.stringify(content);
    if (current === next) {
      return;
    }
    editor.commands.setContent(
      { type: "doc", content: [{ type: "paragraph", content }] },
      { emitUpdate: false },
    );
  }, [content, editor]);

  if (!editor) {
    return (
      <p className="text-sm text-muted-foreground">Loading text editor…</p>
    );
  }

  const ed = editor;

  function setLink() {
    const previous = ed.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) {
      return;
    }
    if (url === "") {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-1.5">
        <Button
          type="button"
          size="icon-sm"
          variant={ed.isActive("bold") ? "default" : "ghost"}
          className="min-h-9 min-w-9"
          aria-label="Bold"
          disabled={disabled}
          onClick={() => ed.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={ed.isActive("italic") ? "default" : "ghost"}
          className="min-h-9 min-w-9"
          aria-label="Italic"
          disabled={disabled}
          onClick={() => ed.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={ed.isActive("link") ? "default" : "ghost"}
          className="min-h-9 min-w-9"
          aria-label="Link"
          disabled={disabled}
          onClick={setLink}
        >
          <LinkIcon className="size-4" />
        </Button>
      </div>
      <EditorContent editor={ed} />
    </div>
  );
}

function UploadProgressBar({
  phase,
  progress,
  readyUrl,
}: {
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
        <span className="font-medium text-foreground">Image upload</span>
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
          Bucket URL ready for this block:
          <br />
          <span className="text-foreground/80">{readyUrl}</span>
        </p>
      ) : null}
    </div>
  );
}

function ImageBlockEditor({
  postId,
  src,
  alt,
  disabled,
  onChange,
  onBusyChange,
}: {
  postId: string;
  src: string;
  alt: string;
  disabled?: boolean;
  onChange: (next: { src: string; alt: string }) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onBusyChangeRef = useRef(onBusyChange);
  const [phase, setPhase] = useState<UploadPhase>(src ? "ready" : "idle");
  const [progress, setProgress] = useState<number | null>(null);

  onBusyChangeRef.current = onBusyChange;

  useEffect(() => {
    if (src) {
      setPhase((prev) => (prev === "ready" ? prev : "ready"));
    }
  }, [src]);

  useEffect(() => {
    const busy = phase === "compressing" || phase === "uploading";
    onBusyChangeRef.current?.(busy);
  }, [phase]);

  const displayUrl = resolveCatalogAssetUrl(src) || src || null;

  async function onFileSelected(file: File | null) {
    if (!file) {
      return;
    }
    if (!isAllowedProductImageFile(file)) {
      toast.error("Use a JPG, PNG, WebP, or GIF image.");
      return;
    }

    setPhase("compressing");
    setProgress(null);
    try {
      const prepared = await prepareProductImageForUpload(file);
      if (prepared.compressed) {
        toast.info(
          `Compressed ${formatImageByteSize(prepared.originalSize)} → ${formatImageByteSize(prepared.finalSize)}`,
        );
      }
      setPhase("uploading");
      setProgress(0);
      const media = await uploadAdminBlogMediaWithProgress(
        postId,
        prepared.file,
        {
          onProgress: setProgress,
          alt: alt.trim() || undefined,
        },
      );
      const url = resolveCatalogAssetUrl(media.url) || media.url || "";
      if (!url) {
        setPhase("error");
        toast.error("Upload succeeded but no image URL was returned.");
        return;
      }
      onChange({ src: url, alt });
      setPhase("ready");
      setProgress(100);
      toast.success("Image uploaded — URL ready for this block");
    } catch (error) {
      setPhase("error");
      toast.error(getErrorMessage(error, "Image upload failed"));
    } finally {
      setProgress(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Files over {formatImageByteSize(PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES)}{" "}
        compress to ≤1MB, then upload to storage. The bucket URL is saved on
        this block.
      </p>
      <Input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        disabled={disabled || phase === "compressing" || phase === "uploading"}
        onChange={(event) => {
          void onFileSelected(event.target.files?.[0] ?? null);
        }}
      />
      <UploadProgressBar
        phase={phase}
        progress={progress}
        readyUrl={displayUrl}
      />
      <div className="space-y-2">
        <Label>Alt text</Label>
        <Input
          value={alt}
          disabled={disabled}
          placeholder="Describe the image"
          onChange={(event) => onChange({ src, alt: event.target.value })}
        />
      </div>
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={alt || ""}
          className="max-h-56 w-full rounded-lg border border-border object-contain"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          No image yet — upload to get a storage URL.
        </div>
      )}
    </div>
  );
}

function ListBlockEditor({
  items,
  ordered,
  disabled,
  onChange,
}: {
  items: string[];
  ordered?: boolean;
  disabled?: boolean;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        One list item per line ({ordered ? "numbered" : "bulleted"}).
      </p>
      <Textarea
        value={items.join("\n")}
        disabled={disabled}
        rows={Math.min(10, Math.max(3, items.length + 1))}
        placeholder={ordered ? "First item\nSecond item" : "Item one\nItem two"}
        onChange={(event) => {
          const next = event.target.value.split("\n");
          onChange(next.length ? next : [""]);
        }}
      />
    </div>
  );
}

function VideoPreview({ src }: { src: string }) {
  const normalized = normalizeVideoSrc(src);
  if (!normalized) {
    return null;
  }

  let embed = "";
  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) {
        embed = `https://www.youtube.com/embed/${id}`;
      }
    } else if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "");
      if (id) {
        embed = `https://www.youtube.com/embed/${id}`;
      }
    } else if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id) {
        embed = `https://player.vimeo.com/video/${id}`;
      }
    } else if (host === "player.vimeo.com") {
      embed = normalized;
    } else if (normalized.includes("/embed/")) {
      embed = normalized;
    }
  } catch {
    return null;
  }

  if (!embed) {
    return null;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
      <iframe
        src={embed}
        title="Video preview"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function BlogBlockStackEditor({
  postId,
  blocks,
  onChange,
  onBusyChange,
  disabled,
  className,
}: BlogBlockStackEditorProps) {
  const [imageBusyIds, setImageBusyIds] = useState<Record<string, boolean>>({});

  const anyImageBusy = Object.values(imageBusyIds).some(Boolean);
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;

  useEffect(() => {
    onBusyChangeRef.current?.(anyImageBusy);
  }, [anyImageBusy]);

  function setBlockBusy(blockId: string, busy: boolean) {
    setImageBusyIds((prev) => {
      if (Boolean(prev[blockId]) === busy) {
        return prev;
      }
      if (!busy) {
        if (!(blockId in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[blockId];
        return next;
      }
      return { ...prev, [blockId]: true };
    });
  }

  function updateBlock(id: string, next: BlogEditorBlock) {
    onChange(blocks.map((block) => (block.id === id ? next : block)));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) {
      return;
    }
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function duplicateBlock(index: number) {
    const source = blocks[index];
    if (!source) {
      return;
    }
    const copy: BlogEditorBlock = {
      ...structuredClone(source),
      id: createBlockId(),
    };
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  function removeBlock(index: number) {
    if (blocks.length <= 1) {
      return;
    }
    onChange(blocks.filter((_, i) => i !== index));
  }

  function addBlock(type: BlogBlockType, afterIndex?: number) {
    const block = emptyBlock(type);
    if (afterIndex === undefined || afterIndex < 0) {
      onChange([...blocks, block]);
      return;
    }
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, block);
    onChange(next);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, index) => (
        <BlockShell
          key={block.id}
          label={BLOCK_TYPE_LABELS[block.type]}
          index={index}
          total={blocks.length}
          disabled={disabled}
          onMoveUp={() => moveBlock(index, -1)}
          onMoveDown={() => moveBlock(index, 1)}
          onDuplicate={() => duplicateBlock(index)}
          onRemove={() => removeBlock(index)}
        >
          {block.type === "paragraph" ? (
            <ParagraphBlockEditor
              content={block.content}
              disabled={disabled}
              onChange={(content) =>
                updateBlock(block.id, { ...block, content })
              }
            />
          ) : null}

          {block.type === "heading" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="min-h-10"
                  variant={block.level === 2 ? "default" : "outline"}
                  disabled={disabled}
                  onClick={() => updateBlock(block.id, { ...block, level: 2 })}
                >
                  H2
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-10"
                  variant={block.level === 3 ? "default" : "outline"}
                  disabled={disabled}
                  onClick={() => updateBlock(block.id, { ...block, level: 3 })}
                >
                  H3
                </Button>
              </div>
              <Input
                value={block.text}
                disabled={disabled}
                placeholder="Heading text"
                onChange={(event) =>
                  updateBlock(block.id, {
                    ...block,
                    text: event.target.value,
                  })
                }
              />
            </div>
          ) : null}

          {block.type === "image" ? (
            <ImageBlockEditor
              postId={postId}
              src={block.src}
              alt={block.alt}
              disabled={disabled}
              onBusyChange={(busy) => setBlockBusy(block.id, busy)}
              onChange={({ src, alt }) =>
                updateBlock(block.id, { ...block, src, alt })
              }
            />
          ) : null}

          {block.type === "video" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>YouTube or Vimeo URL</Label>
                <Input
                  value={block.src}
                  disabled={disabled}
                  placeholder="https://www.youtube.com/watch?v=…"
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block,
                      src: event.target.value,
                    })
                  }
                />
              </div>
              <VideoPreview src={block.src} />
            </div>
          ) : null}

          {block.type === "quote" ? (
            <Textarea
              value={block.text}
              disabled={disabled}
              rows={4}
              placeholder="Quote text"
              onChange={(event) =>
                updateBlock(block.id, { ...block, text: event.target.value })
              }
            />
          ) : null}

          {block.type === "bulletList" || block.type === "orderedList" ? (
            <ListBlockEditor
              items={block.items}
              ordered={block.type === "orderedList"}
              disabled={disabled}
              onChange={(items) => updateBlock(block.id, { ...block, items })}
            />
          ) : null}

          {block.type === "divider" ? (
            <div className="py-4">
              <hr className="border-border" />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Divider — no content needed
              </p>
            </div>
          ) : null}

          <div className="pt-1">
            <AddBlockMenu
              disabled={disabled}
              onAdd={(type) => addBlock(type, index)}
              label="Add below"
            />
          </div>
        </BlockShell>
      ))}

      <AddBlockMenu
        disabled={disabled}
        onAdd={(type) => addBlock(type)}
        label="Add block"
        emphasize
      />
    </div>
  );
}

function AddBlockMenu({
  onAdd,
  disabled,
  label,
  emphasize,
}: {
  onAdd: (type: BlogBlockType) => void;
  disabled?: boolean;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: emphasize ? "default" : "outline" }),
          "min-h-11 w-full gap-1.5 sm:w-auto",
        )}
      >
        <PlusIcon className="size-4" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        {ADDABLE_BLOCK_TYPES.map((type) => (
          <DropdownMenuItem
            key={type}
            className="min-h-10"
            onClick={() => onAdd(type)}
          >
            {BLOCK_TYPE_LABELS[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { EMPTY_DOC } from "@/lib/blog/blog-blocks";
