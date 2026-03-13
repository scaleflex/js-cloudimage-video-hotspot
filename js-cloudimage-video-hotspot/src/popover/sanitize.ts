/** Escape HTML entities in text content */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape a string for safe use in HTML attributes */
export function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Check if a URL is safe (http(s), relative path, or hash) */
export function isSafeUrl(url: string): boolean {
  // eslint-disable-next-line no-control-regex
  const normalized = url.replace(/[\s\x00-\x1f]/g, '');
  return /^https?:\/\//i.test(normalized) || /^\/(?!\/)/.test(normalized) || /^#/.test(normalized);
}

const ALLOWED_TAGS = new Set([
  'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'ul',
]);

const ALLOWED_ATTRS = new Set([
  'class', 'href', 'src', 'alt', 'title', 'target', 'rel',
]);

const SAFE_HREF_PATTERN = /^(?:https?:|mailto:)/i;
const SAFE_SRC_PATTERN = /^(?:https?:|data:image\/(?!svg[+%]))/i;
const SAFE_REL_VALUES = new Set([
  'noopener', 'noreferrer', 'nofollow', 'external', 'author', 'help',
  'license', 'next', 'prev', 'search', 'tag', 'bookmark',
]);

/**
 * Sanitize HTML string to prevent XSS.
 * Uses DOMParser for robust parsing.
 */
export function sanitizeHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  const body = doc.body;

  sanitizeNode(body);

  return body.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        el.remove();
        continue;
      }

      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (!ALLOWED_ATTRS.has(name)) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (name === 'href' && !SAFE_HREF_PATTERN.test(attr.value.trim())) {
          el.removeAttribute(attr.name);
        } else if (name === 'src' && !SAFE_SRC_PATTERN.test(attr.value.trim())) {
          el.removeAttribute(attr.name);
        } else if (name === 'rel') {
          const safeTokens = attr.value.trim().toLowerCase().split(/\s+/).filter((t) => SAFE_REL_VALUES.has(t));
          if (safeTokens.length === 0) {
            el.removeAttribute(attr.name);
          } else {
            el.setAttribute(attr.name, safeTokens.join(' '));
          }
        }
      }

      sanitizeNode(el);
    } else {
      child.remove();
    }
  }
}
