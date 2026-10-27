import { createHash } from "node:crypto";
import { Prisma, type UserRole } from "./generated/prisma/client";
import { db } from "./db";
import { canViewSaintWithRoles } from "./admin-saint-access";
import { assertIntakeEditable, assertIntakeSubmission, createMuseumIntakeInput, editMuseumIntakeInput, intakeDeliverySummary, museumIntakeFields, MuseumIntakeError, reviewMuseumIntakeInput, submitMuseumIntakeInput, museumIntakeRelicInput, type IntakeRelicInput, type IntakeMediaKind } from "./museum-intake-domain";
import { discardIntakeImage, getIntakeImageUrl, prepareIntakeImage, writeIntakeImage } from "./museum-intake-storage";

export type IntakeActor = { id: string; canReview: boolean; roles: readonly UserRole[] };
const include = { media: true, deliveries: true, relics: { orderBy: { position: "asc" } }, approvals: { orderBy: { reviewedVersion: "desc" } } } as const;
type Intake = Prisma.MuseumRelicIntakeGetPayload<{ include: typeof include }>;
const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const teamEditableStatuses = ["draft", "submitted", "needs_changes"];
async function teamAccess(actor: IntakeActor, museumId: string, tx: Prisma.TransactionClient = db) {
  return actor.roles.includes("museum_assistant") && Boolean(await tx.museumIntakeTeamMember.findFirst({ where: { userId: actor.id, museumId, museum: { archivedAt: null }, user: { active: true, roles: { has: "museum_assistant" } } }, select: { userId: true } }));
}
function visible(row: Intake | null, actor: IntakeActor, canTeam = false): asserts row is Intake {
  if (!row || (!actor.canReview && row.createdById !== actor.id && !(canTeam && teamEditableStatuses.includes(row.status)))) throw new MuseumIntakeError(404, "Entry not found.");
}
function versionIs(row: Intake, expected: number) {
  if (row.version !== expected) throw new MuseumIntakeError(409, "This entry changed. Reload it before saving.");
}
function reviewAccess(actor: IntakeActor) {
  if (!actor.canReview) throw new MuseumIntakeError(403, "A museum curator must review this entry.");
}
function editable(row: Intake) {
  assertIntakeEditable(row.status);
}
function activeRelics(row: Intake) {
  return row.relics.filter(relic => !relic.archivedAt).map(relic => ({ ...museumIntakeRelicInput.omit({ id: true }).parse(relic.rawFields), id: relic.id }));
}
function activeMedia(row: Intake) {
  const ids = new Set(activeRelics(row).map(relic => relic.id));
  return row.media.filter(media => !media.archivedAt && (!media.relicId || ids.has(media.relicId)));
}
function dto(row: Intake, actor: IntakeActor, creatorDisplayName: string, canTeam: boolean) {
  const media = activeMedia(row).map(photo => ({ id: photo.id, relicId: photo.relicId, kind: photo.kind, mimeType: photo.mimeType, byteSize: photo.byteSize, width: photo.width, height: photo.height, url: getIntakeImageUrl(photo.storageKey) }));
  const deliveries = row.deliveries.filter(delivery => delivery.reviewedVersion === row.reviewedVersion);
  return {
    id: row.id, museumId: row.museumId, version: row.version, status: row.status,
    createdById: row.createdById, creatorDisplayName, canTeam, canEdit: actor.canReview || row.createdById === actor.id || (canTeam && teamEditableStatuses.includes(row.status)), fields: row.rawFields, reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt, reviewedVersion: row.reviewedVersion,
    approvedSnapshot: row.approvedSnapshot, createdAt: row.createdAt, updatedAt: row.updatedAt,
    relics: activeRelics(row).map(relic => ({ ...relic, media: media.filter(photo => photo.relicId === relic.id) })),
    approvals: row.approvals.map(approval => ({ reviewedVersion: approval.reviewedVersion, snapshot: approval.snapshot, reviewedAt: approval.createdAt })),
    media,
    deliveries: row.deliveries.map(delivery => ({ target: delivery.target, reviewedVersion: delivery.reviewedVersion, status: delivery.status, attempts: delivery.attempts, externalRecordId: delivery.externalRecordId, errorCode: delivery.errorCode, deliveredAt: delivery.deliveredAt })),
    deliverySummary: intakeDeliverySummary(deliveries)
  };
}
async function present(rows: Intake[], actor: IntakeActor, tx: Prisma.TransactionClient = db) {
  const [users, memberships] = await Promise.all([
    tx.user.findMany({ where: { id: { in: [...new Set(rows.map(row => row.createdById))] } }, select: { id: true, name: true, passwordCredential: { select: { username: true } } } }),
    actor.roles.includes("museum_assistant") ? tx.museumIntakeTeamMember.findMany({ where: { userId: actor.id, museum: { archivedAt: null }, user: { active: true, roles: { has: "museum_assistant" } } }, select: { museumId: true } }) : Promise.resolve([])
  ]);
  return rows.map(row => {
    const author = users.find(user => user.id === row.createdById);
    return dto(row, actor, author?.name || author?.passwordCredential?.username || "Team member", actor.canReview || memberships.some(member => member.museumId === row.museumId));
  });
}
async function presentOne(row: Intake, actor: IntakeActor, tx: Prisma.TransactionClient = db) {
  return (await present([row], actor, tx))[0];
}
function correctionState(row: Intake) {
  return row.status === "submitted" || row.status === "approved" ? { status: "draft" } : {};
}
async function saveRelics(tx: Prisma.TransactionClient, row: Intake, relics: IntakeRelicInput[]) {
  const ids = relics.map(relic => relic.id);
  const owned = new Set(row.relics.map(relic => relic.id));
  const foreign = await tx.museumIntakeRelic.findFirst({ where: { id: { in: ids }, intakeId: { not: row.id } }, select: { id: true } });
  if (foreign) throw new MuseumIntakeError(400, "A relic belongs to another entry. Reload this entry.");
  await tx.museumIntakeRelic.updateMany({ where: { intakeId: row.id, id: { notIn: ids }, archivedAt: null }, data: { archivedAt: new Date() } });
  for (const [position, relic] of relics.entries()) {
    const { id, ...fields } = relic;
    if (owned.has(id)) await tx.museumIntakeRelic.update({ where: { id }, data: { rawFields: asJson(fields), position, archivedAt: null } });
    else await tx.museumIntakeRelic.create({ data: { id, intakeId: row.id, rawFields: asJson(fields), position } });
  }
}
async function locked<T>(id: string, actor: IntakeActor, operation: (tx: Prisma.TransactionClient, row: Intake) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "MuseumRelicIntake" WHERE id=${id} FOR UPDATE`);
    const row = await tx.museumRelicIntake.findUnique({ where: { id }, include });
    visible(row, actor, row ? await teamAccess(actor, row.museumId, tx) : false);
    return operation(tx, row);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 20_000 });
}
export async function readMuseumIntake(id: string, actor: IntakeActor) {
  const row = await db.museumRelicIntake.findUnique({ where: { id }, include });
  visible(row, actor, row ? await teamAccess(actor, row.museumId) : false);
  return presentOne(row, actor);
}
export async function readMuseumIntakeMedia(id: string, mediaId: string, actor: IntakeActor) {
  const row = await db.museumRelicIntake.findUnique({ where: { id }, include });
  visible(row, actor, row ? await teamAccess(actor, row.museumId) : false);
  const photo = row.media.find(item => item.id === mediaId);
  if (!photo) throw new MuseumIntakeError(404, "Photo not found.");
  return photo;
}
export async function listMuseumIntakes(actor: IntakeActor, museumId?: string, cursor?: string, scope?: "mine" | "team") {
  if (scope === "team" && (!museumId || (!actor.canReview && !await teamAccess(actor, museumId)))) throw new MuseumIntakeError(403, "Your account is not assigned to this museum's intake team.");
  const where = { ...((scope !== "team" && (!actor.canReview || scope === "mine")) ? { createdById: actor.id } : {}), ...(museumId ? { museumId } : {}), ...(scope === "team" && !actor.canReview ? { OR: [{ status: { in: teamEditableStatuses } }, { createdById: actor.id }] } : {}) };
  const rows = await db.museumRelicIntake.findMany({ where, include, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 101, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
  const page = rows.slice(0, 100);
  return { entries: await present(page, actor), total: await db.museumRelicIntake.count({ where }), limit: 100, nextCursor: rows.length > 100 ? page.at(-1)!.id : null };
}
export async function createMuseumIntake(raw: unknown, actor: IntakeActor) {
  const input = createMuseumIntakeInput.parse(raw);
  const museum = await db.museum.findFirst({ where: { id: input.museumId, archivedAt: null }, select: { id: true } });
  if (!museum) throw new MuseumIntakeError(400, "Choose an active museum.");
  const row = await db.museumRelicIntake.upsert({
    where: { createdById_clientRequestId: { createdById: actor.id, clientRequestId: input.clientRequestId } },
    create: { museumId: museum.id, clientRequestId: input.clientRequestId, createdById: actor.id, rawFields: asJson(input.fields), relics: { create: (input.relics ?? [{ id: `legacy_${input.clientRequestId}`, relicDescription: input.fields.relicDescription ?? "" }]).map(({ id, ...fields }, position) => ({ id, rawFields: asJson(fields), position })) } },
    update: {}, include
  });
  if (row.museumId !== input.museumId) throw new MuseumIntakeError(409, "This request belongs to a different museum. Start a new entry.");
  return presentOne(row, actor);
}
export async function editMuseumIntake(id: string, raw: unknown, actor: IntakeActor) {
  const input = editMuseumIntakeInput.parse(raw);
  return locked(id, actor, async (tx, row) => {
    editable(row); versionIs(row, input.expectedVersion);
    const children = activeRelics(row);
    const relics = input.relics ?? (children.length === 1 ? [{ ...children[0], relicDescription: input.fields.relicDescription ?? children[0].relicDescription }] : undefined);
    if (relics) await saveRelics(tx, row, relics);
    const next = await tx.museumRelicIntake.update({ where: { id }, data: { rawFields: asJson(input.fields), ...correctionState(row), version: { increment: 1 } }, include });
    await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.intake.edited", entityType: "MuseumRelicIntake", entityId: id, beforeJson: asJson({ fields: row.rawFields, relics: activeRelics(row), status: row.status }), afterJson: asJson({ fields: input.fields, relics: activeRelics(next), status: next.status }) } });
    return presentOne(next, actor, tx);
  });
}
export async function addMuseumIntakeMedia(id: string, expectedVersion: number, kind: IntakeMediaKind, file: File, actor: IntakeActor, requestedRelicId?: string) {
  const initial = await db.museumRelicIntake.findUnique({ where: { id }, include });
  visible(initial, actor, initial ? await teamAccess(actor, initial.museumId) : false); editable(initial);
  const childKind = kind === "relic" || kind === "relic_document";
  const children = activeRelics(initial);
  const relicId = childKind ? requestedRelicId ?? (children.length === 1 ? children[0].id : undefined) : null;
  if ((childKind && !children.some(relic => relic.id === relicId)) || (!childKind && requestedRelicId)) throw new MuseumIntakeError(400, "Choose the relic this photo belongs to.");
  const prepared = await prepareIntakeImage(file);
  if (initial.media.some(photo => !photo.archivedAt && photo.relicId === relicId && photo.kind === kind && photo.sourceSha256 === prepared.sourceSha256)) return presentOne(initial, actor);
  versionIs(initial, expectedVersion);
  const storageKey = await writeIntakeImage(prepared.body);
  let committed = false;
  try {
    const result = await locked(id, actor, async (tx, row) => {
      editable(row);
      if (row.media.some(photo => !photo.archivedAt && photo.relicId === relicId && photo.kind === kind && photo.sourceSha256 === prepared.sourceSha256)) return { row, stored: false };
      versionIs(row, expectedVersion);
      if (childKind && !activeRelics(row).some(relic => relic.id === relicId)) throw new MuseumIntakeError(409, "This relic changed. Reload the entry.");
      if (activeMedia(row).filter(photo => photo.relicId === relicId).length >= 12) throw new MuseumIntakeError(400, "This relic or shared section already has 12 photos.");
      const archived = row.media.find(photo => photo.archivedAt && photo.relicId === relicId && photo.kind === kind && photo.sourceSha256 === prepared.sourceSha256);
      const { body: _body, ...metadata } = prepared;
      if (archived) await tx.museumIntakeMedia.update({ where: { id: archived.id }, data: { archivedAt: null } });
      else await tx.museumIntakeMedia.create({ data: { intakeId: id, relicId, kind, storageKey, ...metadata, createdById: actor.id } });
      const next = await tx.museumRelicIntake.update({ where: { id }, data: { ...correctionState(row), version: { increment: 1 } }, include });
      await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.intake.photo_added", entityType: "MuseumRelicIntake", entityId: id, afterJson: { kind, relicId: relicId ?? null, sourceSha256: prepared.sourceSha256, version: next.version, status: next.status } } });
      return { row: next, stored: !archived };
    });
    committed = result.stored;
    return presentOne(result.row, actor);
  } finally {
    if (!committed) {
      try { await discardIntakeImage(storageKey); }
      catch { console.error("Private intake upload cleanup failed", { intakeId: id, storageKey }); }
    }
  }
}
export async function submitMuseumIntake(id: string, raw: unknown, actor: IntakeActor) {
  const input = submitMuseumIntakeInput.parse(raw);
  return locked(id, actor, async (tx, row) => {
    if (row.status === "submitted" && row.version === input.expectedVersion + 1) return presentOne(row, actor, tx);
    assertIntakeEditable(row.status); versionIs(row, input.expectedVersion);
    assertIntakeSubmission(museumIntakeFields.parse(row.rawFields), activeMedia(row), activeRelics(row));
    const next = await tx.museumRelicIntake.update({ where: { id }, data: { status: "submitted", version: { increment: 1 } }, include });
    await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.intake.submitted", entityType: "MuseumRelicIntake", entityId: id, afterJson: { version: next.version } } });
    return presentOne(next, actor, tx);
  });
}
export async function reviewMuseumIntake(id: string, raw: unknown, actor: IntakeActor) {
  reviewAccess(actor);
  const input = reviewMuseumIntakeInput.parse(raw);
  return locked(id, actor, async (tx, row) => {
    const requestFingerprint = fingerprint(input);
    if (input.action === "approve" && row.status === "approved" && row.reviewedVersion === input.expectedVersion && row.reviewFingerprint === requestFingerprint) return presentOne(row, actor, tx);
    versionIs(row, input.expectedVersion);
    if (row.status !== "submitted") throw new MuseumIntakeError(409, "Only submitted entries can be reviewed.");
    if (input.action === "request_changes") {
      const next = await tx.museumRelicIntake.update({ where: { id }, data: { status: "needs_changes", reviewNote: input.note, reviewedById: actor.id, reviewedAt: new Date(), version: { increment: 1 } }, include });
      await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.intake.changes_requested", entityType: "MuseumRelicIntake", entityId: id, afterJson: { version: next.version, note: input.note } } });
      return presentOne(next, actor, tx);
    }
    assertIntakeSubmission(museumIntakeFields.parse(row.rawFields), activeMedia(row), activeRelics(row));
    const saint = input.saintDecision.kind === "existing"
      ? await tx.saint.findFirst({ where: { id: input.saintDecision.saintId, status: { not: "archived" } }, select: { id: true, displayName: true, version: true, status: true, teamVisibility: true } }) : null;
    if (input.saintDecision.kind === "existing" && (!saint || !canViewSaintWithRoles(actor.roles, saint))) throw new MuseumIntakeError(409, "The selected saint is unavailable. Review the identity again.");
    const snapshot = { schemaVersion: 2, museumId: row.museumId, intakeId: id, intakeVersion: row.version, fields: row.rawFields, relics: activeRelics(row), saintDecision: input.saintDecision, saintAtReview: saint, media: activeMedia(row).map(photo => ({ id: photo.id, relicId: photo.relicId, kind: photo.kind, sourceSha256: photo.sourceSha256 })).sort((a, b) => a.id.localeCompare(b.id)), note: input.note ?? null };
    await tx.museumIntakeApproval.create({ data: { intakeId: id, reviewedVersion: row.version, snapshot: asJson(snapshot), reviewedById: actor.id } });
    await tx.museumIntakeDelivery.createMany({ data: ["website", "official_airtable"].map(target => ({ intakeId: id, target, reviewedVersion: row.version, idempotencyKey: fingerprint([id, row.version, target]), status: "blocked_configuration", errorCode: "delivery_adapter_not_enabled" })) });
    const next = await tx.museumRelicIntake.update({ where: { id }, data: { status: "approved", reviewedVersion: row.version, reviewFingerprint: requestFingerprint, approvedSnapshot: asJson(snapshot), reviewNote: input.note, reviewedById: actor.id, reviewedAt: new Date(), version: { increment: 1 } }, include });
    await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.intake.approved", entityType: "MuseumRelicIntake", entityId: id, afterJson: { version: next.version, reviewedVersion: row.version, targets: ["website", "official_airtable"], deliveryEnabled: false } } });
    return presentOne(next, actor, tx);
  });
}
export async function removeMuseumIntakeMedia(id: string, mediaId: string, raw: unknown, actor: IntakeActor) {
  const input = submitMuseumIntakeInput.parse(raw);
  return locked(id, actor, async (tx, row) => {
    editable(row); versionIs(row, input.expectedVersion);
    const photo = activeMedia(row).find(item => item.id === mediaId);
    if (!photo) throw new MuseumIntakeError(404, "Photo not found.");
    // Historical approved snapshots keep private access to their original media.
    await tx.museumIntakeMedia.update({ where: { id: mediaId }, data: { archivedAt: new Date() } });
    const next = await tx.museumRelicIntake.update({ where: { id }, data: { ...correctionState(row), version: { increment: 1 } }, include });
    await tx.auditEvent.create({ data: { userId: actor.id, action: "museum.intake.photo_removed", entityType: "MuseumRelicIntake", entityId: id, beforeJson: { mediaId, kind: photo.kind, sourceSha256: photo.sourceSha256 } } });
    return presentOne(next, actor, tx);
  });
}
