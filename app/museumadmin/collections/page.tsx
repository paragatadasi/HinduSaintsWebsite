import Link from "next/link";
import type { Route } from "next";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
export default async function CollectionItems({searchParams}:{searchParams:Promise<{q?:string;page?:string;error?:string}>}) {
  await requireCapability("access_museum");const params=await searchParams;
  const q=(params.q||"").trim().slice(0,200);const page=Math.max(1,Math.min(10000,parseInt(params.page||"1")||1));
  const where={catalogMuseumId:"museum-spn",status:{not:"archived" as const},...(q?{OR:[{label:{contains:q,mode:"insensitive" as const}},{saints:{some:{saint:{displayName:{contains:q,mode:"insensitive" as const}}}}}]}:{})};
  const [items,count]=await Promise.all([db.museumCollectionItem.findMany({where,orderBy:[{label:"asc"},{id:"asc"}],skip:(page-1)*30,take:30,include:{saints:{include:{saint:{select:{displayName:true}}}},placements:{where:{endedAt:null},include:{location:true}},movePlans:{where:{status:"planned"}}}}),db.museumCollectionItem.count({where})]);
  return <div className="admin-stack"><h1>Relics and planned moves</h1><p>Current locations describe where items are now. A planned move changes nothing until someone confirms the physical move.</p>
    {params.error?<p role="alert">Complete the required fields and try again.</p>:null}
    <form className="admin-search"><label>Find a relic or saint<input name="q" defaultValue={q}/></label><button className="admin-form-button">Search</button></form>
    <p>{count} SPN relics &middot; Page {page}</p>
    <ul>{items.map(item=><li key={item.id}><Link href={`/museumadmin/collections/${item.id}` as Route}>{item.label}</Link> &mdash; {item.placements[0]?.location.label||"Location unknown"}{item.movePlans.length?" · Move planned":""}<p>{item.saints.map(s=>s.saint.displayName).join("; ")}</p></li>)}</ul>
    {!count?<p>No connected relics yet. A source administrator can connect them through Main admin → Source Data → Museum updates.</p>:null}
    <nav aria-label="Relic pages">{page>1?<Link href={`/museumadmin/collections?q=${encodeURIComponent(q)}&page=${page-1}` as Route}>Previous</Link>:null} {page*30<count?<Link href={`/museumadmin/collections?q=${encodeURIComponent(q)}&page=${page+1}` as Route}>Next</Link>:null}</nav>
  </div>;
}
