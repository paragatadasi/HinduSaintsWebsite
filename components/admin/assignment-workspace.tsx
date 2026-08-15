import Link from "next/link";
import type { Route } from "next";
import { AssignmentLeaveControl } from "@/components/admin/assignment-leave-control";
import { AssignmentStatusFields } from "@/components/admin/assignment-status-fields";
import { CollapsibleReviewCard } from "@/components/admin/collapsible-review-card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { claimAssignment, createAssignment, updateAssignment } from "@/app/admin/work/actions";
import { db } from "@/lib/db";
import { saintCatalogWhere, type SaintCatalogScope } from "@/lib/admin-saint-access";

type AssignmentRow = Awaited<ReturnType<typeof loadAssignments>>[number];
type AdminUser = { id: string; name: string | null; email: string };
type WorkView = "mine" | "available" | "blocked" | "completed" | "team";
type SearchParams = Record<string, string | string[] | undefined>;

export async function AssignmentWorkspace({
  canClaim,
  canManage,
  canViewContent,
  canViewInstagram,
  eyebrow,
  headingLevel,
  params,
  saintScope,
  userId
}: {
  canClaim: boolean;
  canManage: boolean;
  canViewContent: boolean;
  canViewInstagram: boolean;
  eyebrow: string;
  headingLevel: "h1" | "h2";
  params: SearchParams;
  saintScope: SaintCatalogScope;
  userId: string;
}) {
  const [candidateAssignments, users, targets] = await Promise.all([
    loadAssignments(canManage, userId),
    canManage ? db.user.findMany({
      where: { active: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true }
    }) : Promise.resolve([]),
    canManage ? loadTargets() : Promise.resolve([])
  ]);
  const refs = await loadContentRefs(candidateAssignments, { canViewContent, canViewInstagram, saintScope });
  const assignments = candidateAssignments.filter((row) => refs.has(`${row.contentType}:${row.contentId}`));
  const mine = assignments.filter((row) => row.assigneeId === userId && actionable(row.state));
  const available = assignments.filter((row) => !row.assigneeId && row.state === "assigned");
  const blocked = assignments.filter((row) => row.state === "blocked" && row.assigneeId === userId);
  const completed = assignments.filter((row) => row.state === "completed" && row.assigneeId === userId).slice(0, 12);
  const requestedView = parseView(first(params.work));
  const view = requestedView === "team" && !canManage ? "mine" : requestedView;
  const updated = first(params.updated);
  const error = first(params.error);
  const teamCount = canManage ? assignments.filter((row) => active(row.state)).length : 0;
  const Heading = headingLevel;

  const views: { id: WorkView; label: string; count?: number }[] = [
    { id: "mine", label: "Active", count: mine.length },
    { id: "available", label: "Available", count: available.length },
    { id: "blocked", label: "Blocked", count: blocked.length },
    { id: "completed", label: "Completed", count: completed.length },
    ...(canManage ? [{ id: "team" as const, label: "Team", count: teamCount }] : [])
  ];

  return (
    <section aria-labelledby="my-work-title" className="admin-stack" id="my-work">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <Heading id="my-work-title">My workflow</Heading>
        <p className="lede">Focus on the assignments that need you now, pick up available work, and revisit blockers or recent progress.</p>
      </div>

      {updated ? <p className="admin-notice form-status form-status--success">Assignment {updated}.</p> : null}
      {error ? <p className="admin-notice form-status form-status--error">{error}</p> : null}

      {canManage ? (
        <CollapsibleReviewCard
          cardId="create-assignment"
          defaultOpen={Boolean(error)}
          description="Choose one content record, define the task, and assign it now or leave it available for self-assignment."
          eyebrow="Coordinate"
          title="Create assignment"
        >
          <form action={createAssignment} className="admin-settings-form admin-settings-form--stacked">
            <SearchableSelect
              label="Content"
              name="target"
              options={targets}
              placeholder="Search content"
              required
              searchEndpoint="/api/admin/assignment-targets"
            />
            <div className="admin-form-grid admin-form-grid--assignment">
              <label className="admin-field">
                <span>Task</span>
                <select name="taskType" defaultValue="review">
                  <option value="review">Review</option>
                  <option value="edit">Edit</option>
                  <option value="research">Research</option>
                  <option value="source_check">Source check</option>
                  <option value="publish">Publish preparation</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Assignee</span>
                <select name="assigneeId" defaultValue="">
                  <option value="">Available for self-assignment</option>
                  {users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name || candidate.email}</option>)}
                </select>
              </label>
              <label className="admin-field">
                <span>Priority</span>
                <select name="priority" defaultValue="normal">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Due date</span>
                <input type="date" name="dueDate" />
              </label>
            </div>
            <label className="admin-field">
              <span>Notes</span>
              <textarea name="notes" maxLength={2000} rows={3} />
            </label>
            <div className="review-actions admin-settings-form__actions">
              <button className="admin-form-button" type="submit">Create assignment</button>
            </div>
          </form>
        </CollapsibleReviewCard>
      ) : null}

      <nav aria-label="Assignment queues" className="admin-queue-filters admin-tab-strip">
        {views.map((item) => (
          <Link
            aria-current={view === item.id ? "page" : undefined}
            className="admin-queue-filter admin-tab-strip__tab"
            href={`/admin?work=${item.id}#my-work` as Route}
            id={`my-work-tab-${item.id}`}
            key={item.id}
          >
            <span>{item.label}</span>
            {item.count !== undefined ? <StatusBadge label={String(item.count)} /> : null}
          </Link>
        ))}
      </nav>

      {view === "mine" ? <AssignmentSection labelledBy="my-work-tab-mine" empty="You have no active assignments." rows={mine} refs={refs} users={users} userId={userId} canManage={canManage} /> : null}
      {view === "available" ? <AssignmentSection labelledBy="my-work-tab-available" empty="No work is currently available for self-assignment." rows={available} refs={refs} users={users} userId={userId} canManage={canManage} available={canClaim} readOnly={!canClaim} /> : null}
      {view === "blocked" ? <AssignmentSection labelledBy="my-work-tab-blocked" empty="You have no blocked assignments." rows={blocked} refs={refs} users={users} userId={userId} canManage={canManage} /> : null}
      {view === "completed" ? <AssignmentSection labelledBy="my-work-tab-completed" empty="You have no recently completed assignments." rows={completed} refs={refs} users={users} userId={userId} canManage={canManage} readOnly /> : null}
      {view === "team" && canManage ? <TeamWorkload assignments={assignments} labelledBy="my-work-tab-team" users={users} /> : null}
    </section>
  );
}

