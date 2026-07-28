export const DEFINITION_LINK_TARGET = "#definition";

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

function escapeMarkdownLabel(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([\[\]])/g, "\\$1");
}

function escapeMarkdownTitle(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
