import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { CheckCircle2, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { AdminPresence } from "@/components/admin/admin-presence";
import { EditConflictPanel } from "@/components/admin/edit-conflict-panel";
import { EditorialDraftForm } from "@/components/admin/editorial-draft-form";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ReviewEditToggle } from "@/components/admin/review-edit-toggle";
import { ReadinessAssignmentSection } from "@/components/admin/readiness-assignment-section";
import { ReviewFactGrid, ReviewSection, ReviewSubsection, ReviewWorkflow } from "@/components/admin/review-ui";
import { Prose } from "@/components/content/prose";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-access";
import { getAdminSaintCatalogScope, saintCatalogWhere, type SaintCatalogScope } from "@/lib/admin-saint-access";
import { draftString, draftStrings, getEditorialDraftMap } from "@/lib/editorial-drafts";
import { getEditorialRevisionActiveKey, placeNarrativeRevisionSchema } from "@/lib/editorial-revisions";
import { getKnownPlaceScope, STATE_PLACE_SLUGS } from "@/lib/place-taxonomy";
import { hasCapability } from "@/lib/permissions";
import {
  mergePlaces,
  publishPlaceNarrativeRevision,
  returnPlaceNarrativeRevisionToDraft,
  savePlaceNarrativeRevision,
  updatePlaceOtherPublicFields,
  updatePlaceOverview
} from "../actions";
import { PlaceOverviewEditor } from "./place-overview-editor";

type AdminPlaceEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignmentError?: string; assignmentUpdated?: string; conflict?: string; revisionError?: string; revisionUpdated?: string }>;
};

