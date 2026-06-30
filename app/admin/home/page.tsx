import { Image, Quote, Save, Sparkles, Star } from "lucide-react";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { HOME_PAGE_CONFIG_ID } from "@/lib/home-page-config";
import { db } from "@/lib/db";
import { getHomeHeroContent, getHomeQuoteContent } from "@/lib/site-content";
import { updateHomePageConfig } from "./actions";
import { HomeBannerFocalPicker } from "./home-banner-focal-picker";
import { HomeBannerUploader } from "./home-banner-uploader";

export default async function AdminHomePage() {
  const [config, saints, traditions] = await Promise.all([
    db.homePageConfig.findUnique({
      where: { id: HOME_PAGE_CONFIG_ID },
      include: { bannerImage: true }
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
  const saintOptions = saints.map((saint) => ({
    value: saint.id,
    label: saint.displayName,
    description: [saint.status, saint.eraLabel].filter(Boolean).join(" · "),
    keywords: [saint.canonicalName, saint.status, saint.eraLabel].filter((value): value is string => Boolean(value))
  }));
  const traditionOptions = traditions.map((tradition) => ({
    value: tradition.id,
    label: tradition.name,
    description: [tradition.status, tradition.founderDisplayName].filter(Boolean).join(" · "),
    keywords: [tradition.status, tradition.founderDisplayName].filter((value): value is string => Boolean(value))
  }));

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Homepage</div>
        <h1>Homepage settings</h1>
        <p className="lede">Curate the public homepage feature slots, hero banner, and daily quote.</p>
      </div>

      <form action={updateHomePageConfig} className="form-stack">
        <ReviewWorkflow
          eyebrow="Homepage CMS"
          title="Public homepage configuration"
          description="Blank fields use the current design-system defaults."
          gridClassName="review-workflow__grid--home-config"
        >
          <ReviewSection title="Hero" icon={<Sparkles size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <div className="field-grid field-grid--identity-line">
                <label>
                  Eyebrow
                  <input name="heroEyebrow" type="text" maxLength={24} defaultValue={config?.heroEyebrow ?? defaultHero.eyebrow} />
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
            <SearchableMultiSelect
              defaultSelectedValues={config?.featuredSaintIds ?? []}
              label="Saints"
              name="featuredSaintId"
              options={saintOptions}
              placeholder="Search saints"
              selectedLabel="Featured saints"
            />
          </ReviewSection>

          <ReviewSection title="Featured traditions" icon={<Star size={18} aria-hidden="true" />}>
            <SearchableMultiSelect
              defaultSelectedValues={config?.featuredTraditionIds ?? []}
              label="Traditions"
              name="featuredTraditionId"
              options={traditionOptions}
              placeholder="Search traditions"
              selectedLabel="Featured traditions"
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
              <label>
                Attribution
                <input name="quoteAttribution" type="text" maxLength={160} defaultValue={config?.quoteAttribution ?? defaultQuote.attribution} />
              </label>
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
    </div>
  );
}
