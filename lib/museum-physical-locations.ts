import {assertAlternativeGuideContext} from "./museum-guide-alternative-domain";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import { readEffectiveCompanionAdditions } from "./museum-companion-additions-state";
import { assertCurrentNorthernGuideTargets } from "./spn-northern-voyage";
import {assertBilashGuideTarget,bilashFollowup} from "./spn-bilash-followup";
import {readMuseumData} from "./museum-working-data";
import { currentReceiverGuideDefinitions } from "./spn-starter-guide-registry";
import {spnDuplicateObservations} from "./spn-observation-suppression";
import { clearCorrectionInput, clearCorrectionOffers, clearCorrectionShelfApplies } from "./museum-clear-correction-domain";
import { allowsPreparedFixedHousingTransfer, assertPreparatoryTransfers } from "./museum-preparatory-transfers";
import { preparationInput, projectPreparations, assertSafeCaseClear, projectPhaseClearances, assertPhaseClearance, phaseNeedsClearance, phaseClearanceRequirements, assertPhasePreparation } from "./museum-preparation-domain";
import { memoizePhysicalSnapshot } from "./museum-physical-snapshot-cache";
import { physicalUndoInput, physicalUndoOffer } from "./museum-physical-undo-domain";
import { assertGuidePhysicalScope } from "./spn-datta-guide";
import { z } from "zod";
import { assertSpnMovementAllowed, spnMovementBlockedReason } from "./spn-movement-holds";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { moveSnapshot, moveLocation, sameMoveLocation, assertDistinctMoveSources, assertWholeCaseClearing, MuseumMoveSessionError, type MoveSnapshot } from "./museum-move-session-domain";
import { readStarterGuideDefinition, registeredStarterGuide, starterGuideContext } from "./spn-starter-guide-registry";
import { physicalFingerprint, resolveMuseumPhysicalCurrent, storedPhysicalLocation } from "./museum-physical-location-current";
import type { MoveSessionActor } from "./museum-move-session-service";
import { v20ComponentSourceIds, componentStagingAcknowledgements, assertComponentClearanceScope, isComponentClearance, projectComponentPlacement } from "./museum-component-clearance-domain";
import { readComponentPlacements, readComponentCorrections } from "./museum-component-clearances";
import { hasOnlySpnHousingReviewHold } from "./spn-movement-holds";
import {isReviewedParamanandArmSupport,paramanandObjectReview,paramanandProposalResolution} from "./spn-paramanand-reviewed-object";

export type PhysicalSnapshotLoader = (tx: Prisma.TransactionClient) => Promise<MoveSnapshot>;
const confirmedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
export const physicalConfirmationInput = z.object({ museumId: z.literal("museum-spn"), clientRequestId: z.string().uuid(),
  confirmedDate, datePrecision: z.literal("date"), evidence: z.string().trim().min(1).max(2000),
  physicalConfirmation: z.literal(true), inventoryAcknowledged: z.literal(true),
  curatorAddition: z.object({ sourceId: z.string().min(1).max(200), version: z.number().int().positive() }).strict().optional(),
  alternativeDecision:z.object({guideVersion:z.string().min(1).max(200),suggestionId:z.string().min(1).max(300),version:z.number().int().positive()}).strict().optional(),
  guideContext: z.object({ guideVersion: z.string().min(1).max(200), contentDigest: z.string().regex(/^[a-f0-9]{64}$/), assignmentDigest: z.string().regex(/^[a-f0-9]{64}$/) }).strict().optional(),
  initialCaseClearAcknowledged: z.literal(true).optional(),
  componentStagingAcknowledgements: componentStagingAcknowledgements.optional(),
  clearedVitrines: z.array(z.string().min(1).max(100)).max(100).optional(),
  records: z.array(z.object({ sourceId: z.string().min(1).max(200), saintId: z.string().nullable(),
    expectedCurrentRevision: z.string().regex(/^[a-f0-9]{64}$/), expectedSourceRevision: z.string().regex(/^[a-f0-9]{64}$/),
    expectedLocationVersion: z.number().int().nonnegative(),
    to: moveLocation }).strict()).max(200)
}).strict().refine(input => input.records.length > 0 || Boolean(input.clearedVitrines?.length), "Choose source records or confirm a cleared vitrine.");
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const action = "museum.physical_location.confirmed";
const receiptType = "MuseumPhysicalConfirmation";

