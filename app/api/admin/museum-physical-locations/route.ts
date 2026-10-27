import { museumPhysicalLocationsHttp } from "@/lib/museum-physical-locations-http";
import { readMuseumMoveSessionSource, registeredMoveProposal } from "@/lib/museum-move-session-source";
import { currentSpnProposalRelease } from "@/lib/spn-current-proposal";
import type { PhysicalSnapshotLoader } from "@/lib/museum-physical-locations";

export const runtime = "nodejs";
const loader: PhysicalSnapshotLoader = async tx => {
  const snapshot = await readMuseumMoveSessionSource(registeredMoveProposal.version, tx);
  const future = new Set(currentSpnProposalRelease.proposal.layout.vitrines.filter(row => row.availability === "future").map(row => row.number));
  return { ...snapshot, vitrineCodes: snapshot.vitrineCodes.filter(code => !future.has(code)) };
};
export const GET = (request: Request) => museumPhysicalLocationsHttp(request, loader);
export const POST = (request: Request) => museumPhysicalLocationsHttp(request, loader);
