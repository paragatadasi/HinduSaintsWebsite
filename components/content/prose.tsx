import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { isDefinitionLink } from "@/lib/markdown";

export function Prose({ markdown }: { markdown: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
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

            return <a href={href} title={title}>{children}</a>;
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
