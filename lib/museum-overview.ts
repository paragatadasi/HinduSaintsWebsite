export type MuseumOverviewParams=Record<string,string|string[]|undefined>;
export function museumOverviewHref(params:MuseumOverviewParams={},view:"layout"|"records"="layout") {
 const query=new URLSearchParams();
 if(view==="records")query.set("view","records");
 for(const key of (view==="records"?["vitrine","shelf","section","q","page"]:["vitrine"])) {
  const value=params[key];
  if(typeof value==="string"&&value.trim())query.set(key,value.trim().slice(0,200));
 }
 return `/museumadmin/overview${query.size?`?${query}`:""}`;
}
