"use client";
import {useRef} from "react";
import type {ReactNode} from "react";

// Pointer capture keeps desktop dragging reliable without interfering with touch scrolling.
// Clicking/keyboard selection remains the equivalent accessible action.
export function MuseumSectionDragButton({children,section,selected,disabled,canDrag,onSelect,onDrop,onHover}:{
 children:ReactNode;section:string;selected:boolean;disabled:boolean;canDrag:boolean;
 onSelect:()=>void;onDrop:(vitrine:string,section:string)=>void;onHover:(vitrine:string|null)=>void;
}){
 const gesture=useRef<{x:number;y:number;dragged:boolean}|null>(null);
 const suppressClick=useRef(false);
 const targetAt=(element:HTMLElement,x:number,y:number)=>{
  const target=document.elementFromPoint(x,y)?.closest<HTMLElement>("[data-museum-vitrine]");
  return target&&element.closest(".museum-planner")?.contains(target)?target.dataset.museumVitrine??null:null;
 };
 return <button type="button" className="museum-planner__section" data-draggable={canDrag} aria-pressed={selected} disabled={disabled}
  onPointerDown={event=>{suppressClick.current=false;if(!canDrag||disabled||event.pointerType!=="mouse"||event.button!==0)return;gesture.current={x:event.clientX,y:event.clientY,dragged:false};event.currentTarget.setPointerCapture(event.pointerId);}}
  onPointerMove={event=>{const current=gesture.current;if(!current)return;if(Math.hypot(event.clientX-current.x,event.clientY-current.y)>8)current.dragged=true;if(current.dragged)onHover(targetAt(event.currentTarget,event.clientX,event.clientY));}}
  onPointerUp={event=>{const current=gesture.current;gesture.current=null;onHover(null);if(!current?.dragged)return;suppressClick.current=true;const vitrine=targetAt(event.currentTarget,event.clientX,event.clientY);if(vitrine!==null)onDrop(vitrine,section);}}
  onPointerCancel={()=>{gesture.current=null;onHover(null);}}
  onLostPointerCapture={()=>{gesture.current=null;onHover(null);}}
  onClick={()=>{if(!suppressClick.current)onSelect();suppressClick.current=false;}}>{children}</button>;
}
