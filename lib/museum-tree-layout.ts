// Shared layout configuration: SVG coordinates, independent of museum or theme.
export const TREE_GEOMETRY = {nodeWidth:260,nodeHeight:132,columnGap:100,rowGap:110,margin:70,laneGap:12,maxLanes:20,nameChars:30,nameLines:4} as const;
export type TreePerson = {id:string;name:string;birthYear:number|null;samadhiYear:number|null;sourceOnly?:boolean;presence?:"location"|"catalogue"|"source"|"none"};
export type TreeClaim = {id:string;from:string;to:string;kind:"guru"|"partner"|"incarnation";status:string;evidence:string;confidence:string};
export type TreeEdge = {key:string;from:string;to:string;kind:TreeClaim["kind"];claims:TreeClaim[];secondary?:"shortcut"|"cycle"|"partner pair";lineage:number};
export type TreeGraph = {nodes:TreePerson[];edges:TreeEdge[]};
export function normalizeTreeClaims(rows:{id:string;fromSaintId:string;toSaintId:string;relationshipType:string;status:string;evidenceStatus:string;confidence:string}[]):TreeClaim[] {
 return rows.flatMap(r=>{
  const kind=["guru","disciple"].includes(r.relationshipType)?"guru":["partner","husband","wife"].includes(r.relationshipType)?"partner":r.relationshipType==="incarnation"?"incarnation":null;
  if(!kind||r.fromSaintId===r.toSaintId||r.status==="archived")return [];
  let from=r.relationshipType==="guru"?r.toSaintId:r.fromSaintId,to=r.relationshipType==="guru"?r.fromSaintId:r.toSaintId;
  if(kind!=="guru"&&from>to)[from,to]=[to,from];
  return [{id:r.id,from,to,kind:kind as TreeClaim["kind"],status:r.status,evidence:r.evidenceStatus,confidence:r.confidence}];
 });
}
function pathExists(edges:Pick<TreeEdge,"from"|"to">[],from:string,to:string,skip?:TreeEdge):boolean {
 const seen=new Set<string>(),queue=[from];
 while(queue.length){const id=queue.shift()!;if(id===to)return true;if(seen.has(id))continue;seen.add(id);for(const e of edges)if(e!==skip&&e.from===id)queue.push(e.to);}
 return false;
}
export function layoutMuseumTree(nodes:TreePerson[],claims:TreeClaim[]) {
 const cfg=TREE_GEOMETRY,people=[...nodes].sort((a,b)=>a.id.localeCompare(b.id)),ids=new Set(people.map(n=>n.id));
 const map=new Map<string,TreeEdge>();
 for(const claim of claims){if(!ids.has(claim.from)||!ids.has(claim.to))continue;const key=`${claim.kind}:${claim.from}:${claim.to}`;const edge=map.get(key)||{key,from:claim.from,to:claim.to,kind:claim.kind,claims:[],lineage:0};edge.claims.push(claim);map.set(key,edge);}
 const edges=[...map.values()].sort((a,b)=>a.key.localeCompare(b.key));
 const gurus=edges.filter(e=>e.kind==="guru"),partners=edges.filter(e=>e.kind==="partner");
 // Pair only actual partners; do not let a chain of spouses flatten other disciples.
 const pair=new Map<string,string>();
 for(const p of partners){
  if(pair.has(p.from)||pair.has(p.to))continue;
  const withoutPair=gurus.filter(e=>!((e.from===p.from&&e.to===p.to)||(e.from===p.to&&e.to===p.from)));
  if(pathExists(withoutPair,p.from,p.to)||pathExists(withoutPair,p.to,p.from))continue;
  pair.set(p.from,p.to);pair.set(p.to,p.from);
 }
 const groupFor=(id:string)=>pair.has(id)?[id,pair.get(id)!].sort()[0]:id;
 // Cycle claims stay in the evidence list; no fabricated generation hierarchy.
 const dag:TreeEdge[]=[];
 for(const e of gurus){if(groupFor(e.from)===groupFor(e.to)){e.secondary="partner pair";continue;}
  const grouped=dag.map(x=>({from:groupFor(x.from),to:groupFor(x.to)}));
  if(pathExists(grouped,groupFor(e.to),groupFor(e.from))){e.secondary="cycle";continue;}dag.push(e);
 }
 const structural=dag.filter(e=>{if(pathExists(dag,e.from,e.to,e)){e.secondary="shortcut";return false;}return true;});
 const groups=new Map<string,TreePerson[]>();for(const n of people){const key=groupFor(n.id);groups.set(key,[...(groups.get(key)||[]),n]);}
 const depths=new Map([...groups.keys()].map(id=>[id,0]));
 for(let i=0;i<groups.size;i++)for(const e of structural){const a=groupFor(e.from),b=groupFor(e.to);depths.set(b,Math.max(depths.get(b)!,depths.get(a)!+1));}
 const children=(id:string)=>structural.filter(e=>e.from===id).map(e=>e.to);
 const roots=people.filter(n=>!structural.some(e=>e.to===n.id)&&!gurus.some(e=>e.to===n.id&&e.secondary==="partner pair"));
 const span=(n:TreePerson)=>n.birthYear===null&&n.samadhiYear===null?null:{start:n.birthYear??n.samadhiYear!-80,end:n.samadhiYear??n.birthYear!+80};
 const maxDepth=Math.max(0,...depths.values());
 const terminal=people.filter(n=>depths.get(groupFor(n.id))===maxDepth&&!children(n.id).length).map(span).filter((s):s is NonNullable<typeof s>=>!!s);
 if(maxDepth>=3)for(const n of people){const incoming=structural.filter(e=>e.to===n.id),life=span(n);if(!pair.has(n.id)&&!children(n.id).length&&incoming.length===1&&roots.some(r=>r.id===incoming[0].from)&&life&&terminal.some(t=>life.start<=t.end+20&&t.start<=life.end+20))depths.set(groupFor(n.id),maxDepth);}
 const rootIndex=new Map<string,number>();
 roots.forEach((root,index)=>{const queue=[root.id];while(queue.length){const id=queue.shift()!;if(rootIndex.has(id))continue;rootIndex.set(id,index%6);queue.push(...children(id));}});
 for(const e of edges)e.lineage=rootIndex.get(e.from)||0;
 const rows=new Map<number,string[]>();for(const id of groups.keys()){const row=depths.get(id)!;rows.set(row,[...(rows.get(row)||[]),id]);}
 const positions=new Map<string,{x:number;y:number;row:number}>();
 // Reserve outer lanes for long/secondary edges, outside every node rectangle.
 const offset=cfg.margin+Math.min(edges.length,cfg.maxLanes)*cfg.laneGap;
 let right=offset;
 for(const [row,groupIds] of [...rows].sort((a,b)=>a[0]-b[0])){
  const parentX=(id:string)=>{const parents=structural.filter(e=>groupFor(e.to)===id).map(e=>positions.get(e.from)?.x).filter((x):x is number=>x!==undefined);return parents.length?parents.reduce((a,b)=>a+b,0)/parents.length:0;};
  const skipScore=(id:string)=>structural.filter(e=>groupFor(e.from)===id).reduce((n,e)=>n+Math.max(0,depths.get(groupFor(e.to))!-row-1),0);
  groupIds.sort((a,b)=>(row===0?skipScore(b)-skipScore(a):parentX(a)-parentX(b))||a.localeCompare(b));
  let x=offset;
  for(const id of groupIds){x=Math.max(x,parentX(id));for(const n of groups.get(id)!){positions.set(n.id,{x,y:cfg.margin+row*(cfg.nodeHeight+cfg.rowGap),row});x+=cfg.nodeWidth+cfg.columnGap;}right=Math.max(right,x);}
 }
 const width=right+offset,height=cfg.margin*2+(Math.max(0,...depths.values())+1)*(cfg.nodeHeight+cfg.rowGap);
 const routed=edges.map((e,index)=>{
  const a=positions.get(e.from)!,b=positions.get(e.to)!;
  const same=a.row===b.row,adjacent=same&&Math.abs(a.x-b.x)===cfg.nodeWidth+cfg.columnGap;
  let path:string;
  if(same&&adjacent&&e.kind==="partner")path=`M ${Math.min(a.x,b.x)+cfg.nodeWidth} ${a.y+cfg.nodeHeight/2} H ${Math.max(a.x,b.x)}`;
  else if(adjacent&&e.secondary==="partner pair"){const forward=b.x>a.x;path=`M ${forward?a.x+cfg.nodeWidth:a.x} ${a.y+cfg.nodeHeight*.75} H ${forward?b.x:b.x+cfg.nodeWidth}`;}
  else if(e.kind==="guru"&&!e.secondary&&b.row===a.row+1)path=`M ${a.x+cfg.nodeWidth/2} ${a.y+cfg.nodeHeight} C ${a.x+cfg.nodeWidth/2} ${a.y+cfg.nodeHeight+cfg.rowGap/2}, ${b.x+cfg.nodeWidth/2} ${b.y-cfg.rowGap/2}, ${b.x+cfg.nodeWidth/2} ${b.y}`;
  else {const lane=cfg.margin+(index%cfg.maxLanes)*cfg.laneGap;const fromY=a.y+cfg.nodeHeight,toY=b.y;path=`M ${a.x+cfg.nodeWidth/2} ${fromY} V ${fromY+cfg.rowGap/3} H ${lane} V ${toY-cfg.rowGap/3} H ${b.x+cfg.nodeWidth/2} V ${toY}`;}
  return {...e,path};
 });
 return {nodes:people.map(n=>({...n,...positions.get(n.id)!,lineage:rootIndex.get(n.id)||0,role:roots.some(r=>r.id===n.id)?"Head (inferred)":children(n.id).length?"Branch head":""})),edges:routed,width,height};
}
export type MuseumTreeLayout=ReturnType<typeof layoutMuseumTree>;
export function treeNameLines(name:string) {
 const lines:string[]=[];let line="";
 const words=name.trim().split(/\s+/).flatMap(word=>word.match(new RegExp(`.{1,${TREE_GEOMETRY.nameChars}}`,"gu"))||[]);
 for(const word of words){if(line&&(line+" "+word).length>TREE_GEOMETRY.nameChars){lines.push(line);line=word;}else line+=(line?" ":"")+word;}
 if(line)lines.push(line);
 return lines.length>TREE_GEOMETRY.nameLines?[...lines.slice(0,TREE_GEOMETRY.nameLines-1),lines[TREE_GEOMETRY.nameLines-1].slice(0,-1)+"…"]:lines;
}
