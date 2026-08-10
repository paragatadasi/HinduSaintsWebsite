import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { getSourceReferenceKey, isDefinitionLink, remarkEditorialFormatting } from "@/lib/markdown";

type ProseSourceReference = {
  key: string;
  title: string;
};

const editorialSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    blockquote: [
      ...(defaultSchema.attributes?.blockquote ?? []),
      ["className", "prose-pullquote"]
    ]
  }
};

export function Prose({
  className,
  headingIdPrefix,
  markdown,
  sourceReferences = []
}: {
  className?: string;
  headingIdPrefix?: string;
  markdown: string;
  sourceReferences?: ProseSourceReference[];
}) {
  const sourceByKey = new Map(sourceReferences.map((source) => [source.key, source]));

  return (
    <div className={["prose", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkEditorialFormatting, { headingIdPrefix }]]}
        rehypePlugins={[[rehypeSanitize, editorialSanitizeSchema]]}
        components={{
          a({ children, href, title }) {
            if (isDefinitionLink(href, title)) {
              return (
                <dfn className="prose-definition" data-definition={title} tabIndex={0}>
                  {children}
                  <span className="sr-only">: {title}</span>
                </dfn>
              );
            }

            const sourceKey = getSourceReferenceKey(href);
            const source = sourceKey ? sourceByKey.get(sourceKey) : undefined;
            if (sourceKey) {
              return source ? (
                <a className="prose-source-reference" href={`#source-${sourceKey}`} title={`View source: ${source.title}`}>
                  {children}
                </a>
              ) : <cite className="prose-source-reference prose-source-reference--unlinked">{children}</cite>;
            }

            return <a href={href} title={title}>{children}</a>;
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
