export const DEFINITION_LINK_TARGET = "#definition";
export const SOURCE_REFERENCE_PREFIX = "#source-ref-";
export const SANITIZED_MARKDOWN_ID_PREFIX = "user-content-";

type MarkdownAstNode = {
  children?: MarkdownAstNode[];
  data?: {
    hProperties?: Record<string, unknown>;
    [key: string]: unknown;
  };
  type: string;
  value?: string;
};

export type MarkdownHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

export function normalizeMarkdown(markdown: string) {
  return markdown.trim();
}

export function createDefinitionMarkdown(term: string, definition: string) {
  const normalizedTerm = term.trim().replace(/\s+/g, " ");
  const normalizedDefinition = definition.trim().replace(/\s+/g, " ");

  if (!normalizedTerm || !normalizedDefinition) {
    return "";
  }

  return `[${escapeMarkdownLabel(normalizedTerm)}](${DEFINITION_LINK_TARGET} "${escapeMarkdownTitle(normalizedDefinition)}")`;
}

export function isDefinitionLink(href: string | undefined, title: string | undefined): title is string {
  return href === DEFINITION_LINK_TARGET && Boolean(title?.trim());
}

export function createSourceReferenceMarkdown(label: string, citationKey: string) {
  const normalizedLabel = label.trim().replace(/\s+/g, " ");
  const normalizedKey = normalizeSourceCitationKey(citationKey);
  if (!normalizedLabel || !normalizedKey) return "";
  return `[${escapeMarkdownLabel(normalizedLabel)}](${SOURCE_REFERENCE_PREFIX}${normalizedKey})`;
}

export function createQuoteMarkdown(value: string, variant: "ordinary" | "pull", sourceReference = "") {
  const quote = value.trim() || "Quoted passage";
  const marker = variant === "pull" ? "> [!pullquote]\n" : "";
  const body = quote.split(/\r?\n/).map((line) => `> ${line || " "}`).join("\n");
  const attribution = sourceReference ? `\n>\n> \u2014 ${sourceReference}` : "";
  return `${marker}${body}${attribution}`;
}

export function getSourceReferenceKey(href: string | undefined) {
  if (!href?.startsWith(SOURCE_REFERENCE_PREFIX)) return undefined;
  return normalizeSourceCitationKey(href.slice(SOURCE_REFERENCE_PREFIX.length)) || undefined;
}

export function replaceSourceReferenceKeys(markdown: string, replacements: ReadonlyMap<string, string>) {
  return markdown.replace(/#source-ref-([a-zA-Z0-9_-]{1,128})/g, (match, key: string) => {
    const replacement = replacements.get(key);
    return replacement ? `${SOURCE_REFERENCE_PREFIX}${replacement}` : match;
  });
}

export function extractMarkdownHeadings(markdown: string, levels: Array<2 | 3> = [2]): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const usedIds = new Map<string, number>();
  let fence: string | undefined;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      fence = fence ? undefined : fenceMatch[1][0];
      continue;
    }
    if (fence) continue;

    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    if (!levels.includes(level)) continue;
    const label = markdownText(match[2]);
    if (!label) continue;
    headings.push({ id: uniqueHeadingId(slugifyHeading(label), usedIds), label, level });
  }

  return headings;
}

export function remarkEditorialFormatting(options: { headingIdPrefix?: string } = {}) {
  return (tree: MarkdownAstNode) => {
    const usedIds = new Map<string, number>();

    visitMarkdownTree(tree, (node) => {
      if (node.type === "blockquote") markPullQuote(node);
      if (options.headingIdPrefix && (node.type === "heading")) {
        const depth = (node as MarkdownAstNode & { depth?: number }).depth;
        if (depth !== 2 && depth !== 3) return;
        const label = markdownNodeText(node);
        const id = uniqueHeadingId(slugifyHeading(label), usedIds);
        node.data = {
          ...node.data,
          hProperties: { ...node.data?.hProperties, id: `${options.headingIdPrefix}${id}` }
        };
      }
    });
  };
}

function normalizeSourceCitationKey(value: string) {
  const normalized = value.trim();
  return /^[a-zA-Z0-9_-]{1,128}$/.test(normalized) ? normalized : "";
}

function visitMarkdownTree(node: MarkdownAstNode, visitor: (node: MarkdownAstNode) => void) {
  visitor(node);
  node.children?.forEach((child) => visitMarkdownTree(child, visitor));
}

function markPullQuote(node: MarkdownAstNode) {
  const firstText = node.children?.[0]?.children?.find((child) => child.type === "text");
  if (!firstText?.value || !/^\[!pullquote\](?:\r?\n|\s|$)/i.test(firstText.value)) return;
  firstText.value = firstText.value.replace(/^\[!pullquote\](?:\r?\n|\s)*/i, "");
  node.data = {
    ...node.data,
    hProperties: { ...node.data?.hProperties, className: ["prose-pullquote"] }
  };
}

function markdownNodeText(node: MarkdownAstNode): string {
  if (typeof node.value === "string") return node.value;
  return node.children?.map(markdownNodeText).join("") ?? "";
}

function markdownText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\\([\\`*{}\[\]()#+.!_-])/g, "$1")
    .trim();
}

function slugifyHeading(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function uniqueHeadingId(base: string, usedIds: Map<string, number>) {
  const count = (usedIds.get(base) ?? 0) + 1;
  usedIds.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

function escapeMarkdownLabel(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([\[\]])/g, "\\$1");
}

function escapeMarkdownTitle(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
