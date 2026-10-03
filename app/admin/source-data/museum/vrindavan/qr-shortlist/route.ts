import {requireCapability} from "@/lib/admin-access";
import {readVrindavanMuseumInventory} from "@/lib/vrindavan-museum-inventory";
export const dynamic="force-dynamic";
export async function GET() {
 await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const inventory=await readVrindavanMuseumInventory();
 const saints=inventory.saints.filter(s=>s.status==="published").map(s=>({id:s.id,name:s.displayName,url:`https://hindusaints.org/saints/${encodeURIComponent(s.slug)}`,entries:inventory.entriesBySaintId.get(s.id)??[]}));
 return Response.json({generatedAt:new Date().toISOString(),museum:inventory.museum,snapshotHash:inventory.snapshotHash,confirmedEntries:inventory.counts.confirmedEntries,publishedSaints:saints.length,saints},{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="vrindavan-public-profile-shortlist.json"'}});
}