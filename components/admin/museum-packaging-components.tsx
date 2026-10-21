import {summarizePackagingComponents} from "@/lib/museum-packaging-components";
import type {PlannerRow} from "@/lib/museum-move-planner-domain";

export function MuseumPackagingComponents({rows}:{rows:PlannerRow[]}){
 const counts=summarizePackagingComponents(rows.flatMap(row=>row.sources));
 if(!counts.sourceEntries)return <p className="museum-planning-meta">Container information not recorded</p>;
 const labels={frame:"Frame",small_frame:"Small frame",box:"Box",bag:"Bag",urn:"Urn",paduka:"Paduka"};
 return <div className="museum-packaging"><p className="eyebrow">Source-reported components</p><dl>{Object.entries(labels).filter(([key])=>counts.components[key as keyof typeof labels]>0).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{counts.components[key as keyof typeof labels]}</dd></div>)}{counts.unknownEntries>0?<div><dt>Unknown entries</dt><dd>{counts.unknownEntries}</dd></div>:null}{counts.conflictingEntries>0?<div><dt>Conflicting entries</dt><dd>{counts.conflictingEntries}</dd></div>:null}</dl><details><summary>About these counts</summary><p>{counts.sourceEntries} distinct inventory entries. Each named component counts once per entry: Small Frame/Box contributes one small frame and one box. Shared entries count once; relic quantities do not multiply these counts. These are provisional source-reported counts, not verified physical totals.</p>{counts.reviewEntries>0?<p>Unknown or conflicting entries are held for review and excluded from component counts. Original source labels are preserved in the inventory.</p>:null}{counts.discrepancyEntries>0?<p>{counts.discrepancyEntries} comparison-sheet differences; Sheet1 is used.</p>:null}</details></div>;
}
