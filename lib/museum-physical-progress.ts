import { db } from "./db";
import { physicalFingerprint, resolveMuseumPhysicalCurrent } from "./museum-physical-location-current";
import { readMuseumPreparations, readMuseumPhaseClearances } from "./museum-physical-locations";
import { readComponentPlacements } from "./museum-component-clearances";
import { projectComponentPlacement } from "./museum-component-clearance-domain";
import {readReceiverAvailabilities} from "./museum-receiver-availability";
import type {PhysicalSnapshotLoader} from "./museum-physical-locations";

export async function readMuseumPhysicalProgress(loader:PhysicalSnapshotLoader) {
  return db.$transaction(async tx => {
    const [saved, preparations, phaseClearances, components] = await Promise.all([
      tx.museumMoveCurrentLocation.findMany({ where: { museumId: "museum-spn" }, orderBy: { sourceId: "asc" },
        select: { sourceId: true, location: true, version: true, confirmedAt: true } }),
      readMuseumPreparations(tx), readMuseumPhaseClearances(tx), readComponentPlacements(tx)
    ]);
    const sourceIds = [...new Set([...saved.map(row=>row.sourceId), ...components.map(row=>row.sourceId)])];
    const positions = sourceIds.map(sourceId => {
      const position = saved.find(row=>row.sourceId===sourceId), component=components.find(row=>row.sourceId===sourceId);
      const state=projectComponentPlacement(resolveMuseumPhysicalCurrent(component?.origin??null,position,null),component);
      return {sourceId,recordedAt:state.componentPlacement?.recordedAt??component?.recordedAt??position!.confirmedAt.toISOString(),...state};
    });
    const receiverAvailabilities=await readReceiverAvailabilities(loader,tx);
    return { museumId: "museum-spn" as const, progressRevision: physicalFingerprint({ positions, preparations, phaseClearances,receiverAvailabilities }),
      positions, preparations, phaseClearances,receiverAvailabilities };
  }, { isolationLevel: "RepeatableRead", timeout: 15000 });
}
