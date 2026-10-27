"use client";

import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";

type Props = {userId?: string; username?: string};
export function MuseumAssistantAccountForm({userId, username}: Props) {
 const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState("");
 const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  const form=event.currentTarget,data=new FormData(form);
  setError("");setSaved("");setFieldErrors({});setBusy(true);
  try {
   const body=userId?{password:data.get("password")}:{username:data.get("username"),name:data.get("name"),password:data.get("password")};
   const response=await fetch(userId?`/api/admin/local-accounts/${userId}/password`:"/api/admin/local-accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok){setFieldErrors(result.fieldErrors??{});setError(result.error||"Could not save the account. Try again.");const invalid=form.elements.namedItem(Object.keys(result.fieldErrors??{})[0]??"");if(invalid instanceof HTMLElement)invalid.focus();return;}
   form.reset();setSaved(userId?"Password reset. Previous sessions have ended.":`Account created for ${result.username}. Share the username and password privately.`);router.refresh();
  }catch{setError("Could not reach the server. Check your connection and try again.");}
  finally{setBusy(false);}
 }
 const prefix=userId??"new-assistant";
 return <form onSubmit={submit} className="admin-settings-form admin-settings-form--stacked">
  {!userId?<><label className="admin-field" htmlFor={`${prefix}-name`}><span>Name · Optional</span><input id={`${prefix}-name`} name="name" autoComplete="name" maxLength={100} disabled={busy}/></label>
  <label className="admin-field" htmlFor={`${prefix}-username`}><span>Username</span><input id={`${prefix}-username`} name="username" autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={48} required disabled={busy} aria-invalid={!!fieldErrors.username} aria-describedby={`${prefix}-username-hint`}/><small id={`${prefix}-username-hint`}>{fieldErrors.username||"3–48 characters. Start with a letter; use letters, numbers, dots, hyphens or underscores."}</small></label>
  <p className="admin-settings-note">Museum Assistant: browse the museum workspace and submit their own relic entries. No other editing or approval access.</p></>:<p className="admin-settings-note">Set a new password for {username}. This signs them out of all devices.</p>}
  <label className="admin-field" htmlFor={`${prefix}-password`}><span>{userId?"New password":"Password"}</span><input id={`${prefix}-password`} name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} aria-invalid={!!fieldErrors.password} aria-describedby={`${prefix}-password-hint`}/><small id={`${prefix}-password-hint`}>{fieldErrors.password||"Use at least 12 characters. A few unrelated words work well."}</small></label>
  {error?<p className="form-status form-status--error" role="alert">{error}</p>:null}
  {saved?<p className="form-status form-status--success" role="status">{saved}</p>:null}
  <div className="review-actions"><button type="submit" className="admin-form-button" disabled={busy}>{busy?"Saving…":userId?"Reset password":"Create assistant account"}</button></div>
 </form>;
}
