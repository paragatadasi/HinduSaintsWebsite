import { ExternalLink, Save } from "lucide-react";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { db } from "@/lib/db";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { getFooterContent } from "@/lib/site-content";
import { updateFooterConfig } from "../actions";

type AdminFooterConfigurationPageProps = {
  searchParams: Promise<{ footer?: string | string[] }>;
};

export default async function AdminFooterConfigurationPage({ searchParams }: AdminFooterConfigurationPageProps) {
  const [{ footer }, config] = await Promise.all([
    searchParams,
    db.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
      select: { imprintUrl: true, privacyPolicyUrl: true }
    })
  ]);
  const defaults = getFooterContent();

  return (
    <section className="admin-stack">
      <div>
        <div className="eyebrow">Site-wide</div>
        <h2>Footer</h2>
        <p className="lede">Manage the legal destinations shown across the public website.</p>
      </div>

      {getSearchParam(footer) === "saved" ? (
        <p className="admin-notice form-status form-status--success">Footer settings updated.</p>
      ) : null}

      <form action={updateFooterConfig} className="form-stack">
        <ReviewWorkflow eyebrow="Legal" title="Footer links" description="These URLs are used by the Imprint and Privacy Policy links in the public footer.">
          <ReviewSection title="Legal destinations" icon={<ExternalLink size={18} aria-hidden="true" />}>
            <div className="form-stack">
              <label>
                Imprint URL
                <input defaultValue={config?.imprintUrl ?? defaults.imprint.href} maxLength={1000} name="imprintUrl" required type="url" />
              </label>
              <label>
                Privacy Policy URL
                <input defaultValue={config?.privacyPolicyUrl ?? defaults.privacyPolicy.href} maxLength={1000} name="privacyPolicyUrl" required type="url" />
              </label>
            </div>
          </ReviewSection>
        </ReviewWorkflow>

        <div className="review-actions">
          <button className="admin-form-button" type="submit"><Save size={16} aria-hidden="true" />Save footer</button>
        </div>
      </form>
    </section>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
