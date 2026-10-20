export function MuseumPlanningStats({items}:{items:{label:string;value:number}[]}){
 return <dl className="museum-planning-stats">{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
