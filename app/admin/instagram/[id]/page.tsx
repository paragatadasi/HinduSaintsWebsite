import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import type { InstagramFirstPageMetadata } from "@/lib/instagram-metadata";
import { compactMetadata, parseInstagramFirstPageMetadata, splitGurus, splitKeyPlaces } from "@/lib/instagram-metadata";
import { rankSaintSearchResults } from "@/lib/saint-search";
import { searchScoreToConfidence } from "@/lib/search-text";
import { toSlug } from "@/lib/slugs";
import { acceptInstagramClaim, attachSaintToInstagramItem, createSaintFromInstagramItem, extractInstagramFirstPageFromImage, updateInstagramItemSaintStatus, updateInstagramItemStatus } from "../actions";
import { FirstPageMetadataForm } from "./first-page-metadata-form";

type AdminInstagramReviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    firstPageExtraction?: string;
    firstPageExtractionMessage?: string;
    saintQuery?: string | string[];
  }>;
};

type SaintOption = {
  id: string;
  displayName: string;
  status: string;
  confidence?: "low" | "medium" | "high";
};

export default async function AdminInstagramReviewPage({ params, searchParams }: AdminInstagramReviewPageProps) {
  const { id } = await params;
  const reviewParams = await searchParams;
  const item = await getInstagramItem(id);

  if (!item) notFound();

  const returnTo = `/admin/instagram/${item.id}`;
  const firstPageText = item.firstPageText
    ?? getRawFirstPageText(item.externalRecord?.rawPayloadJson)
    ?? "";
  const firstPageMetadata = getInitialFirstPageMetadata(item.firstPageMetadata, firstPageText);
  const isImageExtractionConfigured = Boolean(process.env.OPENAI_API_KEY);
  const saintQuery = getSearchParam(reviewParams.saintQuery)
    || firstPageMetadata.displayName
    || item.extractedSaintName
    || "";
  const [placeSuggestions, guruSuggestions, traditionSuggestions, saints] = await Promise.all([
    getPlaceSuggestions(firstPageMetadata),
    getGuruSuggestions(firstPageMetadata),
    getTraditionSuggestions(firstPageMetadata),
    getSaintOptions(saintQuery)
  ]);
  const acceptedClaims = getAcceptedClaimKeys(item.derivedClaims);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Reviewing Instagram item</div>
          <h1>{firstPageMetadata.displayName ?? item.extractedSaintName ?? item.instagramShortcode ?? "Imported Instagram item"}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(item.status)} />
            <StatusBadge label={formatStatus(item.type)} />
            {item.matchConfidence ? <StatusBadge label={item.matchConfidence} /> : null}
            <StatusBadge label={item.postedAt ? item.postedAt.toLocaleDateString() : "date pending"} />
          </div>
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href="/admin/instagram">Back to queue</Link>
          <a className="button button--secondary" href={item.instagramUrl}>View on Instagram</a>
        </div>
      </div>

      <div className="review-detail-grid">
        <section className="review-panel">
          <h2>Post Preview</h2>
          <div className="instagram-detail-preview">
            <a className="instagram-detail-preview__media" href={item.instagramUrl}>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={getInstagramPreviewAlt(item)} />
              ) : (
                <span>{formatStatus(item.type)}</span>
              )}
            </a>
            <div className="instagram-detail-preview__content">
              <div className="field-grid">
                <ReviewField label="Shortcode" value={item.instagramShortcode} />
                <ReviewField label="Posted date" value={item.postedAt?.toLocaleString()} />
                <ReviewField label="Imported" value={item.createdAt.toLocaleString()} />
                <ReviewField label="Last updated" value={item.updatedAt.toLocaleString()} />
              </div>
              <div className="review-field">
                <strong>Caption</strong>
                <p>{item.captionText || "No caption text imported yet."}</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="review-panel">
          <h2>Review target</h2>
          <p>Resolve this item by matching it to an existing saint or creating a saint draft. Published saint pages show matched Instagram content automatically.</p>
          <div className="review-actions">
            <ItemStatusForm instagramItemId={item.id} returnTo={returnTo} status="needs_review" label="Return to review" variant="secondary" />
            <ItemStatusForm instagramItemId={item.id} returnTo={returnTo} status="hidden" label="Hide" variant="warning" />
          </div>
        </aside>
      </div>

      <section className="review-panel">
        <h2>First-page biodata</h2>
        <p>{firstPageText ? "Extracted first-page biodata is ready for human review." : "Extract a first pass from the imported image, then review and edit the fields before saving."}</p>
        <ExtractionNotice
          message={reviewParams.firstPageExtractionMessage}
          status={reviewParams.firstPageExtraction}
        />
        {!firstPageText && !isImageExtractionConfigured ? (
          <p className="admin-notice admin-notice--warning">Image extraction is not configured. Set OPENAI_API_KEY on the server and restart the app.</p>
        ) : null}
        {!firstPageText ? (
          <form action={extractInstagramFirstPageFromImage} className="review-actions">
            <input name="instagramItemId" type="hidden" value={item.id} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="admin-form-button admin-form-button--secondary" type="submit" disabled={!isImageExtractionConfigured}>Extract from image</button>
          </form>
        ) : null}
        <FirstPageMetadataForm
          firstPageText={firstPageText}
          instagramItemId={item.id}
          metadata={firstPageMetadata}
          returnTo={returnTo}
        />
        <div className="review-suggestion-grid">
          <MetadataSuggestionList
            acceptedClaims={acceptedClaims}
            claimType="place"
            emptyText="No key places parsed yet."
            heading="Place suggestions"
            instagramItemId={item.id}
            returnTo={returnTo}
            sourceField="keyPlace"
            suggestions={placeSuggestions}
            targetEntityType="Place"
          />
          <MetadataSuggestionList
            acceptedClaims={acceptedClaims}
            claimType="guru"
            emptyText="No gurus parsed yet."
            heading="Guru saint suggestions"
            instagramItemId={item.id}
            returnTo={returnTo}
            sourceField="guru"
            suggestions={guruSuggestions}
            targetEntityType="Saint"
          />
        </div>
        <DirectClaimList
          acceptedClaims={acceptedClaims}
          instagramItemId={item.id}
          metadata={firstPageMetadata}
          returnTo={returnTo}
          traditionSuggestions={traditionSuggestions}
        />
      </section>

      <section className="review-panel">
        <h2>Saint Matches</h2>
        {item.saints.length > 0 ? (
          <div className="review-list">
            {item.saints.map((link) => (
              <div className="review-row" key={link.id}>
                <div>
                  <div className="review-meta">
                    <StatusBadge label={formatStatus(link.matchStatus)} />
                    <StatusBadge label={link.matchConfidence} />
                    {link.isPrimary ? <StatusBadge label="primary" /> : null}
                  </div>
                  <h3>{link.saint.displayName}</h3>
                  <p>{link.notes ?? "No match notes."}</p>
                  <div className="review-actions">
                    <Link className="admin-text-link" href={`/admin/saints/${link.saint.slug}`}>Open saint review</Link>
                    {link.saint.status === "published" ? <Link className="admin-text-link" href={`/saints/${link.saint.slug}`}>View public saint</Link> : null}
                  </div>
                </div>
                <div className="review-actions">
                  <LinkStatusForm instagramItemSaintId={link.id} matchStatus="matched" returnTo={returnTo} label="Confirm" />
                  <LinkStatusForm instagramItemSaintId={link.id} matchStatus="ignored" returnTo={returnTo} label="Ignore" variant="warning" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No saint matches have been attached yet.</p>
        )}
      </section>

      <section className="review-panel">
        <h2>Attach Saint</h2>
        <form action={`/admin/instagram/${item.id}`} className="admin-search" role="search">
          <label className="sr-only" htmlFor="instagram-saint-search">Search matching saints</label>
          <input
            id="instagram-saint-search"
            name="saintQuery"
            placeholder="Search by name, alias, place, tradition, or date"
            type="search"
            defaultValue={saintQuery}
          />
          <button className="admin-form-button" type="submit">Search</button>
          {saintQuery ? <Link className="admin-form-button admin-form-button--secondary" href={`/admin/instagram/${item.id}`}>Reset</Link> : null}
        </form>
        <form action={attachSaintToInstagramItem} className="form-stack">
          <input name="instagramItemId" type="hidden" value={item.id} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <label>
            Saint
            <select name="saintId" required>
              <option value="">Choose a saint...</option>
              {saints.map((saint) => (
                <option key={saint.id} value={saint.id}>
                  {saint.displayName}{saint.confidence ? ` - ${saint.confidence} match` : ""}{saint.status ? ` (${formatStatus(saint.status)})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Confidence
            <select name="matchConfidence" defaultValue="medium">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Attach and confirm match</button>
          </div>
        </form>
      </section>

      <section className="review-panel">
        <h2>Create Saint Draft</h2>
        <p>Create a needs-review saint from this Instagram biodata and attach the post immediately.</p>
        <form action={createSaintFromInstagramItem} className="form-stack">
          <input name="instagramItemId" type="hidden" value={item.id} />
          <div className="field-grid">
            <label>
              Display name
              <input name="displayName" defaultValue={firstPageMetadata.displayName ?? item.extractedSaintName ?? ""} maxLength={200} required />
            </label>
            <label>
              Canonical name
              <input name="canonicalName" defaultValue={firstPageMetadata.displayName ?? item.extractedSaintName ?? ""} maxLength={200} required />
            </label>
            <label>
              Birth date
              <input name="birthDateRaw" defaultValue={firstPageMetadata.born ?? ""} maxLength={160} />
            </label>
            <label>
              Samadhi date
              <input name="samadhiDateRaw" defaultValue={firstPageMetadata.samadhi ?? ""} maxLength={160} />
            </label>
            <label>
              Tradition
              <input name="tradition" defaultValue={firstPageMetadata.tradition ?? ""} maxLength={240} />
            </label>
          </div>
          <label>
            Short description
            <textarea
              name="shortDescription"
              defaultValue={buildInstagramSaintDescription(firstPageMetadata)}
              maxLength={500}
            />
          </label>
          <div className="review-actions">
            <button className="admin-form-button" type="submit">Create saint draft and attach</button>
          </div>
        </form>
      </section>

      <section className="review-panel">
        <h2>Source Snapshot</h2>
        <div className="field-grid">
          <ReviewField label="Instagram URL" value={item.instagramUrl} />
          <ReviewField label="Thumbnail URL" value={item.thumbnailUrl} />
          <ReviewField label="Import batch" value={item.sourceImportBatch?.sourceName} />
          <ReviewField label="External record" value={item.externalRecord?.externalId} />
        </div>
        {item.externalRecord ? (
          <pre className="raw-json-preview">{JSON.stringify(item.externalRecord.rawPayloadJson, null, 2)}</pre>
        ) : null}
      </section>
    </div>
  );
}

async function getInstagramItem(id: string) {
  const item = await db.instagramItem.findUnique({
    where: { id },
    include: {
      sourceImportBatch: true,
      saints: {
        include: { saint: { select: { displayName: true, slug: true, status: true } } },
        orderBy: [{ isPrimary: "desc" }, { matchConfidence: "desc" }]
      },
      derivedClaims: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!item) return null;

  const externalRecord = await db.externalRecord.findFirst({
    where: { sourceType: "instagram", entityType: "InstagramItem", entityId: item.id },
    orderBy: { lastSeenAt: "desc" }
  });

  return { ...item, externalRecord };
}

async function getSaintOptions(query: string): Promise<SaintOption[]> {
  const saints = await db.saint.findMany({
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      slug: true,
      displayName: true,
      canonicalName: true,
      status: true,
      eraLabel: true,
      birthDateRaw: true,
      samadhiDateRaw: true,
      shortDescription: true,
      biographySummary: true,
      aliases: { select: { alias: true } },
      places: {
        include: { place: true },
        orderBy: { placeType: "asc" }
      },
      traditions: {
        include: { tradition: true },
        orderBy: { isPrimary: "desc" }
      }
    }
  });

  if (!query) {
    return saints.map((saint) => ({
      id: saint.id,
      displayName: saint.displayName,
      status: saint.status,
      confidence: undefined
    }));
  }

  return rankSaintSearchResults(saints, query, { includeAdminFields: true, limit: 25 })
    .map(({ item, score }) => ({
      id: item.id,
      displayName: item.displayName,
      status: item.status,
      confidence: searchScoreToConfidence(score)
    }));
}

function getFirstPageMetadata(value: unknown): InstagramFirstPageMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const metadata = value as Record<string, unknown>;

  return {
    displayName: getString(metadata.displayName),
    subtitle: getString(metadata.subtitle),
    born: getString(metadata.born),
    samadhi: getString(metadata.samadhi),
    keyPlace: getString(metadata.keyPlace),
    keyPlaces: getStringArray(metadata.keyPlaces),
    tradition: getString(metadata.tradition),
    guru: getString(metadata.guru),
    gurus: getStringArray(metadata.gurus)
  };
}

function getInitialFirstPageMetadata(value: unknown, firstPageText: string) {
  const storedMetadata = getFirstPageMetadata(value);
  const parsedMetadata = parseInstagramFirstPageMetadata(firstPageText);

  return compactMetadata({
    ...parsedMetadata,
    ...storedMetadata
  });
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : undefined;
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function buildInstagramSaintDescription(metadata: InstagramFirstPageMetadata) {
  return [
    metadata.subtitle,
    metadata.tradition,
    metadata.keyPlace ? `Associated with ${metadata.keyPlace}.` : undefined
  ].filter(Boolean).join(" ");
}

function getRawFirstPageText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const candidates = [
    raw.firstPageText,
    raw.first_page_text,
    raw.firstSlideText,
    raw.first_slide_text,
    raw.coverText,
    raw.cover_text,
    raw.ocrText,
    raw.ocr_text,
    raw.altText,
    raw.alt_text
  ];

  const match = candidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof match === "string" ? match.trim() : undefined;
}

async function getPlaceSuggestions(metadata: InstagramFirstPageMetadata) {
  const rawPlaces = metadata.keyPlaces?.length ? metadata.keyPlaces : splitKeyPlaces(metadata.keyPlace);
  if (rawPlaces.length === 0) return [];

  const places = await db.place.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, alternateNames: true, region: true, country: true }
  });

  return rawPlaces.map((rawValue) => ({
    rawValue,
    matches: places
      .map((place) => {
        const confidence = getPlaceMatchConfidence(rawValue, [place.name, ...place.alternateNames, place.region, place.country].filter(Boolean) as string[]);
        return confidence === "low" ? undefined : {
          id: place.id,
          href: `/places/${place.slug}`,
          label: place.name,
          detail: [place.region, place.country].filter(Boolean).join(", "),
          confidence
        };
      })
      .filter((match): match is MetadataSuggestionMatch => Boolean(match))
      .sort(sortSuggestionMatches)
      .slice(0, 3)
  }));
}

async function getGuruSuggestions(metadata: InstagramFirstPageMetadata) {
  const rawGurus = metadata.gurus?.length ? metadata.gurus : splitGurus(metadata.guru);
  if (rawGurus.length === 0) return [];

  const saints = await db.saint.findMany({
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      slug: true,
      displayName: true,
      canonicalName: true,
      status: true,
      aliases: { select: { alias: true } }
    }
  });

  return rawGurus.map((rawValue) => ({
    rawValue,
    matches: rankSaintSearchResults(saints, rawValue, { includeAdminFields: true, limit: 3, minimumScore: 180 })
      .map(({ item, score }) => ({
        id: item.id,
        href: `/admin/saints/${item.slug}`,
        label: item.displayName,
        detail: formatStatus(item.status),
        confidence: searchScoreToConfidence(score)
      }))
      .sort(sortSuggestionMatches)
  }));
}

async function getTraditionSuggestions(metadata: InstagramFirstPageMetadata) {
  if (!metadata.tradition) return [];

  const traditions = await db.tradition.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, alternateNames: true, status: true }
  });
  const rawValue = metadata.tradition;

  return traditions
    .map((tradition) => {
      const confidence = getPlaceMatchConfidence(rawValue, [tradition.name, ...tradition.alternateNames]);
      return confidence === "low" ? undefined : {
        id: tradition.id,
        href: `/admin/traditions`,
        label: tradition.name,
        detail: formatStatus(tradition.status),
        confidence
      };
    })
    .filter((match): match is MetadataSuggestionMatch => Boolean(match))
    .sort(sortSuggestionMatches)
    .slice(0, 3);
}

type MetadataSuggestion = Awaited<ReturnType<typeof getPlaceSuggestions>>[number];

type MetadataSuggestionMatch = {
  id: string;
  href: string;
  label: string;
  detail: string;
  confidence: "low" | "medium" | "high";
};

function MetadataSuggestionList({
  acceptedClaims,
  claimType,
  emptyText,
  heading,
  instagramItemId,
  returnTo,
  sourceField,
  suggestions,
  targetEntityType
}: {
  acceptedClaims: Set<string>;
  claimType: "guru" | "place";
  emptyText: string;
  heading: string;
  instagramItemId: string;
  returnTo: string;
  sourceField: string;
  suggestions: MetadataSuggestion[];
  targetEntityType: "Place" | "Saint";
}) {
  return (
    <div className="review-suggestion-list">
      <h3>{heading}</h3>
      {suggestions.length > 0 ? suggestions.map((suggestion) => (
        <div className="review-suggestion" key={suggestion.rawValue}>
          <div>
            <strong>{suggestion.rawValue}</strong>
            {suggestion.matches.length > 0 ? (
              <div className="review-meta">
                {suggestion.matches.map((match) => (
                  <AcceptClaimForm
                    accepted={acceptedClaims.has(getClaimKey(claimType, suggestion.rawValue, targetEntityType, match.id))}
                    claimType={claimType}
                    confidence={match.confidence}
                    instagramItemId={instagramItemId}
                    key={match.id}
                    label={`${match.label}${match.detail ? `, ${match.detail}` : ""}: ${match.confidence}`}
                    rawValue={suggestion.rawValue}
                    returnTo={returnTo}
                    sourceField={sourceField}
                    targetEntityId={match.id}
                    targetEntityType={targetEntityType}
                  />
                ))}
              </div>
            ) : (
              <p>No archive match found.</p>
            )}
          </div>
        </div>
      )) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

type DirectClaim = {
  claimType: "alias" | "birth_date" | "samadhi_date";
  rawValue: string;
  sourceField: string;
  label: string;
  targetEntityType?: undefined;
  targetEntityId?: undefined;
};

function DirectClaimList({
  acceptedClaims,
  instagramItemId,
  metadata,
  returnTo,
  traditionSuggestions
}: {
  acceptedClaims: Set<string>;
  instagramItemId: string;
  metadata: InstagramFirstPageMetadata;
  returnTo: string;
  traditionSuggestions: MetadataSuggestionMatch[];
}) {
  const alias = metadata.displayName;
  const directClaimCandidates: Array<DirectClaim | undefined> = [
    alias ? {
      claimType: "alias" as const,
      rawValue: alias,
      sourceField: "displayName",
      label: `Alias: ${alias}`,
      targetEntityType: undefined,
      targetEntityId: undefined
    } : undefined,
    metadata.born ? {
      claimType: "birth_date" as const,
      rawValue: metadata.born,
      sourceField: "born",
      label: `Birth date: ${metadata.born}`,
      targetEntityType: undefined,
      targetEntityId: undefined
    } : undefined,
    metadata.samadhi ? {
      claimType: "samadhi_date" as const,
      rawValue: metadata.samadhi,
      sourceField: "samadhi",
      label: `Samadhi date: ${metadata.samadhi}`,
      targetEntityType: undefined,
      targetEntityId: undefined
    } : undefined
  ];
  const directClaims = directClaimCandidates.filter((claim): claim is DirectClaim => Boolean(claim));

  if (directClaims.length === 0 && !metadata.tradition) return null;

  return (
    <div className="review-suggestion-list">
      <h3>Direct claims</h3>
      <div className="review-meta">
        {directClaims.map((claim) => (
          <AcceptClaimForm
            accepted={acceptedClaims.has(getClaimKey(claim.claimType, claim.rawValue, claim.targetEntityType, claim.targetEntityId))}
            claimType={claim.claimType}
            confidence="medium"
            instagramItemId={instagramItemId}
            key={`${claim.claimType}:${claim.rawValue}`}
            label={claim.label}
            rawValue={claim.rawValue}
            returnTo={returnTo}
            sourceField={claim.sourceField}
            targetEntityId={claim.targetEntityId}
            targetEntityType={claim.targetEntityType}
          />
        ))}
        {metadata.tradition && traditionSuggestions.length > 0 ? traditionSuggestions.map((suggestion) => (
          <AcceptClaimForm
            accepted={acceptedClaims.has(getClaimKey("tradition", metadata.tradition ?? "", "Tradition", suggestion.id))}
            claimType="tradition"
            confidence={suggestion.confidence}
            instagramItemId={instagramItemId}
            key={suggestion.id}
            label={`Tradition: ${suggestion.label}: ${suggestion.confidence}`}
            rawValue={metadata.tradition ?? ""}
            returnTo={returnTo}
            sourceField="tradition"
            targetEntityId={suggestion.id}
            targetEntityType="Tradition"
          />
        )) : metadata.tradition ? (
          <StatusBadge label={`Tradition pending: ${metadata.tradition}`} />
        ) : null}
      </div>
    </div>
  );
}

function AcceptClaimForm({
  accepted,
  claimType,
  confidence,
  instagramItemId,
  label,
  rawValue,
  returnTo,
  sourceField,
  targetEntityId,
  targetEntityType
}: {
  accepted: boolean;
  claimType: "alias" | "birth_date" | "guru" | "place" | "samadhi_date" | "tradition";
  confidence: "low" | "medium" | "high";
  instagramItemId: string;
  label: string;
  rawValue: string;
  returnTo: string;
  sourceField: string;
  targetEntityId?: string;
  targetEntityType?: "Place" | "Saint" | "Tradition";
}) {
  if (accepted) return <StatusBadge label={`Accepted ${label}`} />;

  return (
    <form action={acceptInstagramClaim}>
      <input name="instagramItemId" type="hidden" value={instagramItemId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="claimType" type="hidden" value={claimType} />
      <input name="rawValue" type="hidden" value={rawValue} />
      <input name="sourceField" type="hidden" value={sourceField} />
      <input name="confidence" type="hidden" value={confidence} />
      {targetEntityType ? <input name="targetEntityType" type="hidden" value={targetEntityType} /> : null}
      {targetEntityId ? <input name="targetEntityId" type="hidden" value={targetEntityId} /> : null}
      <button className="status-badge" type="submit">{label}</button>
    </form>
  );
}

function ExtractionNotice({ message, status }: { message?: string; status?: string }) {
  if (!message || !status) return null;
  const variant = status === "success" ? "success" : "warning";

  return (
    <p className={`admin-notice admin-notice--${variant}`}>
      {message}
    </p>
  );
}

function getPlaceMatchConfidence(rawValue: string, candidates: string[]) {
  const rawSlug = toSlug(rawValue);
  if (!rawSlug) return "low";

  for (const candidate of candidates) {
    const candidateSlug = toSlug(candidate);
    if (!candidateSlug) continue;
    if (rawSlug === candidateSlug) return "high";
    if (rawSlug.includes(candidateSlug) || candidateSlug.includes(rawSlug)) return "medium";
  }

  return "low";
}

function rankConfidence(confidences: Array<"low" | "medium" | "high">) {
  if (confidences.includes("high")) return "high";
  if (confidences.includes("medium")) return "medium";
  return "low";
}

function sortSuggestionMatches(left: MetadataSuggestionMatch, right: MetadataSuggestionMatch) {
  return confidenceScore(right.confidence) - confidenceScore(left.confidence) || left.label.localeCompare(right.label);
}

function confidenceScore(confidence: "low" | "medium" | "high") {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

function getAcceptedClaimKeys(claims: NonNullable<Awaited<ReturnType<typeof getInstagramItem>>>["derivedClaims"]) {
  return new Set(
    claims
      .filter((claim) => claim.status === "matched" || claim.status === "published")
      .map((claim) => getClaimKey(claim.claimType, claim.rawValue, claim.targetEntityType ?? undefined, claim.targetEntityId ?? undefined))
  );
}

function getClaimKey(claimType: string, rawValue: string, targetEntityType?: string, targetEntityId?: string) {
  return [claimType, toSlug(rawValue), targetEntityType ?? "", targetEntityId ?? ""].join(":");
}

function ItemStatusForm({
  instagramItemId,
  returnTo,
  status,
  label,
  variant = "primary"
}: {
  instagramItemId: string;
  returnTo: string;
  status: "needs_review" | "suggested" | "matched" | "ignored" | "published" | "hidden";
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  return (
    <form action={updateInstagramItemStatus}>
      <input name="instagramItemId" type="hidden" value={instagramItemId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="status" type="hidden" value={status} />
      <button className={getActionButtonClassName(variant)} type="submit">{label}</button>
    </form>
  );
}

function LinkStatusForm({
  instagramItemSaintId,
  matchStatus,
  returnTo,
  label,
  variant = "secondary"
}: {
  instagramItemSaintId: string;
  matchStatus: "suggested" | "needs_review" | "matched" | "ignored" | "published" | "hidden";
  returnTo: string;
  label: string;
  variant?: "primary" | "secondary" | "warning";
}) {
  return (
    <form action={updateInstagramItemSaintStatus}>
      <input name="instagramItemSaintId" type="hidden" value={instagramItemSaintId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="matchStatus" type="hidden" value={matchStatus} />
      <button className={getActionButtonClassName(variant)} type="submit">{label}</button>
    </form>
  );
}

function ReviewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="review-field">
      <strong>{label}</strong>
      <span>{value || "Not set"}</span>
    </div>
  );
}

function getActionButtonClassName(variant: "primary" | "secondary" | "warning") {
  return [
    "admin-form-button",
    variant === "secondary" ? "admin-form-button--secondary" : null,
    variant === "warning" ? "admin-form-button--warning" : null
  ].filter(Boolean).join(" ");
}

function getInstagramPreviewAlt(item: NonNullable<Awaited<ReturnType<typeof getInstagramItem>>>) {
  return item.captionText ? `Instagram preview: ${item.captionText.slice(0, 80)}` : "Instagram media preview";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
