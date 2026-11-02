"use client";
import {useMemo} from "react";
import {finalReviewProgress} from "@/lib/museum-final-review-progress";
import type {FinalReviewRecord} from "@/lib/museum-final-review-view";
function Summary({total,complete}:{total:number;complete:number}){
 const percent=total?Math.round(100*complete/total):0;
 return <><strong className="museum-progress__percent">{percent}%</strong><span>{complete} of {total} records finally reviewed</span><div className="museum-progress__bar museum-vitrine-progress"><svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><rect className="museum-vitrine-progress__done" width={percent} height="100"/></svg></div></>;
}
export function MuseumFinalReviewProgress({records,onOpen}:{records:FinalReviewRecord[]|null;onOpen:(vitrine:string)=>void}){
 const progress=useMemo(()=>records?finalReviewProgress(records):null,[records]);
 return <section className="museum-admin-panel museum-progress" aria-label="Final review progress"><h2>Final review progress</h2>{!progress?<p role="status">Loading final review progress…</p>:<><div className="museum-progress__summary"><Summary {...progress}/></div>{progress.regions.map(region=><section className="museum-progress__region" key={region.label}><h3>{region.label}</h3><div className="museum-progress__summary"><Summary {...region}/></div><div className="room-move__phase">{region.vitrines.map(v=><button type="button" key={v.code} disabled={!v.code} className="museum-admin-button museum-admin-button--secondary museum-vitrine-progress museum-progress__vitrine" onClick={()=>onOpen(v.code)} aria-label={`${v.code?"Vitrine "+v.code:"No destination"}: ${v.complete} of ${v.total} finally reviewed`}><svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><rect className="museum-vitrine-progress__done" width={v.total?100*v.complete/v.total:0} height="100"/></svg><span>{v.code?"Vitrine "+v.code:"No destination"}</span><small>{v.total?Math.round(100*v.complete/v.total):0}% · {v.complete}/{v.total}</small></button>)}</div></section>)}</>}</section>;
}
