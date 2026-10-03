"use client";
import {useEffect,useRef,type ReactNode} from "react";
import {X} from "lucide-react";
export function MuseumDetailDialog({titleId,kicker,closeLabel,onClose,children}:{titleId:string;kicker:string;closeLabel:string;onClose:()=>void;children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal()},[]);
 return <dialog ref={dialog} className="museum-modal museum-modal--profile" aria-labelledby={titleId} onClose={onClose}>
  <div className="museum-modal__header"><div className="museum-admin-kicker">{kicker}</div><button type="button" className="museum-icon-button" aria-label={closeLabel} onClick={()=>dialog.current?.close()}><X aria-hidden="true" size={18}/></button></div>
  {children}
 </dialog>;
}
