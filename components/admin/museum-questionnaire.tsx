"use client";
import {useState} from "react";
import {ChevronDown} from "lucide-react";
import {answerEffect, answerLabels, allowedDecisions, statusLabels, type CuratorQuestion, type QuestionAnswer, type QuestionStatus} from "@/lib/museum-questionnaire-domain";
import type {MuseumSaintProfile as Profile} from "@/lib/museum-saint-profile";
import {MuseumSaintProfile} from "./museum-saint-profile";

type Actions = {
  load: () => Promise<CuratorQuestion[]>;
  save: (input: QuestionAnswer) => Promise<{error: string}>;
  profile: (input: {caseId: string; revision: string; saintId: string}) => Promise<Profile | null>;
};
export function MuseumQuestionnaire({initial, canEdit, actions}: {initial: CuratorQuestion[]; canEdit: boolean; actions: Actions}) {
  const [questions, setQuestions] = useState(initial);
  const [filter, setFilter] = useState<QuestionStatus | "all">("awaiting_curator");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const visible = questions.filter(q => filter === "all" || q.status === filter);
  async function reload() {
    setLoading(true);
    try { setQuestions(await actions.load()); setMessage("Questions refreshed."); }
    catch { setMessage("Questions could not be refreshed. Try again."); }
    finally { setLoading(false); }
  }
  return <details className="museum-questionnaire museum-nav-disclosure">
    <summary><span><span className="eyebrow">Curator review</span><span className="museum-questionnaire__title">Help identify these records</span><span className="muted">{questions.filter(q => q.status === "awaiting_curator").length} questions awaiting a curator</span></span><ChevronDown aria-hidden="true"/></summary>
    <div className="museum-questionnaire__body">
      <p>These are source-record questions, not a count of saints or relics. Your answers help the research team; they do not change identities, proposals or physical locations.</p>
      <div className="review-actions"><label>Show questions<select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="all">All questions ({questions.length})</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label} ({questions.filter(q => q.status === value).length})</option>)}</select></label><button className="museum-admin-button museum-admin-button--secondary" disabled={loading} onClick={reload}>{loading ? "Refreshing…" : "Refresh questions"}</button></div>
      <p role="status">{message}</p>
      {!visible.length ? <p>No questions in this group. Saved answers remain available in the other groups.</p> : visible.map(q => <Question key={q.caseId + q.revision} item={q} canEdit={canEdit} actions={actions} onSaved={async () => {setQuestions(await actions.load()); setMessage("Answer saved. Find it in its new group or under All questions.");}}/>)}
    </div>
  </details>;
}
function Question({item, canEdit, actions, onSaved}: {item: CuratorQuestion; canEdit: boolean; actions: Actions; onSaved: () => Promise<void>}) {
  const [decision, setDecision] = useState<QuestionAnswer["decision"] | "">("");
  const [note, setNote] = useState("");
  const [identification, setIdentification] = useState("");
  const [referral, setReferral] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit() {
    if (!decision) return;
    setBusy(true); setError("");
    try {
      const result = await actions.save({museumId: "museum-spn", caseId: item.caseId, revision: item.revision, decision, note, identification: decision === "recognized" ? identification : "", referral: decision === "referral" ? referral : ""});
      if (result.error) {setError(result.error); return;}
      setSaved(true);
      try { await onSaved(); } catch { setError("Your answer was saved, but the list could not refresh. Use Refresh questions to see its new status."); }
    } catch {setError("The save could not be confirmed. Refresh questions to check its history before trying again.");}
    finally {setBusy(false);}
  }
  async function compare(saintId: string) {
    setProfileBusy(true); setProfileError(""); setProfile(null);
    try {const value = await actions.profile({caseId: item.caseId, revision: item.revision, saintId}); setProfile(value); if (!value) setProfileError("This comparison profile is no longer available.");}
    catch {setProfileError("The profile could not load. Refresh questions and try again.");}
    finally {setProfileBusy(false);}
  }
  return <details className="museum-questionnaire__question museum-nav-disclosure">
    <summary><span><strong>{item.title}</strong><span className="muted">{statusLabels[item.status]}</span></span><ChevronDown aria-hidden="true"/></summary>
    <div className="museum-questionnaire__body">
      <h3>{item.question}</h3><p>{item.context}</p>
      <dl className="museum-saint-profile__facts"><div><dt>Source label</dt><dd>{item.sourceName || "No name recorded"}</dd></div><div><dt>Source location clue</dt><dd>{item.sourceLocation} · not physically confirmed</dd></div><div><dt>Relic description in source</dt><dd>{item.relicDescription || "No object described"}</dd></div></dl>
      <details><summary>Source evidence and dates</summary><p>Research source captured {item.sourceCapturedAt.slice(0,10)}. Website mirror imported {item.mirrorCapturedAt?.slice(0,10) || "not available"}. The research snapshot below is preserved for this question.</p><dl className="museum-saint-profile__facts">{Object.entries(item.sourceFields).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{Array.isArray(value) ? value.join(" · ") : String(value ?? "Not recorded")}</dd></div>)}</dl></details>
      {item.candidates.length ? <details><summary>Compare website profiles ({item.candidates.length})</summary><p>Comparison only: none is an approved match. A profile portrait is not a photograph of the museum object.</p><div className="review-actions">{item.candidates.map(s => <button className="museum-admin-button museum-admin-button--secondary" key={s.id} disabled={profileBusy} onClick={() => compare(s.id)}>{s.name}</button>)}</div>{profileBusy ? <p role="status">Loading comparison…</p> : null}{profileError ? <p role="alert">{profileError}</p> : null}{profile ? <MuseumSaintProfile profile={profile} titleId={item.caseId + "-profile"}/> : null}</details> : null}
      {item.blockedReason ? <p role="alert">{item.blockedReason} Previous answers remain in the history below.</p> : !canEdit ? <p>You can review these questions. Museum editing permission is required to save an answer.</p> : <form onSubmit={e => {e.preventDefault(); void submit();}} className="museum-questionnaire__form">
        <fieldset disabled={busy || saved}><legend>What can you tell us?</legend>{allowedDecisions(item.blankEntry).filter(d => d !== "reopen" || item.status !== "awaiting_curator").map(d => <label className="museum-questionnaire__choice" key={d}><input type="radio" name={item.caseId} value={d} checked={decision === d} onChange={() => setDecision(d)}/><span>{answerLabels[d]}</span></label>)}
        {decision === "recognized" ? <label>Name or identifying details<input required maxLength={500} value={identification} onChange={e => setIdentification(e.target.value)}/></label> : null}
        {decision === "referral" ? <label>Person or role to ask (optional)<input maxLength={500} value={referral} onChange={e => setReferral(e.target.value)}/></label> : null}
        <label>Note or evidence (optional)<textarea rows={3} maxLength={3000} value={note} onChange={e => setNote(e.target.value)}/></label>
        {decision ? <p className="museum-questionnaire__effect">{answerEffect(decision)}</p> : null}
        <button className="museum-admin-button" disabled={!decision || (decision === "recognized" && !identification.trim())}>{busy ? "Saving…" : saved ? "Answer saved" : decision === "reopen" ? "Reopen question" : "Save answer"}</button></fieldset>
      </form>}
      {error ? <p role="alert">{error}</p> : null}
      {item.history.length ? <details><summary>Answer history ({item.history.length})</summary><ol className="museum-questionnaire__history">{item.history.map(h => <li key={h.id}><strong>{answerLabels[h.decision]}</strong><p>{h.at.slice(0,10)} · {h.at.slice(11,16)} UTC</p>{h.identification ? <p>{h.identification}</p> : null}{h.referral ? <p>Referral: {h.referral}</p> : null}{h.note ? <p>{h.note}</p> : null}</li>)}</ol></details> : null}
    </div>
  </details>;
}
