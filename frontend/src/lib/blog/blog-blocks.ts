import type { JSONContent } from "@tiptap/react";

import { sanitizeBlogHtml } from "@/lib/blog/sanitize-blog-html";

export type BlogEditorBlock =
  | { id: string; type: "paragraph"; content: JSONContent[] }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "image"; src: string; alt: string }
  | { id: string; type: "video"; src: string }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "bulletList"; items: string[] }
  | { id: string; type: "orderedList"; items: string[] }
  | { id: string; type: "divider" };

export type BlogBlockType = BlogEditorBlock["type"];

export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function createBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyBlock(type: BlogBlockType): BlogEditorBlock {
  switch (type) {
    case "paragraph":
      return { id: createBlockId(), type: "paragraph", content: [] };
    case "heading":
      return { id: createBlockId(), type: "heading", level: 2, text: "" };
    case "image":
      return { id: createBlockId(), type: "image", src: "", alt: "" };
    case "video":
      return { id: createBlockId(), type: "video", src: "" };
    case "quote":
      return { id: createBlockId(), type: "quote", text: "" };
    case "bulletList":
      return { id: createBlockId(), type: "bulletList", items: [""] };
    case "orderedList":
      return { id: createBlockId(), type: "orderedList", items: [""] };
    case "divider":
      return { id: createBlockId(), type: "divider" };
  }
}

function textNode(text: string, marks?: JSONContent["marks"]): JSONContent {
  return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

function inlineToPlainText(nodes: JSONContent[] | undefined): string {
  if (!nodes?.length) {
    return "";
  }
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return node.text || "";
      }
      if (node.type === "hardBreak") {
        return "\n";
      }
      return inlineToPlainText(node.content);
    })
    .join("");
}

function listItemsFromNode(node: JSONContent): string[] {
  const items: string[] = [];
  for (const child of node.content || []) {
    if (child.type !== "listItem") {
      continue;
    }
    const parts: string[] = [];
    for (const inner of child.content || []) {
      if (inner.type === "paragraph") {
        parts.push(inlineToPlainText(inner.content));
      } else {
        parts.push(inlineToPlainText(inner.content));
      }
    }
    items.push(parts.join("\n").trim() || "");
  }
  return items.length ? items : [""];
}

function nodeToBlocks(node: JSONContent): BlogEditorBlock[] {
  if (!node || typeof node !== "object") {
    return [];
  }

  switch (node.type) {
    case "doc":
      return (node.content || []).flatMap(nodeToBlocks);
    case "paragraph":
      return [
        {
          id: createBlockId(),
          type: "paragraph",
          content: Array.isArray(node.content) ? node.content : [],
        },
      ];
    case "heading": {
      const level = Number(node.attrs?.level) === 3 ? 3 : 2;
      return [
        {
          id: createBlockId(),
          type: "heading",
          level,
          text: inlineToPlainText(node.content),
        },
      ];
    }
    case "image":
      return [
        {
          id: createBlockId(),
          type: "image",
          src: String(node.attrs?.src || ""),
          alt: String(node.attrs?.alt || ""),
        },
      ];
    case "youtube":
    case "iframe":
      return [
        {
          id: createBlockId(),
          type: "video",
          src: String(node.attrs?.src || ""),
        },
      ];
    case "blockquote": {
      const text = (node.content || [])
        .map((child) =>
          child.type === "paragraph"
            ? inlineToPlainText(child.content)
            : inlineToPlainText(child.content),
        )
        .filter(Boolean)
        .join("\n");
      return [{ id: createBlockId(), type: "quote", text }];
    }
    case "bulletList":
      return [
        {
          id: createBlockId(),
          type: "bulletList",
          items: listItemsFromNode(node),
        },
      ];
    case "orderedList":
      return [
        {
          id: createBlockId(),
          type: "orderedList",
          items: listItemsFromNode(node),
        },
      ];
    case "horizontalRule":
      return [{ id: createBlockId(), type: "divider" }];
    default:
      return (node.content || []).flatMap(nodeToBlocks);
  }
}

export function tipTapDocToBlocks(
  doc: JSONContent | Record<string, unknown> | null | undefined,
): BlogEditorBlock[] {
  if (!doc || typeof doc !== "object") {
    return [emptyBlock("paragraph")];
  }
  const blocks = nodeToBlocks(doc as JSONContent);
  return blocks.length ? blocks : [emptyBlock("paragraph")];
}

/** True when doc has no meaningful text/media (empty or placeholder paragraph). */
export function isEmptyTipTapDoc(
  doc: JSONContent | Record<string, unknown> | null | undefined,
): boolean {
  const blocks = tipTapDocToBlocks(doc);
  return !blocksHaveContent(blocks);
}

