import { MuseumLocationBrowser } from "@/components/admin/museum-location-browser";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { getMuseumData } from "@/lib/museum-data";
import { buildLocationBrowserRows } from "@/lib/museum-location-browser";

export default async function MuseumLocations({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  await requireCapability("access_museum");
  const params = await searchParams;
  const value = (key:string) => typeof params[key] === "string" ? params[key].trim().slice(0,200) : "";
  const filters = {vitrine:value("vitrine"), shelf:value("shelf"), section:value("section"), q:value("q")};
  const [data, items] = await Promise.all([
    getMuseumData(),
    db.museumCollectionItem.findMany({
      where:{catalogMuseumId:"museum-spn",status:{not:"archived"}},
      include:{saints:{include:{saint:{select:{id:true,displayName:true,status:true}}}},
        placements:{where:{endedAt:null},include:{location:{include:{museum:true}}}},
        movePlans:{where:{status:"planned"},include:{targetLocation:{include:{museum:true}}}}},
      orderBy:[{label:"asc"},{id:"asc"}]
    })
  ]);
  const rows = buildLocationBrowserRows(items.map(item=>({
    id:item.id,label:item.label,inventoryCode:item.inventoryCode,
    saints:item.saints.filter(s=>s.saint.status!=="archived").map(s=>({id:s.saint.id,name:s.saint.displayName})),
    location:item.placements[0] ? {...item.placements[0].location,label:item.placements[0].location.museum.name+": "+item.placements[0].location.label} : null,
    plannedLocation:item.movePlans[0] ? {...item.movePlans[0].targetLocation,label:item.movePlans[0].targetLocation.museum.name+": "+item.movePlans[0].targetLocation.label} : null
  })),data.placements);
  return <MuseumLocationBrowser rows={rows} sections={data.sections} filters={filters} pageNumber={value("page")} />;
}
