import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import {
  mergeTraditions,
  updateTradition,
  updateTraditionHeroImage,
  updateTraditionLineage,
  updateTraditionRelatedLinks,
  updateTraditionScripturalBasis,
  updateTraditionReviewStatus
} from "../actions";
import { TraditionImageActions } from "./tradition-image-actions";
import { TraditionImageUploader } from "./tradition-image-uploader";

type AdminTraditionEditorPageProps = {
  params: Promise<{ id: string }>;
};

type SelectOption = {
  id: string;
  label: string;
  detail?: string;
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
  const saintOptions = allSaints.map((saint) => ({
    id: saint.id,
    label: saint.displayName,
    detail: `${saint.canonicalName} - ${formatStatus(saint.status)}`
  }));
  const placeOptions = allPlaces.map((place) => ({
    id: place.id,
    label: place.name,
    detail: [place.region, place.country].filter(Boolean).join(", ") || undefined
  }));
  const traditionOptions = allTraditions.map((option) => ({
    id: option.id,
    label: option.name,
    detail: `${option._count.saints} saints`
  }));
  const sourceOptions = allSources.map((source) => ({
    id: source.id,
    label: source.title,
    detail: [formatStatus(source.sourceType), source.author].filter(Boolean).join(" - ") || undefined
  }));
  const visibleGalleryImages = tradition.galleryImages.filter((image) => image.publicVisible !== false);
  const hiddenGalleryImages = tradition.galleryImages.filter((image) => image.publicVisible === false);
  const editorImages = getMarkdownEditorImages(tradition);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Editing tradition</div>
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

      <div className="review-detail-grid">
        <section className="review-panel">
          <h2>Page Builder</h2>
          <form action={updateTradition} className="form-stack">
            <input name="traditionId" type="hidden" value={tradition.id} />
            <label>
              Name
              <input name="name" defaultValue={tradition.name} required maxLength={200} />
            </label>
            <label>
              Alternate names
              <textarea name="alternateNames" defaultValue={tradition.alternateNames.join("\n")} />
            </label>
            <label>
              Parent tradition
              <select name="parentTraditionId" defaultValue={tradition.parentTraditionId ?? ""}>
                <option value="">No parent tradition</option>
                {allTraditions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={tradition.status}>
                {contentStatuses.map((status) => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>
            </label>
            <label>
              Short description
              <textarea name="shortDescription" defaultValue={tradition.shortDescription ?? ""} maxLength={500} />
            </label>

            <div className="review-panel__subsection">
              <h3>Overview Facts</h3>
              <label>
                Founder saint
                <select name="founderSaintId" defaultValue={tradition.founderSaintId ?? ""}>
                  <option value="">No linked founder saint</option>
                  {saintOptions.map((saint) => (
                    <option key={saint.id} value={saint.id}>{saint.label}</option>
                  ))}
                </select>
              </label>
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
              <label>
                Origin place
                <select name="originPlaceId" defaultValue={tradition.originPlaceId ?? ""}>
                  <option value="">No linked origin place</option>
                  {placeOptions.map((place) => (
                    <option key={place.id} value={place.id}>{place.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Origin place label override
                <input name="originPlaceLabel" defaultValue={tradition.originPlaceLabel ?? ""} maxLength={200} />
              </label>
            </div>

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
            <label>
              SEO title
              <input name="seoTitle" defaultValue={tradition.seoTitle ?? ""} maxLength={120} />
            </label>
            <label>
              SEO description
              <textarea name="seoDescription" defaultValue={tradition.seoDescription ?? ""} maxLength={300} />
            </label>
            <div className="review-actions">
              <button className="admin-form-button" type="submit">Save page content</button>
            </div>
          </form>
        </section>

        <aside className="review-panel">
          <h2>Publication</h2>
          <p>Publishing makes reviewed tradition content visible on the public home page, index, and detail routes.</p>
          <div className="review-actions">
            <StatusForm traditionId={tradition.id} status="published" label="Publish tradition" />
            <StatusForm traditionId={tradition.id} status="needs_review" label="Return to review" variant="secondary" />
            <StatusForm traditionId={tradition.id} status="archived" label="Archive" variant="warning" />
          </div>

          <div className="review-panel__subsection">
            <h3>Merge duplicate</h3>
            <p>Move saint relationships, source links, and child tradition links from another record into this tradition.</p>
            <form action={mergeTraditions} className="form-stack">
              <input name="targetTraditionId" type="hidden" value={tradition.id} />
              <label>
                Duplicate tradition
                <select name="sourceTraditionId" required>
                  <option value="">Select duplicate</option>
                  {allTraditions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name} ({option._count.saints} saints)</option>
                  ))}
                </select>
              </label>
              <div className="review-actions">
                <button className="admin-form-button admin-form-button--warning" type="submit">Merge into this tradition</button>
              </div>
            </form>
          </div>

          <div className="review-panel__subsection">
            <h3>Child traditions</h3>
            {tradition.childTraditions.length > 0 ? (
              <div className="review-list">
                {tradition.childTraditions.map((child) => (
                  <Link className="admin-text-link" href={`/admin/traditions/${child.slug}` as Route} key={child.id}>
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p>No child traditions are attached.</p>
            )}
          </div>
        </aside>
      </div>

      <section className="review-panel">
        <h2>Lineage Saints</h2>
        <form action={updateTraditionLineage} className="form-stack">
          <input name="traditionId" type="hidden" value={tradition.id} />
          <div className="review-list">
            {buildLineageRows(tradition.lineageSaints).map((row, index) => (
              <div className="review-row" key={row.key}>
                <label>
                  Saint
                  <select name="lineageSaintId" defaultValue={row.saintId}>
                    <option value="">Select saint</option>
                    {saintOptions.map((saint) => (
                      <option key={saint.id} value={saint.id}>{saint.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Role label
                  <input name="lineageRoleLabel" defaultValue={row.roleLabel} maxLength={120} />
                </label>
                <label>
                  Parent saint
                  <select name="lineageParentSaintId" defaultValue={row.parentSaintId}>
                    <option value="">No parent saint</option>
                    {saintOptions.map((saint) => (
                      <option key={saint.id} value={saint.id}>{saint.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Sort order
                  <input name="lineageSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
                </label>
              </div>
            ))}
          </div>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Save lineage</button>
          </div>
        </form>
      </section>

      <section className="review-panel">
        <h2>Related Sidebar Links</h2>
        <form action={updateTraditionRelatedLinks} className="form-stack">
          <input name="traditionId" type="hidden" value={tradition.id} />
          <div className="review-panel__subsection">
            <h3>Manual related traditions</h3>
            <p>Hierarchy links from parent and child traditions appear automatically; add editorial sidebar links here.</p>
            <div className="review-list">
              {buildRelatedTraditionRows(tradition.relatedTraditions).map((row, index) => (
                <div className="review-row" key={row.key}>
                  <label>
                    Tradition
                    <select name="relatedTraditionId" defaultValue={row.relatedTraditionId}>
                      <option value="">Select tradition</option>
                      {traditionOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Label
                    <input name="relatedTraditionLabel" defaultValue={row.label} maxLength={120} />
                  </label>
                  <label>
                    Sort order
                    <input name="relatedTraditionSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="review-panel__subsection">
            <h3>Related places</h3>
            <div className="review-list">
              {buildRelatedPlaceRows(tradition.relatedPlaces).map((row, index) => (
                <div className="review-row" key={row.key}>
                  <label>
                    Place
                    <select name="relatedPlaceId" defaultValue={row.placeId}>
                      <option value="">Select place</option>
                      {placeOptions.map((place) => (
                        <option key={place.id} value={place.id}>{place.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Label
                    <input name="relatedPlaceLabel" defaultValue={row.label} maxLength={120} />
                  </label>
                  <label>
                    Sort order
                    <input name="relatedPlaceSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Save related links</button>
          </div>
        </form>
      </section>

      <section className="review-panel">
        <h2>Scriptural Basis</h2>
        <form action={updateTraditionScripturalBasis} className="form-stack">
          <input name="traditionId" type="hidden" value={tradition.id} />
          <div className="review-list">
            {buildScripturalBasisRows(tradition.scripturalBasis).map((row, index) => (
              <div className="review-row" key={row.key}>
                <label>
                  Display title
                  <input name="scripturalBasisTitle" defaultValue={row.title} maxLength={300} />
                </label>
                <label>
                  Reviewed source
                  <select name="scripturalBasisSourceId" defaultValue={row.sourceId}>
                    <option value="">No linked source</option>
                    {sourceOptions.map((source) => (
                      <option key={source.id} value={source.id}>{source.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  URL override
                  <input name="scripturalBasisUrl" type="url" defaultValue={row.url} maxLength={1000} />
                </label>
                <label>
                  Note
                  <input name="scripturalBasisNote" defaultValue={row.note} maxLength={500} />
                </label>
                <label>
                  Sort order
                  <input name="scripturalBasisSortOrder" type="number" defaultValue={row.sortOrder ?? index} />
                </label>
              </div>
            ))}
          </div>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Save scriptural basis</button>
          </div>
        </form>
      </section>

      <section className="review-panel">
        <h2>Tradition Media</h2>
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
      </section>
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

const contentStatuses = ["draft", "needs_review", "published", "archived"] as const;

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

function buildLineageRows(lineage: NonNullable<Awaited<ReturnType<typeof getTradition>>>["lineageSaints"]) {
  return [
    ...lineage.map((item) => ({
      key: item.id,
      saintId: item.saintId,
      roleLabel: item.roleLabel ?? "",
      parentSaintId: item.parentSaintId ?? "",
      sortOrder: item.sortOrder
    })),
    ...Array.from({ length: 4 }, (_, index) => ({
      key: `new-lineage-${index}`,
      saintId: "",
      roleLabel: "",
      parentSaintId: "",
      sortOrder: lineage.length + index
    }))
  ];
}

function buildRelatedTraditionRows(links: NonNullable<Awaited<ReturnType<typeof getTradition>>>["relatedTraditions"]) {
  return [
    ...links.map((item) => ({
      key: item.id,
      relatedTraditionId: item.relatedTraditionId,
      label: item.label ?? "",
      sortOrder: item.sortOrder
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      key: `new-related-tradition-${index}`,
      relatedTraditionId: "",
      label: "",
      sortOrder: links.length + index
    }))
  ];
}

function buildRelatedPlaceRows(links: NonNullable<Awaited<ReturnType<typeof getTradition>>>["relatedPlaces"]) {
  return [
    ...links.map((item) => ({
      key: item.id,
      placeId: item.placeId,
      label: item.label ?? "",
      sortOrder: item.sortOrder
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      key: `new-related-place-${index}`,
      placeId: "",
      label: "",
      sortOrder: links.length + index
    }))
  ];
}

function buildScripturalBasisRows(links: NonNullable<Awaited<ReturnType<typeof getTradition>>>["scripturalBasis"]) {
  return [
    ...links.map((item) => ({
      key: item.id,
      title: item.title,
      sourceId: item.sourceId ?? "",
      url: item.url ?? "",
      note: item.note ?? "",
      sortOrder: item.sortOrder
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      key: `new-scriptural-basis-${index}`,
      title: "",
      sourceId: "",
      url: "",
      note: "",
      sortOrder: links.length + index
    }))
  ];
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