export function blocksHaveContent(blocks: BlogEditorBlock[]): boolean {
  return blocks.some((block) => {
    switch (block.type) {
      case "paragraph":
        return inlineToPlainText(block.content).trim().length > 0;
      case "heading":
      case "quote":
        return block.text.trim().length > 0;
      case "image":
      case "video":
        return block.src.trim().length > 0;
      case "bulletList":
      case "orderedList":
        return block.items.some((item) => item.trim().length > 0);
      case "divider":
        return true;
      default:
        return false;
    }
  });
}

function paragraphContentToNodes(content: JSONContent[]): JSONContent[] {
  if (!content.length) {
    return [];
  }
  return content;
}

function listToTipTap(
  type: "bulletList" | "orderedList",
  items: string[],
): JSONContent {
  const rows = items.length ? items : [""];
  return {
    type,
    content: rows.map((item) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: item ? [textNode(item)] : [],
        },
      ],
    })),
  };
}

export function normalizeVideoSrc(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/watch?v=${id}` : value;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/watch?v=${id}` : value;
      }
      const id = url.searchParams.get("v");
      if (id) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      return value;
    }
  } catch {
    // keep raw
  }

  return value;
}

export function blocksToTipTapDoc(blocks: BlogEditorBlock[]): JSONContent {
  const content: JSONContent[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        content.push({
          type: "paragraph",
          content: paragraphContentToNodes(block.content),
        });
        break;
      case "heading":
        content.push({
          type: "heading",
          attrs: { level: block.level },
          content: block.text ? [textNode(block.text)] : [],
        });
        break;
      case "image":
        if (block.src.trim()) {
          content.push({
            type: "image",
            attrs: { src: block.src.trim(), alt: block.alt || "" },
          });
        }
        break;
      case "video": {
        const src = normalizeVideoSrc(block.src);
        if (src) {
          content.push({
            type: "youtube",
            attrs: { src },
          });
        }
        break;
      }
      case "quote":
        content.push({
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: block.text ? [textNode(block.text)] : [],
            },
          ],
        });
        break;
      case "bulletList":
        content.push(listToTipTap("bulletList", block.items));
        break;
      case "orderedList":
        content.push(listToTipTap("orderedList", block.items));
        break;
      case "divider":
        content.push({ type: "horizontalRule" });
        break;
    }
  }

  return {
    type: "doc",
    content: content.length ? content : [{ type: "paragraph" }],
  };
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function marksToHtml(text: string, marks: JSONContent["marks"] = []): string {
  let html = escapeHtml(text);
  for (const mark of marks || []) {
    if (mark.type === "bold") {
      html = `<strong>${html}</strong>`;
    } else if (mark.type === "italic") {
      html = `<em>${html}</em>`;
    } else if (mark.type === "underline") {
      html = `<u>${html}</u>`;
    } else if (mark.type === "strike") {
      html = `<s>${html}</s>`;
    } else if (mark.type === "code") {
      html = `<code>${html}</code>`;
    } else if (mark.type === "link" && mark.attrs?.href) {
      const href = escapeHtml(String(mark.attrs.href));
      html = `<a href="${href}" rel="noopener noreferrer" target="_blank">${html}</a>`;
    }
  }
  return html;
}

function inlineToHtml(nodes: JSONContent[] | undefined): string {
  if (!nodes?.length) {
    return "";
  }
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return marksToHtml(node.text || "", node.marks);
      }
      if (node.type === "hardBreak") {
        return "<br />";
      }
      return "";
    })
    .join("");
}

function youtubeEmbedSrc(watchOrEmbed: string): string {
  const normalized = normalizeVideoSrc(watchOrEmbed);
  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (host === "player.vimeo.com") {
      return normalized;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }
  } catch {
    // fall through
  }
  return normalized;
}

