import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "hr",
  "div",
  "span",
  "iframe",
  "figure",
  "figcaption",
  "pre",
  "code",
];

const ALLOWED_ATTR = [
  "href",
  "name",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "loading",
  "allow",
  "allowfullscreen",
  "frameborder",
  "referrerpolicy",
  "class",
  "data-youtube-video",
];

/** Client-side sanitize for HTML paste / preview before save. */
export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["allowfullscreen"],
  });
}

export function slugifyBlogTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const EMPTY_BLOG_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const;
