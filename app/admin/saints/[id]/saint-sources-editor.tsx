"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { ReviewEditToggle } from "@/components/admin/review-edit-toggle";
import { ReviewFactGrid } from "@/components/admin/review-ui";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getSourceDisplayTitle, type SourceMatchKind } from "@/lib/source-display";
import { attachExistingSaintSource, removeSaintSource, upsertSaintSource } from "../actions";

const sourceTypes = ["book", "article", "website", "scripture", "oral_tradition", "other"] as const;

type SaintSourceLink = {
  id: string;
  description: string | null;
  sortOrder: number;
  source: {
    id: string;
    title: string;
    sourceType: (typeof sourceTypes)[number];
    author: string | null;
    publisher: string | null;
    publicationYear: number | null;
    url: string | null;
    _count: { contentSources: number };
  };
};

type SourceSearchOption = {
  value: string;
  label: string;
  description?: string;
  sourceType: (typeof sourceTypes)[number];
  author: string | null;
  publisher: string | null;
  publicationYear: number | null;
  url: string | null;
  usageCount: number;
  matchKind: SourceMatchKind | null;
};

export function SaintSourcesEditor({ canEdit, saintId, sourceLinks }: { canEdit: boolean; saintId: string; sourceLinks: SaintSourceLink[] }) {
  return (
    <div className="form-stack">
      {sourceLinks.length > 0 ? <div className="review-list">
        {sourceLinks.map((link) => {
          const displayTitle = getSourceDisplayTitle({
            author: link.source.author ?? undefined,
            publisher: link.source.publisher ?? undefined,
            title: link.source.title,
            url: link.source.url ?? undefined
          });
          const usageCount = link.source._count.contentSources;
          return <div className="review-row" key={link.id}>
            <ReviewEditToggle
              editable={canEdit}
              editLabel="Edit source"
              summary={<ReviewFactGrid facts={[
                { label: "Source title", value: displayTitle },
                { label: "Type", value: formatLabel(link.source.sourceType) },
                { label: "Description", value: link.description },
                { label: "Author", value: link.source.author }
              ]} />}
              summaryActions={link.source.url ? <a className="admin-text-link source-editor__open-link" href={link.source.url} rel="noreferrer" target="_blank">Open source <ExternalLink aria-hidden="true" size={14} /></a> : null}
            >
              <form action={upsertSaintSource} className="form-stack">
                <input name="contentSourceId" type="hidden" value={link.id} />
                <input name="saintId" type="hidden" value={saintId} />
                <input name="sortOrder" type="hidden" value={link.sortOrder} />
                {usageCount > 1 ? <p className="admin-notice">
                  This source is shared by {usageCount} pages. Changes to its title and publication details apply everywhere; the description below belongs only to this saint.
                </p> : null}
                <SourceFields source={link.source} description={link.description} />
                <div className="review-actions">
                  <button className="admin-form-button" type="submit">Save source</button>
                  <button
                    className="admin-form-button admin-form-button--secondary"
                    formAction={removeSaintSource}
                    formNoValidate
                    type="submit"
                    onClick={(event) => {
                      if (!window.confirm("Remove this source from the saint? The shared source record will remain available elsewhere.")) event.preventDefault();
                    }}
                  >
                    Remove from saint
                  </button>
                </div>
              </form>
            </ReviewEditToggle>
          </div>;
        })}
      </div> : <p className="empty-note">No sources or further reading have been added yet.</p>}

      {canEdit ? <div className="review-panel__subsection">
        <ReviewEditToggle
          editLabel="Add source"
          summary={<p>Search the shared source library first. Each saint can have its own public description while reusing the same underlying source.</p>}
        >
          <div className="source-editor__add-flow">
            <form action={attachExistingSaintSource} className="form-stack source-editor__reuse-form">
              <input name="saintId" type="hidden" value={saintId} />
              <input name="sortOrder" type="hidden" value={sourceLinks.length} />
              <SearchableSelect
                emptyText="No existing sources match this search."
                label="Find an existing source"
                name="sourceId"
                options={[]}
                placeholder="Search by title, author, publisher, or URL"
                required
                searchEndpoint={`/api/admin/sources/search?excludeSaintId=${saintId}`}
              />
              <label>
                Description for this saint <small>Optional</small>
                <textarea maxLength={1000} name="description" />
                <small>This description belongs only to this saint; the source record remains shared.</small>
              </label>
              <div className="review-actions">
                <button className="admin-form-button" type="submit">Attach existing source</button>
              </div>
            </form>

            <ReviewEditToggle
              editLabel="Create new source"
              summary={<p>Can&apos;t find it? Add new bibliographic details after checking the shared library.</p>}
            >
              <NewSourceForm saintId={saintId} sortOrder={sourceLinks.length} />
            </ReviewEditToggle>
          </div>
        </ReviewEditToggle>
      </div> : null}
    </div>
  );
}

