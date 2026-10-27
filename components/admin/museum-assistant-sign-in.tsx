"use client";

import {useState, type FormEvent} from "react";

export function MuseumAssistantSignIn(){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setError("");
  const data=new FormData(event.currentTarget);
  try{
   const response=await fetch("/api/auth/local-sign-in",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password")})});
   const result=await response.json();
   if(!response.ok){setError(result.error||"Could not sign in. Check your username and password.");setBusy(false);return;}
   window.location.assign("/museumadmin/overview");
  }catch{setError("Could not reach the server. Check your connection and try again.");setBusy(false);}
 }
 return <form onSubmit={submit} className="admin-auth__email-form">
  <label className="admin-field" htmlFor="assistant-username"><span>Username</span><input id="assistant-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={48} disabled={busy} aria-describedby={error?"assistant-signin-error":undefined}/></label>
  <label className="admin-field" htmlFor="assistant-password"><span>Password</span><input id="assistant-password" name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={busy} aria-describedby={error?"assistant-signin-error":undefined}/></label>
  {error?<p id="assistant-signin-error" className="form-status form-status--error" role="alert">{error}</p>:null}
  <button type="submit" className="admin-form-button admin-auth__submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
  <p className="admin-settings-note">Forgot your password? Ask a site admin to reset it.</p>
 </form>;
}
