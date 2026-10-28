import { museumCompanionWorkHttp } from "@/lib/museum-companion-work-http";
import { readMuseumMoveSessionSource, registeredMoveProposal } from "@/lib/museum-move-session-source";
export const runtime="nodejs";
const loader=(tx:Parameters<typeof readMuseumMoveSessionSource>[1])=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx);
export const GET=(request:Request)=>museumCompanionWorkHttp(request,loader);
export const POST=(request:Request)=>museumCompanionWorkHttp(request,loader);
