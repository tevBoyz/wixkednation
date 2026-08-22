const sanitizeHtml = require("sanitize-html");

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
  "code"
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  iframe: [
    "src",
    "width",
    "height",
    "allow",
    "allowfullscreen",
    "frameborder",
    "title",
    "referrerpolicy"
  ],
  div: ["class", "data-youtube-video"],
  span: ["class"],
  "*": ["class"]
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function marksToHtml(text, marks = []) {
  let html = escapeHtml(text);
  for (const mark of marks) {
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
      const href = escapeHtml(mark.attrs.href);
      html = `<a href="${href}" rel="noopener noreferrer" target="_blank">${html}</a>`;
    }
  }
  return html;
}

function renderInline(nodes = []) {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return marksToHtml(node.text || "", node.marks || []);
      }
      if (node.type === "hardBreak") {
        return "<br />";
      }
      return "";
    })
    .join("");
}

function renderNode(node) {
  if (!node || typeof node !== "object") {
    return "";
  }

  const children = Array.isArray(node.content)
    ? node.content.map(renderNode).join("")
    : "";

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return `<p>${children || renderInline(node.content) || "<br />"}</p>`;
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 4);
      const inner = children || renderInline(node.content);
      return `<h${level}>${inner}</h${level}>`;
    }
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "horizontalRule":
      return "<hr />";
    case "image": {
      const src = escapeHtml(node.attrs?.src || "");
      const alt = escapeHtml(node.attrs?.alt || "");
      if (!src) {
        return "";
      }
      return `<img src="${src}" alt="${alt}" loading="lazy" />`;
    }
    case "youtube": {
      const src = escapeHtml(node.attrs?.src || "");
      if (!src) {
        return "";
      }
      return `<div class="aspect-video" data-youtube-video><iframe src="${src}" title="YouTube video" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    }
    case "iframe": {
      const src = escapeHtml(node.attrs?.src || "");
      if (!src) {
        return "";
      }
      return `<div class="aspect-video"><iframe src="${src}" title="Embedded media" allowfullscreen></iframe></div>`;
    }
    case "text":
      return marksToHtml(node.text || "", node.marks || []);
    case "hardBreak":
      return "<br />";
    default:
      return children || renderInline(node.content);
  }
}

function tipTapJsonToHtml(bodyJson) {
  if (!bodyJson || typeof bodyJson !== "object") {
    return "";
  }
  return renderNode(bodyJson);
}

function sanitizeBlogHtml(html) {
  if (typeof html !== "string" || !html.trim()) {
    return "";
  }

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
      "vimeo.com"
    ],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank"
      })
    }
  });
}

function resolveBodyHtml({ bodyJson, bodyHtml }) {
  const fromClient =
    typeof bodyHtml === "string" && bodyHtml.trim()
      ? sanitizeBlogHtml(bodyHtml)
      : "";
  if (fromClient) {
    return fromClient;
  }
  return sanitizeBlogHtml(tipTapJsonToHtml(bodyJson));
}

module.exports = {
  resolveBodyHtml,
  sanitizeBlogHtml,
  tipTapJsonToHtml
};