export async function readPhysicalLocationView(loader: PhysicalSnapshotLoader, tx: Prisma.TransactionClient, sourceIds?: string[], includeUndo = true) {
  const snapshot = moveSnapshot.parse(await loader(tx));
  const selected = sourceIds ? snapshot.rows.filter(row => sourceIds.includes(row.sourceId)) : snapshot.rows;
  if (sourceIds?.some(id => !selected.some(row => row.sourceId === id))) throw new MuseumMoveSessionError(409, "A source record changed. Reload the inventory before recording its location.");
  const [positions, links, components] = await Promise.all([
    tx.museumMoveCurrentLocation.findMany({ where: { museumId: "museum-spn", ...(sourceIds ? { sourceId: { in: sourceIds } } : {}) } }),
    tx.externalRecord.findMany({ where: { sourceType: "airtable", externalId: { in: selected.flatMap(row => row.sourceKey ? [row.sourceKey] : []) } }, select: { externalId: true, entityType: true, entityId: true } }),
    selected.some(row=>v20ComponentSourceIds.some(id=>id===row.sourceId))?readComponentPlacements(tx):Promise.resolve([])
  ]);
  const rows = selected.map(row => {
    const link = links.find(link => link.externalId === row.sourceKey);
    const identityChanged = Boolean(row.saintId && (!link || link.entityType !== "Saint" || link.entityId !== row.saintId));
    const current = resolveMuseumPhysicalCurrent(row.sourceReported, positions.find(position => position.sourceId === row.sourceId), row.legacyConfirmed);
    const sourceRevision=physicalFingerprint({ sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, original: row.sourceReported, link, itemIds: row.itemIds ?? [], fixedHousing: row.fixedHousing });
    const reviewedSource={sourceId:row.sourceId,saintId:row.saintId,sourceRevision,identityChanged,housingEvidenceRevision:row.housingEvidenceRevision};
    return projectComponentPlacement({ sourceId: row.sourceId, sourceKey: row.sourceKey ?? null, saintId: row.saintId, name: row.name,
      original: row.sourceReported, legacyConfirmed: row.legacyConfirmed ?? null, proposalDestination: row.destination, proposalVersion: snapshot.proposalVersion,
      duplicateOfSourceId: spnDuplicateObservations[row.sourceId]?.duplicateOfSourceId ?? null,
      fixedHousing: row.fixedHousing, movementBlockedReason: spnMovementBlockedReason(row.sourceId,reviewedSource), verifiedItemIds: [...new Set([...(row.itemIds ?? []), ...(row.itemId ? [row.itemId] : [])])], identityChanged,
      sourceRevision,housingEvidenceRevision:row.housingEvidenceRevision,...(isReviewedParamanandArmSupport(reviewedSource)?{reviewedHousing:{classification:paramanandObjectReview.classification,reviewedDate:paramanandObjectReview.reviewedDate,fitNote:paramanandObjectReview.fitNote}}:{}),
      ...current }, components.find(component => component.sourceId === row.sourceId));
  });
  const confirmedRows = (includeUndo ? rows : []).filter(row => row.currentBasis === "confirmed" && row.currentConfirmed && !row.identityChanged && !row.verifiedItemIds.length);
  const expectedReceipts = confirmedRows.length ? Prisma.join(confirmedRows.map(row =>
    Prisma.sql`(${row.sourceId},${String(row.currentVersion)},${row.currentConfirmed!.confirmedAt})`)) : null;
  const undoReceipts = expectedReceipts ? await tx.$queryRaw<{ id: string; afterJson: Prisma.JsonValue }[]>(Prisma.sql`
    SELECT DISTINCT event.id, event."afterJson" FROM "AuditEvent" event
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(event."afterJson"->'moves')='array' THEN event."afterJson"->'moves' ELSE '[]'::jsonb END) movement
    JOIN (VALUES ${expectedReceipts}) expected("sourceId",version,"confirmedAt")
      ON movement.value->>'sourceId'=expected."sourceId" AND movement.value->>'version'=expected.version
      AND event."afterJson"->>'recordedAt'=expected."confirmedAt"
    WHERE event.action=${action} AND event."entityType"=${receiptType}
      AND event."afterJson"->>'museumId'='museum-spn'
  `) : [];
  return { museumId: "museum-spn" as const, sourceSnapshotAt: snapshot.sourceSnapshotAt ?? null, rows: rows.map(row => ({ ...row, undo: row.componentPlacement ? {
    available:true,receiptId:row.componentPlacement.receiptId,previous:null,previousBasis:null,previousConfirmedAt:null,
    reason:"Correct only the Vitrine 20 component record; this does not confirm a physical return."
  } : physicalUndoOffer(row, undoReceipts) })), vitrineCodes: snapshot.vitrineCodes,
    unmappedCurrentLocations: positions.filter(position => !spnDuplicateObservations[position.sourceId] && !snapshot.rows.some(row => row.sourceId === position.sourceId)).flatMap(position => { const location = storedPhysicalLocation(position.location); return location ? [{ sourceId: position.sourceId, location, version: position.version, recordedAt: position.confirmedAt }] : []; }) };
}

