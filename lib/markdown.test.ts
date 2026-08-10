import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Prose } from "../components/content/prose";
import {
  createDefinitionMarkdown,
  createQuoteMarkdown,
  createSourceReferenceMarkdown,
  extractMarkdownHeadings,
  getSourceReferenceKey,
  isDefinitionLink,
  replaceSourceReferenceKeys
} from "./markdown";

test("createDefinitionMarkdown formats and escapes a definition annotation", () => {
  assert.equal(
    createDefinitionMarkdown('  guru [teacher]  ', 'A "weighty" spiritual guide.  '),
    '[guru \\[teacher\\]](#definition "A \\"weighty\\" spiritual guide.")'
  );
});

test("createDefinitionMarkdown rejects empty terms and definitions", () => {
  assert.equal(createDefinitionMarkdown("", "A definition"), "");
  assert.equal(createDefinitionMarkdown("Bhakti", "  "), "");
});

test("isDefinitionLink only accepts titled definition annotations", () => {
  assert.equal(isDefinitionLink("#definition", "Devotional participation"), true);
  assert.equal(isDefinitionLink("#definition", ""), false);
  assert.equal(isDefinitionLink("/definitions/bhakti", "Devotional participation"), false);
});

test("Prose renders definition annotations as focusable terms instead of links", () => {
  const html = renderToStaticMarkup(
    createElement(Prose, {
      markdown: 'The path of [bhakti](#definition "loving devotion") is open to all.'
    })
  );

  assert.match(html, /<dfn class="prose-definition" data-definition="loving devotion" tabindex="0">/);
  assert.match(html, /<span class="sr-only">: loving devotion<\/span>/);
  assert.doesNotMatch(html, /href="#definition"/);
});

test("source references use safe stable citation keys", () => {
  assert.equal(createSourceReferenceMarkdown("Collected Works", "draft-source_1"), "[Collected Works](#source-ref-draft-source_1)");
  assert.equal(createSourceReferenceMarkdown("Collected Works", "unsafe key"), "");
  assert.equal(getSourceReferenceKey("#source-ref-source_123"), "source_123");
  assert.equal(getSourceReferenceKey("https://example.com"), undefined);
});

test("quote formatting distinguishes ordinary and pull quotes with optional source attribution", () => {
  const citation = createSourceReferenceMarkdown("Primary text", "draft-primary");
  assert.equal(createQuoteMarkdown("A remembered teaching.", "ordinary"), "> A remembered teaching.");
  assert.equal(
    createQuoteMarkdown("A remembered teaching.", "pull", citation),
    "> [!pullquote]\n> A remembered teaching.\n>\n> \u2014 [Primary text](#source-ref-draft-primary)"
  );
});

test("source reference keys are resolved without changing citation labels", () => {
  assert.equal(
    replaceSourceReferenceKeys("Text [Collected Works](#source-ref-draft-1).", new Map([["draft-1", "source-final"]])),
    "Text [Collected Works](#source-ref-source-final)."
  );
});

test("biography headings get stable table-of-contents ids", () => {
  assert.deepEqual(extractMarkdownHeadings("## Early Life\n\n### Childhood\n\n## Early Life"), [
    { id: "early-life", label: "Early Life", level: 2 },
    { id: "early-life-2", label: "Early Life", level: 2 }
  ]);
});

test("Prose renders pull quotes and source references as editorial elements", () => {
  const html = renderToStaticMarkup(
    createElement(Prose, {
      markdown: "> [!pullquote]\n> A remembered teaching.\n>\n> — [Collected Works](#source-ref-source-1)",
      sourceReferences: [{ key: "source-1", title: "Collected Works" }]
    })
  );

  assert.match(html, /<blockquote class="prose-pullquote">/);
  assert.match(html, /class="prose-source-reference" href="#source-source-1"/);
  assert.doesNotMatch(html, /\[!pullquote\]/);
});

test("Prose keeps generated biography heading ids aligned with sanitized anchors", () => {
  const html = renderToStaticMarkup(createElement(Prose, { headingIdPrefix: "biography-section-", markdown: "## Early Life" }));
  assert.match(html, /id="user-content-biography-section-early-life"/);
});
