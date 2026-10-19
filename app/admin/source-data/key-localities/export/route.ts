import {assertCapability} from "@/lib/admin-access";
import {readKeyLocalityPreview} from "@/lib/key-locality-updates";
import {keyLocalityResearch,keyLocalityResearchHash} from "@/lib/key-locality-research";
export async function GET(){
 await assertCapability("view_source_data");await assertCapability("view_full_saint_catalog");await assertCapability("publish_content");
 const view=await readKeyLocalityPreview();
 const report={generatedAt:new Date().toISOString(),researchVersion:keyLocalityResearch.review_version,researchHash:keyLocalityResearchHash,publishedCount:view.published.length,uncovered:view.uncovered,records:view.plans.map(p=>({externalId:p.record.external_id,name:p.record.name,saintId:p.saint?.id??null,published:p.saint?.status==="published"&&p.saint.publicationStatus==="published",blocked:p.blocked,research:p.record,proposed:p.localities.map(l=>({locality:l.research.locality,country:l.research.country,placeId:l.place?.id??null})),current:p.saint?.places??[]}))};
 return Response.json(report,{headers:{"Cache-Control":"private, no-store","Content-Disposition":"attachment; filename=published-saints-locality-coverage.json"}});
}