/** Client preview HTML matching backend tipTapJsonToHtml shape. */
export function blocksToHtml(blocks: BlogEditorBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph": {
        const inner = inlineToHtml(block.content);
        parts.push(`<p>${inner || "<br />"}</p>`);
        break;
      }
      case "heading":
        parts.push(
          `<h${block.level}>${escapeHtml(block.text) || ""}</h${block.level}>`,
        );
        break;
      case "image":
        if (block.src.trim()) {
          parts.push(
            `<img src="${escapeHtml(block.src.trim())}" alt="${escapeHtml(block.alt || "")}" loading="lazy" />`,
          );
        }
        break;
      case "video": {
        const src = youtubeEmbedSrc(block.src);
        if (src) {
          parts.push(
            `<div class="aspect-video" data-youtube-video><iframe src="${escapeHtml(src)}" title="YouTube video" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`,
          );
        }
        break;
      }
      case "quote":
        parts.push(
          `<blockquote><p>${escapeHtml(block.text).replace(/\n/g, "<br />")}</p></blockquote>`,
        );
        break;
      case "bulletList":
        parts.push(
          `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        );
        break;
      case "orderedList":
        parts.push(
          `<ol>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`,
        );
        break;
      case "divider":
        parts.push("<hr />");
        break;
    }
  }

  return sanitizeBlogHtml(parts.join(""));
}

function domInlineToTipTap(node: Node): JSONContent[] {
  const out: JSONContent[] = [];

  const walk = (n: Node, marks: NonNullable<JSONContent["marks"]>) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent || "";
      if (text) {
        out.push(textNode(text, marks.length ? [...marks] : undefined));
      }
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const el = n as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "br") {
      out.push({ type: "hardBreak" });
      return;
    }

    const nextMarks = [...marks];
    if (tag === "strong" || tag === "b") {
      nextMarks.push({ type: "bold" });
    } else if (tag === "em" || tag === "i") {
      nextMarks.push({ type: "italic" });
    } else if (tag === "u") {
      nextMarks.push({ type: "underline" });
    } else if (tag === "s" || tag === "strike") {
      nextMarks.push({ type: "strike" });
    } else if (tag === "code") {
      nextMarks.push({ type: "code" });
    } else if (tag === "a" && el.getAttribute("href")) {
      nextMarks.push({
        type: "link",
        attrs: { href: el.getAttribute("href") },
      });
    }

    for (const child of Array.from(el.childNodes)) {
      walk(child, nextMarks);
    }
  };

  walk(node, []);
  return out;
}

function elementToBlocks(el: Element): BlogEditorBlock[] {
  const tag = el.tagName.toLowerCase();

  if (tag === "p") {
    return [
      {
        id: createBlockId(),
        type: "paragraph",
        content: Array.from(el.childNodes).flatMap((child) =>
          domInlineToTipTap(child),
        ),
      },
    ];
  }

  if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
    const level = tag === "h3" || tag === "h4" ? 3 : 2;
    return [
      {
        id: createBlockId(),
        type: "heading",
        level,
        text: (el.textContent || "").trim(),
      },
    ];
  }

  if (tag === "img") {
    return [
      {
        id: createBlockId(),
        type: "image",
        src: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "",
      },
    ];
  }

  if (tag === "figure") {
    const img = el.querySelector("img");
    if (img) {
      return [
        {
          id: createBlockId(),
          type: "image",
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "",
        },
      ];
    }
  }

  if (tag === "blockquote") {
    return [
      {
        id: createBlockId(),
        type: "quote",
        text: (el.textContent || "").trim(),
      },
    ];
  }

  if (tag === "ul" || tag === "ol") {
    const items = Array.from(el.querySelectorAll(":scope > li")).map(
      (li) => (li.textContent || "").trim(),
    );
    return [
      {
        id: createBlockId(),
        type: tag === "ul" ? "bulletList" : "orderedList",
        items: items.length ? items : [""],
      },
    ];
  }

  if (tag === "hr") {
    return [{ id: createBlockId(), type: "divider" }];
  }

  if (tag === "iframe") {
    const src = el.getAttribute("src") || "";
    if (src) {
      return [{ id: createBlockId(), type: "video", src }];
    }
  }

  if (tag === "div") {
    const iframe = el.querySelector("iframe");
    if (iframe?.getAttribute("src")) {
      return [
        {
          id: createBlockId(),
          type: "video",
          src: iframe.getAttribute("src") || "",
        },
      ];
    }
    return Array.from(el.children).flatMap((child) => elementToBlocks(child));
  }

  if (el.textContent?.trim()) {
    return [
      {
        id: createBlockId(),
        type: "paragraph",
        content: [textNode(el.textContent.trim())],
      },
    ];
  }

  return [];
}

/** Convert sanitized HTML into discrete editor blocks (browser-only). */
export function htmlToBlocks(html: string): BlogEditorBlock[] {
  const clean = sanitizeBlogHtml(html);
  if (!clean.trim()) {
    return [emptyBlock("paragraph")];
  }

  if (typeof DOMParser === "undefined") {
    return [
      {
        id: createBlockId(),
        type: "paragraph",
        content: [textNode(clean.replace(/<[^>]+>/g, " ").trim())],
      },
    ];
  }

  const doc = new DOMParser().parseFromString(
    `<div id="blog-html-root">${clean}</div>`,
    "text/html",
  );
  const root = doc.getElementById("blog-html-root");
  if (!root) {
    return [emptyBlock("paragraph")];
  }

  const blocks = Array.from(root.children).flatMap((child) =>
    elementToBlocks(child),
  );

  if (!blocks.length && root.textContent?.trim()) {
    return [
      {
        id: createBlockId(),
        type: "paragraph",
        content: [textNode(root.textContent.trim())],
      },
    ];
  }

  return blocks.length ? blocks : [emptyBlock("paragraph")];
}

export const BLOCK_TYPE_LABELS: Record<BlogBlockType, string> = {
  paragraph: "Text",
  heading: "Heading",
  image: "Image",
  video: "Video",
  quote: "Quote",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  divider: "Divider",
};

export const ADDABLE_BLOCK_TYPES: BlogBlockType[] = [
  "paragraph",
  "heading",
  "image",
  "video",
  "quote",
  "bulletList",
  "orderedList",
  "divider",
];