export async function readMuseumPhysicalLocations(loader: PhysicalSnapshotLoader, sourceIds?: string[]) {
  const current = await readPhysicalLocationView(loader, db, sourceIds);
  const [confirmationHistory, reportedPlacementReceipts] = await Promise.all([
    db.auditEvent.findMany({ where: { action, entityType: receiptType, entityId: { startsWith: "museum-spn:" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, createdAt: true, afterJson: true } }),
    readReportedPlacementReceipts()
  ]);
  const corrections = await db.auditEvent.findMany({ where: { action: "museum.physical_location.check_undone", entityType: "MuseumPhysicalCheckUndo", entityId: { startsWith: "museum-spn:" } }, select: { afterJson: true } });
  const corrected = corrections.flatMap(event => {
    const value = event.afterJson;
    return value && typeof value === "object" && !Array.isArray(value) && typeof value.targetReceiptId === "string" && typeof value.sourceId === "string"
      ? [{ receiptId: value.targetReceiptId, sourceId: value.sourceId }] : [];
  });
  const activeHistory = confirmationHistory.map(event => {
    const value = event.afterJson;
    if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.moves)) return event;
    return { ...event, afterJson: { ...value, moves: value.moves.filter(move => !move || typeof move !== "object" || Array.isArray(move) || !corrected.some(c => c.receiptId === event.id && c.sourceId === move.sourceId)) } };
  });
  return { ...current, confirmationHistory: activeHistory, clearCorrections: clearCorrectionOffers(current.rows, confirmationHistory), reportedPlacementReceipts, preparations: await readMuseumPreparations(), phaseClearances: await readMuseumPhaseClearances(db,loader) };
}

export async function readReportedPlacementReceipts(tx: Prisma.TransactionClient = db,
  reported: { sourceId: string; currentLocation: { vitrine: string }; confirmedDate: string }[] = registeredStarterGuide.physicalConfirmations.moves) {
  if (!reported.length) return { guideContext: starterGuideContext, expectedCount: 0, matchedCount: 0, complete: true, matched: [], outstandingSourceIds: [] };
  const expected = Prisma.join(reported.map(row => Prisma.sql`(${row.sourceId},${row.currentLocation.vitrine},${row.confirmedDate})`));
  const matched = await tx.$queryRaw<{ sourceId: string; receiptId: string; recordedAt: Date; confirmedDate: string; vitrine: string }[]>(Prisma.sql`
    SELECT DISTINCT ON (expected."sourceId") expected."sourceId", event.id AS "receiptId", event."createdAt" AS "recordedAt",
      event."afterJson"->>'confirmedDate' AS "confirmedDate", expected.vitrine AS vitrine
    FROM "AuditEvent" event
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(event."afterJson"->'moves')='array' THEN event."afterJson"->'moves' ELSE '[]'::jsonb END) movement
    JOIN (VALUES ${expected}) AS expected("sourceId",vitrine,"confirmedDate")
      ON movement.value->>'sourceId'=expected."sourceId" AND movement.value->'location'->>'kind'='vitrine'
      AND movement.value->'location'->>'code'=expected.vitrine
    WHERE event.action=${action} AND event."entityType"=${receiptType}
      AND event."afterJson"->>'museumId'='museum-spn' AND event."afterJson"->>'confirmedDate'>=expected."confirmedDate"
      AND NOT EXISTS (SELECT 1 FROM "AuditEvent" correction
        WHERE correction.action='museum.physical_location.check_undone' AND correction."entityType"='MuseumPhysicalCheckUndo'
          AND correction."afterJson"->>'museumId'='museum-spn'
          AND correction."afterJson"->>'targetReceiptId'=event.id AND correction."afterJson"->>'sourceId'=expected."sourceId")
    ORDER BY expected."sourceId", event."createdAt" DESC, event.id DESC
  `);
  const ids = new Set(matched.map(row => row.sourceId));
  return { guideContext: starterGuideContext, expectedCount: reported.length, matchedCount: ids.size, complete: ids.size === reported.length,
    matched, outstandingSourceIds: reported.filter(row => !ids.has(row.sourceId)).map(row => row.sourceId) };
}

