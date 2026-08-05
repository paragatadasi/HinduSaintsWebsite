import Link from "next/link";
import type { Route } from "next";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { claimAssignment, createAssignment, updateAssignment } from "./actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type AssignmentRow = Awaited<ReturnType<typeof loadAssignments>>[number];

export default async function WorkDashboard({ searchParams }: Props) {
  const user = await requireCapability("view_content");
  const canManage = hasCapability(user.roles, "manage_assignments");
  const canClaim = hasCapability(user.roles, "edit_content");
  const params = await searchParams;
  const [assignments, users, targets] = await Promise.all([
    loadAssignments(),
    db.user.findMany({ where: { active: true }, orderBy: [{ name: "asc" }, { email: "asc" }], select: { id: true, name: true, email: true } }),
    canManage ? loadTargets() : Promise.resolve([])
  ]);
  const refs = await loadContentRefs(assignments);
  const mine = assignments.filter((row) => row.assigneeId === user.id && active(row.state));
  const available = assignments.filter((row) => !row.assigneeId && row.state === "assigned");
  const blocked = assignments.filter((row) => row.state === "blocked" && (canManage || row.assigneeId === user.id));
  const completed = assignments.filter((row) => row.state === "completed").slice(0, 12);
  const updated = first(params.updated); const error = first(params.error);

  return <div className="admin-stack"><div><div className="eyebrow">Personal dashboard</div><h1>Assignments and workload</h1><p className="lede">Coordinate collaborators across Saints, Traditions, Places, and Instagram posts. Completing an assignment records workflow progress; it never publishes content.</p></div>
    {updated ? <p className="admin-notice form-status form-status--success">Assignment {updated}.</p> : null}{error ? <p className="admin-notice form-status form-status--error">{error}</p> : null}
    {canManage ? <section className="review-panel"><div className="section-heading"><div><div className="eyebrow">Coordinate</div><h2>Create assignment</h2></div></div><form action={createAssignment} className="admin-settings-form"><SearchableSelect label="Content" name="target" options={targets} placeholder="Search content" required /><div className="admin-form-grid"><label className="admin-field"><span>Task</span><select name="taskType" defaultValue="review"><option value="review">Review</option><option value="edit">Edit</option><option value="research">Research</option><option value="source_check">Source check</option><option value="publish">Publish preparation</option></select></label><label className="admin-field"><span>Assignee</span><select name="assigneeId" defaultValue=""><option value="">Available for self-assignment</option>{users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name || candidate.email}</option>)}</select></label><label className="admin-field"><span>Priority</span><select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="admin-field"><span>Due date</span><input type="date" name="dueDate" /></label></div><label className="admin-field"><span>Notes</span><textarea name="notes" maxLength={2000} rows={3} /></label><button className="admin-form-button" type="submit">Create assignment</button></form></section> : null}
    <AssignmentSection title="My Work" empty="You have no active assignments." rows={mine} refs={refs} users={users} userId={user.id} canManage={canManage} />
    <AssignmentSection title="Available Work" empty="No work is currently available for self-assignment." rows={available} refs={refs} users={users} userId={user.id} canManage={canManage} available={canClaim} readOnly={!canClaim} />
    <AssignmentSection title="Blocked" empty="No visible assignments are blocked." rows={blocked} refs={refs} users={users} userId={user.id} canManage={canManage} />
    <AssignmentSection title="Recently Completed" empty="No assignments have been completed yet." rows={completed} refs={refs} users={users} userId={user.id} canManage={canManage} readOnly />
    {canManage ? <TeamWorkload assignments={assignments} users={users} /> : null}
  </div>;
}

function AssignmentSection({ title, empty, rows, refs, users, userId, canManage, available = false, readOnly = false }: { title: string; empty: string; rows: AssignmentRow[]; refs: Map<string, { label: string; href: Route }>; users: { id: string; name: string | null; email: string }[]; userId: string; canManage: boolean; available?: boolean; readOnly?: boolean }) {
  return <section><div className="section-heading"><h2>{title}</h2><StatusBadge label={String(rows.length)} /></div>{rows.length ? <div className="review-list">{rows.map((row) => { const ref = refs.get(`${row.contentType}:${row.contentId}`); return <article className="review-row" key={row.id}><div className="review-row__content"><div className="review-meta"><StatusBadge label={label(row.contentType)} /><StatusBadge label={label(row.taskType)} /><StatusBadge label={row.priority} /><StatusBadge label={label(row.state)} /></div><h3>{ref ? <Link href={ref.href}>{ref.label}</Link> : "Missing content record"}</h3><p>{row.notes || "No assignment notes."}</p><small>{row.assignee ? `Assigned to ${row.assignee.name || row.assignee.email}` : "Available to claim"}{row.dueDate ? ` · Due ${row.dueDate.toLocaleDateString()}` : ""}</small></div>{available ? <form action={claimAssignment}><input type="hidden" name="assignmentId" value={row.id} /><button className="admin-form-button" type="submit">Assign to me</button></form> : !readOnly && (canManage || row.assigneeId === userId) ? <form action={updateAssignment} className="admin-settings-form"><input type="hidden" name="assignmentId" value={row.id} />{canManage ? <label className="admin-field"><span>Assignee</span><select defaultValue={row.assigneeId || ""} name="assigneeId"><option value="">Available</option>{users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name || candidate.email}</option>)}</select></label> : null}<label className="admin-field"><span>State</span><select defaultValue={row.state} name="state"><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><button className="admin-form-button admin-form-button--secondary" type="submit">Update</button></form> : null}</article>; })}</div> : <p className="empty-note">{empty}</p>}</section>;
}

