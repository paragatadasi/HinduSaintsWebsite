"use client";

import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";

type MuseumOption = {id: string; name: string};
type Props = {userId?: string; username?: string; museums?: MuseumOption[]};
export function MuseumAssistantAccountForm({userId, username, museums = []}: Props) {
 const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState("");
 const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  const form=event.currentTarget,data=new FormData(form);
  setError("");setSaved("");setFieldErrors({});setBusy(true);
  try {
   const body=userId?{password:data.get("password")}:{username:data.get("username"),name:data.get("name"),password:data.get("password"),museumIds:data.getAll("museumIds")};
   const response=await fetch(userId?`/api/admin/local-accounts/${userId}/password`:"/api/admin/local-accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok){setFieldErrors(result.fieldErrors??{});setError(result.error||"Could not save the account. Try again.");const invalid=form.elements.namedItem(Object.keys(result.fieldErrors??{})[0]??"");if(invalid instanceof HTMLElement)invalid.focus();return;}
   form.reset();setSaved(userId?"Password reset. Previous sessions have ended.":`Account created for ${result.username}. Share the username and password privately.`);router.refresh();
  }catch{setError("Could not reach the server. Check your connection and try again.");}
  finally{setBusy(false);}
 }
 const prefix=userId??"new-assistant";
 return <form onSubmit={submit} className="admin-settings-form admin-settings-form--stacked">
  {!userId?<><label className="admin-field" htmlFor={`${prefix}-name`}><span>Name · Optional</span><input id={`${prefix}-name`} name="name" autoComplete="name" maxLength={100} disabled={busy} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name?`${prefix}-name-error`:undefined}/>{fieldErrors.name?<small id={`${prefix}-name-error`}>{fieldErrors.name}</small>:null}</label>
  <label className="admin-field" htmlFor={`${prefix}-username`}><span>Username</span><input id={`${prefix}-username`} name="username" autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={48} required disabled={busy} aria-invalid={!!fieldErrors.username} aria-describedby={`${prefix}-username-hint`}/><small id={`${prefix}-username-hint`}>{fieldErrors.username||"3–48 characters. Start with a letter; use letters, numbers, dots, hyphens or underscores."}</small></label>
  <p className="admin-settings-note">Museum Assistants can browse the museum, edit their team’s intake entries and check off reviewed placements in the move companion. Intake approval and plan changes remain curator-only.</p></>:<p className="admin-settings-note">Set a new password for {username}. This signs them out of all devices.</p>}
  {!userId ? <MuseumTeamFields museums={museums} disabled={busy}/> : null}
  <label className="admin-field" htmlFor={`${prefix}-password`}><span>{userId?"New password":"Password"}</span><input id={`${prefix}-password`} name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} aria-invalid={!!fieldErrors.password} aria-describedby={`${prefix}-password-hint`}/><small id={`${prefix}-password-hint`}>{fieldErrors.password||"Use at least 12 characters. A few unrelated words work well."}</small></label>
  {error?<p className="form-status form-status--error" role="alert">{error}</p>:null}
  {saved?<p className="form-status form-status--success" role="status">{saved}</p>:null}
  <div className="review-actions"><button type="submit" className="admin-form-button" disabled={busy}>{busy?"Saving…":userId?"Reset password":"Create assistant account"}</button></div>
 </form>;
}


function MuseumTeamFields({museums, selected = [], disabled}: {museums: MuseumOption[]; selected?: string[]; disabled: boolean}) {
 return <fieldset className="admin-field" disabled={disabled}><legend>Museum intake teams</legend><div className="admin-option-grid">{museums.map(museum => <label className="admin-option-toggle" key={museum.id}><input type="checkbox" name="museumIds" value={museum.id} defaultChecked={selected.includes(museum.id)}/><span>{museum.name}</span></label>)}</div><small>Members can edit one another’s drafts and submissions in these museums.</small></fieldset>;
}

export function MuseumAssistantTeamForm({userId, museums, selected}: {userId: string; museums: MuseumOption[]; selected: string[]}) {
 const router = useRouter();
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [saved, setSaved] = useState("");
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (busy) return;
  const museumIds = new FormData(event.currentTarget).getAll("museumIds");
  setBusy(true); setError(""); setSaved("");
  try {
   const response = await fetch(`/api/admin/local-accounts/${userId}/museum-team`, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({museumIds})});
   const result = await response.json();
   if (!response.ok) {setError(result.error || "Could not save team access. Try again."); return;}
   setSaved("Museum team access saved."); router.refresh();
  } catch {setError("Could not reach the server. Check your connection and try again.");}
  finally {setBusy(false);}
 }
 return <form onSubmit={submit} className="admin-settings-form admin-settings-form--stacked"><MuseumTeamFields key={selected.join(",")} museums={museums} selected={selected} disabled={busy}/>{error ? <p className="form-status form-status--error" role="alert">{error}</p> : null}{saved ? <p className="form-status form-status--success" role="status">{saved}</p> : null}<div className="review-actions"><button type="submit" className="admin-form-button" disabled={busy}>{busy ? "Saving…" : "Save team access"}</button></div></form>;
}
