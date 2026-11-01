"use client";
import {createContext,useContext,useState,type ReactNode} from "react";
import {createMuseumReadCache} from "@/lib/museum-client-reads";
const Context=createContext<ReturnType<typeof createMuseumReadCache>|null>(null);
export function MuseumReadProvider({children}:{children:ReactNode}){
 const [cache]=useState(()=>createMuseumReadCache());return <Context.Provider value={cache}>{children}</Context.Provider>;
}
export function useMuseumReads(){
 const shared=useContext(Context);const [local]=useState(()=>createMuseumReadCache());return shared??local;
}
