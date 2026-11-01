import {randomUUID} from "node:crypto";
import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import {physicalFingerprint} from "./museum-physical-location-current";
import {readMuseumRevision} from "./museum-snapshot-cache";

const globals=globalThis as typeof globalThis&{museumCompanionReadEpoch?:string};
const epoch=globals.museumCompanionReadEpoch??=randomUUID();
export function companionReadRevision(revision:string,options:{epoch?:string;day?:string}={}){
 return physicalFingerprint({scheme:2,epoch:options.epoch??epoch,day:options.day??new Date().toISOString().slice(0,10),revision});
}
export async function readMuseumCompanionRevision(client:Prisma.TransactionClient=db){return companionReadRevision(await readMuseumRevision(client));}
export function companionResourceRevision(revision:string,scope:string){return physicalFingerprint({revision,scope});}
