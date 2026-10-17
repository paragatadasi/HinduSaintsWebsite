"use client";

import { FileDown } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

type InstagramBiographyImportPost = {
  id: string;
  label: string;
  detail?: string;
  referenceText?: string;
};

type InstagramBiographyImporterProps = {
  posts: InstagramBiographyImportPost[];
  saintId: string;
  textareaId: string;
};

export function InstagramBiographyImporter({ posts, saintId, textareaId }: InstagramBiographyImporterProps) {
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id ?? "");
  const [references, setReferences] = useState<Record<string, string>>(() => Object.fromEntries(posts.filter((post) => post.referenceText).map((post) => [post.id, post.referenceText!])));
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedPostId), [posts, selectedPostId]);

  if (posts.length === 0) {
    return <p>No matched Instagram posts are attached yet.</p>;
  }

  function importText() {
    if (!selectedPostId) return;
    setMessage(undefined);
    setError(undefined);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/saints/instagram-biography-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saintId,
            instagramItemId: selectedPostId
          })
        });
        const result = await readImportResponse(response);
        if (!response.ok || !result.markdown || typeof result.slideCount !== "number") {
          setError(result.error ?? "Could not import text from this Instagram post.");
          return;
        }
        if (result.referenceText) setReferences((current) => ({ ...current, [selectedPostId]: result.referenceText! }));
        insertIntoBiographyEditor(textareaId, result.markdown);
        setMessage(`Imported text from ${result.slideCount} slide${result.slideCount === 1 ? "" : "s"}. Carousel text saved for reference. Review the draft before saving.`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not import text from this Instagram post.");
      }
    });
  }

  return (
    <div className="instagram-biography-importer">
      <label>
        Instagram post
        <select value={selectedPostId} onChange={(event) => setSelectedPostId(event.target.value)}>
          {posts.map((post) => (
            <option key={post.id} value={post.id}>
              {post.label}
            </option>
          ))}
        </select>
      </label>
      {selectedPost?.detail ? <p>{selectedPost.detail}</p> : null}
      <div className="review-actions">
        <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isPending || !selectedPostId} onClick={importText}>
          <FileDown aria-hidden="true" size={16} />
          Import text from Instagram post
        </button>
      </div>
      {references[selectedPostId] ? (
        <div className="form-stack__field">
          <label htmlFor="instagram-carousel-reference">Saved carousel text</label>
          <textarea id="instagram-carousel-reference" className="admin-reference-text" value={references[selectedPostId]} readOnly />
          <p>This reference stays available when you edit the biography.</p>
        </div>
      ) : null}
      {message ? <p className="admin-notice admin-notice--success">{message}</p> : null}
      {error ? <p className="admin-notice admin-notice--warning">{error}</p> : null}
    </div>
  );
}

async function readImportResponse(response: Response) {
  try {
    return await response.json() as {
      error?: string;
      markdown?: string;
      referenceText?: string;
      slideCount?: number;
    };
  } catch {
    return {
      error: response.status === 401
        ? "Your admin session has expired. Sign in again, then retry the import."
        : "The import service returned an invalid response. Reload the page and try again."
    };
  }
}

function insertIntoBiographyEditor(textareaId: string, markdown: string) {
  const textarea = document.getElementById(textareaId);
  if (!(textarea instanceof HTMLTextAreaElement)) return;

  const insertion = `${textarea.value.trim() ? "\n\n" : ""}${markdown.trim()}\n`;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;

  textarea.setRangeText(insertion, start, end, "end");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}
