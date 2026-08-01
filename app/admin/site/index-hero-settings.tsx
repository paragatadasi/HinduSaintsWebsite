import { Image, Save } from "lucide-react";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { db } from "@/lib/db";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { updateIndexHeroConfig } from "./actions";
import { HomeBannerUploader } from "./home-banner-uploader";

export async function IndexHeroSettings() {
  const config = await db.siteConfig.findUnique({ where: { id: SITE_CONFIG_ID }, include: { saintsHeroImage: true, traditionsHeroImage: true, mapHeroImage: true } });
  const fields = [
    { id: "saintsHeroImageId", label: "Saints page", image: config?.saintsHeroImage, value: config?.saintsHeroImageId },
    { id: "traditionsHeroImageId", label: "Traditions page", image: config?.traditionsHeroImage, value: config?.traditionsHeroImageId },
    { id: "mapHeroImageId", label: "Map page", image: config?.mapHeroImage, value: config?.mapHeroImageId }
  ];
  return <section className="admin-stack" id="index-heroes"><div><div className="eyebrow">Site imagery</div><h2>Directory hero images</h2><p className="lede">Set the wide header image for each public directory page.</p></div><form action={updateIndexHeroConfig} className="form-stack"><ReviewWorkflow eyebrow="Public pages" title="Directory headers" description="Pages retain their standard text header when no image is selected." gridClassName="review-workflow__grid--home-config">{fields.map((field) => <ReviewSection key={field.id} title={field.label} icon={<Image size={18} aria-hidden="true" />}><div className="home-config-media">{field.image ? <img className="site-hero-admin-preview" src={field.image.url} alt={field.image.altText ?? `${field.label} hero`} /> : <p className="empty-note">No hero image selected.</p>}<HomeBannerUploader allowClear defaultBannerImageId={field.value ?? ""} fieldName={field.id} uploadLabel={`${field.label.toLowerCase()} hero`} /></div></ReviewSection>)}</ReviewWorkflow><div className="review-actions"><button className="admin-form-button" type="submit"><Save size={16} aria-hidden="true" />Save hero images</button></div></form></section>;
}
