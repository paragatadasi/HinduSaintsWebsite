"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, Sparkles, UserRound } from "lucide-react";
import type { InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { compactMetadata, parseInstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { updateInstagramFirstPageMetadata } from "../actions";

type FirstPageMetadataFormProps = {
  instagramItemId: string;
  returnTo: string;
  firstPageText: string;
  metadata: InstagramFirstPageMetadata;
  readinessText: string;
};

export function FirstPageMetadataForm({
  instagramItemId,
  returnTo,
  firstPageText,
  metadata,
  readinessText
}: FirstPageMetadataFormProps) {
  const initialMetadata = useMemo(() => compactMetadata(metadata), [metadata]);
  const initialFields = useMemo(() => fieldsFromMetadata(initialMetadata), [initialMetadata]);
  const [text, setText] = useState(firstPageText);
  const [fields, setFields] = useState(initialFields);

  useEffect(() => {
    setText(firstPageText);
    setFields(initialFields);
  }, [firstPageText, initialFields]);

  function parseText() {
    const parsed = parseInstagramFirstPageMetadata(text);
    setFields(fieldsFromMetadata(parsed));
  }

  function updateField(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={updateInstagramFirstPageMetadata} className="first-page-review">
      <input name="instagramItemId" type="hidden" value={instagramItemId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="intent" type="hidden" value="save" />
      <div className="first-page-review__toolbar">
        <div className="first-page-review__heading">
          <div className="first-page-review__eyebrow">Metadata review</div>
          <h2>First Page Biodata</h2>
          <p>{readinessText}</p>
        </div>
        <div className="review-actions">
          <button className="admin-form-button admin-form-button--secondary" type="button" onClick={parseText} disabled={!text.trim()}>
            <Sparkles aria-hidden="true" size={16} />
            Parse from text
          </button>
          <button className="admin-form-button" type="submit">
            <ClipboardList aria-hidden="true" size={16} />
            Save metadata
          </button>
        </div>
      </div>

      <section className="first-page-review__card">
        <div className="first-page-review__section-title">
          <ClipboardList aria-hidden="true" size={18} />
          <h4>Quick summary</h4>
        </div>
        <div className="first-page-review__summary-grid">
          <SummaryItem label="Born" value={fields.born} />
          <SummaryItem label="Samadhi" value={fields.samadhi} />
          <SummaryItem label="Key place" value={fields.keyPlace} />
          <SummaryItem label="Tradition" value={fields.tradition} />
          <SummaryItem label="Guru" value={fields.guru} />
        </div>
      </section>

      <section className="first-page-review__card">
        <label className="first-page-review__label">
          <span className="first-page-review__section-title">
            <FileText aria-hidden="true" size={18} />
            <span>First-page text</span>
          </span>
          <textarea
            name="firstPageText"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={8000}
            placeholder="Paste carousel cover text here."
          />
        </label>
      </section>

      <section className="first-page-review__card">
        <div className="first-page-review__section-title">
          <UserRound aria-hidden="true" size={18} />
          <h4>Basic information</h4>
        </div>
        <div className="field-grid first-page-review__field-grid">
          <label>
            Display name
            <input name="displayName" value={fields.displayName} onChange={(event) => updateField("displayName", event.target.value)} maxLength={200} />
          </label>
          <label>
            Subtitle
            <input name="subtitle" value={fields.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} maxLength={200} />
          </label>
          <label>
            Born
            <input name="born" value={fields.born} onChange={(event) => updateField("born", event.target.value)} maxLength={160} />
          </label>
          <label>
            Samadhi
            <input name="samadhi" value={fields.samadhi} onChange={(event) => updateField("samadhi", event.target.value)} maxLength={160} />
          </label>
          <label>
            Key place
            <textarea name="keyPlace" value={fields.keyPlace} onChange={(event) => updateField("keyPlace", event.target.value)} maxLength={500} />
          </label>
          <label>
            Tradition
            <input name="tradition" value={fields.tradition} onChange={(event) => updateField("tradition", event.target.value)} maxLength={240} />
          </label>
          <label>
            Guru
            <textarea name="guru" value={fields.guru} onChange={(event) => updateField("guru", event.target.value)} maxLength={500} />
          </label>
        </div>
      </section>
    </form>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="first-page-review__summary-item">
      <strong>{label}</strong>
      <span>{value.trim() || "Not set"}</span>
    </div>
  );
}

function fieldsFromMetadata(metadata: InstagramFirstPageMetadata) {
  const compacted = compactMetadata(metadata);

  return {
    displayName: compacted.displayName ?? "",
    subtitle: compacted.subtitle ?? "",
    born: compacted.born ?? "",
    samadhi: compacted.samadhi ?? "",
    keyPlace: compacted.keyPlace ?? "",
    tradition: compacted.tradition ?? "",
    guru: compacted.guru ?? ""
  };
}