function NewSourceForm({ saintId, sortOrder }: { saintId: string; sortOrder: number }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publicationYear, setPublicationYear] = useState("");
  const [url, setUrl] = useState("");
  const [matches, setMatches] = useState<SourceSearchOption[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    const query = sourceSearchQuery(title, url);
    if (query.length < 2) {
      setMatches([]);
      setSearchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const parameters = new URLSearchParams({ q: query, title });
      if (author.trim()) parameters.set("author", author.trim());
      if (publicationYear) parameters.set("year", publicationYear);
      if (url.trim()) parameters.set("url", url.trim());

      try {
        const response = await fetch(`/api/admin/sources/search?${parameters}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Search failed.");
        const payload = await response.json() as { options?: SourceSearchOption[] };
        setMatches((payload.options ?? []).filter((option) => option.matchKind).slice(0, 3));
        setSearchFailed(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMatches([]);
        setSearchFailed(true);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [author, publicationYear, title, url]);

  return (
    <form action={upsertSaintSource} className="form-stack">
      <input name="saintId" type="hidden" value={saintId} />
      <input name="sortOrder" type="hidden" value={sortOrder} />
      <SourceFields
        controlled={{ author, publicationYear, title, url }}
        onComparableChange={{
          author: setAuthor,
          publicationYear: setPublicationYear,
          title: setTitle,
          url: setUrl
        }}
      />
      {matches.length > 0 ? <div className="source-editor__matches" role="status">
        <div>
          <strong>{matches.some((match) => match.matchKind === "exact_url") ? "This source already exists" : "Possible existing source found"}</strong>
          <p>Reuse the shared record and keep the description above specific to this saint.</p>
        </div>
        {matches.map((match) => <div className="source-editor__match" key={match.value}>
          <span><strong>{match.label}</strong>{match.description ? <small>{match.description}</small> : null}</span>
          <button
            className="admin-form-button admin-form-button--secondary"
            formAction={attachExistingSaintSource}
            name="sourceId"
            type="submit"
            value={match.value}
          >
            Use existing source
          </button>
        </div>)}
      </div> : null}
      {searchFailed ? <p className="form-status form-status--error" role="alert">Existing-source matching is temporarily unavailable. Search the shared library above before creating a new record.</p> : null}
      <div className="review-actions">
        <button className="admin-form-button" type="submit">Add new source</button>
      </div>
    </form>
  );
}

function SourceFields({
  controlled,
  description,
  onComparableChange,
  source
}: {
  controlled?: { author: string; publicationYear: string; title: string; url: string };
  description?: string | null;
  onComparableChange?: {
    author: (value: string) => void;
    publicationYear: (value: string) => void;
    title: (value: string) => void;
    url: (value: string) => void;
  };
  source?: SaintSourceLink["source"];
}) {
  return <>
    <div className="field-grid">
      <label>
        Source title
        <input
          maxLength={300}
          name="title"
          required
          {...controlled ? { value: controlled.title, onChange: (event) => onComparableChange?.title(event.target.value) } : { defaultValue: source?.title ?? "" }}
        />
        <small>This title is shown publicly; the raw URL is never used as the visible label.</small>
      </label>
      <label>
        Type
        <select defaultValue={source?.sourceType ?? "website"} name="sourceType">
          {sourceTypes.map((sourceType) => <option key={sourceType} value={sourceType}>{formatLabel(sourceType)}</option>)}
        </select>
      </label>
      <label>
        Author
        <input
          maxLength={200}
          name="author"
          {...controlled ? { value: controlled.author, onChange: (event) => onComparableChange?.author(event.target.value) } : { defaultValue: source?.author ?? "" }}
        />
      </label>
      <label>
        Publisher
        <input defaultValue={source?.publisher ?? ""} maxLength={200} name="publisher" />
      </label>
      <label>
        Publication year
        <input
          max={3000}
          min={0}
          name="publicationYear"
          type="number"
          {...controlled ? { value: controlled.publicationYear, onChange: (event) => onComparableChange?.publicationYear(event.target.value) } : { defaultValue: source?.publicationYear ?? "" }}
        />
      </label>
      <label>
        URL
        <input
          maxLength={1000}
          name="url"
          type="url"
          {...controlled ? { value: controlled.url, onChange: (event) => onComparableChange?.url(event.target.value) } : { defaultValue: source?.url ?? "" }}
        />
      </label>
    </div>
    <label>
      Description
      <textarea defaultValue={description ?? ""} maxLength={1000} name="description" />
      <small>A short public description of what this source contains or why it is useful for this saint.</small>
    </label>
  </>;
}

function sourceSearchQuery(title: string, url: string) {
  if (title.trim().length >= 2) return title.trim();
  try {
    return new URL(url).hostname;
  } catch {
    return url.trim();
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
