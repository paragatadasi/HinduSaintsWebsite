"use client";
import {useEffect,useLayoutEffect,useRef,type RefObject,type PointerEvent,type MouseEvent} from "react";
import {createMuseumTreeTouch} from "@/lib/museum-tree-touch";
import type {TreePoint} from "@/lib/museum-tree-camera";
export function useMuseumTreeTouch(viewport:RefObject<HTMLDivElement|null>,zoom:number,setZoom:(zoom:number)=>void,enabled:boolean){
 const current=useRef({zoom,setZoom});current.current={zoom,setZoom};
 const pending=useRef<TreePoint|null>(null);
 const gesture=useRef<ReturnType<typeof createMuseumTreeTouch>|null>(null);
 if(!gesture.current)gesture.current=createMuseumTreeTouch({
  read:()=>({scroll:{x:viewport.current?.scrollLeft||0,y:viewport.current?.scrollTop||0},zoom:current.current.zoom}),
  pan:point=>{if(viewport.current){viewport.current.scrollLeft=point.x;viewport.current.scrollTop=point.y;}},
  pinch:(next,point)=>{pending.current=point;current.current.setZoom(next);if(next===current.current.zoom&&viewport.current){viewport.current.scrollLeft=point.x;viewport.current.scrollTop=point.y;pending.current=null;}}
 });
 useEffect(()=>{if(!enabled)gesture.current?.reset();return()=>gesture.current?.reset();},[enabled]);
 useLayoutEffect(()=>{const view=viewport.current;if(view&&pending.current){view.scrollLeft=pending.current.x;view.scrollTop=pending.current.y;pending.current=null;}},[zoom,viewport]);
 const position=(event:PointerEvent<HTMLDivElement>)=>{const box=event.currentTarget.getBoundingClientRect();return {x:event.clientX-box.left,y:event.clientY-box.top};};
 return {
  onPointerDown:(event:PointerEvent<HTMLDivElement>)=>{if(enabled&&event.pointerType!=="mouse")gesture.current!.down(event.pointerId,position(event));},
  onPointerMove:(event:PointerEvent<HTMLDivElement>)=>{if(enabled&&gesture.current!.move(event.pointerId,position(event))){event.preventDefault();if(!event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.setPointerCapture(event.pointerId);}},
  onPointerUp:(event:PointerEvent<HTMLDivElement>)=>gesture.current!.end(event.pointerId),
  onPointerCancel:(event:PointerEvent<HTMLDivElement>)=>gesture.current!.end(event.pointerId),
  onLostPointerCapture:(event:PointerEvent<HTMLDivElement>)=>gesture.current!.lostCapture(event.pointerId,event.target===event.currentTarget),
  onClickCapture:(event:MouseEvent<HTMLDivElement>)=>{if(enabled&&event.detail!==0&&gesture.current!.suppressClick()){event.preventDefault();event.stopPropagation();}}
 };
}
