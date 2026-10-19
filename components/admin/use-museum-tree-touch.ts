"use client";
import {useLayoutEffect,useRef,type RefObject,type PointerEvent} from "react";
import {treePinchCamera,type TreePoint} from "@/lib/museum-tree-camera";

export function useMuseumTreeTouch(viewport:RefObject<HTMLDivElement|null>,zoom:number,setZoom:(zoom:number)=>void,enabled:boolean){
 const points=useRef(new Map<number,TreePoint>()),moved=useRef(false);
 const start=useRef<{a:TreePoint;b?:TreePoint;scroll:TreePoint;zoom:number}|null>(null);
 const pending=useRef<TreePoint|null>(null);
 useLayoutEffect(()=>{const view=viewport.current;if(view&&pending.current){view.scrollLeft=pending.current.x;view.scrollTop=pending.current.y;pending.current=null;}},[zoom,viewport]);
 const begin=()=>{const view=viewport.current,list=[...points.current.values()];if(view&&list.length)start.current={a:list[0],b:list[1],scroll:{x:view.scrollLeft,y:view.scrollTop},zoom};else start.current=null;};
 const position=(event:PointerEvent<HTMLDivElement>)=>{const box=event.currentTarget.getBoundingClientRect();return {x:event.clientX-box.left,y:event.clientY-box.top};};
 return {
  onPointerDown:(event:PointerEvent<HTMLDivElement>)=>{if(!enabled||event.pointerType==="mouse")return;if(!points.current.size)moved.current=false;points.current.set(event.pointerId,position(event));begin();},
  onPointerMove:(event:PointerEvent<HTMLDivElement>)=>{
   if(!enabled||!points.current.has(event.pointerId)||!start.current)return;
   points.current.set(event.pointerId,position(event));const list=[...points.current.values()],initial=start.current,view=event.currentTarget;
   if(list.length>1&&initial.b){
    moved.current=true;const camera=treePinchCamera({...initial,b:initial.b},list[0],list[1]);pending.current=camera.scroll;setZoom(camera.zoom);
    // A pinch at a zoom boundary still pans, even when React has no zoom update.
    if(camera.zoom===zoom){view.scrollLeft=camera.scroll.x;view.scrollTop=camera.scroll.y;pending.current=null;}
   }else{const dx=list[0].x-initial.a.x,dy=list[0].y-initial.a.y;if(Math.hypot(dx,dy)>6)moved.current=true;if(moved.current){view.scrollLeft=initial.scroll.x-dx;view.scrollTop=initial.scroll.y-dy;}}
   if(moved.current){event.preventDefault();if(!view.hasPointerCapture(event.pointerId))view.setPointerCapture(event.pointerId);}
  },
  onPointerUp:(event:PointerEvent<HTMLDivElement>)=>{points.current.delete(event.pointerId);begin();},
  onPointerCancel:(event:PointerEvent<HTMLDivElement>)=>{points.current.delete(event.pointerId);begin();},
  onLostPointerCapture:(event:PointerEvent<HTMLDivElement>)=>{points.current.delete(event.pointerId);begin();},
  onClickCapture:(event:React.MouseEvent<HTMLDivElement>)=>{if(enabled&&moved.current&&event.detail!==0){event.preventDefault();event.stopPropagation();moved.current=false;}}
 };
}