export default async function AdminPlaceEditorPage({ params, searchParams }: AdminPlaceEditorPageProps) {
  const { id } = await params;
  const { assignmentError, assignmentUpdated, conflict, revisionError, revisionUpdated } = await searchParams;
  const user = await requireAdminUser();
  const saintScope = getAdminSaintCatalogScope(user.roles);
  const canEditStructured = hasCapability(user.roles, "edit_structured_content");
  const canEditLongForm = hasCapability(user.roles, "edit_long_form_content");
  const canPublish = hasCapability(user.roles, "publish_content");
  const canMerge = hasCapability(user.roles, "manage_sensitive_actions");
  const place = await getPlace(id, saintScope);

  if (!place) notFound();

  const effectivePlaceScope = getEffectivePlaceScope(place);
  const editorialDrafts = await getEditorialDraftMap("place", place.id);
  const overviewDraft = editorialDrafts.get("overview");
  const publicFieldsDraft = editorialDrafts.get("public_fields");
  const draftPlaceScope = toPlaceScope(draftString(overviewDraft, "placeScope", effectivePlaceScope));
  const [statePlaces, localityPlaces, countryRecords, mergeOptions, narrativeRevisionRow] = await Promise.all([
    db.place.findMany({
      where: {
        id: { not: place.id },
        OR: [
          { placeScope: "state" },
          { slug: { in: Array.from(STATE_PLACE_SLUGS) } }
        ]
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, region: true, country: true, alternateNames: true }
    }),
    db.place.findMany({
      where: {
        id: { not: place.id },
        placeScope: "locality"
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, parentStateId: true, region: true, country: true, alternateNames: true }
    }),
    db.place.findMany({
      where: { country: { not: null } },
      distinct: ["country"],
      orderBy: { country: "asc" },
      select: { country: true }
    }),
    db.place.findMany({
      where: { id: { not: place.id } },
      orderBy: [
        { placeScope: "desc" },
        { name: "asc" }
      ],
      include: {
        _count: { select: { saints: { where: { saint: saintCatalogWhere(saintScope) } }, localities: true } }
      }
    }),
    db.editorialRevision.findUnique({
      where: { activeKey: getEditorialRevisionActiveKey("place", place.id) },
      include: { updatedBy: { select: { name: true, email: true } } }
    })
  ]);
  const parsedNarrativeRevision = narrativeRevisionRow ? placeNarrativeRevisionSchema.safeParse(narrativeRevisionRow.payload) : null;
  const narrativeRevision = parsedNarrativeRevision?.success ? parsedNarrativeRevision.data : null;
  const stateOptions = statePlaces.map((state) => ({
    value: state.id,
    label: state.name,
    description: [state.region, state.country].filter(Boolean).join(", ") || undefined,
    keywords: state.alternateNames
  }));
  const localityOptions = localityPlaces.map((locality) => ({
    value: locality.id,
    label: locality.name,
    description: [locality.region, locality.country].filter(Boolean).join(", ") || undefined,
    keywords: [
      locality.parentStateId,
      locality.region,
      locality.country,
      ...locality.alternateNames
    ].filter((keyword): keyword is string => Boolean(keyword))
  }));
  const countryOptions = countryRecords
    .map((record) => record.country)
    .filter((country): country is string => Boolean(country));
  const mergePlaceOptions = mergeOptions.map((option) => ({
    value: option.id,
    label: option.name,
    description: `${formatStatus(option.placeScope)}, ${option._count.saints} saints`,
    keywords: [
      option.placeScope,
      option.region,
      option.country,
      ...option.alternateNames
    ].filter((keyword): keyword is string => Boolean(keyword))
  }));

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Reviewing place</div>
          <h1>{place.name}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(effectivePlaceScope)} />
            <StatusBadge label={formatStatus(place.placeKind)} />
            <StatusBadge label={`${place._count.saints} saints`} />
            {place.parentState ? <StatusBadge label={`state: ${place.parentState.name}`} /> : null}
          </div>
          <AdminPresence entityType="place" entityId={place.id} />
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href="/admin/places">Back to places</Link>
          <Link className="button button--secondary" href={`/places/${place.slug}` as Route}>View public page</Link>
        </div>
      </div>
      <EditConflictPanel conflictId={conflict} returnTo={`/admin/places/${place.slug}`} />

      <div className="review-detail-grid review-detail-grid--decision">
        <ReviewWorkflow
          description="Confirm whether this place has enough location context for the public map and place page."
          eyebrow="Review decision"
          gridClassName="review-workflow__grid--readiness-assignment"
          title="Public Place Readiness"
        >
          <ReviewSection
            icon={<CheckCircle2 aria-hidden="true" size={18} />}
            title="Public page state"
          >
            <div className="field-grid field-grid--compact-facts">
              <ReviewField label="Place unit" value={formatStatus(effectivePlaceScope)} />
              <ReviewField label="Workflow" value={formatStatus(place.workflowStatus)} />
              <ReviewField label="Place kind" value={formatStatus(place.placeKind)} />
              <ReviewField label="Parent state" value={place.parentState?.name} />
              <ReviewField label="Localities" value={`${place.localities.length}`} />
              <ReviewField label="Saint links" value={`${place._count.saints}`} />
              <ReviewField label="Country" value={place.country} />
              <ReviewField label="Page overview" value={narrativeRevisionRow?.status === "needs_review" ? "Revision needs review" : formatMarkdownSummary(place.overviewMarkdown)} />
            </div>
          </ReviewSection>

          <ReadinessAssignmentSection
            assignmentError={assignmentError}
            assignmentUpdated={assignmentUpdated}
            contentId={place.id}
            contentType="place"
            currentUserId={user.id}
            currentUserRoles={user.roles}
            returnTo={`/admin/places/${place.slug}`}
            workflowStatus={place.workflowStatus}
          />

          <ReviewSection
            className="review-workflow__section--wide"
            icon={<MapPin aria-hidden="true" size={18} />}
            title="Review actions"
          >
            <p>Use this page to confirm map hierarchy, edit public copy, or merge duplicate place records.</p>
            <div className="review-actions">
              <Link className="button button--secondary" href={`/places/${place.slug}` as Route}>View public page</Link>
              <Link className="button button--secondary" href="/admin/places">Back to places</Link>
            </div>
          </ReviewSection>
        </ReviewWorkflow>

        {canMerge ? <CollapsibleReviewCard
          cardId="place-merge"
          description="Administrative duplicate handling for overlapping place records."
          eyebrow="Technical action"
          title="Merge Duplicate"
        >
          <p>Move saint relationships and child locality links from another record into this place.</p>
          <form action={mergePlaces} className="form-stack">
            <input name="targetPlaceId" type="hidden" value={place.id} />
            <SearchableSelect
              emptyText="No places match this search."
              label="Duplicate place"
              name="sourcePlaceId"
              options={mergePlaceOptions}
              placeholder="Search duplicate places"
              required
            />
            <div className="review-actions">
              <button className="admin-form-button admin-form-button--warning" type="submit">Merge into this place</button>
            </div>
          </form>
        </CollapsibleReviewCard> : null}
      </div>

      <CollapsibleReviewCard
        cardId="place-overview"
        defaultOpen
        description="Review the public identity and place hierarchy before editing."
        eyebrow="Place overview"
        title="Overview"
      >
        <ReviewEditToggle
          editable={canEditStructured}
          editLabel="Edit overview"
          summary={(
            <div className="field-grid">
              <ReviewField label="Name" value={place.name} />
              <ReviewField label="Alternate names" value={place.alternateNames.join(", ")} />
              <ReviewField label="Place unit" value={formatStatus(effectivePlaceScope)} />
              <ReviewField label="Place kind" value={formatStatus(place.placeKind)} />
              <ReviewField label="Parent state" value={place.parentState?.name} />
              <ReviewField label="Localities" value={formatLocalities(place.localities)} />
              <ReviewField label="Country" value={place.country} />
            </div>
          )}
        >
          <PlaceOverviewEditor
            action={updatePlaceOverview}
            alternateNames={draftString(overviewDraft, "alternateNames", place.alternateNames.join(", "))}
            country={draftString(overviewDraft, "country", place.country ?? "")}
            countryOptions={countryOptions}
            effectivePlaceScope={draftPlaceScope}
            initialDraft={overviewDraft}
            localityOptions={localityOptions}
            name={draftString(overviewDraft, "name", place.name)}
            parentStateId={draftString(overviewDraft, "parentStateId", place.parentStateId ?? "")}
            placeId={place.id}
            selectedLocalityIds={draftStrings(overviewDraft, "localityIds", place.localities.map((locality) => locality.id))}
            stateOptions={stateOptions}
            version={place.version}
          />
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="place-public-fields"
        defaultOpen
        description="Draft and review the public place narrative without replacing the overview that visitors currently see."
        eyebrow="Editorial revision"
        title="Place Narrative Draft and Review"
      >
        {revisionUpdated ? <p className="admin-notice form-status form-status--success">{formatNarrativeRevisionUpdate(revisionUpdated)}</p> : null}
        {revisionError === "published-content-changed" ? <p className="admin-notice form-status form-status--error">The published overview changed after this revision began. Return it to draft and reconcile the changes before publishing.</p> : null}
        <div className="editorial-revision-comparison">
          <ReviewSubsection eyebrow="Live public version" title="Published now" description="This overview remains public until a submitted revision is approved.">
            <ReviewFactGrid facts={[{ label: "Page overview", value: formatMarkdownSummary(place.overviewMarkdown) }]} />
          </ReviewSubsection>
          {narrativeRevisionRow && narrativeRevision ? <ReviewSubsection
            eyebrow="Working version"
            title={narrativeRevisionRow.status === "needs_review" ? "Submitted for review" : "Draft revision"}
            description={`Last updated by ${narrativeRevisionRow.updatedBy.name || narrativeRevisionRow.updatedBy.email}.`}
          >
            <div className="review-meta"><StatusBadge label={formatStatus(narrativeRevisionRow.status)} /></div>
            <ReviewFactGrid facts={[{ label: "Page overview", value: formatMarkdownSummary(narrativeRevision.overviewMarkdown) }]} />
            {narrativeRevisionRow.status === "needs_review" ? <>
              {narrativeRevision.overviewMarkdown ? <div className="editorial-revision-preview"><Prose markdown={narrativeRevision.overviewMarkdown} /></div> : null}
              {canPublish ? <div className="review-actions">
                <form action={publishPlaceNarrativeRevision}><input name="revisionId" type="hidden" value={narrativeRevisionRow.id} /><input name="placeId" type="hidden" value={place.id} /><button className="admin-form-button" type="submit">Publish revision</button></form>
                <form action={returnPlaceNarrativeRevisionToDraft}><input name="revisionId" type="hidden" value={narrativeRevisionRow.id} /><input name="placeId" type="hidden" value={place.id} /><button className="admin-form-button admin-form-button--secondary" type="submit">Return to draft</button></form>
              </div> : null}
            </> : null}
          </ReviewSubsection> : null}
        </div>
        {canEditLongForm && narrativeRevisionRow?.status !== "needs_review" ? <ReviewEditToggle
          editable
          editLabel={narrativeRevisionRow ? "Continue editing draft" : "Start a revision"}
          summary={<p>Saving or submitting this working version will not change the public place page.</p>}
        >
          <EditorialDraftForm action={savePlaceNarrativeRevision} baseVersion={place.version} className="form-stack" entityId={place.id} entityType="place" initialDraft={publicFieldsDraft} section="public_fields">
            <input name="placeId" type="hidden" value={place.id} />
            <input name="version" type="hidden" value={place.version} />
            <div className="form-stack__field">
              <label htmlFor="place-overview">Page overview</label>
              <MarkdownEditor
                defaultValue={draftString(publicFieldsDraft, "overviewMarkdown", narrativeRevision?.overviewMarkdown ?? place.overviewMarkdown ?? "")}
                maxLength={20000}
                name="overviewMarkdown"
                textareaId="place-overview"
              />
            </div>
            <div className="review-actions">
              <button className="admin-form-button admin-form-button--secondary" name="intent" value="save_draft" type="submit">Save draft</button>
              <button className="admin-form-button" name="intent" value="submit_review" type="submit">Submit for review</button>
            </div>
          </EditorialDraftForm>
        </ReviewEditToggle> : null}

        <ReviewEditToggle
          editable={canEditStructured}
          editLabel="Edit internal notes"
          summary={<ReviewFactGrid facts={[{ label: "Internal notes", value: place.notes }]} />}
        >
          <form action={updatePlaceOtherPublicFields} className="form-stack">
            <input name="placeId" type="hidden" value={place.id} />
            <input name="version" type="hidden" value={place.version} />
            <label>Internal notes<textarea name="notes" defaultValue={place.notes ?? ""} maxLength={1000} /></label>
            <div className="review-actions"><button className="admin-form-button admin-form-button--secondary" type="submit">Save internal notes</button></div>
          </form>
        </ReviewEditToggle>
      </CollapsibleReviewCard>
    </div>
  );
}

