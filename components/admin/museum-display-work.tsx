"use client";
import {useEffect,useRef,useState} from "react";

export function MuseumDisplayWork({name,shelf,canEditShelf,canManage,onShelfSave,onTaskAdd}:{name:string;shelf:string|null;canEditShelf:boolean;canManage:boolean;onShelfSave:(value:string)=>Promise<void>;onTaskAdd:(text:string)=>Promise<void>}){
 const [shelfValue,setShelfValue]=useState(shelf??""),[task,setTask]=useState("");
 const [saving,setSaving]=useState<"shelf"|"task"|null>(null),[error,setError]=useState(""),[message,setMessage]=useState("");
 const previousShelf=useRef(shelf??"");
 useEffect(()=>{const previous=previousShelf.current;previousShelf.current=shelf??"";setShelfValue(value=>value===previous?shelf??"":value);},[shelf]);
 async function save(kind:"shelf"|"task"){
  if(saving)return;setSaving(kind);setError("");setMessage("");
  try{if(kind==="shelf"){await onShelfSave(shelfValue.trim());setMessage("Shelf saved.");}else{await onTaskAdd(task.trim());setTask("");setMessage("To-do added.");}}
  catch(error){setError(error instanceof Error?error.message:"Could not save. Your details are still here.");}finally{setSaving(null);}
 }
 return <details className="museum-display-work"><summary>{shelf?`Shelf ${shelf} · `:""}Shelf & to-do</summary>
  <form className="museum-display-work__form" onSubmit={event=>{event.preventDefault();void save("shelf");}}><label className="admin-field"><span>Final shelf</span><input aria-label={`Final shelf for ${name}`} maxLength={100} value={shelfValue} onChange={event=>setShelfValue(event.target.value)} disabled={!canManage||!canEditShelf||saving!==null}/></label><button type="submit" className="museum-admin-button museum-admin-button--secondary" disabled={!canManage||!canEditShelf||saving!==null||shelfValue.trim()===(shelf??"")}>{saving==="shelf"?"Saving…":"Save shelf"}</button></form>
  {!canEditShelf?<small>Mark placed to record the final shelf.</small>:null}
  <form className="museum-display-work__form" onSubmit={event=>{event.preventDefault();void save("task");}}><label className="admin-field"><span>Add a to-do</span><input aria-label={`To-do for ${name}`} maxLength={500} value={task} onChange={event=>setTask(event.target.value)} disabled={!canManage||saving!==null}/></label><button type="submit" className="museum-admin-button museum-admin-button--secondary" disabled={!canManage||saving!==null||!task.trim()}>{saving==="task"?"Saving…":"Add"}</button></form>
  {error?<p role="alert">{error}</p>:message?<small role="status">{message}</small>:null}
 </details>;
}
