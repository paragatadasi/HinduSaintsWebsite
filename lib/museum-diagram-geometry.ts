import type {WebNode} from "./museum-connected-layout";
export const ROOM_COLUMNS=[1,.25,1,1,.25,1];
export const ROOM_ROWS=[
 [".",".","v6","v6","v6","v7"],
 ["v19",".","v20","v5",".","v8"],
 ["v18",".","v21","v4",".","v9"],
 ["v17",".","v22","v3",".","v10"],
 ["v16",".","v23","v2",".","v11"],
 ["v15",".","v24","v1",".","v12"],
 ["v14",".",".",".",".","entrance"],
 ["v13","v13","v0","v0",".","entrance"],
 [".",".","temple","temple",".","."]
];
export type DiagramPosition={nodeId:string;x:number;y:number};
export function vitrineCenter(number:string){
 const cells=ROOM_ROWS.flatMap((row,y)=>row.flatMap((value,x)=>value===`v${number}`?[{x,y}]:[]));
 if(!cells.length)return null;
 const left=Math.min(...cells.map(c=>ROOM_COLUMNS.slice(0,c.x).reduce((a,b)=>a+b,0)));
 const right=Math.max(...cells.map(c=>ROOM_COLUMNS.slice(0,c.x+1).reduce((a,b)=>a+b,0)));
 return {x:(left+right)/2/ROOM_COLUMNS.reduce((a,b)=>a+b,0),y:(Math.min(...cells.map(c=>c.y))+Math.max(...cells.map(c=>c.y))+1)/2/ROOM_ROWS.length};
}
export function proposalDiagramPositions(nodes:{id:string;name:string}[],areas:{section:string;vitrines:string[]}[]):DiagramPosition[]{
 const unassigned=nodes.filter(n=>!areas.some(a=>a.section===n.name&&a.vitrines.some(v=>vitrineCenter(v))));
 return nodes.map(n=>{
  const area=areas.find(a=>a.section===n.name),points=[...new Set(area?.vitrines??[])].flatMap(v=>{const point=vitrineCenter(v);return point?[point]:[];});
  if(!points.length)return {nodeId:n.id,x:(unassigned.indexOf(n)+.5)/Math.max(1,unassigned.length),y:.96};
  return {nodeId:n.id,x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length*.82};
 });
}
// Move the selected set by one shared, bounded delta: never distort its shape.
export function moveDiagramGroup(nodes:WebNode[],ids:ReadonlySet<string>,dx:number,dy:number,width:number,height:number){
 const moving=nodes.filter(n=>ids.has(n.id));if(!moving.length)return nodes;
 const x=Math.max(Math.max(...moving.map(n=>n.w/2-n.x)),Math.min(Math.min(...moving.map(n=>width-n.w/2-n.x)),dx));
 const y=Math.max(Math.max(...moving.map(n=>n.h/2-n.y)),Math.min(Math.min(...moving.map(n=>height-n.h/2-n.y)),dy));
 return nodes.map(n=>ids.has(n.id)?{...n,x:n.x+x,y:n.y+y}:n);
}
