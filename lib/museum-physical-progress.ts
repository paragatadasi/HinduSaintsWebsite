import { db } from "./db";
import { physicalFingerprint, resolveMuseumPhysicalCurrent } from "./museum-physical-location-current";
import { readMuseumPreparations, readMuseumPhaseClearances } from "./museum-physical-locations";

export async function readMuseumPhysicalProgress() {
  return db.$transaction(async tx => {
    const [saved, preparations, phaseClearances] = await Promise.all([
      tx.museumMoveCurrentLocation.findMany({ where: { museumId: "museum-spn" }, orderBy: { sourceId: "asc" },
        select: { sourceId: true, location: true, version: true, confirmedAt: true } }),
      readMuseumPreparations(tx), readMuseumPhaseClearances(tx)
    ]);
    const positions = saved.map(position => ({ sourceId: position.sourceId,
      recordedAt: position.confirmedAt.toISOString(), ...resolveMuseumPhysicalCurrent(null, position, null) }));
    return { museumId: "museum-spn" as const, progressRevision: physicalFingerprint({ positions, preparations, phaseClearances }),
      positions, preparations, phaseClearances };
  }, { isolationLevel: "RepeatableRead", timeout: 15000 });
}
