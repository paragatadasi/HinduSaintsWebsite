import { ExternalLink } from "lucide-react";
import { ReviewEditToggle } from "@/components/admin/review-edit-toggle";
import { ReviewFactGrid } from "@/components/admin/review-ui";
import { getSourceDisplayTitle } from "@/lib/source-display";
import { removeSaintSource, upsertSaintSource } from "../actions";

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
  };
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
          return <div className="review-row" key={link.id}>
            <ReviewEditToggle
              editable={canEdit}
              editLabel="Edit source"
              summary={<>
                <ReviewFactGrid facts={[
                  { label: "Source title", value: displayTitle },
                  { label: "Type", value: formatLabel(link.source.sourceType) },
                  { label: "Description", value: link.description },
                  { label: "Author", value: link.source.author }
                ]} />
                {link.source.url ? <a className="admin-text-link" href={link.source.url} rel="noreferrer" target="_blank">Open source <ExternalLink aria-hidden="true" size={14} /></a> : null}
              </>}
            >
              <form action={upsertSaintSource} className="form-stack">
                <input name="contentSourceId" type="hidden" value={link.id} />
                <input name="saintId" type="hidden" value={saintId} />
                <input name="sortOrder" type="hidden" value={link.sortOrder} />
                <SourceFields source={link.source} description={link.description} />
                <div className="review-actions">
                  <button className="admin-form-button" type="submit">Save source</button>
                </div>
              </form>
              <form action={removeSaintSource} className="review-actions">
                <input name="contentSourceId" type="hidden" value={link.id} />
                <input name="saintId" type="hidden" value={saintId} />
                <button className="admin-form-button admin-form-button--danger" type="submit">Remove from saint</button>
              </form>
            </ReviewEditToggle>
          </div>;
        })}
      </div> : <p className="empty-note">No sources or further reading have been added yet.</p>}

      {canEdit ? <div className="review-panel__subsection">
        <ReviewEditToggle
          editLabel="Add source"
          summary={<p>Add a book, article, website, scripture, or other reference. The source can be cited from the biography editor as soon as it is saved.</p>}
        >
          <form action={upsertSaintSource} className="form-stack">
            <input name="saintId" type="hidden" value={saintId} />
            <input name="sortOrder" type="hidden" value={sourceLinks.length} />
            <SourceFields />
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Add source</button>
            </div>
          </form>
        </ReviewEditToggle>
      </div> : null}
    </div>
  );
}

function SourceFields({ description, source }: { description?: string | null; source?: SaintSourceLink["source"] }) {
  return <>
    <div className="field-grid">
      <label>
        Source title
        <input defaultValue={source?.title ?? ""} maxLength={300} name="title" required />
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
        <input defaultValue={source?.author ?? ""} maxLength={200} name="author" />
      </label>
      <label>
        Publisher
        <input defaultValue={source?.publisher ?? ""} maxLength={200} name="publisher" />
      </label>
      <label>
        Publication year
        <input defaultValue={source?.publicationYear ?? ""} max={3000} min={0} name="publicationYear" type="number" />
      </label>
      <label>
        URL
        <input defaultValue={source?.url ?? ""} maxLength={1000} name="url" type="url" />
      </label>
    </div>
    <label>
      Description
      <textarea defaultValue={description ?? ""} maxLength={1000} name="description" />
      <small>A short public description of what this source contains or why it is useful.</small>
    </label>
  </>;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
