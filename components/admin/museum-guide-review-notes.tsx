import type {GuideEntry} from "@/lib/spn-move-guide";

export function MuseumGuideReviewNotes({entry}: {entry: GuideEntry}) {
  if (!entry.reviewNotes?.length) return null;
  if (!entry.reviewNotesCollapsible) return <>{entry.reviewNotes.map(note => <small key={note}>{note}</small>)}</>;
  return <details className="museum-shelf__alert">
    <summary aria-label={`Review placement notes for ${entry.name}`}>!</summary>
    {entry.reviewNotes.map(note => <p key={note}>{note}</p>)}
  </details>;
}
