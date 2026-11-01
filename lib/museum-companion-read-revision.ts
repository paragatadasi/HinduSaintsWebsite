import {randomUUID} from "node:crypto";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {physicalFingerprint} from "./museum-physical-location-current";

// Read-model dependencies, including relation tables: tuple versions also detect
// edits that do not update a parent timestamp, relinks, deletes and raw imports.
export const companionReadTables=[
 "Saint","SaintAlias","SaintPlace","Place","SaintTradition","Tradition",
 "SaintRelationship","SaintFamily","SaintFamilyMember","SaintMuseumSection",
 "SaintVisitPlace","MuseumSaintState","MuseumSection","MuseumExhibitGroup",
 "AirtableMirrorRecord","ExternalRecord","MuseumDisplayMembership","MuseumArrangement",
 "MuseumFamilyProposalMove","Museum","MuseumLocation","MuseumCollectionItem",
 "MuseumItemSaint","MuseumItemPlacement","MuseumCollectionImport",
 "MuseumMoveCurrentLocation","MuseumGuideSuggestionDecision","MuseumCompanionShelf",
 "MuseumCompanionTask","AuditEvent"
] as const;
const globals=globalThis as typeof globalThis&{museumCompanionReadEpoch?:string};
const epoch=globals.museumCompanionReadEpoch??=randomUUID();
type TableRevision={table_name:string;row_count:string;tuple_revision:string};
export function companionReadRevision(rows:TableRevision[],options:{epoch?:string;day?:string}={}){
 return physicalFingerprint({scheme:1,epoch:options.epoch??epoch,day:options.day??new Date().toISOString().slice(0,10),
  tables:[...rows].sort((a,b)=>a.table_name.localeCompare(b.table_name))});
}
export async function readMuseumCompanionRevision(client:Prisma.TransactionClient=db){
 const queries=companionReadTables.map(name=>Prisma.sql`SELECT ${name}::text AS table_name,count(*)::text AS row_count,
  md5(coalesce(string_agg(xmin::text||':'||ctid::text,',' ORDER BY ctid),'')) AS tuple_revision FROM ${Prisma.raw('"public"."'+name+'"')}`);
 return companionReadRevision(await client.$queryRaw<TableRevision[]>(Prisma.join(queries,' UNION ALL ')));
}
export function companionResourceRevision(revision:string,scope:string){return physicalFingerprint({revision,scope});}
