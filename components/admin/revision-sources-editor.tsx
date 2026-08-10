"use client";

import { useEffect, useRef, useState } from "react";
import type { SourceRevision } from "@/lib/editorial-revisions";

const sourceTypes: SourceRevision["sourceType"][] = ["book", "article", "website", "scripture", "oral_tradition", "other"];

type RevisionSourcesEditorProps = {
  initialSources: SourceRevision[];
};

export function RevisionSourcesEditor({ initialSources }: RevisionSourcesEditorProps) {
  const [sources, setSources] = useState<SourceRevision[]>(initialSources);
  const serializedInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    serializedInputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [sources]);

  function updateSource(index: number, patch: Partial<SourceRevision>) {
    setSources((current) => current.map((source, sourceIndex) => sourceIndex === index ? { ...source, ...patch } : source));
  }

  return (
    <div className="revision-sources-editor">
      <input name="sourcesJson" ref={serializedInputRef} type="hidden" value={JSON.stringify(sources)} readOnly />
      <div className="revision-sources-editor__heading">
        <div>
          <h4>Associated sources</h4>
          <p>These citations stay with this revision and replace the public source list only when the revision is published.</p>
        </div>
        <button
          className="admin-form-button admin-form-button--secondary"
          type="button"
          onClick={() => setSources((current) => [...current, { title: "", sourceType: "website" }])}
        >
          Add source
        </button>
      </div>
      {sources.length > 0 ? <div className="review-list">
        {sources.map((source, index) => (
          <div className="form-stack review-row" key={`${source.sourceId ?? "new"}-${index}`}>
            <div className="field-grid">
              <label>
                Title
                <input
                  maxLength={300}
                  required
                  value={source.title}
                  onChange={(event) => updateSource(index, { title: event.target.value })}
                />
              </label>
              <label>
                Type
                <select value={source.sourceType} onChange={(event) => updateSource(index, { sourceType: event.target.value as SourceRevision["sourceType"] })}>
                  {sourceTypes.map((sourceType) => <option key={sourceType} value={sourceType}>{formatLabel(sourceType)}</option>)}
                </select>
              </label>
              <label>
                Author
                <input maxLength={200} value={source.author ?? ""} onChange={(event) => updateSource(index, { author: emptyValue(event.target.value) })} />
              </label>
              <label>
                Publisher
                <input maxLength={200} value={source.publisher ?? ""} onChange={(event) => updateSource(index, { publisher: emptyValue(event.target.value) })} />
              </label>
              <label>
                Publication year
                <input
                  min={0}
                  max={3000}
                  type="number"
                  value={source.publicationYear ?? ""}
                  onChange={(event) => updateSource(index, { publicationYear: event.target.value ? Number(event.target.value) : undefined })}
                />
              </label>
              <label>
                URL
                <input maxLength={1000} type="url" value={source.url ?? ""} onChange={(event) => updateSource(index, { url: emptyValue(event.target.value) })} />
              </label>
            </div>
            <label>
              Citation note
              <textarea maxLength={1000} value={source.note ?? ""} onChange={(event) => updateSource(index, { note: emptyValue(event.target.value) })} />
            </label>
            <div className="review-actions">
              <button className="admin-text-link" type="button" onClick={() => setSources((current) => current.filter((_, sourceIndex) => sourceIndex !== index))}>
                Remove from draft
              </button>
            </div>
          </div>
        ))}
      </div> : <p className="empty-note">No sources are attached to this revision yet.</p>}
    </div>
  );
}

function emptyValue(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}
