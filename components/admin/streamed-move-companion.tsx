"use client";
import {Suspense,use,useEffect,useState,type ComponentProps} from "react";
import {SpnRoomMoveCompanion} from "./spn-room-move-companion";
type Props=ComponentProps<typeof SpnRoomMoveCompanion>;
type Guides=NonNullable<Props["phaseGuides"]>;
export type GuideLoadResult={guides:Guides;error?:never}|{guides?:never;error:string};
function RemainingGuides({pending,onLoaded}:{pending:Promise<GuideLoadResult>;onLoaded:(result:GuideLoadResult)=>void}){
 const result=use(pending);
 useEffect(()=>onLoaded(result),[result,onLoaded]);
 return null;
}
export function StreamedMoveCompanion({pendingGuides,...props}:Props & {pendingGuides:Promise<GuideLoadResult>}){
 const [result,setResult]=useState<GuideLoadResult|null>(null);
 return <>{result?.error?<p role="alert">Other museum rows could not load. Refresh the page to try again; saved progress is kept.</p>:null}
 <SpnRoomMoveCompanion {...props} phaseGuides={result?.guides}/>
 <Suspense fallback={null}><RemainingGuides pending={pendingGuides} onLoaded={setResult}/></Suspense></>;
}
