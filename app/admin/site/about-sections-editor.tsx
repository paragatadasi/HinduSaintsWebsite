"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ABOUT_PAGE_SECTION_LIMIT } from "@/lib/site-content";

type AboutSection = {
  body: string;
  title: string;
};

type AboutSectionRow = AboutSection & {
  key: string;
};

export function AboutSectionsEditor({ sections: initialSections }: { sections: AboutSection[] }) {
  const nextKey = useRef(initialSections.length);
  const [sections, setSections] = useState<AboutSectionRow[]>(() =>
    initialSections.map((section, index) => ({
      ...section,
      key: `about-section-${index}`
    }))
  );

  return (
    <div className="form-stack">
      <div className="review-list">
        {sections.map((section, index) => (
          <div className="review-row" key={section.key}>
            <div className="section-heading">
              <div className="eyebrow">Section {index + 1}</div>
              {sections.length > 1 ? (
                <button
                  aria-label={`Remove section ${index + 1}`}
                  className="admin-form-button admin-form-button--low-priority"
                  type="button"
                  onClick={() => setSections((current) => current.filter((item) => item.key !== section.key))}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </div>
            <label>
              Section title
              <input
                defaultValue={section.title}
                maxLength={160}
                name="aboutSectionTitle"
                required
                type="text"
              />
            </label>
            <div className="form-stack">
              <label htmlFor={`about-section-body-${section.key}`}>Section body</label>
              <MarkdownEditor
                defaultValue={section.body}
                formatting="basic"
                maxLength={5000}
                name="aboutSectionBody"
                required
                textareaId={`about-section-body-${section.key}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="review-actions">
        <button
          className="admin-form-button admin-form-button--secondary"
          disabled={sections.length >= ABOUT_PAGE_SECTION_LIMIT}
          type="button"
          onClick={() => {
            const key = nextKey.current;
            nextKey.current += 1;
            setSections((current) => [...current, { body: "", key: `about-section-${key}`, title: "" }]);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Add section
        </button>
      </div>
    </div>
  );
}
