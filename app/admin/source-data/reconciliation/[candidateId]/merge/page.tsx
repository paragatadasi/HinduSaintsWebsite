import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, GitMerge, ShieldCheck } from "lucide-react";
import { Prisma } from "@/lib/generated/prisma/client";
import { ReviewFactGrid, ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdminUser } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import {
  SAINT_MERGE_FIELD_GROUPS,
  SAINT_MERGE_SCALAR_SELECT,
  formatSaintMergeValue,
  getSaintMergeConflicts,
  mergeChoiceInputName,
  type SaintMergeConflict,
  type SaintMergeRecord
} from "@/lib/saint-merge";
import { mergeConfirmedSaints } from "../../merge-actions";

type Props = {
  params: Promise<{ candidateId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function SaintMergePage({ params, searchParams }: Props) {
  const [{ candidateId }, { error }] = await Promise.all([params, searchParams]);
  const user = await requireAdminUser();
  if (!hasCapability(user.roles, "merge_saints")) redirect("/admin?access=denied");
  const canExecute = hasCapability(user.roles, "manage_sensitive_actions");
  const candidate = await db.duplicateCandidate.findUnique({
    where: { id: candidateId },
    select: { id: true, entityType: true, entityId: true, candidateEntityId: true, status: true, message: true, resolutionNotes: true }
  });
  if (!candidate || candidate.entityType !== "Saint" || !candidate.entityId || !candidate.candidateEntityId) notFound();
  if (candidate.status !== "resolved") redirect("/admin/source-data/reconciliation?view=duplicates&error=Confirm+the+duplicate+before+opening+merge+review");

  const pairIds = [candidate.entityId, candidate.candidateEntityId];
  const saints = await db.saint.findMany({
    where: { id: { in: pairIds } },
    select: MERGE_PAGE_SAINT_SELECT
  });
  if (saints.length !== 2) redirect("/admin/source-data/reconciliation?view=duplicates&status=resolved&error=One+record+has+already+been+merged+or+removed");
  const left = saints.find((saint) => saint.id === candidate.entityId)!;
  const right = saints.find((saint) => saint.id === candidate.candidateEntityId)!;
  const defaultSurvivorId = recommendSurvivor(left, right);
  const conflictGroups = getSaintMergeConflicts(left as SaintMergeRecord, right as SaintMergeRecord);
  const fieldLabels = new Map<string, Map<string, string>>([
    [left.id, new Map(left.primaryImage ? [["primaryImageId", left.primaryImage.altText || left.primaryImage.url]] : [])],
    [right.id, new Map(right.primaryImage ? [["primaryImageId", right.primaryImage.altText || right.primaryImage.url]] : [])]
  ]);

  return (
    <div className="admin-stack saint-merge-page">
      <header>
        <Link className="admin-text-link" href="/admin/source-data/reconciliation?view=duplicates&status=resolved"><ArrowLeft aria-hidden="true" size={16} /> Back to confirmed duplicates</Link>
        <div className="eyebrow">Duplicate reconciliation</div>
        <h1>Merge {left.displayName} and {right.displayName}</h1>
        <p className="lede">Choose one canonical record, resolve only the fields that differ, and review everything that will move before the duplicate is retired.</p>
        <div className="review-meta"><StatusBadge label="Confirmed duplicate" /><StatusBadge label={`${totalRelatedRecords(left)} + ${totalRelatedRecords(right)} linked records reviewed`} /></div>
      </header>

      {error ? <p className="admin-notice form-status form-status--error">{error}</p> : null}

      <form action={mergeConfirmedSaints} className="form-stack">
        <input name="candidateId" type="hidden" value={candidate.id} />
        <ReviewWorkflow
          description="The surviving record keeps its URL. The retired URL becomes a permanent redirect, and all relationship changes are committed together or not at all."
          eyebrow="Final merge review"
          title="Choose the canonical Saint"
        >
          <ReviewSection className="review-workflow__section--wide" icon={<GitMerge aria-hidden="true" size={18} />} title="Surviving record">
            <p className="admin-settings-note">This choice determines the canonical Saint ID and URL. It does not automatically win every field conflict below.</p>
            <div className="saint-merge-record-grid">
              <SurvivorChoice defaultChecked={defaultSurvivorId === left.id} saint={left} />
              <SurvivorChoice defaultChecked={defaultSurvivorId === right.id} saint={right} />
            </div>
          </ReviewSection>

          {SAINT_MERGE_FIELD_GROUPS.map((group) => {
            const conflicts = conflictGroups.get(group.id) ?? [];
            if (conflicts.length === 0) return null;
            return (
              <ReviewSection className="review-workflow__section--wide" key={group.id} title={group.label}>
                <p className="admin-settings-note">{group.description}</p>
                <div className="saint-merge-conflicts">
                  {conflicts.map((conflict) => (
                    <MergeConflictRow
                      conflict={conflict}
                      defaultSurvivorId={defaultSurvivorId}
                      fieldLabels={fieldLabels}
                      key={conflict.field}
                      left={left}
                      right={right}
                    />
                  ))}
                </div>
              </ReviewSection>
            );
          })}

          <ReviewSection className="review-workflow__section--wide" title="Relationship transfer">
            <p className="admin-settings-note">Links move to the survivor inside the same transaction. Exact duplicates are consolidated, biography slug collisions are retained with a safe suffix, self-relationships are removed, and private Museum data remains private.</p>
            <div className="saint-merge-record-grid">
              <RelationshipSummary label={left.displayName} saint={left} />
              <RelationshipSummary label={right.displayName} saint={right} />
            </div>
          </ReviewSection>

          <ReviewSection className="review-workflow__section--wide saint-merge-confirmation" icon={<ShieldCheck aria-hidden="true" size={18} />} title="Final confirmation">
            {canExecute ? (
              <>
                <p>This operation removes the duplicate record after transferring its content. The audit log and retired URL preserve what happened, but the merge is not an ordinary edit.</p>
                <label className="admin-field">
                  <span>Sensitive-action password</span>
                  <input autoComplete="current-password" name="sensitiveActionPassword" required type="password" />
                </label>
                <label className="admin-checkbox saint-merge-acknowledgement">
                  <input name="acknowledgeMerge" required type="checkbox" />
                  <span>I reviewed the survivor, field choices, and relationship transfer above.</span>
                </label>
                <button className="admin-form-button" type="submit">Merge records</button>
              </>
            ) : (
              <p className="admin-notice">You can review and confirm duplicate candidates. A Site Admin must complete the password-protected merge because it permanently retires one record.</p>
            )}
          </ReviewSection>
        </ReviewWorkflow>
      </form>
    </div>
  );
}

function SurvivorChoice({ defaultChecked, saint }: { defaultChecked: boolean; saint: MergePageSaint }) {
  return (
    <label className="saint-merge-record-choice">
      <input defaultChecked={defaultChecked} name="survivorId" required type="radio" value={saint.id} />
      <span className="saint-merge-record-choice__body">
        <strong>{saint.displayName}</strong>
        <span>/{saint.slug}</span>
        <span>{formatLabel(saint.teamVisibility)} · {formatLabel(saint.publicationStatus)} · {formatLabel(saint.workflowStatus)}</span>
      </span>
    </label>
  );
}

function MergeConflictRow({ conflict, defaultSurvivorId, fieldLabels, left, right }: {
  conflict: SaintMergeConflict;
  defaultSurvivorId: string;
  fieldLabels: Map<string, Map<string, string>>;
  left: MergePageSaint;
  right: MergePageSaint;
}) {
  const recommended = isBlank(conflict.leftValue) && !isBlank(conflict.rightValue)
    ? right.id
    : isBlank(conflict.rightValue) && !isBlank(conflict.leftValue)
      ? left.id
      : defaultSurvivorId;
  return (
    <fieldset className="saint-merge-conflict-row">
      <legend>{conflict.label}</legend>
      <div className="saint-merge-choice-grid">
        <FieldChoice
          defaultChecked={recommended === left.id}
          label={left.displayName}
          name={mergeChoiceInputName(conflict.field)}
          value={fieldLabels.get(left.id)?.get(conflict.field) || formatSaintMergeValue(conflict.leftValue)}
          valueId={left.id}
        />
        <FieldChoice
          defaultChecked={recommended === right.id}
          label={right.displayName}
          name={mergeChoiceInputName(conflict.field)}
          value={fieldLabels.get(right.id)?.get(conflict.field) || formatSaintMergeValue(conflict.rightValue)}
          valueId={right.id}
        />
      </div>
    </fieldset>
  );
}

function FieldChoice({ defaultChecked, label, name, value, valueId }: { defaultChecked: boolean; label: string; name: string; value: string; valueId: string }) {
  return (
    <label className="saint-merge-field-choice">
      <input defaultChecked={defaultChecked} name={name} required type="radio" value={valueId} />
      <span><strong>{label}</strong><span>{value}</span></span>
    </label>
  );
}

function RelationshipSummary({ label, saint }: { label: string; saint: MergePageSaint }) {
  return (
    <section className="duplicate-comparison-panel">
      <h3>{label}</h3>
      <ReviewFactGrid facts={[
        { label: "Names and biographies", value: String(saint._count.aliases + saint._count.biographies) },
        { label: "Places and traditions", value: String(saint._count.places + saint._count.traditions + saint._count.traditionLineageEntries) },
        { label: "Saint relationships", value: String(saint._count.relationshipsFrom + saint._count.relationshipsTo) },
        { label: "Instagram and media", value: String(saint._count.instagramItems + saint._count.instagramClaims + saint._count.galleryImages) },
        { label: "Museum and family", value: String(saint._count.museumSectionAssignments + saint._count.familyMemberships) },
        { label: "Founded traditions", value: String(saint._count.foundedTraditions) }
      ]} />
    </section>
  );
}

const MERGE_PAGE_SAINT_SELECT = {
  ...SAINT_MERGE_SCALAR_SELECT,
  slug: true,
  primaryImage: { select: { altText: true, url: true } },
  _count: { select: {
    aliases: true,
    biographies: true,
    galleryImages: true,
    instagramItems: true,
    instagramClaims: true,
    places: true,
    relationshipsFrom: true,
    relationshipsTo: true,
    traditions: true,
    familyMemberships: true,
    museumSectionAssignments: true,
    traditionLineageEntries: true,
    traditionLineageChildren: true,
    foundedTraditions: true
  } }
} satisfies Prisma.SaintSelect;
type MergePageSaint = Prisma.SaintGetPayload<{ select: typeof MERGE_PAGE_SAINT_SELECT }>;

function recommendSurvivor(left: MergePageSaint, right: MergePageSaint) {
  const score = (saint: MergePageSaint) => (
    (saint.publicationStatus === "published" ? 1000 : 0)
    + (saint.teamVisibility === "public" ? 100 : 0)
    + totalRelatedRecords(saint)
    + (saint.shortDescription ? 3 : 0)
    + (saint.primaryImageId ? 2 : 0)
  );
  return score(right) > score(left) ? right.id : left.id;
}

function totalRelatedRecords(saint: MergePageSaint) {
  return Object.values(saint._count).reduce((sum, value) => sum + value, 0);
}
function isBlank(value: unknown) { return value === null || value === undefined || value === ""; }
function formatLabel(value: string) { return value.replaceAll("_", " "); }
