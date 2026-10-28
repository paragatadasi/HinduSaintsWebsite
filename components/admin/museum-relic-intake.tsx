"use client";
import { intakeFieldsEqual, intakeRelicPayload, intakeRelicsEqual } from "@/lib/museum-intake-fields";
import { AdminViewTabs } from "@/components/admin/admin-view-tabs";
import { useEffect, useRef, useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
type Fields = {
    saintName: string;
    relicDescription?: string;
    saintPlaceRaw?: string;
    birthDateRaw?: string;
    samadhiDateRaw?: string;
    broughtByRaw?: string;
};
type PhotoKind = "relic" | "saint_portrait" | "bio_document" | "relic_document";
type Relic = { id: string; relicDescription: string; broughtByRaw?: string; relicPlaceRaw?: string; additionalSaintsRaw?: string };
const newRelic = (): Relic => ({ id: crypto.randomUUID(), relicDescription: "", broughtByRaw: "" });
type View = "intake" | "entries" | "team" | "review";
type Entry = {
    id: string;
    version: number;
    createdById: string;
    creatorDisplayName: string;
    canEdit: boolean;
    relics: Relic[];
    status: string;
    fields: Fields;
    reviewNote?: string | null;
    media: {
        id: string;
        kind: PhotoKind;
        relicId?: string | null;
        url: string;
    }[];
    deliveries: {
        target: string;
        reviewedVersion?: number;
        status: string;
    }[];
};
const blank: Fields = { saintName: "", relicDescription: "", saintPlaceRaw: "", birthDateRaw: "", samadhiDateRaw: "", broughtByRaw: "" };
const statusNames: Record<string, string> = { draft: "Draft", submitted: "Awaiting review", needs_changes: "Needs correction", approved: "Approved" };
const deliveryNames: Record<string, string> = { blocked_configuration: "Setup pending", queued: "Queued", sending: "Sending", succeeded: "Delivered", failed: "Delivery failed", unknown: "Check delivery result" };
class RequestError extends Error {
    constructor(message: string, public status: number) { super(message); }
}
async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const response = await fetch(`/api/admin/museum-intake${path}`, { method, cache: "no-store", headers: body instanceof FormData ? undefined : body ? { "Content-Type": "application/json" } : undefined, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => null);
    if (!response.ok)
        throw new RequestError(typeof data?.error === "string" ? data.error : "Could not save. Please try again.", response.status);
    if (!data)
        throw new RequestError("Could not read the response. Reload to check whether your entry saved.", 502);
    return data as T;
}
export function MuseumRelicIntake({ museumId, canReview, canTeam, initialView, userId, initialRelicId }: {
    museumId: string;
    canReview: boolean;
    canTeam: boolean;
    initialView: View;
    userId: string;
    initialRelicId: string;
}) {
    const [view, setView] = useState<View>(initialView);
    const reviewMode = view === "review";
    const [returnView, setReturnView] = useState<"entries" | "team">("entries");
    const scope = reviewMode ? "" : view === "team" ? "&scope=team" : "&scope=mine";
    const [theme, setTheme] = useState("cream");
    const [relics, setRelics] = useState<Relic[]>([{id:initialRelicId,relicDescription:"",broughtByRaw:""}]);
    const [correcting, setCorrecting] = useState(false);
    useEffect(() => { try { setTheme(localStorage.getItem("museum-intake-theme") || "cream"); } catch {} }, []);
    function appearance(next: string) { setTheme(next); try { localStorage.setItem("museum-intake-theme", next); } catch {} }
    const [entries, setEntries] = useState<Entry[]>([]), [entry, setEntry] = useState<Entry | null>(null), [fields, setFields] = useState<Fields>(blank);
    const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [message, setMessage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({}), [decision, setDecision] = useState(""), [saintId, setSaintId] = useState(""), [reviewNote, setReviewNote] = useState("");
    const [cursor, setCursor] = useState<string | null>(null);
    const [activity, setActivity] = useState("");
    const [retryPhotos, setRetryPhotos] = useState<Record<string, File>>({});
    const [conflict, setConflict] = useState(false);
    const requestId = useRef("");
    const form = useRef<HTMLFormElement>(null);
    const pending = useRef(false);
    const reviewEntries = entries.filter(item => item.status !== "draft");
    const drafts = entries.filter(item => item.status === "draft");
    const queueEntries = reviewMode ? reviewEntries : view === "team" ? entries : entries.filter(item => item.createdById === userId);
    function queueItem(item: Entry) { return <button type="button" key={item.id} className="museum-intake__queue-item" disabled={busy} onClick={() => perform(async () => {setActivity("Opening entry…");open(await request<Entry>(`/${item.id}`));})}><strong>{item.fields.saintName || "Unnamed saint"}</strong><small>{item.relics.length} {item.relics.length === 1 ? "relic" : "relics"} · {statusNames[item.status] ?? item.status}</small>{view === "team" ? <small>Added by {item.creatorDisplayName}</small> : null}<span>{reviewMode || !item.canEdit ? "Open entry" : item.status === "draft" ? "Continue" : "Make corrections"} →</span></button>; }
    const editable = !entry || (entry.canEdit && (!reviewMode || entry.status === "draft" || entry.status === "needs_changes"));
    useEffect(() => { let active = true; setLoading(true); setEntries([]); setCursor(null); request<{
        entries: Entry[];
        nextCursor: string | null;
    }>(`?museumId=${encodeURIComponent(museumId)}${scope}`).then(data => { if (active) {
        setEntries(data.entries);
        setCursor(data.nextCursor);
    } }).catch(() => { if (active)
        setMessage("Could not load entries. Reload to try again."); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [museumId, scope]);
    useEffect(() => { const guard = (event: BeforeUnloadEvent) => { if (dirty || busy || Object.keys(retryPhotos).length > 0) {
        event.preventDefault();
        event.returnValue = "";
    } }; const navigate = (event: MouseEvent) => { const target = event.target; if ((dirty || busy || Object.keys(retryPhotos).length > 0) && target instanceof Element && target.closest('a[href]') && !target.closest('a[target="_blank"]') && !window.confirm("Leave without saving these edits?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.dispatchEvent(new Event("route-navigation-cancelled"));
    } }; window.addEventListener("beforeunload", guard); document.addEventListener("click", navigate, true); return () => { window.removeEventListener("beforeunload", guard); document.removeEventListener("click", navigate, true); }; }, [dirty, busy, retryPhotos]);
    function remember(next: Entry) { setEntry(next); setEntries(old => [next, ...old.filter(e => e.id !== next.id)]); }
    function open(next: Entry | null) { if ((dirty || Object.keys(retryPhotos).length > 0) && !window.confirm("Discard unsaved changes?"))
        return; if (view === "team" || view === "entries") setReturnView(view); setEntry(next); setRelics(next?.relics ?? [newRelic()]); setCorrecting(!!next && next.status !== "draft"); if (!reviewMode) setView("intake"); setFields(next?.fields ?? { ...blank }); setReviewNote(next?.reviewNote ?? ""); setDecision(""); setSaintId(""); setErrors({}); setMessage(""); setDirty(false); setConflict(false); setRetryPhotos({}); requestId.current = ""; }
    function errorAt(key: string, text: string) { setErrors(old => ({ ...old, [key]: text })); }
    async function perform(action: () => Promise<void>, field?: string) { if (pending.current)
        return; pending.current = true; setBusy(true); setMessage(""); try {
        await action();
    }
    catch (error) {
        const text = error instanceof Error ? error.message : "Could not save. Please try again.";
        if (error instanceof RequestError && error.status === 409) {
            setConflict(true);
            setMessage("This entry changed. Your edits are still here. Reload the saved entry before continuing.");
        }
        else if (field) {
            errorAt(field, text);

        }
        else
            setMessage(text);
    }
    finally {
        pending.current = false;
        setBusy(false);
        setActivity("");
    } }
    async function saveFields() { const children = relics.map(intakeRelicPayload); if (entry && !dirty && !["submitted", "approved"].includes(entry.status)) return entry; setActivity("Saving details…"); let saved: Entry; if (entry) {
        saved = await request<Entry>(`/${entry.id}`, "PATCH", { expectedVersion: entry.version, fields, relics:children });
    }
    else {
        requestId.current ||= crypto.randomUUID();
        saved = await request<Entry>("", "POST", { museumId, clientRequestId: requestId.current, fields, relics:children });
    } remember(saved);
    if (!entry && (!intakeFieldsEqual(saved.fields, fields) || !intakeRelicsEqual(saved.relics, relics))) {
      saved = await request<Entry>(`/${saved.id}`, "PATCH", {expectedVersion:saved.version,fields,relics:children}); remember(saved);
    }
    setDirty(false); return saved; }
    function validate() { const next: Record<string, string> = {}; if (!fields.saintName.trim())
        next.saintName = "Enter the saint’s name."; for (const relic of relics) { if (!relic.relicDescription.trim()) next[`description-${relic.id}`] = "Describe this relic."; if (!entry?.media.some(p => p.kind === "relic" && p.relicId === relic.id)) next[`relic-${relic.id}`] = "Add a photo of this relic."; } for (const kind of Object.keys(retryPhotos)) next[kind] = "Retry or remove the unsaved photo before submitting."; setErrors(next); const key = Object.keys(next)[0]; if (key) {
        const target = form.current?.querySelector<HTMLElement>(`[data-field="${key}"]`); target?.scrollIntoView({block:"center"}); target?.focus();
        return false;
    } return true; }
    async function upload(kind: PhotoKind, file: File, relicId?: string) { const key = relicId ? `${kind}-${relicId}` : kind; errorAt(key, ""); if (file.size > 10 * 1024 * 1024) {
        errorAt(key, "Choose an image under 10 MB.");
        return;
    } setRetryPhotos(old => ({ ...old, [key]: file }));
    await perform(async () => { const saved = dirty || !entry ? await saveFields() : entry; setMessage("Details saved. Uploading photo…"); setActivity("Uploading photo…"); const data = new FormData(); data.set("file", file); data.set("kind", kind); if (relicId) data.set("relicId", relicId); data.set("expectedVersion", String(saved.version)); try { remember(await request<Entry>(`/${saved.id}/media`, "POST", data)); } catch (error) { setMessage("Details saved. Photo not saved—retry the upload."); throw error; } setRetryPhotos(old => { const next = { ...old }; delete next[key]; return next; }); setMessage("Details and photo saved."); }, key);
    }
    async function saveAndStartNew() {
      if (Object.keys(retryPhotos).length) {
        setMessage("Retry or remove the unsaved photos before starting a new draft. Your details are still here.");
        return;
      }
      await perform(async () => {
        const saved = await saveFields();
        setEntry(null);
        setFields({...blank});
        setRelics([newRelic()]);
        setDirty(false);
        setCorrecting(false);
        setConflict(false);
        setErrors({});
        setRetryPhotos({});
        setReviewNote("");
        setDecision("");
        setSaintId("");
        setReturnView("entries");
        requestId.current = "";
        setMessage(`${saved.fields.saintName || "Entry"} saved. Ready for a new saint.`);
        window.scrollTo({top:0,behavior:"instant"});
      });
    }
    function change(key: keyof Fields, value: string) { setFields(old => ({ ...old, [key]: value })); setDirty(true); setMessage(""); errorAt(key, ""); }
    function field(key: keyof Fields, label: string, optional = false) { return <label className="museum-intake__field" key={key} htmlFor={`intake-${key}`}><span>{label}{optional ? <small> · Optional</small> : null}</span><input id={`intake-${key}`} data-field={key} value={fields[key] ?? ""} maxLength={key === "broughtByRaw" ? 500 : key === "saintPlaceRaw" ? 2000 : 300} disabled={!editable || busy} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={e => change(key, e.target.value)}/><ErrorText name={key} text={errors[key]}/></label>; }
    function photos(kind: PhotoKind, label: string, relicId?: string) {
        const key = relicId ? `${kind}-${relicId}` : kind;
        const media = entry?.media.filter(p => p.kind === kind && (relicId ? p.relicId === relicId : !p.relicId)) ?? [];
        return <section className="museum-intake__field" aria-label={label}><strong>{label}{kind !== "relic" ? <small> · Optional</small> : null}</strong><div className="intake-stack__upload-box"><div className="museum-intake__photos">{media.length ? media.map(p => <figure key={p.id}><a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={label}/></a>{editable ? <button type="button" disabled={busy || conflict} onClick={() => perform(async () => { remember(await request<Entry>(`/${entry!.id}/media/${p.id}`, "DELETE", { expectedVersion: entry!.version })); }, key)}>Remove photo</button> : null}</figure>) : <small>No photo added</small>}</div>{editable ? <div className="museum-intake__actions">{[true, false].map(camera => <label className="museum-intake__upload" key={String(camera)}>{camera ? "Take photo" : "Upload photo"}<input data-field={camera ? key : undefined} type="file" accept="image/jpeg,image/png,image/webp" capture={camera ? "environment" : undefined} disabled={busy || conflict} aria-label={`${camera ? "Take" : "Upload"} ${label.toLowerCase()}`} aria-describedby={`hint-${key}${errors[key] ? ` error-${key}` : ""}`} aria-invalid={!!errors[key]} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void upload(kind, file, relicId); }}/></label>)}</div> : null}{editable ? <small id={`hint-${key}`}>JPEG, PNG or WebP · Up to 10 MB.</small> : null}</div><ErrorText name={key} text={errors[key]}/>{retryPhotos[key] && !busy ? <div className="museum-intake__actions"><button type="button" disabled={conflict} onClick={() => upload(kind, retryPhotos[key], relicId)}>Retry photo upload</button><button type="button" onClick={() => { setRetryPhotos(old => { const next = {...old}; delete next[key]; return next; }); errorAt(key, ""); }}>Remove unsaved photo</button></div> : null}</section>;
    }
    function changeView(next: View) { if (busy || ((dirty || Object.keys(retryPhotos).length) && !window.confirm("Leave without saving these edits?"))) return; if (next === "intake") setReturnView("entries"); setView(next); setEntry(null); setFields({...blank}); setRelics([newRelic()]); setDirty(false); setRetryPhotos({}); setErrors({}); setConflict(false); setCorrecting(false); requestId.current = ""; setMessage(""); }
    return <div className="intake-stack" data-intake-theme={theme}>
      <div className="intake-stack__appearance"><span>Appearance</span>{["cream", "dark"].map(value => <button type="button" key={value} aria-pressed={theme === value} onClick={() => appearance(value)}>{value === "cream" ? "Cream" : "Dark"}</button>)}</div>
      <div className="intake-stack__main">
      <header className="intake-stack__heading"><div><p className="intake-stack__eyebrow">SPN · New arrivals</p><h1>{view === "team" ? "Team entries" : view === "entries" ? "My entries" : reviewMode ? "Curator review" : "Receive relics"}</h1>{view === "intake" ? <p>One saint. Add each relic below.</p> : null}</div>{view === "entries" || view === "team" ? <button type="button" onClick={() => changeView("intake")}>New saint</button> : view === "intake" && editable ? <button type="button" disabled={busy || conflict} onClick={() => void saveAndStartNew()}>Save &amp; start new</button> : null}</header>
      <AdminViewTabs<View> label="Relic intake" value={view} onChange={changeView} options={[{value:"intake",label:"Team intake"},{value:"entries",label:"My entries"},...(canTeam ? [{value:"team" as const,label:"Team entries"}] : []),...(canReview ? [{value:"review" as const,label:"Curator review"}] : [])]}/>
      {busy || message ? <p role="status" className="intake-stack__status">{busy ? activity || "Saving…" : message}</p> : null}
      {view !== "intake" && !entry ? <section className="intake-stack__card">{loading ? <p>Loading entries…</p> : <><p>{queueEntries.length} {queueEntries.length === 1 ? "entry" : "entries"}</p>{queueEntries.length ? queueEntries.map(queueItem) : <p>{reviewMode ? "No entries submitted for review yet." : "No entries yet."}</p>}{reviewMode ? <details><summary>Drafts ({drafts.length})</summary>{drafts.map(queueItem)}</details> : null}{cursor ? <button type="button" disabled={busy} onClick={() => perform(async () => { const data = await request<{entries:Entry[];nextCursor:string|null}>(`?museumId=${encodeURIComponent(museumId)}${scope}&cursor=${encodeURIComponent(cursor)}`);setEntries(old => [...old,...data.entries.filter(e => !old.some(saved => saved.id === e.id))]);setCursor(data.nextCursor); })}>Load more entries</button> : null}</>}</section> : <>
      {!reviewMode && entry ? <button type="button" disabled={busy} onClick={() => changeView(returnView)}>Back to {returnView === "team" ? "team entries" : "my entries"}</button> : null}
      {reviewMode ? <button type="button" disabled={busy} onClick={() => changeView("review")}>Back to review queue</button> : null}
      {conflict ? <button type="button" disabled={busy} onClick={() => perform(async () => { if (entry && window.confirm("Replace your unsaved edits with the saved entry?")) { const fresh = await request<Entry>(`/${entry.id}`);setEntry(fresh);setFields(fresh.fields);setRelics(fresh.relics);setDirty(false);setRetryPhotos({});setConflict(false);setMessage("Saved entry loaded."); } })}>Reload saved entry</button> : null}
      <form ref={form} noValidate onKeyDown={e => {if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); form.current?.requestSubmit(); }}} onSubmit={e => {e.preventDefault();if (!editable || !validate()) return;void perform(async () => {const saved = await saveFields();setActivity("Submitting for review…");const submitted = await request<Entry>(`/${saved.id}/submit`,"POST",{expectedVersion:saved.version});remember(submitted);setDirty(false);setCorrecting(false);setMessage("Submitted for curator review.");if (canReview) setView("review");else {setView(returnView);setEntry(null);}window.scrollTo({top:0,behavior:"instant"});});}}>
      <section className="intake-stack__card"><div className="intake-stack__heading"><div><p className="intake-stack__eyebrow">Shared details</p><h2>Saint</h2></div><small>Used for every relic</small></div>{entry?.status === "needs_changes" ? <p>{entry.reviewNote}</p> : null}{correcting && !reviewMode ? <p>Submit your changes for curator review when ready.</p> : null}{field("saintName","Name of saint")}<details className="intake-stack__optional"><summary>More details</summary>{photos("bio_document","Bio document")}{photos("saint_portrait","Photo of saint")}{field("saintPlaceRaw","Place of saint",true)}<div className="intake-stack__dates">{field("birthDateRaw","Birth date",true)}{field("samadhiDateRaw","Samadhi date",true)}</div>{field("broughtByRaw","Who brought the relics",true)}</details></section>
      <h2 className="intake-stack__relic-heading">Relics <small>({relics.length})</small></h2>
      {relics.map((relic,index) => <article key={relic.id} className="intake-stack__card intake-stack__relic"><div className="intake-stack__heading"><div><p className="intake-stack__eyebrow">Relic {index+1}</p><h2>Relic details</h2></div>{editable && relics.length > 1 ? <button type="button" disabled={busy} onClick={() => {if (!window.confirm("Remove this relic from the entry?")) return;setRelics(old => old.filter(r => r.id !== relic.id));setDirty(true);setRetryPhotos(old => Object.fromEntries(Object.entries(old).filter(([key]) => !key.endsWith(relic.id))));}}>Remove relic</button> : null}</div>
      {photos("relic","Photo of relic",relic.id)}<label className="museum-intake__field" htmlFor={`description-${relic.id}`}><span>Description of relic</span><textarea id={`description-${relic.id}`} data-field={`description-${relic.id}`} rows={3} maxLength={8000} value={relic.relicDescription} disabled={!editable || busy} aria-invalid={!!errors[`description-${relic.id}`]} aria-describedby={errors[`description-${relic.id}`] ? `error-description-${relic.id}` : undefined} onChange={e => {setRelics(old => old.map(r => r.id === relic.id ? {...r,relicDescription:e.target.value} : r));setDirty(true);errorAt(`description-${relic.id}`,"");}}/><ErrorText name={`description-${relic.id}`} text={errors[`description-${relic.id}`]}/></label>
      {entry?.media.some(p => p.kind === "bio_document") ? <p className="intake-stack__shared">Uses the saint’s bio document</p> : null}<details className="intake-stack__optional"><summary>More details</summary>{photos("relic_document","Relic-specific document",relic.id)}<label className="museum-intake__field" htmlFor={`place-${relic.id}`}><span>Place associated with this relic <small>· Optional</small></span><input id={`place-${relic.id}`} value={relic.relicPlaceRaw ?? ""} maxLength={2000} disabled={!editable || busy} onChange={e => {setRelics(old => old.map(r => r.id === relic.id ? {...r,relicPlaceRaw:e.target.value} : r));setDirty(true);}}/></label><label className="museum-intake__field" htmlFor={`additional-saints-${relic.id}`}><span>Additional saints connected to this relic <small>· Optional</small></span><input id={`additional-saints-${relic.id}`} value={relic.additionalSaintsRaw ?? ""} maxLength={2000} disabled={!editable || busy} onChange={e => {setRelics(old => old.map(r => r.id === relic.id ? {...r,additionalSaintsRaw:e.target.value} : r));setDirty(true);}}/></label><label className="museum-intake__field">Who brought this relic <small>Optional</small><input value={relic.broughtByRaw ?? ""} maxLength={500} disabled={!editable || busy} onChange={e => {setRelics(old => old.map(r => r.id === relic.id ? {...r,broughtByRaw:e.target.value} : r));setDirty(true);}}/></label><small>Leave blank to use the shared arrival details.</small></details></article>)}
      {editable ? <><button type="button" className="intake-stack__add" disabled={busy || relics.length >= 50} onClick={() => {setRelics(old => [...old,newRelic()]);setDirty(true);}}>+ Add another relic</button><p className="intake-stack__status">{dirty ? "Unsaved changes" : entry ? "Details saved" : ""}</p><div className="museum-intake__actions"><button type="button" disabled={busy || conflict} onClick={() => perform(async () => {await saveFields();setMessage("Draft saved.");})}>Save draft</button><button type="submit" className="intake-stack__primary" disabled={busy || conflict}>{busy ? activity || "Saving…" : correcting ? "Submit changes for review" : "Submit for curator review"}</button></div></> : null}
{reviewMode && canReview && entry?.status === "submitted" ? <ReviewWorkflow eyebrow="Curator review" title="Review this entry" gridClassName="museum-intake__sections"><label className="museum-intake__field">Saint record<select value={decision} disabled={busy} onChange={e => { setDecision(e.target.value); errorAt("decision", ""); }} aria-describedby={errors.decision ? "error-decision" : undefined}><option value="">Choose an option</option><option value="existing">Link to an existing saint</option><option value="new_draft">Create a private saint draft</option></select><ErrorText name="decision" text={errors.decision}/></label>{decision === "existing" ? <SearchableSelect name="saintId" label="Find the saint" options={[]} searchEndpoint="/api/admin/saints/search" onValueChange={setSaintId}/> : null}<label className="museum-intake__field">Review note<textarea value={reviewNote} disabled={busy} maxLength={4000} onChange={e => { setReviewNote(e.target.value); errorAt("reviewNote", ""); }} aria-describedby={errors.reviewNote ? "error-reviewNote" : undefined}/><ErrorText name="reviewNote" text={errors.reviewNote}/></label><p>Approval saves the reviewed entry. Delivery to Airtable and the website is awaiting setup.</p><div className="museum-intake__actions"><button type="button" className="museum-admin-button" disabled={busy || dirty || conflict} onClick={() => { if (!decision || (decision === "existing" && !saintId)) {
        errorAt("decision", "Choose a saint record before approving.");
        return;
    } void perform(async () => { remember(await request<Entry>(`/${entry.id}/review`, "POST", { action: "approve", expectedVersion: entry.version, saintDecision: decision === "existing" ? { kind: "existing", saintId } : { kind: "new_draft" }, note: reviewNote })); setMessage("Approved. Delivery is awaiting setup."); }); }}>Approve entry</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy || dirty || conflict} onClick={() => { if (!reviewNote.trim()) {
        errorAt("reviewNote", "Describe the correction needed.");
        return;
    } void perform(async () => { remember(await request<Entry>(`/${entry.id}/review`, "POST", { action: "request_changes", expectedVersion: entry.version, note: reviewNote })); setMessage("Correction requested."); }); }}>Request correction</button></div>{dirty ? <p>Save details before reviewing.</p> : null}</ReviewWorkflow> : null}{entry?.deliveries.length ? <ReviewSection title="Previous review deliveries"><p>These delivery records belong to earlier approved revisions, not unsent corrections.</p>{entry.deliveries.map(d => <p key={`${d.target}-${d.reviewedVersion}`}><strong>{d.target === "website" ? "Website catalogue" : "Official Airtable"}</strong> · Revision {d.reviewedVersion} · {deliveryNames[d.status] ?? d.status}</p>)}</ReviewSection> : null}</form></>}
      </div></div>;
}
function ErrorText({ name, text }: { name: string; text?: string }) { return text ? <p className="museum-intake__error" id={`error-${name}`} role="alert">{text}</p> : null; }
