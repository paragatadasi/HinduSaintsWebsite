import {createHash} from "node:crypto";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {hasCapability} from "./permissions";
import {MuseumConflict} from "./museum-service";
import seed from "@/data/museum/spn-curator-questions.json";
import {answerInput, allowedDecisions, questionEvidence, questionStatus, type CuratorQuestion, type QuestionHistory} from "./museum-questionnaire-domain";

const entityType = "MuseumCuratorQuestionnaire";
const museumId = "museum-spn";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

async function context(tx: Prisma.TransactionClient) {
  const [mirrors, events, candidates] = await Promise.all([
    tx.airtableMirrorRecord.findMany({where: {baseId: "appMapiXrtNwnS9oZ", tableIdOrName: "Saints", recordId: {in: seed.cases.map(c => c.sourceRecordId)}}}),
    tx.auditEvent.findMany({where: {entityType, entityId: {in: seed.cases.map(c => museumId + ":" + c.caseId)}}, orderBy: [{createdAt: "desc"}, {id: "desc"}]}),
    tx.saint.findMany({where: {slug: {in: seed.cases.flatMap(c => c.candidateSlugs)}, status: {not: "archived"}}, select: {id: true, slug: true, displayName: true}})
  ]);
  return seed.cases.map(c => {
    const mirror = mirrors.find(m => m.recordId === c.sourceRecordId);
    const history: QuestionHistory[] = events.filter(e => e.entityId === museumId + ":" + c.caseId).map(e => {
      const value = e.afterJson as Record<string, unknown>;
      const answer = answerInput.parse(value.answer);
      return {id: e.id, at: e.createdAt.toISOString(), evidenceVersion: String(value.evidenceVersion), decision: answer.decision, note: answer.note, identification: answer.identification, referral: answer.referral};
    });
    // A newer conflicting mirror is a technical reconciliation task. An older
    // mirror does not replace the explicitly dated research snapshot.
    const changed = mirror && mirror.importedAt >= new Date(c.sourceCapturedAt) && hash(questionEvidence(mirror.rawFieldsJson)) !== hash(questionEvidence(c.sourceFields));
    const blockedReason = !mirror ? "The source entry is missing from the website mirror. The data team must restore it before an answer can be saved." : changed ? "Newer source evidence differs from this question. The data team must review it before an answer can be saved." : undefined;
    const review: CuratorQuestion = {
      reviewGroup: c.reviewGroup as CuratorQuestion["reviewGroup"], recognitionLabel: c.recognitionLabel, identificationPrompt: c.identificationPrompt, suggestedNames: c.suggestedNames,
      caseId: c.caseId, revision: hash({question: c.question, reviewGroup: c.reviewGroup, caseId: c.caseId, evidenceVersion: c.evidenceVersion, mirror: mirror ? questionEvidence(mirror.rawFieldsJson) : null, blockedReason, latest: history[0]?.id ?? null}),
      title: c.title, question: c.question, context: c.context, sourceName: c.sourceName,
      sourceLocation: c.sourceLocationClue.vitrine ? `Vitrine ${c.sourceLocationClue.vitrine}${c.sourceLocationClue.shelf ? " / Shelf " + c.sourceLocationClue.shelf : ""}` : "Location not recorded",
      relicDescription: c.relicDescription, sourceCapturedAt: c.sourceCapturedAt,
      mirrorCapturedAt: mirror?.importedAt.toISOString() ?? null, sourceFields: c.sourceFields,
      blankEntry: c.questionType === "source_entry_clarification", blockedReason,
      status: blockedReason ? "blocked" : questionStatus(history, c.evidenceVersion), history,
      candidates: candidates.filter(s => c.candidateSlugs.some(slug => slug === s.slug)).map(s => ({id: s.id, name: s.displayName}))
    };
    return {review, evidenceVersion: c.evidenceVersion};
  });
}

// Callers enforce both museum and full-catalog access before reading this queue.
export async function readSpnCuratorQuestions() {
  return (await context(db)).map(c => c.review);
}

export async function saveSpnCuratorAnswer(raw: unknown, actorId: string) {
  const input = answerInput.parse(raw);
  try {
    await db.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-questionnaire:" + museumId},0))`);
      const actor = await tx.user.findUnique({where: {id: actorId}, select: {active: true, roles: true}});
      if (!actor?.active || !(["access_museum", "manage_museum", "view_full_saint_catalog"] as const).every(cap => hasCapability(actor.roles, cap))) throw new MuseumConflict("Museum editing permission is required.");
      const item = (await context(tx)).find(c => c.review.caseId === input.caseId);
      if (!item || item.review.revision !== input.revision) throw new MuseumConflict("This question or its answer changed. Reload the questions before saving.");
      if (item.review.blockedReason) throw new MuseumConflict(item.review.blockedReason);
      if (!allowedDecisions(item.review.blankEntry).includes(input.decision)) throw new MuseumConflict("That answer is not available for this question.");
      if (input.decision === "reopen" && item.review.status === "awaiting_curator") throw new MuseumConflict("This question is already awaiting a curator answer.");
      await tx.auditEvent.create({data: {userId: actorId, action: "museum.questionnaire." + input.decision, entityType, entityId: museumId + ":" + input.caseId,
        beforeJson: json({status: item.review.status, previousAnswerId: item.review.history[0]?.id ?? null}),
        afterJson: json({museumId, evidenceVersion: item.evidenceVersion, sourceCapturedAt: item.review.sourceCapturedAt, answer: input})}});
    }, {isolationLevel: "Serializable", timeout: 30000});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new MuseumConflict("Another answer was saved at the same time. Reload the questions before trying again.");
    throw error;
  }
}
