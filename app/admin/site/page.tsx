import { BookOpen, ExternalLink, FileText, Image, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { db } from "@/lib/db";
import { getAboutPageContent, getFooterContent } from "@/lib/site-content";
import { updateAboutPageConfig, updateFooterConfig } from "./actions";
import { AboutSectionsEditor } from "./about-sections-editor";
import { HomepageSettings } from "./homepage-settings";
import { HomeBannerUploader } from "./home-banner-uploader";
import { AboutDiscoveryEditor } from "./about-discovery-editor";

type AdminSitePageProps = {
  searchParams: Promise<{
    about?: string | string[];
    footer?: string | string[];
    homepage?: string | string[];
  }>;
};

export default async function AdminSitePage({ searchParams }: AdminSitePageProps) {
  const [{ about, footer, homepage }, config] = await Promise.all([
    searchParams,
    db.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
      include: {
        aboutHeroImage: true,
        aboutVisionImage: true,
        aboutStoryImage: true,
        aboutGuruImage: true
      }
    })
  ]);
  const aboutDefaults = getAboutPageContent();
  const footerDefaults = getFooterContent();
  const aboutSections =
    config
    && aboutDefaults
    && config.aboutSectionTitles.length > 0
    && config.aboutSectionTitles.length === config.aboutSectionBodies.length
      ? config.aboutSectionTitles.map((title, index) => ({
          title,
          body: config.aboutSectionBodies[index] ?? ""
        }))
      : aboutDefaults?.sections ?? [];
  const configuredDiscoveryCount = config?.aboutDiscoveryItemTitles.length ?? 0;
  const aboutDiscoveryItems = config
    && configuredDiscoveryCount > 0
    && config.aboutDiscoveryItemBodies.length === configuredDiscoveryCount
    && config.aboutDiscoveryItemHrefs.length === configuredDiscoveryCount
    && config.aboutDiscoveryItemIcons.length === configuredDiscoveryCount
      ? config.aboutDiscoveryItemTitles.map((title, index) => ({
          title,
          body: config.aboutDiscoveryItemBodies[index] ?? "",
          href: config.aboutDiscoveryItemHrefs[index] ?? "/",
          icon: normalizeDiscoveryIcon(config.aboutDiscoveryItemIcons[index])
        }))
      : aboutDefaults?.discovery.items ?? [];

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Site</div>
        <h1>Site configuration</h1>
        <p className="lede">Manage the public homepage, About page, and site-wide footer settings.</p>
      </div>

      {getSearchParam(homepage) === "saved" ? (
        <p className="admin-notice form-status form-status--success">Homepage settings updated.</p>
      ) : null}
      <HomepageSettings />

      {aboutDefaults ? (
        <section className="admin-stack" id="about">
          <div>
            <div className="eyebrow">Site section</div>
            <h2>About page</h2>
            <p className="lede">Edit the introduction and public information sections shown on the About page.</p>
          </div>

          {getSearchParam(about) === "saved" ? (
            <p className="admin-notice form-status form-status--success">About page updated.</p>
          ) : null}

          <form action={updateAboutPageConfig} className="form-stack">
            <ReviewWorkflow
              eyebrow="About CMS"
              title="Public About page"
              description="Each section body supports the same safe Markdown rendering used on the public page."
              gridClassName="review-workflow__grid--home-config"
            >
              <ReviewSection title="Introduction" icon={<BookOpen size={18} aria-hidden="true" />}>
                <div className="form-stack">
                  <div className="field-grid field-grid--identity-line">
                    <label>
                      Eyebrow
                      <input
                        defaultValue={config?.aboutEyebrow ?? aboutDefaults.eyebrow}
                        maxLength={80}
                        name="aboutEyebrow"
                        required
                        type="text"
                      />
                    </label>
                    <label>
                      Title
                      <input
                        defaultValue={config?.aboutTitle ?? aboutDefaults.title}
                        maxLength={160}
                        name="aboutTitle"
                        required
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="form-stack">
                    <label htmlFor="about-introduction">Introduction</label>
                    <MarkdownEditor
                      defaultValue={config?.aboutIntroduction ?? aboutDefaults.introduction}
                      formatting="basic"
                      maxLength={1000}
                      name="aboutIntroduction"
                      required
                      textareaId="about-introduction"
                    />
                  </div>
                </div>
              </ReviewSection>

              <ReviewSection title="Content sections" icon={<FileText size={18} aria-hidden="true" />}>
                <AboutSectionsEditor sections={aboutSections} />
              </ReviewSection>

              <ReviewSection title="Discovery cards" icon={<BookOpen size={18} aria-hidden="true" />}>
                <div className="form-stack">
                  <label>
                    Section title
                    <input name="aboutDiscoveryTitle" maxLength={160} required type="text" defaultValue={config?.aboutDiscoveryTitle ?? aboutDefaults.discovery.title} />
                  </label>
                  <AboutDiscoveryEditor items={aboutDiscoveryItems} />
                </div>
              </ReviewSection>

              <ReviewSection title="Page imagery" icon={<Image size={18} aria-hidden="true" />}>
                <p className="review-workflow__description">
                  Upload an image for each visual slot. Existing selections remain active until replaced and saved.
                </p>
                <div className="about-config-image-grid">
                  <AboutImageField
                    image={config?.aboutHeroImage}
                    imageId={config?.aboutHeroImageId}
                    fieldName="aboutHeroImageId"
                    label="hero background"
                  />
                  <AboutImageField
                    image={config?.aboutVisionImage}
                    imageId={config?.aboutVisionImageId}
                    fieldName="aboutVisionImageId"
                    label="vision section image"
                  />
                  <AboutImageField
                    image={config?.aboutStoryImage}
                    imageId={config?.aboutStoryImageId}
                    fieldName="aboutStoryImageId"
                    label="story section image"
                  />
                  <AboutImageField
                    image={config?.aboutGuruImage}
                    imageId={config?.aboutGuruImageId}
                    fieldName="aboutGuruImageId"
                    label="Guruji section image"
                  />
                </div>
              </ReviewSection>
            </ReviewWorkflow>

            <div className="review-actions">
              <button className="admin-form-button" type="submit">
                <Save size={16} aria-hidden="true" />
                Save About page
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="admin-stack" id="footer">
        <div>
          <div className="eyebrow">Site section</div>
          <h2>Footer</h2>
          <p className="lede">Manage the legal destinations shown across the public website.</p>
        </div>

        {getSearchParam(footer) === "saved" ? (
          <p className="admin-notice form-status form-status--success">Footer settings updated.</p>
        ) : null}

        <form action={updateFooterConfig} className="form-stack">
          <ReviewWorkflow
            eyebrow="Legal"
            title="Footer links"
            description="These URLs are used by the Imprint and Privacy Policy links in the public footer."
          >
            <ReviewSection title="Legal destinations" icon={<ExternalLink size={18} aria-hidden="true" />}>
              <div className="form-stack">
                <label>
                  Imprint URL
                  <input
                    defaultValue={config?.imprintUrl ?? footerDefaults.imprint.href}
                    maxLength={1000}
                    name="imprintUrl"
                    required
                    type="url"
                  />
                </label>
                <label>
                  Privacy Policy URL
                  <input
                    defaultValue={config?.privacyPolicyUrl ?? footerDefaults.privacyPolicy.href}
                    maxLength={1000}
                    name="privacyPolicyUrl"
                    required
                    type="url"
                  />
                </label>
              </div>
            </ReviewSection>
          </ReviewWorkflow>

          <div className="review-actions">
            <button className="admin-form-button" type="submit">
              <Save size={16} aria-hidden="true" />
              Save footer
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function AboutImageField({
  fieldName,
  image,
  imageId,
  label
}: {
  fieldName: string;
  image?: { altText: string | null; url: string } | null;
  imageId?: string | null;
  label: string;
}) {
  return (
    <div className="about-config-image-field">
      <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
      {image ? <img className="about-config-image-preview" src={image.url} alt={image.altText ?? label} /> : null}
      <HomeBannerUploader
        defaultBannerImageId={imageId ?? ""}
        fieldName={fieldName}
        uploadLabel={label}
      />
    </div>
  );
}

function normalizeDiscoveryIcon(value: string | undefined): "sparkles" | "book" | "map" | "flame" {
  if (value === "book" || value === "map" || value === "flame") return value;
  return "sparkles";
}
