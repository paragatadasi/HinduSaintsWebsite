"use client";

import { FileDown } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { importBiographyTextFromInstagramPost } from "../actions";

type InstagramBiographyImportPost = {
  id: string;
  label: string;
  detail?: string;
};

type InstagramBiographyImporterProps = {
  posts: InstagramBiographyImportPost[];
  saintId: string;
  textareaId: string;
};

export function InstagramBiographyImporter({ posts, saintId, textareaId }: InstagramBiographyImporterProps) {
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id ?? "");
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
        const result = await importBiographyTextFromInstagramPost({
          saintId,
          instagramItemId: selectedPostId
        });
        insertIntoBiographyEditor(textareaId, result.markdown);
        setMessage(`Imported text from ${result.slideCount} slide${result.slideCount === 1 ? "" : "s"}. Review the draft before saving.`);
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
      {message ? <p className="admin-notice admin-notice--success">{message}</p> : null}
      {error ? <p className="admin-notice admin-notice--warning">{error}</p> : null}
    </div>
  );
}

function insertIntoBiographyEditor(textareaId: string, markdown: string) {
  const textarea = document.getElementById(textareaId);
  if (!(textarea instanceof HTMLTextAreaElement)) return;

  const insertion = `${textarea.value.trim() ? "\n\n" : ""}${markdown.trim()}\n`;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;

  textarea.setRangeText(insertion, start, end, "end");
  textarea.focus();
}
