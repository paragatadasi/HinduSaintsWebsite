import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { StatusBadge } from "@/components/ui/status-badge";

type SourceImportBatchHistoryRow = {
  id: string;
  sourceName: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  rawSummary: string | null;
  notes: string | null;
};

export function SourceImportBatchHistory({
  cardId,
  rows,
  sourceLabel
}: {
  cardId: string;
  rows: SourceImportBatchHistoryRow[];
  sourceLabel: string;
}) {
  return (
    <CollapsibleReviewCard
      cardId={cardId}
      description={`Preserved raw ${sourceLabel} batches remain available for review and debugging.`}
      eyebrow="Import history"
      title={`${sourceLabel} raw import batches`}
    >
      {rows.length > 0 ? (
        <div className="review-list">
          {rows.map((row) => (
            <article className="review-row" key={row.id}>
              <div>
                <div className="review-meta">
                  <StatusBadge label={formatLabel(row.status)} />
                  <StatusBadge label={formatLabel(row.sourceName ?? "import batch")} />
                </div>
                <h3>{row.notes || `${sourceLabel} source batch`}</h3>
                {row.rawSummary ? (
                  <details className="airtable-job-details">
                    <summary>View preserved raw summary</summary>
                    <pre className="raw-json-preview">{formatRawSummary(row.rawSummary)}</pre>
                  </details>
                ) : (
                  <p>No raw summary was recorded.</p>
                )}
              </div>
              <div className="review-meta">
                <StatusBadge label={formatDate(row.startedAt)} />
                {row.completedAt ? <StatusBadge label={`Completed ${formatDate(row.completedAt)}`} /> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">No raw {sourceLabel} import batches have been recorded.</p>
      )}
    </CollapsibleReviewCard>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: Date) {
  return value.toLocaleString();
}

function formatRawSummary(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