async function getPlace(slugOrId: string, saintScope: SaintCatalogScope) {
  return db.place.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: {
      parentState: { select: { id: true, name: true, slug: true } },
      localities: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true }
      },
      _count: { select: { saints: { where: { saint: saintCatalogWhere(saintScope) } } } }
    }
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatNarrativeRevisionUpdate(value: string) {
  if (value === "submitted") return "Place narrative submitted for review. The public page is unchanged.";
  if (value === "published") return "Place narrative revision published.";
  if (value === "returned") return "Place narrative revision returned to draft.";
  return "Place narrative draft saved. The public page is unchanged.";
}

function toPlaceScope(value: string): "locality" | "state" | "country" {
  return value === "state" || value === "country" ? value : "locality";
}

function ReviewField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="review-field">
      <strong>{label}</strong>
      <span>{value || "Not set"}</span>
    </div>
  );
}

function formatMarkdownSummary(value?: string | null) {
  if (!value?.trim()) return undefined;
  return `${value.trim().length.toLocaleString()} characters`;
}

function formatLocalities(localities: Array<{ name: string }>) {
  return localities.map((locality) => locality.name).join(", ");
}

function getEffectivePlaceScope(place: { placeScope: "locality" | "state" | "country"; slug: string }) {
  return getKnownPlaceScope(place.slug) === "state" ? "state" : place.placeScope;
}