function AssignmentSection({ labelledBy, empty, rows, refs, users, userId, canManage, available = false, readOnly = false }: {
  labelledBy: string;
  empty: string;
  rows: AssignmentRow[];
  refs: Map<string, { label: string; href: Route }>;
  users: AdminUser[];
  userId: string;
  canManage: boolean;
  available?: boolean;
  readOnly?: boolean;
}) {
  return (
    <section aria-labelledby={labelledBy}>
      {rows.length ? (
        <div className="review-list">
          {rows.map((row) => {
            const ref = refs.get(`${row.contentType}:${row.contentId}`);
            return (
              <article className="review-row" key={row.id}>
                <div className="review-row__content">
                  <div className="review-meta">
                    <StatusBadge label={label(row.contentType)} />
                    <StatusBadge label={label(row.taskType)} />
                    <StatusBadge label={row.priority} />
                    <StatusBadge label={label(row.state)} />
                  </div>
                  <h4>{ref ? <Link href={ref.href}>{ref.label}</Link> : "Missing content record"}</h4>
                  <p>{row.notes || "No assignment notes."}</p>
                  {row.state === "blocked" && row.blockedReason ? (
                    <p className="assignment-blocked-reason"><strong>Blocking reason:</strong> {row.blockedReason}</p>
                  ) : null}
                  <small>{row.assignee ? `Assigned to ${row.assignee.name || row.assignee.email}` : "Available to claim"}{row.dueDate ? ` · Due ${row.dueDate.toLocaleDateString()}` : ""}</small>
                </div>
                {available ? (
                  <form action={claimAssignment}>
                    <input type="hidden" name="assignmentId" value={row.id} />
                    <button className="admin-form-button" type="submit">Assign to me</button>
                  </form>
                ) : !readOnly && (canManage || row.assigneeId === userId) ? (
                  <div className="assignment-workspace__controls">
                    <form action={updateAssignment} className="admin-settings-form admin-settings-form--inline admin-settings-form--assignment-status">
                      <input type="hidden" name="assignmentId" value={row.id} />
                      {canManage ? (
                        <label className="admin-field">
                          <span>Assignee</span>
                          <select defaultValue={row.assigneeId || ""} name="assigneeId">
                            <option value="">Available</option>
                            {users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name || candidate.email}</option>)}
                          </select>
                        </label>
                      ) : null}
                      <AssignmentStatusFields defaultBlockedReason={row.blockedReason} defaultStatus={row.state} />
                      <button className="admin-form-button admin-form-button--secondary" type="submit">Update</button>
                    </form>
                    {row.assigneeId === userId ? <AssignmentLeaveControl assignmentId={row.id} contentLabel={ref?.label} /> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : <p className="empty-note">{empty}</p>}
    </section>
  );
}

function TeamWorkload({ assignments, labelledBy, users }: { assignments: AssignmentRow[]; labelledBy: string; users: AdminUser[] }) {
  const activeRows = assignments.filter((row) => active(row.state));
  return (
    <section aria-labelledby={labelledBy}>
      <div className="review-list">
        {users.map((user) => {
          const rows = activeRows.filter((row) => row.assigneeId === user.id);
          const blocked = rows.filter((row) => row.state === "blocked").length;
          return (
            <div className="review-row" key={user.id}>
              <div><h4>{user.name || user.email}</h4>{user.name ? <p>{user.email}</p> : null}</div>
              <div className="review-meta"><StatusBadge label={`${rows.length} active`} />{blocked ? <StatusBadge label={`${blocked} blocked`} /> : null}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function loadAssignments(canManage: boolean, userId: string) {
  return db.contentAssignment.findMany({
    where: canManage ? undefined : { OR: [{ assigneeId: userId }, { assigneeId: null, state: "assigned" }] },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { name: true, email: true } }
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 300
  });
}

async function loadTargets() {
  const [saints, traditions, places, posts] = await Promise.all([
    db.saint.findMany({ orderBy: { displayName: "asc" }, take: 300, select: { id: true, displayName: true, status: true } }),
    db.tradition.findMany({ orderBy: { name: "asc" }, take: 300, select: { id: true, name: true, status: true } }),
    db.place.findMany({ orderBy: { name: "asc" }, take: 300, select: { id: true, name: true } }),
    db.instagramItem.findMany({ orderBy: { createdAt: "desc" }, take: 300, select: { id: true, extractedSaintName: true, instagramShortcode: true, status: true } })
  ]);
  return [
    ...saints.map((row) => ({ value: `saint:${row.id}`, label: row.displayName, description: `Saint · ${row.status}` })),
    ...traditions.map((row) => ({ value: `tradition:${row.id}`, label: row.name, description: `Tradition · ${row.status}` })),
    ...places.map((row) => ({ value: `place:${row.id}`, label: row.name, description: "Place" })),
    ...posts.map((row) => ({ value: `instagram_item:${row.id}`, label: row.extractedSaintName || row.instagramShortcode || "Instagram post", description: `Instagram · ${row.status}` }))
  ];
}

async function loadContentRefs(
  rows: AssignmentRow[],
  access: { canViewContent: boolean; canViewInstagram: boolean; saintScope: SaintCatalogScope }
) {
  const ids = (type: string) => rows.filter((row) => row.contentType === type).map((row) => row.contentId);
  const [saints, traditions, places, posts] = await Promise.all([
    db.saint.findMany({ where: { id: { in: ids("saint") }, ...saintCatalogWhere(access.saintScope) }, select: { id: true, displayName: true, slug: true } }),
    access.canViewContent ? db.tradition.findMany({ where: { id: { in: ids("tradition") } }, select: { id: true, name: true, slug: true } }) : Promise.resolve([]),
    access.canViewContent ? db.place.findMany({ where: { id: { in: ids("place") } }, select: { id: true, name: true } }) : Promise.resolve([]),
    access.canViewInstagram ? db.instagramItem.findMany({ where: { id: { in: ids("instagram_item") } }, select: { id: true, extractedSaintName: true, instagramShortcode: true } }) : Promise.resolve([])
  ]);
  const map = new Map<string, { label: string; href: Route }>();
  saints.forEach((row) => map.set(`saint:${row.id}`, { label: row.displayName, href: `/admin/saints/${row.slug}` as Route }));
  traditions.forEach((row) => map.set(`tradition:${row.id}`, { label: row.name, href: `/admin/traditions/${row.id}` as Route }));
  places.forEach((row) => map.set(`place:${row.id}`, { label: row.name, href: `/admin/places/${row.id}` as Route }));
  posts.forEach((row) => map.set(`instagram_item:${row.id}`, { label: row.extractedSaintName || row.instagramShortcode || "Instagram post", href: `/admin/instagram/${row.id}` as Route }));
  return map;
}

function parseView(value: string | undefined): WorkView {
  return value === "available" || value === "blocked" || value === "completed" || value === "team" ? value : "mine";
}

function actionable(state: string) { return state === "assigned" || state === "in_progress"; }
function active(state: string) { return state === "assigned" || state === "in_progress" || state === "blocked"; }
function label(value: string) { return value.replaceAll("_", " "); }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
