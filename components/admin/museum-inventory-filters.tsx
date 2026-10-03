import Link from "next/link";
import type {Route} from "next";
export type MuseumInventoryFilter={name:string;label:string;value:string;allLabel:string;options:{value:string;label:string}[]};
export function MuseumInventoryFilters({action,query,searchLabel,filters,submitLabel}:{action:string;query:string;searchLabel:string;filters:MuseumInventoryFilter[];submitLabel:string}) {
 return <form action={action} className="museum-location-filters">
  <label className="admin-field">{searchLabel}<input type="search" name="q" defaultValue={query}/></label>
  {filters.map(filter=><label className="admin-field" key={filter.name}>{filter.label}<select name={filter.name} defaultValue={filter.value}><option value="">{filter.allLabel}</option>{filter.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
  <div className="review-actions"><button className="museum-admin-button">{submitLabel}</button><Link href={action as Route}>Clear filters</Link></div>
 </form>;
}
