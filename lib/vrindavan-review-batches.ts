import type {IdentityMatch} from "./vrindavan-identity-domain";
import {identityName} from "./vrindavan-identity-domain";

type ReviewRow = {
 row:{id:string;sourceKey:string;status:string;itemId:string|null;observedAt:Date};
 data:{sourceRow:number;name:string|null;saintIds:string[]};
 identity:IdentityMatch;missingReviewedTarget:boolean;
};
export const vrindavanReviewBatches=[
 {key:"clear",label:"Clear current matches",description:"Current website names or aliases identify one saint. Use the existing clear-match batch confirmation."},
 {key:"variants",label:"Name and title variants",description:"One possible website candidate; review the identity and source context before linking."},
 {key:"competing",label:"Competing website identities",description:"Multiple candidates, including possible duplicate drafts. Choose the canonical saint; do not merge records here."},
 {key:"combined",label:"Combined-person rows",description:"The source names more than one saint. Confirm each existing identity separately."},
 {key:"unmatched",label:"Unmatched named rows",description:"No unique website identity yet. Research existing names and aliases before considering new saints."},
 {key:"unidentified",label:"Unnamed rows",description:"No usable saint identity. Leave unchanged until the museum supplies identifying evidence."},
 {key:"blocked",label:"Inventory-linked rows",description:"A physical item is already attached. Review through the inventory workflow before changing its identity."}
] as const;
export type VrindavanReviewBatch = typeof vrindavanReviewBatches[number]["key"];
export function vrindavanReviewBatch(row:ReviewRow):VrindavanReviewBatch {
 if(row.row.itemId)return "blocked";
 if(!row.data.name||row.identity.category==="unidentified")return "unidentified";
 if(row.data.name.includes("&"))return "combined";
 if(row.identity.category==="clear")return "clear";
 if(row.identity.candidates.length>1)return "competing";
 if(row.identity.candidates.length===1)return "variants";
 return "unmatched";
}
// Read-only grouping. Newer observations supersede earlier decisions in the same source row.
export function buildVrindavanReviewBatches<T extends ReviewRow>(rows:T[],snapshotHash?:string) {
 if(snapshotHash&&!/^[a-f0-9]{64}$/.test(snapshotHash))throw Error("Invalid review snapshot");
 const latest=new Map<string,T>();
 const ordered=[...rows].sort((a,b)=>b.row.observedAt.getTime()-a.row.observedAt.getTime()||b.row.id.localeCompare(a.row.id));
 for(const row of ordered)if(!latest.has(row.row.sourceKey))latest.set(row.row.sourceKey,row);
 const valid=[...latest.values()].filter(p=>/^vrindavan-workbook:[a-f0-9]{64}:Sheet1:[1-9][0-9]*$/.test(p.row.sourceKey));
 const snapshots=[...new Set(valid.map(p=>p.row.sourceKey.split(":")[1]))];
 if(snapshotHash&&!snapshots.includes(snapshotHash))throw Error("Review snapshot unavailable");
 const selectedSnapshot=snapshotHash??snapshots[0]??null;
 const current=valid.filter(p=>p.row.sourceKey.split(":")[1]===selectedSnapshot).sort((a,b)=>a.data.sourceRow-b.data.sourceRow);
 const remaining=current.filter(p=>["pending","deferred"].includes(p.row.status));
 const confirmed=current.filter(p=>p.row.status==="identity_linked");
 const batches=vrindavanReviewBatches.map(batch=>({...batch,rows:remaining.filter(p=>vrindavanReviewBatch(p)===batch.key)}));
 const namedGroups=new Map<string,T[]>();
 for(const row of current){if(!row.data.name)continue;const name=identityName(row.data.name);const entries=namedGroups.get(name)??[];entries.push(row);namedGroups.set(name,entries);}
 const repeatedNames=[...namedGroups.values()].filter(group=>group.length>1&&group.some(row=>remaining.includes(row)));
 return {snapshotHash:selectedSnapshot,snapshots,current,remaining,confirmed,batches,repeatedNames,
  confirmedLinkAlerts:confirmed.filter(p=>p.missingReviewedTarget),
  summary:{sourceRows:current.length,confirmedRows:confirmed.length,remainingRows:remaining.length,
   pendingRows:remaining.filter(p=>p.row.status==="pending").length,deferredRows:remaining.filter(p=>p.row.status==="deferred").length,
   confirmedLinkAlerts:confirmed.filter(p=>p.missingReviewedTarget).length,
   batchCounts:Object.fromEntries(batches.map(b=>[b.key,b.rows.length]))}};
}
