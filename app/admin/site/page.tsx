import { ExternalLink, Save } from "lucide-react";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { SITE_CONFIG_ID } from "@/lib/site-config";
import { db } from "@/lib/db";
import { getFooterContent } from "@/lib/site-content";
import { updateSiteConfig } from "./actions";

type AdminSitePageProps = {
  searchParams: Promise<{ saved?: string | string[] }>;
};

export default async function AdminSitePage({ searchParams }: AdminSitePageProps) {
  const [{ saved }, config] = await Promise.all([
    searchParams,
    db.siteConfig.findUnique({ where: { id: SITE_CONFIG_ID } })
  ]);
  const defaults = getFooterContent();
  const didSave = getSearchParam(saved) === "true";

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Site settings</div>
        <h1>Site-wide settings</h1>
        <p className="lede">Manage links and details that appear across the public website.</p>
      </div>

      {didSave ? (
        <p className="admin-notice form-status form-status--success">Site settings updated.</p>
      ) : null}

      <form action={updateSiteConfig} className="form-stack">
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
                  defaultValue={config?.imprintUrl ?? defaults.imprint.href}
                  maxLength={1000}
                  name="imprintUrl"
                  required
                  type="url"
                />
              </label>
              <label>
                Privacy Policy URL
                <input
                  defaultValue={config?.privacyPolicyUrl ?? defaults.privacyPolicy.href}
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
            Save site settings
          </button>
        </div>
      </form>
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
