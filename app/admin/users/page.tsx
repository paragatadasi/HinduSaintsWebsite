import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCapability } from "@/lib/admin-access";
import { getBulkDeletePasswordStatus } from "@/lib/admin-secrets";
import { db } from "@/lib/db";
import { userRoleLabels } from "@/lib/permissions";
import { setBulkDeletePasswordAction } from "../actions";
import { createAdminUser, updateUserAccess } from "./actions";

const roles = ["site_admin", "data_admin", "editor", "contributor", "curator", "translator"] as const;

type UsersAccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersAccessPage({ searchParams }: UsersAccessPageProps) {
  await requireCapability("manage_users");
  const [params, users, audits, passwordStatus] = await Promise.all([
    searchParams,
    db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }, { email: "asc" }] }),
    db.adminAccessAudit.findMany({
      include: { targetUser: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    getBulkDeletePasswordStatus()
  ]);
  const message = getMessage(params);
  const passwordUpdated = firstParam(params.sensitiveActionPassword) === "updated";
  const updatedEmail = firstParam(params.updated);

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Operations</div>
        <h1>Users &amp; Access</h1>
        <p className="lede">Approve users, assign additive roles, and review access changes. At least one active Site Admin must remain.</p>
      </div>

      {message ? <p className={`admin-notice form-status form-status--${message.tone}`}>{message.text}</p> : null}

      <CollapsibleReviewCard
        cardId="approve-user"
        defaultOpen={users.length === 0}
        description="Create an approved database user before their first Google sign-in. Their verified Google account links to this record."
        eyebrow="New access"
        title="Approve a user"
      >
        <form action={createAdminUser} className="admin-settings-form admin-settings-form--stacked">
          <label className="admin-field"><span>Email</span><input autoComplete="email" name="email" required type="email" /></label>
          <RoleCheckboxes defaults={["contributor"]} />
          <p className="admin-settings-note">Roles combine additively. Ongoing authorization is database-backed.</p>
          <div className="review-actions admin-settings-form__actions"><button className="admin-form-button" type="submit">Approve user</button></div>
        </form>
      </CollapsibleReviewCard>

      <section aria-label="Approved users">
        <div className="section-heading"><h2>Approved users</h2><StatusBadge label={String(users.length)} /></div>
        <div className="review-list">
          {users.map((user) => (
            <CollapsibleReviewCard
              cardId={`user-${user.id}`}
              className="admin-user-access-card"
              defaultOpen={updatedEmail === user.email}
              description={user.name ? user.email : formatRoles(user.roles)}
              eyebrow={`${user.active ? "Active" : "Inactive"} · ${user.lastSignedInAt ? `Last sign-in ${formatDate(user.lastSignedInAt)}` : "Never signed in"}`}
              key={user.id}
              title={user.name || user.email}
            >
              <form action={updateUserAccess} className="admin-settings-form admin-settings-form--stacked">
                <input name="userId" type="hidden" value={user.id} />
                <RoleCheckboxes defaults={user.roles} />
                <div className="admin-form-footer">
                  <label className="admin-option-toggle"><input defaultChecked={user.active} name="active" type="checkbox" /><span>Active account</span></label>
                  <button className="admin-form-button" type="submit">Save access</button>
                </div>
              </form>
            </CollapsibleReviewCard>
          ))}
        </div>
      </section>

      <CollapsibleReviewCard
        cardId="sensitive-action-password"
        className="admin-settings-panel"
        defaultOpen={passwordUpdated}
        description="Required before destructive bulk operations. This shared safeguard does not replace role checks or audit records."
        eyebrow="Sensitive actions"
        title="Sensitive-action password"
      >
        <div className="review-meta"><StatusBadge label={passwordStatus.isConfigured ? "Configured" : "Not configured"} />{passwordStatus.isDatabaseConfigured ? <StatusBadge label="Managed in CMS" /> : null}</div>
        {passwordUpdated ? <p className="admin-notice form-status form-status--success">Sensitive-action password updated.</p> : null}
        <form action={setBulkDeletePasswordAction} className="admin-settings-form admin-settings-form--stacked">
          <label className="admin-field"><span>New password</span><input autoComplete="new-password" minLength={10} name="bulkDeletePassword" required type="password" /></label>
          <label className="admin-field"><span>Confirm password</span><input autoComplete="new-password" minLength={10} name="confirmBulkDeletePassword" required type="password" /></label>
          <div className="review-actions admin-settings-form__actions"><button className="admin-form-button" type="submit">Set password</button></div>
        </form>
        {passwordStatus.updatedAt ? <p className="admin-settings-note">Last updated {formatDate(passwordStatus.updatedAt)}{passwordStatus.updatedByEmail ? ` by ${passwordStatus.updatedByEmail}` : ""}.</p> : null}
      </CollapsibleReviewCard>

      <CollapsibleReviewCard cardId="access-audit" description="Recent user approvals, role changes, activations, and deactivations." eyebrow="Audit history" title="Recent access changes">
        {audits.length ? (
          <div className="review-list">
            {audits.map((audit) => (
              <article className="review-row" key={audit.id}>
                <div>
                  <div className="review-meta"><StatusBadge label={formatAction(audit.action)} /><StatusBadge label={formatDate(audit.createdAt)} /></div>
                  <h3>{audit.targetUser.name || audit.targetUser.email}</h3>
                  <p>{formatRoles(audit.beforeRoles)} → {formatRoles(audit.afterRoles)} · {audit.beforeActive ? "active" : "inactive"} → {audit.afterActive ? "active" : "inactive"}</p>
                </div>
                <p>Changed by {audit.actorEmail}</p>
              </article>
            ))}
          </div>
        ) : <p className="empty-note">No access changes have been recorded yet.</p>}
      </CollapsibleReviewCard>
    </div>
  );
}

function RoleCheckboxes({ defaults }: { defaults: readonly string[] }) {
  return (
    <fieldset className="admin-field">
      <legend>Roles</legend>
      <div className="admin-option-grid">
        {roles.map((role) => (
          <label className="admin-option-toggle" key={role}>
            <input defaultChecked={defaults.includes(role)} name="roles" type="checkbox" value={role} />
            <span>{userRoleLabels[role]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function getMessage(params: Record<string, string | string[] | undefined>) {
  const error = firstParam(params.error);
  if (error) return { text: error, tone: "error" } as const;
  const created = firstParam(params.created);
  if (created) return { text: `${created} is approved and can now sign in.`, tone: "success" } as const;
  const updated = firstParam(params.updated);
  if (updated) return { text: `Access updated for ${updated}.`, tone: "success" } as const;
  return null;
}

function firstParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatDate(value: Date) { return value.toLocaleString(); }
function formatAction(value: string) { return value.replaceAll("_", " "); }
function formatRoles(values: readonly (keyof typeof userRoleLabels)[]) { return values.length ? values.map((role) => userRoleLabels[role]).join(", ") : "No roles"; }
