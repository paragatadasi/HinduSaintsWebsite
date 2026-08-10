"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Bold,
  BookOpen,
  Heading1,
  Heading2,
  Image,
  Italic,
  Link2,
  Library,
  List,
  ListOrdered,
  Minus,
  Quote
} from "lucide-react";
import { FocalImage } from "@/components/ui/focal-image";
import { IMAGE_CROP_ASPECT } from "@/lib/image-crop-config";
import { createDefinitionMarkdown, createQuoteMarkdown, createSourceReferenceMarkdown } from "@/lib/markdown";
import type { PublicImage } from "@/lib/public-contracts";

export type MarkdownEditorImage = {
  altText: string;
  caption: string;
  focalPoint?: PublicImage["focalPoint"];
  height?: number;
  id: string;
  url: string;
  width?: number;
};

type MarkdownEditorProps = {
  citationChannel?: string;
  defaultValue: string;
  enableDefinitions?: boolean;
  formatting?: "basic" | "full";
  images?: MarkdownEditorImage[];
  maxLength?: number;
  name: string;
  required?: boolean;
  sourceOptions?: MarkdownEditorSourceOption[];
  textareaId?: string;
};

export type MarkdownEditorSourceOption = {
  key: string;
  title: string;
};

export const MARKDOWN_CITATION_SOURCES_EVENT = "markdown-citation-sources";

type InsertionMode = "block" | "linePrefix" | "wrap";

