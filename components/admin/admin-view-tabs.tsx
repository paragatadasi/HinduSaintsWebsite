"use client";
import {useEffect,useRef} from "react";
export function AdminViewTabs<T extends string>({label,value,onChange,options,disabled=false,scrollable=false}:{label:string;scrollable?:boolean;disabled?:boolean;value:T;onChange:(value:T)=>void;options:{value:T;label:string}[]}){
 const strip=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!scrollable)return;
  const rail=strip.current,active=rail?.querySelector<HTMLElement>('[aria-current]');
  if(!rail||!active)return;
  const bounds=rail.getBoundingClientRect(),tab=active.getBoundingClientRect();
  if(tab.left<bounds.left)rail.scrollLeft-=bounds.left-tab.left;
  else if(tab.right>bounds.right)rail.scrollLeft+=tab.right-bounds.right;
 },[value,scrollable]);
 return <nav ref={strip} className={`admin-tab-strip${scrollable?" admin-tab-strip--scrollable":""}`} aria-label={label}>{options.map((option,index)=><button type="button" className="admin-tab-strip__tab" disabled={disabled} key={option.value} aria-current={option.value===value?"location":undefined} onClick={()=>onChange(option.value)} onKeyDown={event=>{
  const next=event.key==="ArrowRight"?(index+1)%options.length:event.key==="ArrowLeft"?(index+options.length-1)%options.length:event.key==="Home"?0:event.key==="End"?options.length-1:null;
  if(next===null)return;event.preventDefault();onChange(options[next].value);(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
 }}>{option.label}</button>)}</nav>;
}
