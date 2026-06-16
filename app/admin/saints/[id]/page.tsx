import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { db } from "@/lib/db";
import { getInstagramLinkProps } from "@/lib/external-links";
import { parseImportedDate } from "@/lib/import-dates";
import { getInstagramImageUrls } from "@/lib/instagram";
import {
  removeSaintSource,
  reviewSaintInstagramClaim,
  updateSaintAliases,
  updateSaintBasics,
  updateSaintReviewStatus,
  updateSaintTraditions,
  upsertSaintBiography,
  upsertSaintSource
} from "../actions";
import { SaintImageActions } from "./saint-image-actions";
import { SaintImageCropper } from "./saint-image-cropper";
import { SaintPlaceRouteEditor, type SaintPlaceRouteOption } from "./saint-place-route-editor";

type AdminSaintEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSaintEditorPage({ params }: AdminSaintEditorPageProps) {
  const { id } = await params;
  const saint = await getSaint(id);

  if (!saint) notFound();

  const [externalRecord, allTraditions, allPlaces, sourceLinks] = await Promise.all([
    db.externalRecord.findFirst({
      where: { sourceType: "airtable", entityType: "Saint", entityId: saint.id },
      select: { externalId: true, lastSeenAt: true }
    }),
    db.tradition.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
    db.place.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, region: true, country: true } }),
    db.contentSource.findMany({
      where: { entityType: "Saint", entityId: saint.id },
      include: { source: true },
      orderBy: { sortOrder: "asc" }
    })
  ]);
  const trackerRows = externalRecord ? await getTrackerRows(externalRecord.externalId) : [];
  const instagramImages = await getInstagramImagesForSaint(saint);
  const visibleGalleryImages = saint.galleryImages.filter((image) => image.publicVisible !== false);
  const hiddenGalleryImages = saint.galleryImages.filter((image) => image.publicVisible === false);
  const biographyImages = getBiographyEditorImages(saint, visibleGalleryImages);
  const primaryBiography = saint.biographies.find((biography) => biography.status === "published") ?? saint.biographies[0];
  const selectedTraditionIds = saint.traditions.map((item) => item.traditionId);
  const traditionOptions = allTraditions.map((tradition) => ({
    value: tradition.id,
    label: tradition.name,
    description: formatStatus(tradition.status)
  }));
  const placeLinksByPlaceId = new Map(saint.places.map((place) => [place.placeId, place]));
  const selectedPlaceIds = saint.places.map((place) => place.placeId);
  const placeOptions: SaintPlaceRouteOption[] = allPlaces.map((place) => {
    const link = placeLinksByPlaceId.get(place.id);

    return {
      value: place.id,
      label: place.name,
      description: formatPlaceLocation(place),
      keywords: [place.region, place.country].filter((value): value is string => Boolean(value)),
      placeType: link?.placeType ?? "associated",
      routeLabel: link?.routeLabel,
      routeOrder: link?.routeOrder
    };
  });

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Reviewing saint</div>
          <h1>{saint.displayName}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(saint.status)} />
            {saint.hasInstagramContent ? <StatusBadge label="Instagram content" /> : null}
            {externalRecord ? <StatusBadge label="Airtable linked" /> : null}
          </div>
        </div>
        {saint.status === "published" ? (
          <Link className="button button--secondary" href={`/saints/${saint.slug}`}>View public page</Link>
        ) : null}
      </div>

      <div className="review-detail-grid">
        <section className="review-panel">
          <h2>Public Fields</h2>
          <form action={updateSaintBasics} className="form-stack">
            <input name="saintId" type="hidden" value={saint.id} />
            <label>
              Display name
              <input name="displayName" defaultValue={saint.displayName} required maxLength={200} />
            </label>
            <label>
              Canonical name
              <input name="canonicalName" defaultValue={saint.canonicalName} required maxLength={200} />
            </label>
            <label>
              Short description
              <textarea name="shortDescription" defaultValue={saint.shortDescription ?? ""} maxLength={500} />
            </label>
            <label>
              Era label
              <input name="eraLabel" defaultValue={saint.eraLabel ?? ""} maxLength={120} />
            </label>
            <label>
              Birth date
              <input name="birthDateRaw" defaultValue={saint.birthDateRaw ?? ""} maxLength={120} />
            </label>
            <label>
              Samadhi date
              <input name="samadhiDateRaw" defaultValue={saint.samadhiDateRaw ?? ""} maxLength={120} />
            </label>
            <label>
              Date notes
              <textarea name="dateNotes" defaultValue={saint.dateNotes ?? ""} maxLength={1000} />
            </label>
            <label>
              SEO title
              <input name="seoTitle" defaultValue={saint.seoTitle ?? ""} maxLength={120} />
            </label>
            <label>
              SEO description
              <textarea name="seoDescription" defaultValue={saint.seoDescription ?? ""} maxLength={300} />
            </label>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save review edits</button>
            </div>
          </form>

          <div className="review-panel__subsection">
            <h3>Traditions</h3>
            <form action={updateSaintTraditions} className="form-stack">
              <input name="saintId" type="hidden" value={saint.id} />
              <SearchableMultiSelect
                defaultSelectedValues={selectedTraditionIds}
                emptyText="No traditions match this search."
                label="Traditions"
                name="traditionIds"
                options={traditionOptions}
                placeholder="Search traditions"
                primaryName="primaryTraditionId"
                selectedLabel="Selected traditions"
              />
              <div className="review-actions">
                <button className="admin-form-button" type="submit">Save traditions</button>
              </div>
            </form>
          </div>

          <div className="review-panel__subsection">
            <h3>Places and Route Order</h3>
            <SaintPlaceRouteEditor
              options={placeOptions}
              placeTypes={placeTypes}
              saintId={saint.id}
              selectedPlaceIds={selectedPlaceIds}
            />
          </div>

          <div className="review-panel__subsection">
            <h3>Biography</h3>
            <form action={upsertSaintBiography} className="form-stack">
              <input name="saintId" type="hidden" value={saint.id} />
              {primaryBiography ? <input name="biographyId" type="hidden" value={primaryBiography.id} /> : null}
              <label>
                Title
                <input name="title" defaultValue={primaryBiography?.title ?? "Profile notes"} required maxLength={200} />
              </label>
              <label>
                Status
                <select name="status" defaultValue={primaryBiography?.status ?? "draft"}>
                  {contentStatuses.map((status) => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </select>
              </label>
              <div className="form-stack__field">
                <label htmlFor="biography-body-markdown">Body Markdown</label>
                <MarkdownEditor
                  defaultValue={primaryBiography?.bodyMarkdown ?? ""}
                  images={biographyImages}
                  maxLength={20000}
                  name="bodyMarkdown"
                  required
                  textareaId="biography-body-markdown"
                />
              </div>
              <div className="form-stack__field">
                <label htmlFor="airtable-biography">AirTable biography</label>
                <textarea
                  id="airtable-biography"
                  className="admin-reference-text"
                  defaultValue={saint.biographySummary ?? ""}
                  readOnly
                />
              </div>
              <div className="review-actions">
                <button className="admin-form-button" type="submit">Save biography</button>
              </div>
            </form>
          </div>

          <div className="review-panel__subsection">
            <h3>Sources and Further Reading</h3>
            {sourceLinks.length > 0 ? (
              <div className="review-list">
                {sourceLinks.map((link) => (
                  <form action={upsertSaintSource} className="form-stack review-row" key={link.id}>
                    <input name="saintId" type="hidden" value={saint.id} />
                    <input name="contentSourceId" type="hidden" value={link.id} />
                    <input name="sourceId" type="hidden" value={link.sourceId} />
                    <label>
                      Title
                      <input name="title" defaultValue={link.source.title} required maxLength={300} />
                    </label>
                    <label>
                      Type
                      <select name="sourceType" defaultValue={link.source.sourceType}>
                        {sourceTypes.map((sourceType) => (
                          <option key={sourceType} value={sourceType}>{formatStatus(sourceType)}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Author
                      <input name="author" defaultValue={link.source.author ?? ""} maxLength={200} />
                    </label>
                    <label>
                      Publisher
                      <input name="publisher" defaultValue={link.source.publisher ?? ""} maxLength={200} />
                    </label>
                    <label>
                      Publication year
                      <input name="publicationYear" type="number" defaultValue={link.source.publicationYear ?? ""} />
                    </label>
                    <label>
                      URL
                      <input name="url" type="url" defaultValue={link.source.url ?? ""} maxLength={1000} />
                    </label>
                    <label>
                      Note
                      <textarea name="note" defaultValue={link.notes ?? link.source.notes ?? ""} maxLength={1000} />
                    </label>
                    <label>
                      Sort order
                      <input name="sortOrder" type="number" defaultValue={link.sortOrder} />
                    </label>
                    <div className="review-actions">
                      <button className="admin-form-button" type="submit">Save source</button>
                      <button className="admin-form-button admin-form-button--warning" formAction={removeSaintSource} type="submit">
                        Remove source
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            ) : (
              <p>No reviewed sources have been attached.</p>
            )}

            <div className="review-panel__subsection">
              <h3>Add source</h3>
              <form action={upsertSaintSource} className="form-stack">
                <input name="saintId" type="hidden" value={saint.id} />
                <label>
                  Title
                  <input name="title" required maxLength={300} />
                </label>
                <label>
                  Type
                  <select name="sourceType" defaultValue="website">
                    {sourceTypes.map((sourceType) => (
                      <option key={sourceType} value={sourceType}>{formatStatus(sourceType)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Author
                  <input name="author" maxLength={200} />
                </label>
                <label>
                  Publisher
                  <input name="publisher" maxLength={200} />
                </label>
                <label>
                  Publication year
                  <input name="publicationYear" type="number" />
                </label>
                <label>
                  URL
                  <input name="url" type="url" maxLength={1000} />
                </label>
                <label>
                  Note
                  <textarea name="note" maxLength={1000} />
                </label>
                <label>
                  Sort order
                  <input name="sortOrder" type="number" defaultValue={sourceLinks.length} />
                </label>
                <div className="review-actions">
                  <button className="admin-form-button" type="submit">Add source</button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <aside className="review-panel">
          <h2>Review Actions</h2>
          <p>Publishing makes this saint eligible for public display. Returning to review removes it from public pages.</p>
          <div className="review-actions">
            <StatusForm saintId={saint.id} status="published" label="Approve and publish" />
            <StatusForm saintId={saint.id} status="needs_review" label="Return to review" variant="secondary" />
            <StatusForm saintId={saint.id} status="hidden" label="Hide" variant="warning" />
          </div>
        </aside>
      </div>

      <section className="review-panel">
        <h2>Review Snapshot</h2>
        <div className="field-grid">
          <ReviewField label="Slug" value={saint.slug} />
          <ReviewField label="Era" value={saint.eraLabel} />
          <ReviewField label="Birth date" value={saint.birthDateRaw} />
          <ReviewField label="Samadhi date" value={saint.samadhiDateRaw} />
          <ReviewField label="Date notes" value={saint.dateNotes} />
          <ReviewField label="SEO title" value={saint.seoTitle} />
          <ReviewField label="SEO description" value={saint.seoDescription} />
          <ReviewField label="Last Airtable mirror seen" value={externalRecord?.lastSeenAt.toLocaleString()} />
        </div>
      </section>

      <section className="review-panel">
        <h2>Aliases</h2>
        <form action={updateSaintAliases} className="form-stack">
          <input name="saintId" type="hidden" value={saint.id} />
          <label>
            Aliases
            <textarea name="aliases" defaultValue={saint.aliases.map((alias) => alias.alias).join("\n")} />
          </label>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Save aliases</button>
          </div>
        </form>
      </section>

      <section className="review-panel">
        <h2>Instagram Claims</h2>
        {saint.instagramClaims.length > 0 ? (
          <div className="review-list">
            {saint.instagramClaims.map((claim) => (
              <div className="review-row" key={claim.id}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={formatStatus(claim.status)} />
                    <StatusBadge label={claim.confidence} />
                    <StatusBadge label={formatStatus(claim.claimType)} />
                  </div>
                  <h3>{formatClaimLabel(claim.claimType)}</h3>
                  <p>{claim.rawValue}</p>
                  {isDateClaim(claim.claimType) ? (
                    <p>{formatDateClaimInterpretation(claim.rawValue)}</p>
                  ) : null}
                  <div className="review-actions">
                    <Link className="admin-text-link" href={`/admin/instagram/${claim.instagramItemId}`}>Open Instagram item</Link>
                    {claim.instagramItem.instagramShortcode ? <a className="admin-text-link" href={claim.instagramItem.instagramUrl} {...getInstagramLinkProps(claim.instagramItem.instagramUrl)}>View post</a> : null}
                  </div>
                </div>
                <div className="review-actions">
                  {claim.status === "needs_review" || claim.status === "suggested" ? (
                    <>
                      <ClaimReviewForm claimId={claim.id} saintId={saint.id} intent="accept" label="Accept" />
                      <ClaimReviewForm claimId={claim.id} saintId={saint.id} intent="ignore" label="Ignore" variant="warning" />
                    </>
                  ) : (
                    <StatusBadge label={claim.appliedAt ? `applied ${claim.appliedAt.toLocaleDateString()}` : formatStatus(claim.status)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No direct Instagram claims are waiting for review.</p>
        )}
      </section>

      <section className="review-panel">
        <h2>Instagram Tracker Matches</h2>
        {trackerRows.length > 0 ? (
          <div className="review-list">
            {trackerRows.map((row) => (
              <div className="review-row" key={row.id}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={formatStatus(row.matchStatus)} />
                    {row.matchConfidence ? <StatusBadge label={row.matchConfidence} /> : null}
                  </div>
                  <h3>{row.saintName ?? "Unnamed tracker row"}</h3>
                  {row.postUrl ? <p><a href={row.postUrl}>{row.postUrl}</a></p> : null}
                </div>
                <StatusBadge label={`row ${row.rowNumber}`} />
              </div>
            ))}
          </div>
        ) : (
          <p>No matched tracker rows are linked to this saint.</p>
        )}
      </section>

      <section className="review-panel">
        <h2>Images</h2>
        {saint.primaryImage ? (
          <figure className="image-with-credit image-with-credit--admin">
            <img src={saint.primaryImage.url} alt={saint.primaryImage.altText ?? saint.displayName} width={saint.primaryImage.width ?? undefined} height={saint.primaryImage.height ?? undefined} />
            <figcaption>
              <span>{saint.primaryImage.caption ?? "Primary saint image"}</span>
              {saint.primaryImage.sourceUrl ? <small>Source preserved</small> : null}
              <SaintImageActions
                imageLabel={saint.primaryImage.caption ?? saint.primaryImage.altText ?? "Primary saint image"}
                mediaAssetId={saint.primaryImage.id}
                saintId={saint.id}
                visible
              />
            </figcaption>
          </figure>
        ) : null}
        {visibleGalleryImages.length > 0 ? (
          <div className="media-grid">
            {visibleGalleryImages.map(({ mediaAsset }) => (
              <figure className="image-with-credit image-with-credit--admin" key={mediaAsset.id}>
                <img src={mediaAsset.url} alt={mediaAsset.altText ?? saint.displayName} width={mediaAsset.width ?? undefined} height={mediaAsset.height ?? undefined} />
                <figcaption>
                  <span>{mediaAsset.caption ?? "Imported saint image"}</span>
                  {mediaAsset.sourceUrl ? <small>Source preserved</small> : null}
                  <SaintImageActions
                    imageLabel={mediaAsset.caption ?? mediaAsset.altText ?? "Imported saint image"}
                    mediaAssetId={mediaAsset.id}
                    saintId={saint.id}
                    visible
                  />
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p>No public saint images have been attached.</p>
        )}
        <div className="review-panel__subsection">
          <h3>Add image</h3>
          <SaintImageCropper
            defaultAltText={`${saint.displayName} portrait`}
            instagramImages={instagramImages}
            saintId={saint.id}
            stagedImages={hiddenGalleryImages.map(({ mediaAsset }) => ({
              altText: mediaAsset.altText,
              caption: mediaAsset.caption,
              id: mediaAsset.id,
              sourceUrl: mediaAsset.sourceUrl,
              url: mediaAsset.url
            }))}
          />
        </div>
      </section>
    </div>
  );
}

async function getSaint(slugOrId: string) {
  const saint = await db.saint.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: {
      aliases: { orderBy: { createdAt: "asc" } },
      primaryImage: true,
      galleryImages: {
        include: { mediaAsset: true },
        orderBy: { sortOrder: "asc" }
      },
      instagramItems: {
        include: {
          instagramItem: {
            select: {
              id: true,
              instagramShortcode: true,
              instagramUrl: true,
              thumbnailUrl: true,
              mediaAssets: {
                orderBy: { sortOrder: "asc" },
                select: { cachedUrl: true }
              }
            }
          }
        },
        orderBy: [
          { isPrimary: "desc" },
          { reviewedAt: "desc" }
        ]
      },
      places: {
        include: { place: true },
        orderBy: [
          { routeOrder: "asc" },
          { placeType: "asc" }
        ]
      },
      traditions: {
        include: { tradition: true },
        orderBy: { isPrimary: "desc" }
      },
      biographies: {
        orderBy: [
          { status: "desc" },
          { updatedAt: "desc" }
        ]
      }
    }
  });

  if (!saint) return null;

  const instagramClaims = await db.instagramDerivedClaim.findMany({
    where: {
      appliedSaintId: saint.id,
      claimType: { in: ["alias", "birth_date", "samadhi_date", "tradition"] },
      status: { in: ["needs_review", "suggested", "matched", "ignored"] }
    },
    include: {
      instagramItem: {
        select: {
          id: true,
          instagramUrl: true,
          instagramShortcode: true
        }
      }
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "asc" }
    ]
  });

  return { ...saint, instagramClaims };
}

async function getInstagramImagesForSaint(saint: NonNullable<Awaited<ReturnType<typeof getSaint>>>) {
  const itemIds = saint.instagramItems.map((link) => link.instagramItemId);
  if (itemIds.length === 0) return [];

  const externalRecords = await db.externalRecord.findMany({
    where: {
      sourceType: "instagram",
      entityType: "InstagramItem",
      entityId: { in: itemIds }
    },
    orderBy: { lastSeenAt: "desc" }
  });
  const rawByItemId = new Map(externalRecords.map((record) => [record.entityId, record.rawPayloadJson]));

  return saint.instagramItems.flatMap((link) => {
    const item = link.instagramItem;
    const label = item.instagramShortcode ? `Instagram ${item.instagramShortcode}` : "Instagram post";
    const sourceUrls = item.mediaAssets.length > 0
      ? item.mediaAssets.map((asset) => asset.cachedUrl)
      : getInstagramImageUrls(rawByItemId.get(item.id), item.thumbnailUrl);

    return sourceUrls.map((sourceUrl, index) => ({
      id: `${item.id}-${index}`,
      instagramUrl: item.instagramUrl,
      label: index === 0 ? label : `${label}, image ${index + 1}`,
      sourceUrl
    }));
  });
}

function getBiographyEditorImages(
  saint: NonNullable<Awaited<ReturnType<typeof getSaint>>>,
  visibleGalleryImages: NonNullable<Awaited<ReturnType<typeof getSaint>>>["galleryImages"]
) {
  const images = new Map<string, {
    altText: string;
    caption: string;
    id: string;
    url: string;
  }>();

  if (saint.primaryImage) {
    images.set(saint.primaryImage.id, {
      altText: saint.primaryImage.altText ?? saint.displayName,
      caption: saint.primaryImage.caption ?? "Primary saint image",
      id: saint.primaryImage.id,
      url: saint.primaryImage.url
    });
  }

  visibleGalleryImages.forEach(({ mediaAsset }) => {
    images.set(mediaAsset.id, {
      altText: mediaAsset.altText ?? saint.displayName,
      caption: mediaAsset.caption ?? "Imported saint image",
      id: mediaAsset.id,
      url: mediaAsset.url
    });
  });

  return Array.from(images.values());
}

async function getTrackerRows(externalId: string) {
  const [, tableIdOrName, recordId] = externalId.split(":");
  if (!tableIdOrName || !recordId) return [];

  const mirror = await db.airtableMirrorRecord.findFirst({
    where: { tableIdOrName, recordId },
    include: {
      instagramTrackerRows: {
        orderBy: { rowNumber: "asc" }
      }
    }
  });

  return mirror?.instagramTrackerRows ?? [];
}

function ReviewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-field">
      <strong>{label}</strong>
      <span>{value || "Not set"}</span>
    </div>
  );
}

const contentStatuses = ["draft", "needs_review", "published", "hidden", "archived"] as const;
const placeTypes = ["primary", "birth", "samadhi", "sadhana", "associated", "other"] as const;
const sourceTypes = ["book", "article", "website", "scripture", "oral_tradition", "other"] as const;

function formatPlaceLocation(place: { region: string | null; country: string | null }) {
  const location = [place.region, place.country].filter(Boolean).join(", ");
  return location || undefined;
}

function StatusForm({
  saintId,
  status,
  label,
  variant = "primary"
}: {
  saintId: string;
  status: "needs_review" | "published" | "hidden";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  const className = [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");

  return (
    <form action={updateSaintReviewStatus}>
      <input name="saintId" type="hidden" value={saintId} />
      <input name="status" type="hidden" value={status} />
      <button className={className} type="submit">{label}</button>
    </form>
  );
}

function ClaimReviewForm({
  claimId,
  intent,
  label,
  saintId,
  variant = "secondary"
}: {
  claimId: string;
  intent: "accept" | "ignore";
  label: string;
  saintId: string;
  variant?: "secondary" | "warning";
}) {
  const className = [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");

  return (
    <form action={reviewSaintInstagramClaim}>
      <input name="claimId" type="hidden" value={claimId} />
      <input name="saintId" type="hidden" value={saintId} />
      <input name="intent" type="hidden" value={intent} />
      <button className={className} type="submit">{label}</button>
    </form>
  );
}

function formatClaimLabel(claimType: string) {
  if (claimType === "birth_date") return "Birth date candidate";
  if (claimType === "samadhi_date") return "Samadhi date candidate";
  if (claimType === "alias") return "Alias candidate";
  if (claimType === "tradition") return "Tradition candidate";
  return formatStatus(claimType);
}

function isDateClaim(claimType: string) {
  return claimType === "birth_date" || claimType === "samadhi_date";
}

function formatDateClaimInterpretation(rawValue: string) {
  const parsed = parseImportedDate(rawValue);
  const parts = [
    parsed.year ? `year ${parsed.year}` : undefined,
    parsed.month ? `month ${parsed.month}` : undefined,
    parsed.day ? `day ${parsed.day}` : undefined,
    `precision ${parsed.precision}`
  ].filter(Boolean);

  return `Parsed as ${parts.join(", ")}.`;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
