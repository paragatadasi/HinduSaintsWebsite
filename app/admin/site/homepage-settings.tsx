import { Image, Quote, Save, Sparkles, Star } from "lucide-react";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { HOME_PAGE_CONFIG_ID } from "@/lib/home-page-config";
import { db } from "@/lib/db";
import { getHomeHeroContent, getHomeQuoteContent, getHomeSectionContent } from "@/lib/site-content";
import { updateHomePageConfig } from "./home-actions";
import { HomeBannerFocalPicker } from "./home-banner-focal-picker";
import { HomeBannerUploader } from "./home-banner-uploader";
import { FeaturedTraditionPlacementsEditor } from "./featured-tradition-placements-editor";

export async function HomepageSettings() {
  const [config, saints, traditions] = await Promise.all([
    db.homePageConfig.findUnique({
      where: { id: HOME_PAGE_CONFIG_ID },
      include: {
        bannerImage: true,
        featuredTraditionBannerImage: true,
        featuredTraditionPlacements: {
          include: { bannerImage: true },
          orderBy: { sortOrder: "asc" }
        }
      }
    }),
    db.saint.findMany({
      orderBy: [{ status: "asc" }, { displayName: "asc" }],
      select: {
        id: true,
        displayName: true,
        canonicalName: true,
        status: true,
        eraLabel: true
      }
    }),
    db.tradition.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        status: true,
        founderDisplayName: true
      }
    })
  ]);
  const defaultHero = getHomeHeroContent();
  const defaultQuote = getHomeQuoteContent();
  const defaultSections = {
    featuredSaints: getHomeSectionContent("featuredSaints"),
    map: getHomeSectionContent("map"),
    traditions: getHomeSectionContent("traditions"),
    instagram: getHomeSectionContent("instagram")
  };
  const defaultQuoteSaintId = config?.quoteSaintId
    ?? saints.find((saint) => saint.status === "published" && (
      saint.displayName === defaultQuote.attribution
      || saint.canonicalName === defaultQuote.attribution
    ))?.id
    ?? "";
  const saintOptions = saints.map((saint) => ({
    value: saint.id,
    label: saint.displayName,
    description: [saint.status, saint.eraLabel].filter(Boolean).join(" · "),
    keywords: [saint.canonicalName, saint.status, saint.eraLabel].filter((value): value is string => Boolean(value))
  }));
  const quoteSaintOptions = saints
    .filter((saint) => saint.status === "published")
    .map((saint) => ({
      value: saint.id,
      label: saint.displayName,
      description: saint.eraLabel ?? undefined,
      keywords: [saint.canonicalName, saint.eraLabel].filter((value): value is string => Boolean(value))
    }));
  const traditionOptions = traditions.map((tradition) => ({
    value: tradition.id,
    label: tradition.name,
    description: [tradition.status, tradition.founderDisplayName].filter(Boolean).join(" · "),
    keywords: [tradition.status, tradition.founderDisplayName].filter((value): value is string => Boolean(value))
  }));
  const featuredTraditionPlacements = config?.featuredTraditionPlacements.length
    ? config.featuredTraditionPlacements.map((placement) => ({
        traditionId: placement.traditionId,
        bannerImageId: placement.bannerImageId ?? undefined,
        bannerImage: placement.bannerImage ? {
          url: placement.bannerImage.url,
          altText: placement.bannerImage.altText ?? undefined
        } : undefined,
        focalX: placement.focalX,
        focalY: placement.focalY,
        focalWidth: placement.focalWidth,
        focalHeight: placement.focalHeight
      }))
    : (config?.featuredTraditionIds ?? []).slice(0, 5).map((traditionId, index) => ({
        traditionId,
        bannerImageId: index === 0 ? config?.featuredTraditionBannerImageId ?? undefined : undefined,
        bannerImage: index === 0 && config?.featuredTraditionBannerImage ? {
          url: config.featuredTraditionBannerImage.url,
          altText: config.featuredTraditionBannerImage.altText ?? undefined
        } : undefined,
        focalX: index === 0 ? config?.featuredTraditionBannerFocalX ?? 50 : 50,
        focalY: index === 0 ? config?.featuredTraditionBannerFocalY ?? 50 : 50,
        focalWidth: index === 0 ? config?.featuredTraditionBannerFocalWidth ?? 60 : 60,
        focalHeight: index === 0 ? config?.featuredTraditionBannerFocalHeight ?? 60 : 60
      }));

  return (
    <section className="admin-stack" id="homepage">
      <div>
        <div className="eyebrow">Site section</div>
        <h2>Homepage</h2>
        <p className="lede">Curate the public homepage feature slots, hero banner, and daily quote.</p>
      </div>

      <form action={updateHomePageConfig} className="form-stack">
        <ReviewWorkflow
          className="review-panel--homepage-config"
          eyebrow="Homepage CMS"
          title="Public homepage configuration"
          description="Blank fields use the current design-system defaults."
          gridClassName="review-workflow__grid--homepage-config"
        >
          <ReviewSection title="Hero" icon={<Sparkles size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <div className="field-grid field-grid--identity-line">
                <label>
                  Eyebrow
                  <input name="heroEyebrow" type="text" defaultValue={config?.heroEyebrow ?? defaultHero.eyebrow} />
                </label>
                <label>
                  Title
                  <input name="heroTitle" type="text" maxLength={160} defaultValue={config?.heroTitle ?? defaultHero.title} />
                </label>
              </div>
              <label>
                Body
                <textarea name="heroBody" maxLength={500} defaultValue={config?.heroBody ?? defaultHero.body} />
              </label>
              <div className="field-grid">
                <label>
                  Search label
                  <input name="heroPrimaryLabel" type="text" maxLength={120} defaultValue={config?.heroPrimaryLabel ?? defaultHero.primaryAction.label} />
                </label>
                <label>
                  Search path
                  <input name="heroPrimaryHref" type="text" maxLength={500} defaultValue={config?.heroPrimaryHref ?? defaultHero.primaryAction.href} />
                </label>
                <label>
                  Secondary label
                  <input name="heroSecondaryLabel" type="text" maxLength={120} defaultValue={config?.heroSecondaryLabel ?? defaultHero.secondaryAction.label} />
                </label>
                <label>
                  Secondary URL
                  <input name="heroSecondaryHref" type="text" maxLength={500} defaultValue={config?.heroSecondaryHref ?? defaultHero.secondaryAction.href} />
                </label>
              </div>
            </div>
          </ReviewSection>

          <ReviewSection title="Banner image" icon={<Image size={18} aria-hidden="true" />}>
            <div className="home-config-media">
              {config?.bannerImage ? (
                <HomeBannerFocalPicker
                  altText={config.bannerImage.altText ?? "Homepage banner image"}
                  defaultArea={{
                    x: config.bannerFocalX,
                    y: config.bannerFocalY,
                    width: config.bannerFocalWidth,
                    height: config.bannerFocalHeight
                  }}
                  imageUrl={config.bannerImage.url}
                />
              ) : (
                <>
                  <input name="bannerFocalX" type="hidden" value={50} />
                  <input name="bannerFocalY" type="hidden" value={50} />
                  <input name="bannerFocalWidth" type="hidden" value={60} />
                  <input name="bannerFocalHeight" type="hidden" value={60} />
                  <p className="empty-note">No banner image selected.</p>
                </>
              )}
              <HomeBannerUploader defaultBannerImageId={config?.bannerImageId ?? ""} />
            </div>
          </ReviewSection>

          <ReviewSection title="Featured saints" icon={<Star size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <SectionHeadingFields
                eyebrowName="featuredSaintsEyebrow"
                eyebrowValue={config?.featuredSaintsEyebrow ?? defaultSections.featuredSaints.eyebrow}
                titleName="featuredSaintsTitle"
                titleValue={config?.featuredSaintsTitle ?? defaultSections.featuredSaints.title}
              />
              <SearchableMultiSelect
              defaultSelectedValues={config?.featuredSaintIds ?? []}
              label="Saints"
              name="featuredSaintId"
              options={saintOptions}
              placeholder="Search saints"
              reorderable
              selectedLabel="Featured saints"
              />
            </div>
          </ReviewSection>

          <ReviewSection title="Map" icon={<Star size={18} aria-hidden="true" />}>
            <SectionHeadingFields
              eyebrowName="mapEyebrow"
              eyebrowValue={config?.mapEyebrow ?? defaultSections.map.eyebrow}
              titleName="mapTitle"
              titleValue={config?.mapTitle ?? defaultSections.map.title}
            />
          </ReviewSection>

          <ReviewSection className="review-workflow__section--wide" title="Featured traditions" icon={<Star size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <SectionHeadingFields
                eyebrowName="traditionsEyebrow"
                eyebrowValue={config?.traditionsEyebrow ?? defaultSections.traditions.eyebrow}
                titleName="traditionsTitle"
                titleValue={config?.traditionsTitle ?? defaultSections.traditions.title}
              />
              <FeaturedTraditionPlacementsEditor
              initialPlacements={featuredTraditionPlacements}
              options={traditionOptions}
              />
            </div>
          </ReviewSection>

          <ReviewSection title="Instagram" icon={<Star size={18} aria-hidden="true" />}>
            <SectionHeadingFields
              eyebrowName="instagramEyebrow"
              eyebrowValue={config?.instagramEyebrow ?? defaultSections.instagram.eyebrow}
              titleName="instagramTitle"
              titleValue={config?.instagramTitle ?? defaultSections.instagram.title}
            />
          </ReviewSection>

          <ReviewSection title="Quote of the day" icon={<Quote size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <label>
                Eyebrow
                <input name="quoteEyebrow" type="text" maxLength={80} defaultValue={config?.quoteEyebrow ?? defaultQuote.eyebrow} />
              </label>
              <label>
                Quote
                <textarea name="quoteText" maxLength={500} defaultValue={config?.quoteText ?? defaultQuote.quote} />
              </label>
              <SearchableSelect
                defaultValue={defaultQuoteSaintId}
                emptyText="No published saints match this search."
                label="Attribution"
                name="quoteSaintId"
                options={quoteSaintOptions}
                placeholder="Search published saints"
                required
              />
            </div>
          </ReviewSection>
        </ReviewWorkflow>

        <div className="review-actions">
          <button className="admin-form-button" type="submit">
            <Save size={16} aria-hidden="true" />
            Save homepage
          </button>
        </div>
      </form>
    </section>
  );
}

function SectionHeadingFields({ eyebrowName, eyebrowValue, titleName, titleValue }: {
  eyebrowName: string;
  eyebrowValue: string;
  titleName: string;
  titleValue: string;
}) {
  return (
    <div className="field-grid field-grid--identity-line">
      <label>
        Eyebrow
        <input name={eyebrowName} type="text" maxLength={80} defaultValue={eyebrowValue} />
      </label>
      <label>
        Section title
        <input name={titleName} type="text" maxLength={160} defaultValue={titleValue} />
      </label>
    </div>
  );
}