export async function confirmMuseumPhysicalLocations(raw: unknown, actor: MoveSessionActor, loader: PhysicalSnapshotLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must record physical locations.");
  loader = memoizePhysicalSnapshot(loader);
  const input = physicalConfirmationInput.parse(raw);
  assertComponentClearanceScope(input);
  assertDistinctMoveSources(input.records);
  if (input.guideContext) {
    const definition = readStarterGuideDefinition(input.guideContext.guideVersion);
    if(!input.alternativeDecision && !input.curatorAddition)assertGuidePhysicalScope(definition, input.records, input.clearedVitrines);
    const registered = definition.context;
    if (registered.contentDigest !== input.guideContext.contentDigest || registered.assignmentDigest !== input.guideContext.assignmentDigest) throw new MuseumMoveSessionError(409, "The guide content changed. Reload it before recording a placement.");
  }
  return db.$transaction(async tx => {
    // Share the session lock: both workflows update the same source-current ledger.
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const entityId = `${input.museumId}:${input.clientRequestId}`, fingerprint = physicalFingerprint(input);
    const retry = await tx.auditEvent.findFirst({ where: { action, entityType: receiptType, entityId }, select: { id: true, afterJson: true } });
    if (retry) {
      const receipt = retry.afterJson as { fingerprint?: string } | null;
      if (receipt?.fingerprint !== fingerprint) throw new MuseumMoveSessionError(409, "This request already recorded different locations. Reload before recording another confirmation.");
      return { ...await readPhysicalLocationView(loader, tx, input.records.map(row => row.sourceId)), preparations: await readMuseumPreparations(tx), phaseClearances: await readMuseumPhaseClearances(tx,loader), receipt: retry, replayed: true, alreadyRecorded: [] as string[] };
    }
    if(input.guideContext && readStarterGuideDefinition(input.guideContext.guideVersion).readOnly)
      throw new MuseumMoveSessionError(409,"This guide is historical. Reload the current guide before recording a new physical move.");
    assertCurrentNorthernGuideTargets(input);
    if(input.guideContext&&!input.alternativeDecision&&!input.curatorAddition&&!input.clearedVitrines?.length&&input.records.some(r=>r.sourceId===paramanandObjectReview.sourceId&&r.to.kind==="vitrine"&&r.to.code==="37")&&paramanandProposalResolution((await readMuseumData(tx)).placements).destination!=="37")
      throw new MuseumMoveSessionError(409,"This captured Vitrine 37 destination is superseded. Review the complete arm-support's current Puri proposal before recording a move.");
    if(input.guideContext&&!input.alternativeDecision&&!input.curatorAddition&&!input.clearedVitrines?.length&&
       input.records.some(row=>row.sourceId===bilashFollowup.sourceId&&row.to.kind==="vitrine"&&row.to.code==="57"))
      assertBilashGuideTarget(input.records,(await readMuseumData(tx)).placements);
    if(input.alternativeDecision){
      if(!input.guideContext||input.clearedVitrines?.length)throw new MuseumMoveSessionError(400,"Reload the alternative destination before confirming it.");
      await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-guide-decisions:spn'))`;
      const key={museumId:"museum-spn",guideVersion:input.alternativeDecision.guideVersion,suggestionId:input.alternativeDecision.suggestionId};
      const decision=await tx.museumGuideSuggestionDecision.findUnique({where:{museumId_guideVersion_suggestionId:key}});
      const suggestion=assertAlternativeGuideContext(readStarterGuideDefinition(input.guideContext.guideVersion),readStarterGuideDefinition(key.guideVersion),key.suggestionId);
      const effective=await readGuideAlternativeDestinations(tx);
      if(!decision||decision.version!==input.alternativeDecision.version||decision.decision!=="declined"||!decision.alternativeVitrine||!suggestion||
        input.records.some(r=>!effective.some(a=>a.sourceId===r.sourceId&&a.guideVersion===key.guideVersion&&a.suggestionId===key.suggestionId&&a.version===decision.version)||!suggestion.sourceIds.includes(r.sourceId)||r.to.kind!=="vitrine"||r.to.code!==decision.alternativeVitrine||(r.to.shelf??null)!==(decision.alternativeShelf??null)))
        throw new MuseumMoveSessionError(409,"The alternative changed. Reload it before recording the move.");
    }
    const phase = input.guideContext ? readStarterGuideDefinition(input.guideContext.guideVersion) : null;
    let additionPhases: ReturnType<typeof currentReceiverGuideDefinitions> = [];
    if (input.curatorAddition) {
      if (input.alternativeDecision || input.clearedVitrines?.length || input.records.length !== 1)
        throw new MuseumMoveSessionError(400, "Confirm one added record without clearing a vitrine.");
      await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-companion-additions:spn'))`;
      const addition = (await readEffectiveCompanionAdditions(tx)).find(row => row.sourceId === input.curatorAddition!.sourceId);
      const record = input.records[0];
      if (!addition || addition.version !== input.curatorAddition.version || addition.sourceId !== record.sourceId ||
        addition.saintId !== record.saintId || addition.sourceRevision !== record.expectedSourceRevision ||
        record.to.kind !== "vitrine" || record.to.code !== addition.vitrine || (record.to.shelf ?? null) !== addition.shelf)
        throw new MuseumMoveSessionError(409, "The added destination changed. Reload it before recording the move.");
      additionPhases = currentReceiverGuideDefinitions(addition.vitrine);
      if (input.guideContext ? !additionPhases.some(row => row.context.guideVersion === input.guideContext!.guideVersion) : additionPhases.length > 0)
        throw new MuseumMoveSessionError(409, "Open this destination's current move guide before recording its added relic.");
    }
    const transfers = [...(phase?.physicalScope?.preparatoryTransfers ?? []), ...additionPhases.flatMap(row => row.physicalScope?.preparatoryTransfers ?? [])];
    const current = await readPhysicalLocationView(loader, tx, input.clearedVitrines?.length ? undefined : [...new Set([...input.records.map(row => row.sourceId), ...transfers.map(row => row.sourceId)])], false);
    if (input.clearedVitrines?.some(code => !current.vitrineCodes.includes(code))) throw new MuseumMoveSessionError(400, "Choose cleared vitrines in this museum's layout.");
    assertPreparatoryTransfers(input.records, transfers, current.rows);
    if (input.curatorAddition) {
      const preparations = await readMuseumPreparations(tx);
      assertPhasePreparation(input.records, [input.records[0].to.code], preparations);
      const clearances = await readMuseumPhaseClearances(tx,loader);
      for (const receiver of additionPhases) {
        const scope = receiver.physicalScope;
        if (scope?.allowClear && scope.clearVitrines?.length && phaseNeedsClearance(input.records, scope.clearanceRequiredDestinations))
          assertPhaseClearance(input, phaseClearanceRequirements(input.records, scope.clearVitrines, scope.clearancePerDestination), receiver.context.guideVersion,
            clearances.map(row => scope.previousClearanceVersions?.includes(row.guideVersion) ? { ...row, guideVersion: receiver.context.guideVersion } : row), current.rows, input.records);
        if (scope?.preparationVitrines?.length) assertPhasePreparation(input.records, scope.preparationVitrines, preparations);
      }
    }
    const initialCases=phase?.physicalScope?.allowClear ? phase.physicalScope.clearVitrines ?? [] : [];
    if(initialCases.length && (input.clearedVitrines?.length || phaseNeedsClearance(input.records,phase?.physicalScope?.clearanceRequiredDestinations)))
      assertPhaseClearance(input,input.clearedVitrines?.length ? initialCases : phaseClearanceRequirements(input.records, initialCases, phase?.physicalScope?.clearancePerDestination),phase?.context.guideVersion ?? "",(await readMuseumPhaseClearances(tx,loader)).map(c=>phase?.physicalScope?.previousClearanceVersions?.includes(c.guideVersion)?{...c,guideVersion:phase.context.guideVersion}:c),current.rows,input.records);
    const preparationVitrines = [...new Set([...(phase?.physicalScope?.preparationVitrines ?? []), ...transfers.map(row => row.toVitrine)])];
    if(preparationVitrines.length)assertPhasePreparation(input.records,preparationVitrines,await readMuseumPreparations(tx));
    if (input.clearedVitrines?.length && !initialCases.length) assertSafeCaseClear(input.clearedVitrines, [...current.rows, ...current.unmappedCurrentLocations.map(row=>({currentBasis:"confirmed",current:row.location}))]);
    if (input.clearedVitrines?.length) assertWholeCaseClearing(input.clearedVitrines, [...current.rows.map(row => ({ sourceId: row.sourceId, current: row.current })), ...current.unmappedCurrentLocations.map(row => ({ sourceId: row.sourceId, current: row.location }))], input.records);
    const componentMoves: {sourceId:string; origin: import("./museum-move-session-domain").MoveLocation; location: import("./museum-move-session-domain").MoveLocation; scope:"vitrine_20_contents_only"; expectedSourceRevision:string; previousCurrentRevision:string; previousLocationVersion:number; revision:string}[] = [];
    const changes = input.records.map(record => {
      const row = current.rows.find(row => row.sourceId === record.sourceId);
      if (!row) throw new MuseumMoveSessionError(409, "This source is not in the current inventory snapshot. Reload before confirming it.");
      if (row.identityChanged || row.saintId !== record.saintId || row.sourceRevision !== record.expectedSourceRevision) throw new MuseumMoveSessionError(409, "A source identity or its evidence changed. Reload and check the source before confirming.");
      if (row.verifiedItemIds.length) throw new MuseumMoveSessionError(409, "This source has verified inventory items. Record their moves through the item workflow.");
      let to = record.to;
      if (to.kind === "table") {
        if (to.code !== "staging-area") throw new MuseumMoveSessionError(400, "Use the Staging area for temporarily cleared displays.");
        to = { kind: "table", code: "staging-area", label: "Staging area" };
      } else {
        if (!current.vitrineCodes.includes(to.code)) throw new MuseumMoveSessionError(400, "Choose a vitrine in this museum's layout.");
        to = { ...to, label: `Vitrine ${to.code}` };
      }
      const componentOnly = isComponentClearance(input, row);
      if (componentOnly && !hasOnlySpnHousingReviewHold(row.sourceId))
        throw new MuseumMoveSessionError(409,"This record has a different movement restriction. Review its own workflow.");
      if (!componentOnly) assertSpnMovementAllowed(row.sourceId, row.current, to,row);
      if (row.fixedHousing && !sameMoveLocation(row.current, to) && !allowsPreparedFixedHousingTransfer(row.sourceId, row.current, to, transfers)) throw new MuseumMoveSessionError(409, "This display has fixed or special housing. Review that restriction before moving it.");
      if (row.currentVersion !== record.expectedLocationVersion || row.currentRevision !== record.expectedCurrentRevision) {
        if (!input.clearedVitrines?.length && row.currentBasis === "confirmed" && sameMoveLocation(row.current, to)) return null;
        throw new MuseumMoveSessionError(409, "A physical location changed. Reload it before recording this confirmation.");
      }
      if (componentOnly) {
        componentMoves.push({sourceId:row.sourceId,origin:row.current!,location:to,scope:"vitrine_20_contents_only",
          expectedSourceRevision:row.sourceRevision,previousCurrentRevision:row.currentRevision,previousLocationVersion:row.currentVersion,
          revision:physicalFingerprint({clientRequestId:input.clientRequestId,sourceId:row.sourceId,scope:"vitrine_20_contents_only",previousCurrentRevision:row.currentRevision})});
        return null;
      }
      return { sourceId: row.sourceId, sourceKey: row.sourceKey, saintId: row.saintId, name: row.name, original: row.original,
        previous: row.current, previousState: { basis: row.currentBasis, location: row.current, effectiveConfirmedAt: row.currentConfirmed?.confirmedAt ?? null }, location: to, version: row.currentVersion + 1 };
    }).filter(change => change !== null);
    const alreadyRecorded = input.records.filter(record => !changes.some(change => change.sourceId === record.sourceId) && !componentMoves.some(change => change.sourceId === record.sourceId)).map(record => record.sourceId);
    if (!changes.length && !componentMoves.length && alreadyRecorded.length) return { ...await readPhysicalLocationView(loader, tx, input.records.map(row => row.sourceId)),
      preparations: await readMuseumPreparations(tx), phaseClearances: await readMuseumPhaseClearances(tx,loader), receipt: null, replayed: false, alreadyRecorded };
    const recordedAt = new Date();
    for (const change of changes) await tx.museumMoveCurrentLocation.upsert({
      where: { museumId_sourceId: { museumId: input.museumId, sourceId: change.sourceId } },
      create: { museumId: input.museumId, sourceId: change.sourceId, location: json(change.location), confirmedAt: recordedAt, confirmedById: actor.id },
      update: { location: json(change.location), version: { increment: 1 }, confirmedAt: recordedAt, confirmedById: actor.id }
    });
    const receipt = await tx.auditEvent.create({ data: { userId: actor.id, action, entityType: receiptType, entityId,
      beforeJson: json(current.rows.map(row => ({ sourceId: row.sourceId, current: row.current, version: row.currentVersion }))),
      afterJson: json({ museumId: input.museumId, fingerprint, clientRequestId: input.clientRequestId, confirmedDate: input.confirmedDate,
        datePrecision: input.datePrecision, recordedAt: recordedAt.toISOString(), evidence: input.evidence, scope: componentMoves.length ? "source_observation_with_components" : "source_observation", moves: changes,
        ...(componentMoves.length ? {componentMoves, componentStagingAcknowledgements:input.componentStagingAcknowledgements} : {}),
        guideContext: input.guideContext ?? null, curatorAddition: input.curatorAddition ?? null, clearedVitrines: input.clearedVitrines ?? [], inventoryCompleteness: "unverified",
        emptyCaseClaim: input.clearedVitrines?.length ? "curator_confirmed_at_event_time" : "none", proposalChanged: false, sourceChanged: false }) }, select: { id: true, afterJson: true } });
    return { ...await readPhysicalLocationView(loader, tx, input.records.map(row => row.sourceId)), preparations: await readMuseumPreparations(tx), phaseClearances: await readMuseumPhaseClearances(tx,loader), receipt, replayed: false, alreadyRecorded };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}

export async function undoMuseumPhysicalCheck(raw: unknown, actor: MoveSessionActor, loader: PhysicalSnapshotLoader) {
  if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must correct placement checks.");
  loader = memoizePhysicalSnapshot(loader);
  const input = physicalUndoInput.parse(raw);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const undoAction = "museum.physical_location.check_undone", entityId = `${input.museumId}:${input.clientRequestId}`;
    const fingerprint = physicalFingerprint(input);
    const retry = await tx.auditEvent.findFirst({ where: { action: undoAction, entityType: "MuseumPhysicalCheckUndo", entityId }, select: { id: true, afterJson: true } });
    if (retry) {
      if ((retry.afterJson as { fingerprint?: string } | null)?.fingerprint !== fingerprint) throw new MuseumMoveSessionError(409, "This request already corrected a different check. Reload before trying again.");
      return { ...await readPhysicalLocationView(loader, tx), preparations: await readMuseumPreparations(tx), phaseClearances: await readMuseumPhaseClearances(tx,loader), receipt: retry, replayed: true };
    }
    const state = await readPhysicalLocationView(loader, tx, [input.sourceId]);
    const row = state.rows[0];
    if (!row || row.identityChanged || row.saintId !== input.saintId || row.sourceRevision !== input.expectedSourceRevision ||
      row.currentVersion !== input.expectedLocationVersion || row.currentRevision !== input.expectedCurrentRevision)
      throw new MuseumMoveSessionError(409, "This source or its physical location changed. Reload before undoing the check.");
    const offer = row.undo;
    if (!offer.available || offer.receiptId !== input.receiptId) throw new MuseumMoveSessionError(409, offer.reason ?? "This confirmation can no longer be undone.");
    if (row.componentPlacement) {
      const receipt=await tx.auditEvent.create({data:{userId:actor.id,action:undoAction,entityType:"MuseumPhysicalCheckUndo",entityId,
        afterJson:json({museumId:input.museumId,fingerprint,targetReceiptId:input.receiptId,sourceId:row.sourceId,
          scope:"vitrine_20_contents_only",correctionOnly:true,physicalReturnClaim:false,recordedAt:new Date().toISOString(),
          proposalChanged:false,sourceChanged:false})},select:{id:true,afterJson:true}});
      return {...await readPhysicalLocationView(loader,tx),preparations:await readMuseumPreparations(tx),
        phaseClearances:await readMuseumPhaseClearances(tx,loader),receipt,replayed:false};
    }
    const restored = { kind: "restored_recorded_state", basis: offer.previousBasis, location: offer.previous, effectiveConfirmedAt: offer.previousConfirmedAt };
    const recordedAt = new Date();
    const changed = await tx.museumMoveCurrentLocation.updateMany({ where: { museumId: input.museumId, sourceId: input.sourceId, version: input.expectedLocationVersion },
      data: { location: json(restored), version: { increment: 1 }, confirmedAt: recordedAt, confirmedById: actor.id } });
    if (changed.count !== 1) throw new MuseumMoveSessionError(409, "This location changed. Reload before undoing the check.");
    const receipt = await tx.auditEvent.create({ data: { userId: actor.id, action: undoAction, entityType: "MuseumPhysicalCheckUndo", entityId,
      beforeJson: json({ sourceId: row.sourceId, current: row.current, basis: row.currentBasis, version: row.currentVersion }),
      afterJson: json({ museumId: input.museumId, fingerprint, targetReceiptId: input.receiptId, sourceId: row.sourceId, saintId: row.saintId,
        restored, version: row.currentVersion + 1, recordedAt: recordedAt.toISOString(), correctionOnly: true, physicalReturnClaim: false,
        proposalChanged: false, sourceChanged: false }) }, select: { id: true, afterJson: true } });
    return { ...await readPhysicalLocationView(loader, tx), preparations: await readMuseumPreparations(tx), phaseClearances: await readMuseumPhaseClearances(tx,loader), receipt, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
}

export async function readMuseumPreparations(tx: Prisma.TransactionClient = db) {
  return projectPreparations(await tx.auditEvent.findMany({where:{OR:[
    {action:"museum.vitrine.preparation.updated",entityType:"MuseumVitrinePreparation"},
    {action,entityType:receiptType,afterJson:{path:["clearedVitrines"],not:[]}}
  ],entityId:{startsWith:"museum-spn:"}},select:{id:true,createdAt:true,afterJson:true}}));
}
export async function saveMuseumPreparation(raw:unknown, actor:MoveSessionActor, loader:PhysicalSnapshotLoader) {
  if(!actor.canManage) throw new MuseumMoveSessionError(403,"A museum curator must record preparation.");
  const input=preparationInput.parse(raw);
  return db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
    const prepAction="museum.vitrine.preparation.updated", entityId=`museum-spn:${input.clientRequestId}`, fingerprint=physicalFingerprint(input);
    const retry=await tx.auditEvent.findFirst({where:{action:prepAction,entityType:"MuseumVitrinePreparation",entityId},select:{id:true,afterJson:true}});
    if(retry){
      if((retry.afterJson as {fingerprint?:string}|null)?.fingerprint!==fingerprint)throw new MuseumMoveSessionError(409,"This request already saved different preparation. Reload before trying again.");
      return {museumId:"museum-spn",preparations:await readMuseumPreparations(tx),receipt:retry,replayed:true};
    }
    const snapshot=moveSnapshot.parse(await loader(tx));
    if(!snapshot.vitrineCodes.includes(input.vitrine))throw new MuseumMoveSessionError(400,"Choose a vitrine in this museum's layout.");
    const previous=(await readMuseumPreparations(tx)).find(row=>row.vitrine===input.vitrine);
    if((previous?.version??0)!==input.expectedVersion)throw new MuseumMoveSessionError(409,"Preparation changed. Reload its current status.");
    const receipt=await tx.auditEvent.create({data:{userId:actor.id,action:prepAction,entityType:"MuseumVitrinePreparation",entityId,
      beforeJson:previous?json(previous):Prisma.JsonNull,afterJson:json({...input,version:input.expectedVersion+1,fingerprint,
        physicalMoveClaim:false,emptyCaseClaim:false,proposalChanged:false})},select:{id:true,afterJson:true}});
    return {museumId:"museum-spn",preparations:await readMuseumPreparations(tx),receipt,replayed:false};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60_000});
}

export async function correctMuseumClear(raw:unknown,actor:MoveSessionActor,loader:PhysicalSnapshotLoader){
 if(!actor.canManage)throw new MuseumMoveSessionError(403,"A museum curator must correct clearing records.");
 const input=clearCorrectionInput.parse(raw);assertDistinctMoveSources(input.records);loader=memoizePhysicalSnapshot(loader);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
  const correctionAction="museum.physical_location.clear_corrected",entityId=`museum-spn:${input.clientRequestId}`,fingerprint=physicalFingerprint(input);
  const retry=await tx.auditEvent.findFirst({where:{action:correctionAction,entityType:"MuseumClearCorrection",entityId},select:{id:true,afterJson:true}});
  if(retry){
   if((retry.afterJson as {fingerprint?:string}|null)?.fingerprint!==fingerprint)throw new MuseumMoveSessionError(409,"This request already corrected different entries. Reload before trying again.");
   return {...await readPhysicalLocationView(loader,tx),preparations:await readMuseumPreparations(tx),receipt:retry,replayed:true};
  }
  const target=await tx.auditEvent.findFirst({where:{id:input.receiptId,action,entityType:receiptType,entityId:{startsWith:"museum-spn:"}},select:{id:true,afterJson:true}});
  if(!target)throw new MuseumMoveSessionError(409,"This clearing receipt is no longer available.");
  const current=await readPhysicalLocationView(loader,tx,input.records.map(row=>row.sourceId),false);
  const offers=clearCorrectionOffers(current.rows,[target]).flatMap(offer=>offer.records);
  const changes=input.records.map(record=>{
   const offer=offers.find(row=>row.sourceId===record.sourceId);
   if(!offer || offer.saintId!==record.saintId || offer.expectedCurrentRevision!==record.expectedCurrentRevision ||
     offer.expectedSourceRevision!==record.expectedSourceRevision || offer.expectedLocationVersion!==record.expectedLocationVersion)
    throw new MuseumMoveSessionError(409,"A clearing entry or its source changed. Reload and review the correction again.");
   return offer;
  });
  const recordedAt=new Date();
  for(const change of changes){
   const restored={kind:"restored_recorded_state",basis:"confirmed",location:change.previous,effectiveConfirmedAt:change.previousConfirmedAt};
   const changed=await tx.museumMoveCurrentLocation.updateMany({where:{museumId:input.museumId,sourceId:change.sourceId,version:change.expectedLocationVersion},
    data:{location:json(restored),version:{increment:1},confirmedAt:recordedAt,confirmedById:actor.id}});
   if(changed.count!==1)throw new MuseumMoveSessionError(409,"A location changed. Reload before correcting the clearing record.");
   const shelf=await tx.museumCompanionShelf.findUnique({where:{museumId_sourceId:{museumId:input.museumId,sourceId:change.sourceId}}});
   const restoredShelf=shelf && clearCorrectionShelfApplies(shelf,change)
    ? await tx.museumCompanionShelf.update({where:{museumId_sourceId:{museumId:input.museumId,sourceId:change.sourceId}},data:{physicalVersion:change.expectedLocationVersion+1,version:{increment:1},updatedById:actor.id}}) : null;
   await tx.auditEvent.create({data:{userId:actor.id,action:"museum.physical_location.check_undone",entityType:"MuseumPhysicalCheckUndo",entityId:`${entityId}:${change.sourceId}`,
    beforeJson:json({physical:current.rows.find(row=>row.sourceId===change.sourceId),shelf}),afterJson:json({museumId:input.museumId,targetReceiptId:input.receiptId,sourceId:change.sourceId,
      saintId:change.saintId,restored,version:change.expectedLocationVersion+1,recordedAt:recordedAt.toISOString(),correctionOnly:true,physicalReturnClaim:false,
      proposalChanged:false,sourceChanged:false,restoredShelf,parentCorrection:entityId})}});
  }
  const receipt=await tx.auditEvent.create({data:{userId:actor.id,action:correctionAction,entityType:"MuseumClearCorrection",entityId,
   afterJson:json({museumId:input.museumId,fingerprint,targetReceiptId:input.receiptId,sourceIds:changes.map(row=>row.sourceId),
    recordedAt:recordedAt.toISOString(),correctionOnly:true,physicalMoveClaim:false})},select:{id:true,afterJson:true}});
  return {...await readPhysicalLocationView(loader,tx),preparations:await readMuseumPreparations(tx),receipt,replayed:false};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60_000});
}

