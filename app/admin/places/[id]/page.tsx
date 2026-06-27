import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { CheckCircle2, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ReviewEditToggle } from "@/components/admin/review-edit-toggle";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getKnownPlaceScope, STATE_PLACE_SLUGS } from "@/lib/place-taxonomy";
import { mergePlaces, updatePlaceOtherPublicFields, updatePlaceOverview } from "../actions";
import { PlaceOverviewEditor } from "./place-overview-editor";

type AdminPlaceEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPlaceEditorPage({ params }: AdminPlaceEditorPageProps) {
  const { id } = await params;
  const place = await getPlace(id);

  if (!place) notFound();

  const effectivePlaceScope = getEffectivePlaceScope(place);
  const [statePlaces, localityPlaces, countryRecords, mergeOptions] = await Promise.all([
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
        _count: { select: { saints: true, localities: true } }
      }
    })
  ]);
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
            <StatusBadge label={`${place._count.saints} saints`} />
            {place.parentState ? <StatusBadge label={`state: ${place.parentState.name}`} /> : null}
          </div>
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href="/admin/places">Back to places</Link>
          <Link className="button button--secondary" href={`/places/${place.slug}` as Route}>View public page</Link>
        </div>
      </div>

      <div className="review-detail-grid review-detail-grid--decision">
        <ReviewWorkflow
          description="Confirm whether this place has enough location context for the public map and place page."
          eyebrow="Review decision"
          gridClassName="review-workflow__grid--tradition-readiness"
          title="Public Place Readiness"
        >
          <ReviewSection
            icon={<CheckCircle2 aria-hidden="true" size={18} />}
            title="Public page state"
          >
            <div className="field-grid field-grid--compact-facts">
              <ReviewField label="Place unit" value={formatStatus(effectivePlaceScope)} />
              <ReviewField label="Parent state" value={place.parentState?.name} />
              <ReviewField label="Localities" value={`${place.localities.length}`} />
              <ReviewField label="Saint links" value={`${place._count.saints}`} />
              <ReviewField label="Country" value={place.country} />
              <ReviewField label="Page overview" value={formatMarkdownSummary(place.overviewMarkdown)} />
            </div>
          </ReviewSection>

          <ReviewSection
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

        <CollapsibleReviewCard
          cardId="place-merge"
          defaultOpen
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
        </CollapsibleReviewCard>
      </div>

      <CollapsibleReviewCard
        cardId="place-overview"
        defaultOpen
        description="Review the public identity and place hierarchy before editing."
        eyebrow="Place overview"
        title="Overview"
      >
        <ReviewEditToggle
          editLabel="Edit overview"
          summary={(
            <div className="field-grid">
              <ReviewField label="Name" value={place.name} />
              <ReviewField label="Alternate names" value={place.alternateNames.join(", ")} />
              <ReviewField label="Place unit" value={formatStatus(effectivePlaceScope)} />
              <ReviewField label="Parent state" value={place.parentState?.name} />
              <ReviewField label="Localities" value={formatLocalities(place.localities)} />
              <ReviewField label="Country" value={place.country} />
            </div>
          )}
        >
          <PlaceOverviewEditor
            action={updatePlaceOverview}
            alternateNames={place.alternateNames}
            country={place.country ?? ""}
            countryOptions={countryOptions}
            effectivePlaceScope={effectivePlaceScope}
            localityOptions={localityOptions}
            name={place.name}
            parentStateId={place.parentStateId ?? ""}
            placeId={place.id}
            selectedLocalityIds={place.localities.map((locality) => locality.id)}
            stateOptions={stateOptions}
          />
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="place-public-fields"
        defaultOpen={!place.overviewMarkdown}
        description="Public place narrative and internal editorial notes."
        eyebrow="Public content"
        title="Public Fields"
      >
        <ReviewEditToggle
          editLabel="Edit public fields"
          summary={(
            <div className="field-grid">
              <ReviewField label="Page overview" value={formatMarkdownSummary(place.overviewMarkdown)} />
              <ReviewField label="Internal notes" value={place.notes} />
            </div>
          )}
        >
          <form action={updatePlaceOtherPublicFields} className="form-stack">
            <input name="placeId" type="hidden" value={place.id} />
            <div className="form-stack__field">
              <label htmlFor="place-overview">Page overview</label>
              <MarkdownEditor
                defaultValue={place.overviewMarkdown ?? ""}
                maxLength={20000}
                name="overviewMarkdown"
                textareaId="place-overview"
              />
            </div>
            <label>
              Internal notes
              <textarea name="notes" defaultValue={place.notes ?? ""} maxLength={1000} />
            </label>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save public fields</button>
            </div>
          </form>
        </ReviewEditToggle>
      </CollapsibleReviewCard>
    </div>
  );
}

async function getPlace(slugOrId: string) {
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
      _count: { select: { saints: true } }
    }
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
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

function getEffectivePlaceScope(place: { placeScope: "locality" | "state"; slug: string }) {
  return getKnownPlaceScope(place.slug) === "state" ? "state" : place.placeScope;
}
