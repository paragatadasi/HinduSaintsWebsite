import { historicalStagingHttp } from "@/lib/museum-historical-staging-http";
import { readMuseumMoveSessionSource, registeredMoveProposal } from "@/lib/museum-move-session-source";
import type { PhysicalSnapshotLoader } from "@/lib/museum-physical-locations";

export const runtime = "nodejs";
const loader: PhysicalSnapshotLoader = tx => readMuseumMoveSessionSource(registeredMoveProposal.version, tx);
export const GET = (request: Request) => historicalStagingHttp(request, loader);
export const POST = (request: Request) => historicalStagingHttp(request, loader);
