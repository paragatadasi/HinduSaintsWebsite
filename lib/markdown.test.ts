import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Prose } from "../components/content/prose";
import { createDefinitionMarkdown, isDefinitionLink } from "./markdown";

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
