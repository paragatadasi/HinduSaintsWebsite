import { BookOpen, FileText, Image, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { db } from "@/lib/db";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { getAboutPageContent } from "@/lib/site-content";
import { AboutDiscoveryEditor } from "../about-discovery-editor";
import { AboutSectionsEditor } from "../about-sections-editor";
import { updateAboutPageConfig } from "../actions";
import { HomeBannerUploader } from "../home-banner-uploader";

type AdminAboutConfigurationPageProps = {
  searchParams: Promise<{ about?: string | string[] }>;
};

export default async function AdminAboutConfigurationPage({ searchParams }: AdminAboutConfigurationPageProps) {
  const [{ about }, config] = await Promise.all([
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
  const defaults = getAboutPageContent();
  if (!defaults) return <p className="empty-note">About page defaults are unavailable.</p>;

  const sections = config
    && config.aboutSectionTitles.length > 0
    && config.aboutSectionTitles.length === config.aboutSectionBodies.length
      ? config.aboutSectionTitles.map((title, index) => ({ title, body: config.aboutSectionBodies[index] ?? "" }))
      : defaults.sections;
  const discoveryCount = config?.aboutDiscoveryItemTitles.length ?? 0;
  const discoveryItems = config
    && discoveryCount > 0
    && config.aboutDiscoveryItemBodies.length === discoveryCount
    && config.aboutDiscoveryItemHrefs.length === discoveryCount
    && config.aboutDiscoveryItemIcons.length === discoveryCount
      ? config.aboutDiscoveryItemTitles.map((title, index) => ({
          title,
          body: config.aboutDiscoveryItemBodies[index] ?? "",
          href: config.aboutDiscoveryItemHrefs[index] ?? "/",
          icon: normalizeDiscoveryIcon(config.aboutDiscoveryItemIcons[index])
        }))
      : defaults.discovery.items;

  return (
    <section className="admin-stack">
      <div>
        <div className="eyebrow">Public page</div>
        <h2>About</h2>
        <p className="lede">Edit the introduction, public information sections, discovery cards, and page imagery.</p>
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
                  <input defaultValue={config?.aboutEyebrow ?? defaults.eyebrow} maxLength={80} name="aboutEyebrow" required type="text" />
                </label>
                <label>
                  Title
                  <input defaultValue={config?.aboutTitle ?? defaults.title} maxLength={160} name="aboutTitle" required type="text" />
                </label>
              </div>
              <div className="form-stack">
                <label htmlFor="about-introduction">Introduction</label>
                <MarkdownEditor
                  defaultValue={config?.aboutIntroduction ?? defaults.introduction}
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
            <AboutSectionsEditor sections={sections} />
          </ReviewSection>

          <ReviewSection title="Discovery cards" icon={<BookOpen size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <label>
                Section title
                <input name="aboutDiscoveryTitle" maxLength={160} required type="text" defaultValue={config?.aboutDiscoveryTitle ?? defaults.discovery.title} />
              </label>
              <AboutDiscoveryEditor items={discoveryItems} />
            </div>
          </ReviewSection>

          <ReviewSection title="Page imagery" icon={<Image size={18} aria-hidden="true" />}>
            <p className="review-workflow__description">Upload an image for each visual slot. Existing selections remain active until replaced and saved.</p>
            <div className="about-config-image-grid">
              <AboutImageField image={config?.aboutHeroImage} imageId={config?.aboutHeroImageId} fieldName="aboutHeroImageId" label="hero background" />
              <AboutImageField image={config?.aboutVisionImage} imageId={config?.aboutVisionImageId} fieldName="aboutVisionImageId" label="vision section image" />
              <AboutImageField image={config?.aboutStoryImage} imageId={config?.aboutStoryImageId} fieldName="aboutStoryImageId" label="story section image" />
              <AboutImageField image={config?.aboutGuruImage} imageId={config?.aboutGuruImageId} fieldName="aboutGuruImageId" label="Guruji section image" />
            </div>
          </ReviewSection>
        </ReviewWorkflow>

        <div className="review-actions">
          <button className="admin-form-button" type="submit"><Save size={16} aria-hidden="true" />Save About page</button>
        </div>
      </form>
    </section>
  );
}

function AboutImageField({ fieldName, image, imageId, label }: {
  fieldName: string;
  image?: { altText: string | null; url: string } | null;
  imageId?: string | null;
  label: string;
}) {
  return (
    <div className="about-config-image-field">
      <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
      {image ? <img className="about-config-image-preview" src={image.url} alt={image.altText ?? label} /> : null}
      <HomeBannerUploader defaultBannerImageId={imageId ?? ""} fieldName={fieldName} uploadLabel={label} />
    </div>
  );
}

function normalizeDiscoveryIcon(value: string | undefined): "sparkles" | "book" | "map" | "flame" {
  if (value === "book" || value === "map" || value === "flame") return value;
  return "sparkles";
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
