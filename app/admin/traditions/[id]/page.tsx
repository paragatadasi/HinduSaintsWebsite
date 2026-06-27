import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { CheckCircle2, GitBranch } from "lucide-react";
import type { ReactNode } from "react";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ReviewEditToggle } from "@/components/admin/review-edit-toggle";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import {
  mergeTraditions,
  updateTraditionHeroImage,
  updateTraditionLineage,
  updateTraditionOtherPublicFields,
  updateTraditionOverview,
  updateTraditionRelatedLinks,
  updateTraditionScripturalBasis,
  updateTraditionReviewStatus
} from "../actions";
import { TraditionImageActions } from "./tradition-image-actions";
import { TraditionImageUploader } from "./tradition-image-uploader";
import { TraditionLineageEditor } from "./tradition-lineage-editor";
import { TraditionRelatedLinksEditor } from "./tradition-related-links-editor";
import { TraditionScripturalBasisEditor } from "./tradition-scriptural-basis-editor";

type AdminTraditionEditorPageProps = {
  params: Promise<{ id: string }>;
};

type SelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

export default async function AdminTraditionEditorPage({ params }: AdminTraditionEditorPageProps) {
  const { id } = await params;
  const tradition = await getTradition(id);

  if (!tradition) notFound();

  const [allTraditions, allSaints, allPlaces, allSources] = await Promise.all([
    db.tradition.findMany({
      where: { id: { not: tradition.id } },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { saints: true, childTraditions: true } }
      }
    }),
    db.saint.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, canonicalName: true, status: true }
    }),
    db.place.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, region: true, country: true }
    }),
    db.source.findMany({
      orderBy: [
        { sourceType: "asc" },
        { title: "asc" }
      ],
      select: { id: true, title: true, sourceType: true, author: true, url: true }
    })
  ]);
  const saintOptions: SelectOption[] = allSaints.map((saint) => ({
    value: saint.id,
    label: saint.displayName,
    description: `${saint.canonicalName} - ${formatStatus(saint.status)}`,
    keywords: [saint.canonicalName, saint.status]
  }));
  const placeOptions: SelectOption[] = allPlaces.map((place) => ({
    value: place.id,
    label: place.name,
    description: [place.region, place.country].filter(Boolean).join(", ") || undefined,
    keywords: [place.region, place.country].filter((keyword): keyword is string => Boolean(keyword))
  }));
  const traditionOptions: SelectOption[] = allTraditions.map((option) => ({
    value: option.id,
    label: option.name,
    description: `${option._count.saints} saints`,
    keywords: [option.slug, ...option.alternateNames]
  }));
  const sourceOptions: SelectOption[] = allSources.map((source) => ({
    value: source.id,
    label: source.title,
    description: [formatStatus(source.sourceType), source.author].filter(Boolean).join(" - ") || undefined,
    keywords: [source.sourceType, source.author, source.url].filter((keyword): keyword is string => Boolean(keyword))
  }));
  const visibleGalleryImages = tradition.galleryImages.filter((image) => image.publicVisible !== false);
  const hiddenGalleryImages = tradition.galleryImages.filter((image) => image.publicVisible === false);
  const editorImages = getMarkdownEditorImages(tradition);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Reviewing tradition</div>
          <h1>{tradition.name}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(tradition.status)} />
            <StatusBadge label={`${tradition._count.saints} saint links`} />
            <StatusBadge label={`${tradition.lineageSaints.length} lineage saints`} />
            {tradition.parentTradition ? <StatusBadge label={`parent: ${tradition.parentTradition.name}`} /> : null}
          </div>
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href="/admin/traditions">Back to traditions</Link>
          {tradition.status === "published" ? (
            <Link className="button button--secondary" href={`/traditions/${tradition.slug}` as Route}>View public page</Link>
          ) : null}
        </div>
      </div>

      <div className="review-detail-grid review-detail-grid--decision">
        <ReviewWorkflow
          className="review-panel--tradition-readiness"
          description="Confirm whether the tradition page has enough reviewed content, then choose the publication outcome."
          eyebrow="Review decision"
          gridClassName="review-workflow__grid--tradition-readiness"
          title="Public Tradition Readiness"
        >
          <ReviewSection
            icon={<CheckCircle2 aria-hidden="true" size={18} />}
            title="Publish state"
          >
            <div className="field-grid field-grid--compact-facts">
              <ReviewField label="Current status" value={formatStatus(tradition.status)} />
              <ReviewField label="Overview" value={tradition.shortDescription ? "Ready" : "Needs summary"} />
              <ReviewField label="Founder" value={tradition.founderSaint?.displayName ?? tradition.founderDisplayName} />
              <ReviewField label="Origin" value={tradition.originPlace?.name ?? tradition.originPlaceLabel ?? tradition.origin} />
              <ReviewField label="Long-form sections" value={`${countLongFormSections(tradition)} of 3`} />
              <ReviewField label="Public images" value={`${visibleGalleryImages.length + (tradition.heroImage ? 1 : 0)}`} />
            </div>
          </ReviewSection>

          <ReviewSection
            icon={<GitBranch aria-hidden="true" size={18} />}
            title="Review actions"
          >
            <p>Publishing makes reviewed tradition content visible on the public home page, index, and detail routes.</p>
            <div className="review-actions">
              <StatusForm traditionId={tradition.id} status="published" label="Approve and publish" />
              <StatusForm traditionId={tradition.id} status="needs_review" label="Return to review" variant="secondary" />
              <StatusForm traditionId={tradition.id} status="archived" label="Archive" variant="warning" />
            </div>
          </ReviewSection>
        </ReviewWorkflow>

        <CollapsibleReviewCard
          cardId="tradition-merge"
          defaultOpen
          description="Administrative duplicate handling for imported or overlapping records."
          eyebrow="Technical action"
          title="Merge Duplicate"
        >
          <p>Move saint relationships, source links, lineage, scriptural basis, and child tradition links from another record into this tradition.</p>
          <form action={mergeTraditions} className="form-stack">
            <input name="targetTraditionId" type="hidden" value={tradition.id} />
            <SearchableSelect
              emptyText="No traditions match this search."
              label="Duplicate tradition"
              name="sourceTraditionId"
              options={traditionOptions}
              placeholder="Search duplicate traditions"
              required
            />
            <div className="review-actions">
              <button className="admin-form-button admin-form-button--warning" type="submit">Merge into this tradition</button>
            </div>
          </form>
        </CollapsibleReviewCard>
      </div>

      <CollapsibleReviewCard
        cardId="tradition-overview"
        defaultOpen
        description="Review the public identity and tradition relationships before editing."
        eyebrow="Profile overview"
        title="Overview"
      >
        <ReviewEditToggle
          editLabel="Edit overview"
          summary={(
            <div className="field-grid">
              <ReviewField label="Name" value={tradition.name} />
              <ReviewField label="Alternate names" value={tradition.alternateNames.join(", ")} />
              <ReviewField label="Parent tradition" value={tradition.parentTradition?.name} />
              <ReviewField label="Child traditions" value={tradition.childTraditions.map((child) => child.name).join(", ")} />
              <ReviewField label="Short description" value={tradition.shortDescription} />
            </div>
          )}
        >
          <form action={updateTraditionOverview} className="form-stack">
            <input name="traditionId" type="hidden" value={tradition.id} />
            <input name="status" type="hidden" value={tradition.status} />
            <div className="field-grid field-grid--identity-line">
              <label>
                Name
                <input name="name" defaultValue={tradition.name} required maxLength={200} />
              </label>
              <label>
                Alternate names
                <input name="alternateNames" defaultValue={tradition.alternateNames.join(", ")} maxLength={2000} />
              </label>
            </div>
            <div className="field-grid">
              <SearchableSelect
                defaultValue={tradition.parentTraditionId ?? ""}
                emptyText="No traditions match this search."
                label="Parent tradition"
                name="parentTraditionId"
                options={[{ value: "", label: "No parent tradition" }, ...traditionOptions]}
                placeholder="Search traditions"
              />
              <div className="review-field">
                <strong>Child traditions</strong>
                <span>{tradition.childTraditions.map((child) => child.name).join(", ") || "Not set"}</span>
              </div>
            </div>
            <label>
              Short description
              <textarea name="shortDescription" defaultValue={tradition.shortDescription ?? ""} maxLength={500} />
            </label>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save overview</button>
            </div>
          </form>
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="tradition-public-fields"
        defaultOpen
        description="Founder, origin, focus, and SEO fields used by the public tradition page."
        eyebrow="Profile metadata"
        title="Public Fields"
      >
        <ReviewEditToggle
          editLabel="Edit public fields"
          summary={(
            <div className="field-grid">
              <ReviewField label="Founder saint" value={tradition.founderSaint?.displayName} />
              <ReviewField label="Founder display override" value={tradition.founderDisplayName} />
              <ReviewField label="Origin" value={tradition.origin} />
              <ReviewField label="Era label" value={tradition.eraLabel} />
              <ReviewField label="Focus" value={tradition.focus} />
              <ReviewField label="Origin place" value={formatPlaceName(tradition.originPlace)} />
              <ReviewField label="Origin place label override" value={tradition.originPlaceLabel} />
              <ReviewField label="SEO title" value={tradition.seoTitle} />
              <ReviewField label="SEO description" value={tradition.seoDescription} />
            </div>
          )}
        >
          <form action={updateTraditionOtherPublicFields} className="form-stack">
            <input name="traditionId" type="hidden" value={tradition.id} />
            <div className="field-grid">
              <SearchableSelect
                defaultValue={tradition.founderSaintId ?? ""}
                emptyText="No saints match this search."
                label="Founder saint"
                name="founderSaintId"
                options={[{ value: "", label: "No linked founder saint" }, ...saintOptions]}
                placeholder="Search saints"
              />
              <label>
                Founder display override
                <input name="founderDisplayName" defaultValue={tradition.founderDisplayName ?? ""} maxLength={200} />
              </label>
              <label>
                Origin
                <input name="origin" defaultValue={tradition.origin ?? ""} maxLength={200} />
              </label>
              <label>
                Era label
                <input name="eraLabel" defaultValue={tradition.eraLabel ?? ""} maxLength={120} />
              </label>
              <label>
                Focus
                <input name="focus" defaultValue={tradition.focus ?? ""} maxLength={300} />
              </label>
              <SearchableSelect
                defaultValue={tradition.originPlaceId ?? ""}
                emptyText="No places match this search."
                label="Origin place"
                name="originPlaceId"
                options={[{ value: "", label: "No linked origin place" }, ...placeOptions]}
                placeholder="Search places"
              />
              <label>
                Origin place label override
                <input name="originPlaceLabel" defaultValue={tradition.originPlaceLabel ?? ""} maxLength={200} />
              </label>
              <label>
                SEO title
                <input name="seoTitle" defaultValue={tradition.seoTitle ?? ""} maxLength={120} />
              </label>
              <label>
                SEO description
                <textarea name="seoDescription" defaultValue={tradition.seoDescription ?? ""} maxLength={300} />
              </label>
            </div>
            <input name="foundingAcharyaMarkdown" type="hidden" value={tradition.foundingAcharyaMarkdown ?? ""} />
            <input name="historyMarkdown" type="hidden" value={tradition.historyMarkdown ?? tradition.longIntroductionMarkdown ?? ""} />
            <input name="keyTeachingsMarkdown" type="hidden" value={tradition.keyTeachingsMarkdown ?? ""} />
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save public fields</button>
            </div>
          </form>
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="tradition-lineage"
        defaultOpen={tradition.lineageSaints.length === 0}
        description="Lineage saints, roles, parent relationships, and display order."
        eyebrow="Lineage context"
        title="Lineage Saints"
      >
        <ReviewEditToggle
          editLabel="Edit lineage"
          summary={(
            tradition.lineageSaints.length > 0 ? (
              <div className="review-list">
                {tradition.lineageSaints.map((item) => (
                  <div className="review-row" key={item.id}>
                    <div className="field-grid">
                      <ReviewField label="Saint" value={item.saint.displayName} />
                      <ReviewField label="Role" value={item.roleLabel} />
                      <ReviewField label="Parent saint" value={item.parentSaint?.displayName} />
                      <ReviewField label="Sort order" value={`${item.sortOrder}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No lineage saints are attached.</p>
            )
          )}
        >
          <TraditionLineageEditor
            action={updateTraditionLineage}
            rows={buildLineageRows(tradition.lineageSaints)}
            saintOptions={saintOptions}
            traditionId={tradition.id}
          />
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="tradition-long-form"
        description="Founding acharya, history, and teachings shown on the public tradition page."
        eyebrow="Long-form content"
        title="Tradition Sections"
      >
        <ReviewEditToggle
          editLabel="Edit sections"
          summary={(
            <div className="field-grid">
              <ReviewField label="Founding Acharya" value={formatMarkdownSummary(tradition.foundingAcharyaMarkdown)} />
              <ReviewField label="History" value={formatMarkdownSummary(tradition.historyMarkdown ?? tradition.longIntroductionMarkdown)} />
              <ReviewField label="Key Teachings" value={formatMarkdownSummary(tradition.keyTeachingsMarkdown)} />
            </div>
          )}
        >
          <form action={updateTraditionOtherPublicFields} className="form-stack">
            <input name="traditionId" type="hidden" value={tradition.id} />
            <input name="founderSaintId" type="hidden" value={tradition.founderSaintId ?? ""} />
            <input name="founderDisplayName" type="hidden" value={tradition.founderDisplayName ?? ""} />
            <input name="origin" type="hidden" value={tradition.origin ?? ""} />
            <input name="eraLabel" type="hidden" value={tradition.eraLabel ?? ""} />
            <input name="focus" type="hidden" value={tradition.focus ?? ""} />
            <input name="originPlaceId" type="hidden" value={tradition.originPlaceId ?? ""} />
            <input name="originPlaceLabel" type="hidden" value={tradition.originPlaceLabel ?? ""} />
            <input name="seoTitle" type="hidden" value={tradition.seoTitle ?? ""} />
            <input name="seoDescription" type="hidden" value={tradition.seoDescription ?? ""} />
            <div className="form-stack__field">
              <label htmlFor="tradition-founding-acharya">Founding Acharya</label>
              <MarkdownEditor
                defaultValue={tradition.foundingAcharyaMarkdown ?? ""}
                images={editorImages}
                maxLength={20000}
                name="foundingAcharyaMarkdown"
                textareaId="tradition-founding-acharya"
              />
            </div>
            <div className="form-stack__field">
              <label htmlFor="tradition-history">History</label>
              <MarkdownEditor
                defaultValue={tradition.historyMarkdown ?? tradition.longIntroductionMarkdown ?? ""}
                images={editorImages}
                maxLength={20000}
                name="historyMarkdown"
                textareaId="tradition-history"
              />
            </div>
            <div className="form-stack__field">
              <label htmlFor="tradition-key-teachings">Key Teachings</label>
              <MarkdownEditor
                defaultValue={tradition.keyTeachingsMarkdown ?? ""}
                images={editorImages}
                maxLength={20000}
                name="keyTeachingsMarkdown"
                textareaId="tradition-key-teachings"
              />
            </div>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save tradition sections</button>
            </div>
          </form>
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="tradition-related-links"
        description="Manual sidebar links near the tradition hierarchy and geography they affect."
        eyebrow="Related context"
        title="Related Sidebar Links"
      >
        <ReviewEditToggle
          editLabel="Edit related links"
          summary={(
            <div className="field-grid">
              <ReviewField label="Parent tradition" value={tradition.parentTradition?.name} />
              <ReviewField label="Child traditions" value={tradition.childTraditions.map((child) => child.name).join(", ")} />
              <ReviewField label="Manual related traditions" value={tradition.relatedTraditions.map((item) => item.label || item.relatedTradition.name).join(", ")} />
              <ReviewField label="Related places" value={tradition.relatedPlaces.map((item) => item.label || item.place.name).join(", ")} />
            </div>
          )}
        >
          <TraditionRelatedLinksEditor
            action={updateTraditionRelatedLinks}
            placeOptions={placeOptions}
            relatedPlaces={buildRelatedPlaceRows(tradition.relatedPlaces)}
            relatedTraditions={buildRelatedTraditionRows(tradition.relatedTraditions)}
            traditionId={tradition.id}
            traditionOptions={traditionOptions}
          />
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="tradition-scriptural-basis"
        description="Reviewed source references and display notes."
        eyebrow="References"
        title="Scriptural Basis"
      >
        <ReviewEditToggle
          editLabel="Edit scriptural basis"
          summary={(
            tradition.scripturalBasis.length > 0 ? (
              <div className="review-list">
                {tradition.scripturalBasis.map((item) => (
                  <div className="review-row" key={item.id}>
                    <div className="field-grid">
                      <ReviewField label="Display title" value={item.title} />
                      <ReviewField label="Reviewed source" value={item.source?.title} />
                      <ReviewField label="URL override" value={item.url} />
                      <ReviewField label="Note" value={item.note} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No scriptural basis links have been attached.</p>
            )
          )}
        >
          <TraditionScripturalBasisEditor
            action={updateTraditionScripturalBasis}
            rows={buildScripturalBasisRows(tradition.scripturalBasis)}
            sourceOptions={sourceOptions}
            traditionId={tradition.id}
          />
        </ReviewEditToggle>
      </CollapsibleReviewCard>

      <CollapsibleReviewCard
        cardId="tradition-media"
        defaultOpen={!tradition.heroImage && visibleGalleryImages.length === 0}
        description="Hero image, public gallery images, hidden staged images, and uploads."
        eyebrow="Media"
        title="Tradition Media"
      >
        {tradition.heroImage ? (
          <figure className="image-with-credit image-with-credit--admin">
            <img src={tradition.heroImage.url} alt={tradition.heroImage.altText ?? tradition.name} width={tradition.heroImage.width ?? undefined} height={tradition.heroImage.height ?? undefined} />
            <figcaption>
              <span>{tradition.heroImage.caption ?? "Hero tradition image"}</span>
              {tradition.heroImage.sourceUrl ? <small>Source preserved</small> : null}
            </figcaption>
          </figure>
        ) : null}
        <form action={updateTraditionHeroImage} className="form-stack">
          <input name="traditionId" type="hidden" value={tradition.id} />
          <label>
            Hero image from gallery
            <select name="mediaAssetId" defaultValue={tradition.heroImageId ?? ""}>
              <option value="">No hero image</option>
              {visibleGalleryImages.map(({ mediaAsset }) => (
                <option key={mediaAsset.id} value={mediaAsset.id}>{mediaAsset.caption ?? mediaAsset.altText ?? "Tradition image"}</option>
              ))}
            </select>
          </label>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Save hero image</button>
          </div>
        </form>

        {visibleGalleryImages.length > 0 ? (
          <div className="media-grid">
            {visibleGalleryImages.map(({ mediaAsset }) => (
              <figure className="image-with-credit image-with-credit--admin" key={mediaAsset.id}>
                <img src={mediaAsset.url} alt={mediaAsset.altText ?? tradition.name} width={mediaAsset.width ?? undefined} height={mediaAsset.height ?? undefined} />
                <figcaption>
                  <span>{mediaAsset.caption ?? "Tradition gallery image"}</span>
                  {mediaAsset.sourceUrl ? <small>Source preserved</small> : null}
                  <TraditionImageActions
                    imageLabel={mediaAsset.caption ?? mediaAsset.altText ?? "Tradition gallery image"}
                    mediaAssetId={mediaAsset.id}
                    traditionId={tradition.id}
                    visible
                  />
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p>No public tradition gallery images have been attached.</p>
        )}

        {hiddenGalleryImages.length > 0 ? (
          <div className="review-panel__subsection">
            <h3>Hidden images</h3>
            <div className="media-grid">
              {hiddenGalleryImages.map(({ mediaAsset }) => (
                <figure className="image-with-credit image-with-credit--admin" key={mediaAsset.id}>
                  <img src={mediaAsset.url} alt={mediaAsset.altText ?? tradition.name} width={mediaAsset.width ?? undefined} height={mediaAsset.height ?? undefined} />
                  <figcaption>
                    <span>{mediaAsset.caption ?? "Hidden tradition image"}</span>
                    <TraditionImageActions
                      imageLabel={mediaAsset.caption ?? mediaAsset.altText ?? "Hidden tradition image"}
                      mediaAssetId={mediaAsset.id}
                      traditionId={tradition.id}
                      visible={false}
                    />
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        <div className="review-panel__subsection">
          <h3>Add image</h3>
          <TraditionImageUploader defaultAltText={`${tradition.name} tradition image`} traditionId={tradition.id} />
        </div>
      </CollapsibleReviewCard>
    </div>
  );
}

async function getTradition(slugOrId: string) {
  return db.tradition.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: {
      founderSaint: { select: { id: true, displayName: true } },
      heroImage: true,
      originPlace: { select: { id: true, name: true, region: true, country: true } },
      parentTradition: { select: { id: true, name: true, slug: true } },
      childTraditions: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true }
      },
      galleryImages: {
        include: { mediaAsset: true },
        orderBy: { sortOrder: "asc" }
      },
      lineageSaints: {
        include: {
          saint: { select: { id: true, displayName: true } },
          parentSaint: { select: { id: true, displayName: true } }
        },
        orderBy: { sortOrder: "asc" }
      },
      relatedTraditions: {
        include: {
          relatedTradition: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { sortOrder: "asc" }
      },
      relatedPlaces: {
        include: {
          place: { select: { id: true, name: true, region: true, country: true } }
        },
        orderBy: { sortOrder: "asc" }
      },
      scripturalBasis: {
        include: {
          source: { select: { id: true, title: true, sourceType: true, url: true } }
        },
        orderBy: { sortOrder: "asc" }
      },
      _count: { select: { saints: true } }
    }
  });
}

function StatusForm({
  traditionId,
  status,
  label,
  variant = "primary"
}: {
  traditionId: string;
  status: "needs_review" | "published" | "archived";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  const className = [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");

  return (
    <form action={updateTraditionReviewStatus}>
      <input name="traditionId" type="hidden" value={traditionId} />
      <input name="status" type="hidden" value={status} />
      <button className={className} type="submit">{label}</button>
    </form>
  );
}

function getMarkdownEditorImages(tradition: NonNullable<Awaited<ReturnType<typeof getTradition>>>) {
  const images = new Map<string, {
    altText: string;
    caption: string;
    id: string;
    url: string;
  }>();

  if (tradition.heroImage) {
    images.set(tradition.heroImage.id, {
      altText: tradition.heroImage.altText ?? tradition.name,
      caption: tradition.heroImage.caption ?? "Hero tradition image",
      id: tradition.heroImage.id,
      url: tradition.heroImage.url
    });
  }

  tradition.galleryImages
    .filter((image) => image.publicVisible !== false)
    .forEach(({ mediaAsset }) => {
      images.set(mediaAsset.id, {
        altText: mediaAsset.altText ?? tradition.name,
        caption: mediaAsset.caption ?? "Tradition gallery image",
        id: mediaAsset.id,
        url: mediaAsset.url
      });
    });

  return Array.from(images.values());
}

function ReviewField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="review-field">
      <strong>{label}</strong>
      <span>{value || "Not set"}</span>
    </div>
  );
}

function countLongFormSections(tradition: NonNullable<Awaited<ReturnType<typeof getTradition>>>) {
  return [
    tradition.foundingAcharyaMarkdown,
    tradition.historyMarkdown ?? tradition.longIntroductionMarkdown,
    tradition.keyTeachingsMarkdown
  ].filter((value) => Boolean(value?.trim())).length;
}

function formatMarkdownSummary(value?: string | null) {
  if (!value?.trim()) return undefined;
  return `${value.trim().length.toLocaleString()} characters`;
}

function formatPlaceName(place?: { name: string; region: string | null; country: string | null } | null) {
  if (!place) return undefined;
  const location = [place.region, place.country].filter(Boolean).join(", ");
  return location ? `${place.name} (${location})` : place.name;
}

function buildLineageRows(lineage: NonNullable<Awaited<ReturnType<typeof getTradition>>>["lineageSaints"]) {
  return lineage.map((item) => ({
    key: item.id,
    saintId: item.saintId,
    roleLabel: item.roleLabel ?? "",
    parentSaintId: item.parentSaintId ?? "",
    sortOrder: item.sortOrder
  }));
}

function buildRelatedTraditionRows(links: NonNullable<Awaited<ReturnType<typeof getTradition>>>["relatedTraditions"]) {
  return links.map((item) => ({
    key: item.id,
    relatedTraditionId: item.relatedTraditionId,
    label: item.label ?? "",
    sortOrder: item.sortOrder
  }));
}

function buildRelatedPlaceRows(links: NonNullable<Awaited<ReturnType<typeof getTradition>>>["relatedPlaces"]) {
  return links.map((item) => ({
    key: item.id,
    placeId: item.placeId,
    label: item.label ?? "",
    sortOrder: item.sortOrder
  }));
}

function buildScripturalBasisRows(links: NonNullable<Awaited<ReturnType<typeof getTradition>>>["scripturalBasis"]) {
  return links.map((item) => ({
    key: item.id,
    title: item.title,
    sourceId: item.sourceId ?? "",
    url: item.url ?? "",
    note: item.note ?? "",
    sortOrder: item.sortOrder
  }));
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
