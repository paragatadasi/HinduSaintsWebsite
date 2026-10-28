"use client";
export function AdminViewTabs<T extends string>({label,value,onChange,options,disabled=false}:{label:string;disabled?:boolean;value:T;onChange:(value:T)=>void;options:{value:T;label:string}[]}){
 return <nav className="admin-tab-strip" aria-label={label}>{options.map((option,index)=><button type="button" className="admin-tab-strip__tab" disabled={disabled} key={option.value} aria-current={option.value===value?"location":undefined} onClick={()=>onChange(option.value)} onKeyDown={event=>{
  const next=event.key==="ArrowRight"?(index+1)%options.length:event.key==="ArrowLeft"?(index+options.length-1)%options.length:event.key==="Home"?0:event.key==="End"?options.length-1:null;
  if(next===null)return;event.preventDefault();onChange(options[next].value);(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
 }}>{option.label}</button>)}</nav>;
}
