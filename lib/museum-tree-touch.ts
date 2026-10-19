import {treePinchCamera,type TreePoint} from "./museum-tree-camera";
type TouchPort={read:()=>{scroll:TreePoint;zoom:number};pan:(point:TreePoint)=>void;pinch:(zoom:number,scroll:TreePoint)=>void};
// Isolated from React so capture-transfer sequences can be regression tested.
export function createMuseumTreeTouch(port:TouchPort){
 const points=new Map<number,TreePoint>();let moved=false;
 let start:({a:TreePoint;b?:TreePoint;scroll:TreePoint;zoom:number})|null=null;
 const begin=()=>{const list=[...points.values()];start=list.length?{a:list[0],b:list[1],...port.read()}:null;};
 const end=(id:number)=>{points.delete(id);begin();};
 return {
  down(id:number,point:TreePoint){if(!points.size)moved=false;points.set(id,point);begin();},
  move(id:number,point:TreePoint){
   if(!points.has(id)||!start)return false;
   points.set(id,point);const list=[...points.values()];
   if(list.length>1&&start.b){moved=true;const camera=treePinchCamera({...start,b:start.b},list[0],list[1]);port.pinch(camera.zoom,camera.scroll);}
   else {const dx=list[0].x-start.a.x,dy=list[0].y-start.a.y;if(Math.hypot(dx,dy)>6)moved=true;if(moved)port.pan({x:start.scroll.x-dx,y:start.scroll.y-dy});}
   return moved;
  },
  end,
  lostCapture(id:number,viewportLostCapture:boolean){
   // Taking capture on the viewport releases the SVG child's implicit capture.
   // That bubbled event does not mean the finger has lifted.
   if(viewportLostCapture)end(id);
  },
  suppressClick(){const suppress=moved;moved=false;return suppress;},
  reset(){points.clear();start=null;moved=false;}
 };
}
