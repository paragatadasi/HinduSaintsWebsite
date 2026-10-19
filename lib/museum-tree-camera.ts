// Diagram coordinates stay stable while the user's pinch midpoint moves.
export type TreePoint = {x:number;y:number};
export function clampTreeZoom(zoom:number){return Math.max(.25,Math.min(2.5,zoom));}
export function treeZoomScroll(scroll:TreePoint,point:TreePoint,oldZoom:number,newZoom:number):TreePoint {
 return {x:(scroll.x+point.x)/oldZoom*newZoom-point.x,y:(scroll.y+point.y)/oldZoom*newZoom-point.y};
}
export function treePinchCamera(start:{a:TreePoint;b:TreePoint;scroll:TreePoint;zoom:number},a:TreePoint,b:TreePoint){
 const distance=(p:TreePoint,q:TreePoint)=>Math.hypot(p.x-q.x,p.y-q.y);
 const midpoint=(p:TreePoint,q:TreePoint)=>({x:(p.x+q.x)/2,y:(p.y+q.y)/2});
 const oldMid=midpoint(start.a,start.b),mid=midpoint(a,b);
 const zoom=clampTreeZoom(start.zoom*distance(a,b)/Math.max(1,distance(start.a,start.b)));
 const anchor=treeZoomScroll(start.scroll,oldMid,start.zoom,zoom);
 return {zoom,scroll:{x:anchor.x+oldMid.x-mid.x,y:anchor.y+oldMid.y-mid.y}};
}