function TeamWorkload({ assignments, users }: { assignments: AssignmentRow[]; users: { id: string; name: string | null; email: string }[] }) {
  const activeRows = assignments.filter((row) => active(row.state));
  return <section><div className="section-heading"><h2>Team Workload</h2></div><div className="review-list">{users.map((user) => { const rows = activeRows.filter((row) => row.assigneeId === user.id); const blocked = rows.filter((row) => row.state === "blocked").length; return <div className="review-row" key={user.id}><div><h3>{user.name || user.email}</h3><p>{user.email}</p></div><div className="review-meta"><StatusBadge label={`${rows.length} active`} />{blocked ? <StatusBadge label={`${blocked} blocked`} /> : null}</div></div>; })}</div></section>;
}

async function loadAssignments() { return db.contentAssignment.findMany({ include: { assignee: { select: { id: true, name: true, email: true } }, assignedBy: { select: { name: true, email: true } } }, orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }], take: 300 }); }
async function loadTargets() { const [saints, traditions, places, posts] = await Promise.all([db.saint.findMany({ orderBy: { displayName: "asc" }, take: 300, select: { id: true, displayName: true, status: true } }), db.tradition.findMany({ orderBy: { name: "asc" }, take: 300, select: { id: true, name: true, status: true } }), db.place.findMany({ orderBy: { name: "asc" }, take: 300, select: { id: true, name: true } }), db.instagramItem.findMany({ orderBy: { createdAt: "desc" }, take: 300, select: { id: true, extractedSaintName: true, instagramShortcode: true, status: true } })]); return [...saints.map((row) => ({ value: `saint:${row.id}`, label: row.displayName, description: `Saint · ${row.status}` })), ...traditions.map((row) => ({ value: `tradition:${row.id}`, label: row.name, description: `Tradition · ${row.status}` })), ...places.map((row) => ({ value: `place:${row.id}`, label: row.name, description: "Place" })), ...posts.map((row) => ({ value: `instagram_item:${row.id}`, label: row.extractedSaintName || row.instagramShortcode || "Instagram post", description: `Instagram · ${row.status}` }))]; }
async function loadContentRefs(rows: AssignmentRow[]) { const ids = (type: string) => rows.filter((row) => row.contentType === type).map((row) => row.contentId); const [saints, traditions, places, posts] = await Promise.all([db.saint.findMany({ where: { id: { in: ids("saint") } }, select: { id: true, displayName: true, slug: true } }), db.tradition.findMany({ where: { id: { in: ids("tradition") } }, select: { id: true, name: true, slug: true } }), db.place.findMany({ where: { id: { in: ids("place") } }, select: { id: true, name: true } }), db.instagramItem.findMany({ where: { id: { in: ids("instagram_item") } }, select: { id: true, extractedSaintName: true, instagramShortcode: true } })]); const map = new Map<string, { label: string; href: Route }>(); saints.forEach((row) => map.set(`saint:${row.id}`, { label: row.displayName, href: `/admin/saints/${row.slug}` as Route })); traditions.forEach((row) => map.set(`tradition:${row.id}`, { label: row.name, href: `/admin/traditions/${row.id}` as Route })); places.forEach((row) => map.set(`place:${row.id}`, { label: row.name, href: `/admin/places/${row.id}` as Route })); posts.forEach((row) => map.set(`instagram_item:${row.id}`, { label: row.extractedSaintName || row.instagramShortcode || "Instagram post", href: `/admin/instagram/${row.id}` as Route })); return map; }
function active(state: string) { return state === "assigned" || state === "in_progress" || state === "blocked"; }
function label(value: string) { return value.replaceAll("_", " "); }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