export async function readMuseumPhaseClearances(tx:Prisma.TransactionClient=db,loader?:PhysicalSnapshotLoader){
 const correctionsRead=readComponentCorrections(tx);
 const [events,corrections,components]=await Promise.all([tx.auditEvent.findMany({where:{action,entityType:receiptType,entityId:{startsWith:"museum-spn:"},
  afterJson:{path:["clearedVitrines"],not:[]}},select:{id:true,createdAt:true,afterJson:true}}),correctionsRead,readComponentPlacements(tx,correctionsRead)]);
 const validComponents=new Set<string>();
 if(components.length){
  if(!loader){const source=await import("./museum-move-session-source");loader=transaction=>source.readMuseumMoveSessionSource(source.registeredMoveProposal.version,transaction);}
  const current=await readPhysicalLocationView(loader,tx,components.map(row=>row.sourceId),false);
  for(const row of current.rows)if(row.componentPlacement)validComponents.add(row.componentPlacement.receiptId+":"+row.sourceId);
 }
 return projectPhaseClearances(events.filter(event=>{
  if(corrections.some(c=>c.receiptId===event.id))return false;
  const value=event.afterJson;
  if(value&&typeof value==="object"&&!Array.isArray(value)&&value.scope==="source_observation_with_components")
   return Array.isArray(value.componentMoves)&&value.componentMoves.length>0&&value.componentMoves.every(row=>
    row&&typeof row==="object"&&!Array.isArray(row)&&typeof row.sourceId==="string"&&validComponents.has(event.id+":"+row.sourceId));
  return true;
 }));
}
