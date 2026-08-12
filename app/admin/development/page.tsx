import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getDevelopmentExperiencesForAdmin,
  requireDevelopmentExperienceViewer
} from "@/lib/development-experiences";
import { hasCapability } from "@/lib/permissions";
import { updateDevelopmentExperience } from "./actions";

const statusLabels = {
  off: "Off",
  admin_preview: "Admin preview",
  public: "Public"
} as const;

export default async function DevelopmentExperiencesPage() {
  const user = await requireDevelopmentExperienceViewer();
  const experiences = await getDevelopmentExperiencesForAdmin();
  const canManage = hasCapability(user.roles, "manage_development_experiences");

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Development</div>
        <h1>Feature previews</h1>
        <p className="lede">Review work in progress without exposing it to public visitors or search engines.</p>
      </div>

      <p className="admin-notice">
        Off hides an experience from everyone. Admin preview limits it to Site Admins, Editors, and Testers. Public makes its guarded public surface available to everyone.
      </p>

      <div className="review-list">
        {experiences.map(({ definition, status, updatedAt, updatedByEmail }) => (
          <article className="review-row" key={definition.key}>
            <div>
              <div className="review-meta">
                <StatusBadge label={definition.kind === "page" ? "Page" : "Feature"} />
                <StatusBadge label={statusLabels[status]} />
              </div>
              <h2>{definition.name}</h2>
              <p>{definition.description}</p>
              {updatedAt ? <p className="admin-settings-note">Updated {updatedAt.toLocaleString()}{updatedByEmail ? ` by ${updatedByEmail}` : ""}.</p> : null}
              {definition.previewHref && status !== "off" ? (
                <Link className="button button--secondary" href={definition.previewHref as Route} prefetch={false}>Open preview</Link>
              ) : null}
            </div>

            {canManage ? (
              <form action={updateDevelopmentExperience} className="admin-settings-form">
                <input name="key" type="hidden" value={definition.key} />
                <label className="admin-field">
                  <span>Visibility</span>
                  <select defaultValue={status} name="status">
                    <option value="off">Off</option>
                    <option value="admin_preview">Admin preview</option>
                    <option value="public">Public</option>
                  </select>
                </label>
                <button className="admin-form-button" type="submit">Save visibility</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
