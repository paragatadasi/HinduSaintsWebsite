import {db} from "./db";
import {getMuseumData} from "./museum-data";
import {buildLocationBrowserRows} from "./museum-location-browser";
import {provisionalNumberCollisions} from "./museum-room-layout";
import {spnMuseumLayout} from "./spn-museum-layout";

// Protected page calls this after both museum and full-catalog checks.
// Share the current-location/source distinction with Vitrines and shelves.
export async function readSpnLayoutInventory(){
 const [data,items,locations]=await Promise.all([
  getMuseumData(),
  db.museumCollectionItem.findMany({where:{catalogMuseumId:"museum-spn",status:{not:"archived"}},select:{id:true,label:true,inventoryCode:true,
   saints:{select:{saint:{select:{id:true,displayName:true,status:true}}}},
   placements:{where:{endedAt:null},select:{location:{select:{code:true,label:true,museumId:true}}}}
  }}),
  db.museumLocation.findMany({where:{museumId:"museum-spn"},select:{code:true}})
 ]);
 const rows=buildLocationBrowserRows(items.map(item=>({...item,saints:item.saints.filter(s=>s.saint.status!=="archived").map(s=>({id:s.saint.id,name:s.saint.displayName})),location:item.placements[0]?.location??null,plannedLocation:null})),data.placements);
 const collisions=provisionalNumberCollisions(spnMuseumLayout,[...locations.map(l=>l.code),...data.placements.flatMap(p=>p.sourceVitrine?[p.sourceVitrine.vitrine]:[]),...rows.map(r=>r.vitrine)]);
 return {rows,collisions};
}
