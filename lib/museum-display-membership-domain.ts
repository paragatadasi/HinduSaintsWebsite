import { createHash } from "node:crypto";
export type DisplayMembershipChange = {placementId:string;familyKey:string;familyLabel:string;section:string;detached:boolean;version:number};
export type DisplayMembershipControl = {familyKey:string;label:string;detached:boolean;revision:string};
export function membershipRevision(placement:unknown, change?:DisplayMembershipChange) {
  return createHash("sha256").update(JSON.stringify({placement,change:change || null})).digest("hex");
}
