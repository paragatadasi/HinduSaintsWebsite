import {requireCapability} from "@/lib/admin-access";
import {readVrindavanIdentityReview} from "@/lib/vrindavan-identity-review";
import {buildVrindavanReviewBatches} from "@/lib/vrindavan-review-batches";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");
 const snapshot=new URL(request.url).searchParams.get("batch")??undefined;
 const headers={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"};
 if(snapshot&&!/^[a-f0-9]{64}$/.test(snapshot))return Response.json({error:"Invalid snapshot"},{status:400,headers});
 const review=await readVrindavanIdentityReview();
 if(snapshot&&!review.rows.some(p=>p.row.sourceKey.split(":")[1]===snapshot))return Response.json({error:"Review snapshot unavailable"},{status:404,headers});
 const report=buildVrindavanReviewBatches(review.rows,snapshot);
 type Row=typeof review.rows[number];
 const exported=(p:Row)=>({observationId:p.row.id,sourceKey:p.row.sourceKey,status:p.row.status,
  sourceRow:p.data.sourceRow,sourceName:p.data.sourceName,name:p.data.name,place:p.data.place,
  relic:p.data.relic,quantity:p.data.quantity,display:p.data.display,position:p.data.position,
  comments:p.data.comments,warnings:p.data.warnings,note:p.data.note,confirmedSaintIds:p.data.saintIds,
  itemId:p.row.itemId,missingReviewedTarget:p.missingReviewedTarget,
  match:{category:p.identity.category,method:p.identity.method,candidates:p.identity.candidates.map(({aliases,...saint})=>saint)},
  reviewUrl:`https://hindusaints.org/admin/source-data/museum/vrindavan/${encodeURIComponent(p.row.id)}`});
 return Response.json({version:1,museum:"vrindavan",generatedAt:new Date().toISOString(),snapshotHash:report.snapshotHash,
  summary:report.summary,batches:report.batches.map(b=>({key:b.key,label:b.label,description:b.description,rows:b.rows.map(exported)})),
  repeatedNameEvidence:report.repeatedNames.map(group=>group.map(exported)),confirmedLinkAlerts:report.confirmedLinkAlerts.map(exported),
  websiteCatalogue:review.saints,
  policy:"Read-only current website matching. Confirmed links are preserved; no saint is created, merged, published or automatically linked. Relic locations and source place meanings remain separate review decisions."},
  {headers:{...headers,"Content-Disposition":'attachment; filename="vrindavan-remaining-identity-review.json"'}});
}