export function MarkdownEditor({
  citationChannel,
  defaultValue,
  enableDefinitions = false,
  formatting = "full",
  images = [],
  maxLength,
  name,
  required = false,
  sourceOptions = [],
  textareaId
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [citationSources, setCitationSources] = useState(sourceOptions);
  const [selectedCitationKey, setSelectedCitationKey] = useState("");

  useEffect(() => {
    if (!citationChannel) return;
    const handleSources = (event: Event) => {
      const detail = (event as CustomEvent<{ channel: string; sources: MarkdownEditorSourceOption[] }>).detail;
      if (detail.channel !== citationChannel) return;
      setCitationSources(detail.sources);
      setSelectedCitationKey((current) => detail.sources.some((source) => source.key === current) ? current : "");
    };
    window.addEventListener(MARKDOWN_CITATION_SOURCES_EVENT, handleSources);
    return () => window.removeEventListener(MARKDOWN_CITATION_SOURCES_EVENT, handleSources);
  }, [citationChannel]);

  return (
    <div className="markdown-editor">
      <div className="markdown-editor__toolbar" aria-label="Text formatting">
        {formatting === "full" ? (
          <>
            <ToolbarButton label="Heading 1" onClick={() => insertMarkdown("# ", "Heading", "linePrefix")}>
              <Heading1 size={18} />
            </ToolbarButton>
            <ToolbarButton label="Heading 2" onClick={() => insertMarkdown("## ", "Section heading", "linePrefix")}>
              <Heading2 size={18} />
            </ToolbarButton>
          </>
        ) : null}
        <ToolbarButton label="Bold" onClick={() => insertMarkdown("**", "important text", "wrap", "**")}>
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => insertMarkdown("*", "emphasis", "wrap", "*")}>
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton label="External link" onClick={insertExternalLink}>
          <Link2 size={18} />
        </ToolbarButton>
        {formatting === "full" && enableDefinitions ? (
          <ToolbarButton label="Definition" onClick={insertDefinition}>
            <BookOpen size={18} />
          </ToolbarButton>
        ) : null}
        {formatting === "full" ? (
          <>
            <ToolbarButton label="Ordinary quote" onClick={() => insertQuote("ordinary")}>
              <Quote size={18} />
            </ToolbarButton>
            <ToolbarButton label="Pull quote" onClick={() => insertQuote("pull")}>
              <Quote size={22} />
            </ToolbarButton>
            <ToolbarButton label="Bullet list" onClick={() => insertMarkdown("- ", "List item", "linePrefix")}>
              <List size={18} />
            </ToolbarButton>
            <ToolbarButton label="Numbered list" onClick={() => insertMarkdown("1. ", "List item", "linePrefix")}>
              <ListOrdered size={18} />
            </ToolbarButton>
            <ToolbarButton label="Divider" onClick={() => insertMarkdown("\n---\n", "", "block")}>
              <Minus size={18} />
            </ToolbarButton>
          </>
        ) : null}
        {formatting === "full" && citationSources.length > 0 ? (
          <div className="markdown-editor__citation-tools">
            <label>
              <span className="sr-only">Source for quote or attribution</span>
              <select aria-label="Source for quote or attribution" value={selectedCitationKey} onChange={(event) => setSelectedCitationKey(event.target.value)}>
                <option value="">No source attribution</option>
                {citationSources.map((source) => <option key={source.key} value={source.key}>{source.title}</option>)}
              </select>
            </label>
            <button className="markdown-editor__citation-button" disabled={!selectedCitationKey} type="button" onClick={insertSourceAttribution}>
              <Library aria-hidden="true" size={18} />
              Add source
            </button>
          </div>
        ) : null}
      </div>
      <textarea
        id={textareaId}
        ref={textareaRef}
        name={name}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
      />
      {images.length > 0 ? (
        <div className="markdown-editor__image-picker" aria-label="Attached images">
          {images.map((image) => (
            <button
              className="markdown-editor__image"
              key={image.id}
              title={`Insert ${image.caption}`}
              type="button"
              onClick={() => insertMarkdown(`\n![${escapeMarkdownAlt(image.altText)}](${image.url})\n`, "", "block")}
            >
              <FocalImage
                src={image.url}
                alt={image.altText}
                width={image.width}
                height={image.height}
                cropAspect={IMAGE_CROP_ASPECT.markdownPreview}
                focalPoint={image.focalPoint}
              />
              <span>
                <Image size={14} />
                {image.caption}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  function insertMarkdown(prefix: string, fallback: string, mode: InsertionMode, suffix = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    const insertValue = selected || fallback;
    const next =
      mode === "wrap"
        ? `${prefix}${insertValue}${suffix}`
        : mode === "linePrefix"
          ? prefixSelectedLines(prefix, insertValue)
          : `${prefix}${insertValue}${suffix}`;

    textarea.setRangeText(next, start, end, "end");
    textarea.focus();
  }

  function insertDefinition() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const selectedTerm = selected.trim();
    const term = selectedTerm || window.prompt("Word or phrase to define:");

    if (!term) {
      textarea.focus();
      return;
    }

    const definition = window.prompt(`Definition for "${term}":`);
    if (!definition) {
      textarea.focus();
      return;
    }

    const markdown = createDefinitionMarkdown(term, definition);
    if (!markdown) {
      textarea.focus();
      return;
    }

    const leadingWhitespace = selectedTerm ? selected.match(/^\s*/)?.[0] ?? "" : "";
    const trailingWhitespace = selectedTerm ? selected.match(/\s*$/)?.[0] ?? "" : "";
    const replacement = `${leadingWhitespace}${markdown}${trailingWhitespace}`;

    textarea.setRangeText(replacement, start, end, "end");
    textarea.focus();
  }

  function insertExternalLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const selectedLabel = selected.trim();
    const label = selectedLabel || window.prompt("Link text:");

    if (!label) {
      textarea.focus();
      return;
    }

    const inputUrl = window.prompt("External website URL:", "https://");
    if (!inputUrl) {
      textarea.focus();
      return;
    }

    let normalizedUrl: string;
    try {
      const url = new URL(inputUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("Unsupported link protocol");
      }
      normalizedUrl = url.toString();
    } catch {
      window.alert("Enter a valid website URL beginning with https:// or http://.");
      textarea.focus();
      return;
    }

    const leadingWhitespace = selectedLabel ? selected.match(/^\s*/)?.[0] ?? "" : "";
    const trailingWhitespace = selectedLabel ? selected.match(/\s*$/)?.[0] ?? "" : "";
    const replacement = `${leadingWhitespace}[${escapeMarkdownLabel(label)}](<${normalizedUrl}>)${trailingWhitespace}`;

    textarea.setRangeText(replacement, start, end, "end");
    textarea.focus();
  }

  function insertQuote(variant: "ordinary" | "pull") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    textarea.setRangeText(createQuoteMarkdown(selected, variant, getSelectedSourceMarkdown()), start, end, "end");
    textarea.focus();
  }

  function insertSourceAttribution() {
    const textarea = textareaRef.current;
    const citation = getSelectedSourceMarkdown();
    if (!textarea || !citation) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const separator = selected && !/\s$/.test(selected) ? " " : "";
    textarea.setRangeText(`${selected}${separator}${citation}`, start, end, "end");
    textarea.focus();
  }

  function getSelectedSourceMarkdown() {
    const source = citationSources.find((option) => option.key === selectedCitationKey);
    return source ? createSourceReferenceMarkdown(source.title, source.key) : "";
  }
}

function ToolbarButton({
  children,
  label,
  onClick
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button aria-label={label} className="markdown-editor__tool" title={label} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function prefixSelectedLines(prefix: string, value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `${prefix}${line || " "}`)
    .join("\n");
}

function escapeMarkdownAlt(value: string) {
  return value.replace(/[\[\]]/g, "");
}

function escapeMarkdownLabel(value: string) {
  return value.replace(/([\[\]\\])/g, "\\$1");
}
