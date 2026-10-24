"use client";
import {useRef, useState} from "react";
import {ChevronDown} from "lucide-react";
import {answerEffect, answerLabels, allowedDecisions, statusLabels, type CuratorQuestion, type QuestionAnswer, type QuestionStatus} from "@/lib/museum-questionnaire-domain";
import type {MuseumSaintProfile as Profile} from "@/lib/museum-saint-profile";


type Actions = {
  load: () => Promise<CuratorQuestion[]>;
  save: (input: QuestionAnswer) => Promise<{error: string}>;
  profile: (input: {caseId: string; revision: string; saintId: string}) => Promise<Profile | null>;
};
export function MuseumQuestionnaire({initial, canEdit, actions}: {initial: CuratorQuestion[]; canEdit: boolean; actions: Actions}) {
  const [questions, setQuestions] = useState(initial);
  const feedback = useRef<HTMLParagraphElement>(null);
  const [group, setGroup] = useState<CuratorQuestion["reviewGroup"]>("inventory");
  const [filter, setFilter] = useState<QuestionStatus | "all">("awaiting_curator");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const visible = questions.filter(q => q.reviewGroup === group && (filter === "all" || q.status === filter));
  async function reload() {
    setLoading(true);
    try { setQuestions(await actions.load()); setMessage("Questions refreshed."); }
    catch { setMessage("Questions could not be refreshed. Try again."); }
    finally { setLoading(false); }
  }
  return <details className="museum-questionnaire museum-nav-disclosure">
    <summary><span><span className="eyebrow">Curator review</span><span className="museum-questionnaire__title">A few collection checks</span><span className="muted">{questions.filter(q => q.reviewGroup === "inventory" && q.status === "awaiting_curator").length} collection checks awaiting an answer</span></span><ChevronDown aria-hidden="true"/></summary>
    <div className="museum-questionnaire__body">
      <p>Help us find the missing clues needed for a preliminary section. A teacher, tradition or place associated with the saint may be enough.</p>
      <div className="museum-questionnaire__groups" role="group" aria-label="Review purpose">{(["inventory", "conflict", "optional"] as const).map(value => <button key={value} type="button" aria-pressed={group === value} onClick={() => {setGroup(value); setFilter("awaiting_curator"); setMessage("");}}>{({inventory:"Collection checks", conflict:"Conflicting records", optional:"Optional research"})[value]} <span>{questions.filter(q => q.reviewGroup === value && q.status === "awaiting_curator").length}</span></button>)}</div>
      <p>{group === "inventory" ? "These blank rows may represent items that need a destination. Start by telling us whether an item exists." : group === "conflict" ? "These records contain conflicting identities. Regional placement and identity verification are separate; existing review holds remain." : "These records already have enough geographic context for preliminary planning. Add details if you know them; you can leave this research for later."}</p>
      <div className="review-actions"><label>Show answers<select value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="all">All answers ({questions.filter(q => q.reviewGroup === group).length})</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label} ({questions.filter(q => q.reviewGroup === group && q.status === value).length})</option>)}</select></label><button className="museum-admin-button museum-admin-button--secondary" disabled={loading} onClick={reload}>{loading ? "Refreshing…" : "Refresh questions"}</button></div>
      <p role="status" tabIndex={-1} ref={feedback}>{message}</p>
      {!visible.length ? <p>No questions in this group. Saved answers remain available in the other groups.</p> : visible.map(q => <Question key={q.caseId + q.revision} item={q} canEdit={canEdit} actions={actions} onSaved={async (outcome) => {setQuestions(await actions.load()); setMessage(outcome + " Choose All answers to revisit it."); feedback.current?.focus();}}/>)}
    </div>
  </details>;
}
function Question({item, canEdit, actions, onSaved}: {item: CuratorQuestion; canEdit: boolean; actions: Actions; onSaved: (outcome: string) => Promise<void>}) {
  const [decision, setDecision] = useState<QuestionAnswer["decision"] | "">("");
  const [note, setNote] = useState("");
  const [identification, setIdentification] = useState("");
  const [referral, setReferral] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("");
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
      try { await onSaved(decision === "unknown" || decision === "unlabelled" ? "Saved for research. No further details are needed from you now." : decision === "onsite" ? "Saved for an on-site check. Return when you have the label." : decision === "reopen" ? "Question reopened." : "Answer saved for review."); } catch { setError("Your answer was saved, but the list could not refresh. Use Refresh questions to see its new status."); }
    } catch {setError("The save could not be confirmed. Refresh questions to check its history before trying again.");}
    finally {setBusy(false);}
  }
  async function compare(saintId: string) {
    setSelectedProfile(saintId); setProfileBusy(true); setProfileError(""); setProfile(null);
    try {const value = await actions.profile({caseId: item.caseId, revision: item.revision, saintId}); setProfile(value); if (!value) setProfileError("This comparison profile is no longer available.");}
    catch {setProfileError("The profile could not load. Refresh questions and try again.");}
    finally {setProfileBusy(false);}
  }
  return <details className="museum-questionnaire__question museum-nav-disclosure">
    <summary><span><strong>{item.title}</strong><span className="muted">{statusLabels[item.status]}</span></span><ChevronDown aria-hidden="true"/></summary>
    <div className="museum-questionnaire__body">
      <h3>{item.question}</h3><p>{item.context}</p><div className="museum-questionnaire__review"><div className="museum-questionnaire__evidence">
      <dl className="museum-saint-profile__facts"><div><dt>Name in the collection record</dt><dd>{item.sourceName || "No name recorded"}</dd></div><div><dt>Recorded museum location</dt><dd>{item.sourceLocation} · not physically confirmed</dd></div><div><dt>Relics listed</dt><dd>{item.relicDescription || "No object described"}</dd></div></dl>
      <details><summary>Collection record and research notes</summary><p>Research source captured {item.sourceCapturedAt.slice(0,10)}. Website mirror imported {item.mirrorCapturedAt?.slice(0,10) || "not available"}. The research snapshot below is preserved for this question.</p><dl className="museum-saint-profile__facts">{Object.entries(item.sourceFields).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{Array.isArray(value) ? value.join(" · ") : String(value ?? "Not recorded")}</dd></div>)}</dl></details>
      {item.candidates.length ? <details><summary>Compare possible profiles ({item.candidates.length})</summary><p>These profiles are for comparison; no match has been confirmed. Portraits show the saint, not the museum object.</p><div className="review-actions">{item.candidates.map(s => <button className="museum-admin-button museum-admin-button--secondary" key={s.id} aria-pressed={selectedProfile === s.id} disabled={profileBusy} onClick={() => compare(s.id)}>{s.name}</button>)}</div>{profileBusy ? <p role="status">Loading comparison…</p> : null}{profileError ? <p role="alert">{profileError}</p> : null}{profile ? <div className="museum-questionnaire__profile">{profile.images[0] ? <img className="museum-contents-portrait" src={profile.images[0].url} alt={profile.images[0].alt || profile.name}/> : null}<div><h4>{profile.name}</h4>{profile.facts.map(f => <p key={f.label}><strong>{f.label}:</strong> {f.value}</p>)}<p>{profile.description}</p></div></div> : null}</details> : null}
      </div><div className="museum-questionnaire__answer">{item.blockedReason ? <p role="alert">{item.blockedReason} Previous answers remain in the history below.</p> : !canEdit ? <p>You can review these questions. Museum editing permission is required to save an answer.</p> : <form onSubmit={e => {e.preventDefault(); void submit();}} className="museum-questionnaire__form">
        <fieldset disabled={busy || saved}><legend>Your answer</legend>{allowedDecisions(item.blankEntry).filter(d => d !== "reopen" || item.status !== "awaiting_curator").map(d => <label className="museum-questionnaire__choice" key={d}><input type="radio" name={item.caseId} value={d} checked={decision === d} onChange={() => setDecision(d)}/><span>{d === "recognized" ? item.recognitionLabel : answerLabels[d]}</span></label>)}
        {decision === "recognized" ? <label>{item.identificationPrompt}<input list={item.caseId + "-names"} required maxLength={500} value={identification} onChange={e => setIdentification(e.target.value)}/><datalist id={item.caseId + "-names"}>{item.suggestedNames.map(name => <option key={name} value={name}/>)}</datalist></label> : null}
        {decision === "referral" ? <label>Person or role to ask (optional)<input maxLength={500} value={referral} onChange={e => setReferral(e.target.value)}/></label> : null}
        <details><summary>Add a note (optional)</summary><label>Note or evidence<textarea rows={3} maxLength={3000} value={note} onChange={e => setNote(e.target.value)}/></label></details>
        {decision ? <p className="museum-questionnaire__effect">{answerEffect(decision)}</p> : null}
        <button className="museum-admin-button" disabled={!decision || (decision === "recognized" && !identification.trim())}>{busy ? "Saving…" : saved ? "Answer saved" : decision === "reopen" ? "Reopen question" : "Save answer"}</button></fieldset>
      </form>}
      {error ? <p role="alert">{error}</p> : null}</div></div>
      {item.history.length ? <details><summary>Answer history ({item.history.length})</summary><ol className="museum-questionnaire__history">{item.history.map(h => <li key={h.id}><strong>{answerLabels[h.decision]}</strong><p>{h.at.slice(0,10)} · {h.at.slice(11,16)} UTC</p>{h.identification ? <p>{h.identification}</p> : null}{h.referral ? <p>Referral: {h.referral}</p> : null}{h.note ? <p>{h.note}</p> : null}</li>)}</ol></details> : null}
    </div>
  </details>;
}
