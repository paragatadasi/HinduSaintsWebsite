import {NextResponse} from "next/server";
import {getAdminUser} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {getMuseumData} from "@/lib/museum-data";
import {readMuseumPhysicalLocations} from "@/lib/museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "@/lib/museum-move-session-source";
import {readShelfPlanningContext} from "@/lib/museum-shelf-planning-source";
import {allOperationalSpnShelves as packet} from "@/lib/spn-operational-shelves";

export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
export async function GET(){
 const user=await getAdminUser();
 if(!user?.active)return NextResponse.json({error:"Sign in to continue."},{status:401,headers});
 if(!hasCapability(user.roles,"access_museum")||!hasCapability(user.roles,"view_museum_catalog"))return NextResponse.json({error:"Museum access is required."},{status:403,headers});
 try{
  const [current,physical]=await Promise.all([getMuseumData(),readMuseumPhysicalLocations(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx))]);
  return NextResponse.json(await readShelfPlanningContext(packet,current,physical),{headers});
 }catch{
  return NextResponse.json({error:"Shelf plans could not be refreshed. Try again."},{status:500,headers});
 }
}
