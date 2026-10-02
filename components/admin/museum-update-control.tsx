"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewWorkflow } from "@/components/admin/review-ui";
type Job = { id:string; status:string; progress:string; createdAt:string; completedAt:string|null; summary:Record<string,number>|null };
export function MuseumUpdateControl({ canRun }: { canRun:boolean }) {
  const router = useRouter(); const [jobs,setJobs] = useState<Job[]>([]); const [error,setError] = useState("");
  const [busy,setBusy] = useState(false); const completed = useRef<string|null>(null);
  useEffect(() => {
    let alive=true;
    async function poll() {
      try { const response=await fetch("/api/admin/museum/updates",{cache:"no-store"}); if(!response.ok) throw Error("Could not read update status.");
        const data=await response.json(); if(!alive)return; setJobs(data.jobs);
        const latest=data.jobs[0] as Job|undefined;
        if(latest && ["queued","running"].includes(latest.status)) completed.current="waiting";
        if(latest?.status==="completed" && completed.current!==latest.id) { if(completed.current!==null)router.refresh(); completed.current=latest.id; }
      } catch { if(alive)setError("Status unavailable. Refresh the page to check before retrying."); }
    }
    void poll(); const interval=setInterval(poll,4000); return ()=>{alive=false;clearInterval(interval);};
  },[router]);
  async function start(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);setError("");const form=event.currentTarget;const password=String(new FormData(form).get("password")||"");
    try { const response=await fetch("/api/admin/museum/updates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
      const data=await response.json();if(!response.ok)throw Error(data.error);form.reset();completed.current="waiting";
      router.refresh();
    } catch(error) {setError(error instanceof Error?error.message:"Could not start update.");} finally {setBusy(false);}
  }
  const active=jobs.some(j=>["queued","running"].includes(j.status));
  return <ReviewWorkflow eyebrow="Source Data" title="Check for museum updates">
    <p>Refresh SPN source records and display clear vitrine matches. Uncertain matches go to review. Reviewed saints and relic placements are preserved.</p>
    {canRun ? <form onSubmit={start} className="admin-stack">
      <label>Sensitive-action password<input name="password" type="password" autoComplete="off" required maxLength={256}/></label>
      <button type="submit" className="admin-form-button" disabled={busy||active}>{busy||active?"Update in progress":"Check for museum updates"}</button>
    </form>:<p>An administrator with import permission can start an update.</p>}
    {error?<p role="alert">{error}</p>:null}
    <div aria-live="polite">{jobs.slice(0,3).map(job=><div key={job.id}>
      <p><strong>{job.status}</strong> - {job.progress} <time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleString()}</time></p>
      {job.summary?<p>{job.summary.updated} saint locations updated &middot; {job.summary.unchanged} unchanged &middot; {job.summary.hidden} no longer displayed &middot; {job.summary.awaitingReview} source rows awaiting review. Read {job.summary.saintsRead} Saints and {job.summary.relicsRead} Relics.</p>:null}
      {job.status==="interrupted"?<p>This run was interrupted. A new check can safely retry it.</p>:null}
    </div>)}</div>
  </ReviewWorkflow>;
}
