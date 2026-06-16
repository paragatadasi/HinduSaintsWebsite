"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Bold, Heading1, Heading2, Image, Italic, List, ListOrdered, Minus, Quote } from "lucide-react";

export type MarkdownEditorImage = {
  altText: string;
  caption: string;
  id: string;
  url: string;
};

type MarkdownEditorProps = {
  defaultValue: string;
  images?: MarkdownEditorImage[];
  maxLength?: number;
  name: string;
  required?: boolean;
  textareaId?: string;
};

type InsertionMode = "block" | "linePrefix" | "wrap";

export function MarkdownEditor({
  defaultValue,
  images = [],
  maxLength,
  name,
  required = false,
  textareaId
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="markdown-editor">
      <div className="markdown-editor__toolbar" aria-label="Text formatting">
        <ToolbarButton label="Heading 1" onClick={() => insertMarkdown("# ", "Heading", "linePrefix")}>
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" onClick={() => insertMarkdown("## ", "Section heading", "linePrefix")}>
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton label="Bold" onClick={() => insertMarkdown("**", "important text", "wrap", "**")}>
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => insertMarkdown("*", "emphasis", "wrap", "*")}>
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => insertMarkdown("> ", "Quoted passage", "linePrefix")}>
          <Quote size={18} />
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
              <img src={image.url} alt={image.altText} />
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
