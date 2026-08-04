import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { userRoleLabels } from "@/lib/permissions";
import { updateUserAccess } from "./actions";
const roles = ["site_admin", "data_admin", "editor", "contributor", "curator", "translator"] as const;
export default async function UsersAccessPage() {
  await requireCapability("manage_users");
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }, { email: "asc" }] });
  return <div className="admin-stack"><div><div className="eyebrow">Operations</div><h1>Users &amp; Access</h1><p className="lede">Assign additive roles and deactivate access. At least one active Site Admin must remain.</p></div><div className="review-list">{users.map((user) => <form action={updateUserAccess} className="review-row" key={user.id}><input name="userId" type="hidden" value={user.id} /><div><h2>{user.name || user.email}</h2>{user.name ? <p>{user.email}</p> : null}<div className="review-actions">{roles.map((role) => <label className="bulk-review-select-all" key={role}><input defaultChecked={user.roles.includes(role)} name="roles" type="checkbox" value={role} /><span>{userRoleLabels[role]}</span></label>)}</div></div><div className="admin-settings-form"><label className="bulk-review-select-all"><input defaultChecked={user.active} name="active" type="checkbox" /><span>Active</span></label><button className="admin-form-button" type="submit">Save access</button></div></form>)}</div></div>;
}
