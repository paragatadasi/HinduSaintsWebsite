"use client";
import { intakeFieldsEqual } from "@/lib/museum-intake-fields";
import { useEffect, useRef, useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ReviewSection, ReviewWorkflow } from "@/components/admin/review-ui";
type Fields = {
    saintName: string;
    relicDescription: string;
    saintPlaceRaw?: string;
    birthDateRaw?: string;
    samadhiDateRaw?: string;
    broughtByRaw?: string;
};
type PhotoKind = "relic" | "saint_portrait" | "bio_document";
type Entry = {
    id: string;
    version: number;
    status: string;
    fields: Fields;
    reviewNote?: string | null;
    media: {
        id: string;
        kind: PhotoKind;
        url: string;
    }[];
    deliveries: {
        target: string;
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
export function MuseumRelicIntake({ museumId, canReview, reviewMode }: {
    museumId: string;
    canReview: boolean;
    reviewMode: boolean;
}) {
    const [entries, setEntries] = useState<Entry[]>([]), [entry, setEntry] = useState<Entry | null>(null), [fields, setFields] = useState<Fields>(blank);
    const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [message, setMessage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({}), [decision, setDecision] = useState(""), [saintId, setSaintId] = useState(""), [reviewNote, setReviewNote] = useState("");
    const [cursor, setCursor] = useState<string | null>(null);
    const [activity, setActivity] = useState("");
    const [retryPhotos, setRetryPhotos] = useState<Partial<Record<PhotoKind, File>>>({});
    const [conflict, setConflict] = useState(false);
    const requestId = useRef("");
    const form = useRef<HTMLFormElement>(null);
    const pending = useRef(false);
    const reviewEntries = entries.filter(item => item.status !== "draft");
    const drafts = entries.filter(item => item.status === "draft");
    const queueEntries = reviewMode ? reviewEntries : entries;
    function queueItem(item: Entry) { return <button key={item.id} className="museum-intake__queue-item" aria-pressed={entry?.id === item.id} disabled={busy} onClick={() => open(item)}><strong>{item.fields.saintName || "Untitled draft"}</strong><small>{statusNames[item.status] ?? item.status}</small></button>; }
    const editable = !entry || entry.status === "draft" || entry.status === "needs_changes" || (canReview && entry.status === "submitted");
    useEffect(() => { let active = true; request<{
        entries: Entry[];
        nextCursor: string | null;
    }>(`?museumId=${encodeURIComponent(museumId)}`).then(data => { if (active) {
        setEntries(data.entries);
        setCursor(data.nextCursor);
    } }).catch(() => { if (active)
        setMessage("Could not load entries. Reload to try again."); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [museumId, reviewMode]);
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
        return; setEntry(next); setFields(next?.fields ?? { ...blank }); setReviewNote(next?.reviewNote ?? ""); setDecision(""); setSaintId(""); setErrors({}); setMessage(""); setDirty(false); setConflict(false); setRetryPhotos({}); requestId.current = ""; }
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
    async function saveFields() { if (entry && !dirty) return entry; setActivity("Saving details…"); let saved: Entry; if (entry) {
        saved = await request<Entry>(`/${entry.id}`, "PATCH", { expectedVersion: entry.version, fields });
    }
    else {
        requestId.current ||= crypto.randomUUID();
        saved = await request<Entry>("", "POST", { museumId, clientRequestId: requestId.current, fields });
    } if (!entry && !intakeFieldsEqual(saved.fields, fields)) {
        remember(saved);
        saved = await request<Entry>(`/${saved.id}`, "PATCH", { expectedVersion: saved.version, fields });
    } remember(saved); setDirty(false); return saved; }
    function validate() { const next: Record<string, string> = {}; if (!fields.saintName.trim())
        next.saintName = "Enter the saint’s name."; if (!fields.relicDescription.trim())
        next.relicDescription = "Describe the relic."; if (!entry?.media.some(p => p.kind === "relic"))
        next.relic = "Add a photo of the relic."; if (!entry?.media.some(p => p.kind === "bio_document")) next.bio_document = "Add a photo of the bio document."; for (const kind of Object.keys(retryPhotos)) next[kind] = "Retry or remove the unsaved photo before submitting."; setErrors(next); const key = Object.keys(next)[0]; if (key) {
        form.current?.querySelector<HTMLElement>(`[data-field="${key}"]`)?.focus();
        return false;
    } return true; }
    async function upload(kind: PhotoKind, file: File) { errorAt(kind, ""); if (file.size > 10 * 1024 * 1024) {
        errorAt(kind, "Choose an image under 10 MB.");
        return;
    } setRetryPhotos(old => ({ ...old, [kind]: file }));
    await perform(async () => { const saved = dirty || !entry ? await saveFields() : entry; setMessage("Details saved. Uploading photo…"); setActivity("Uploading photo…"); const data = new FormData(); data.set("file", file); data.set("kind", kind); data.set("expectedVersion", String(saved.version)); try { remember(await request<Entry>(`/${saved.id}/media`, "POST", data)); } catch (error) { setMessage("Details saved. Photo not saved—retry the upload."); throw error; } setRetryPhotos(old => { const next = { ...old }; delete next[kind]; return next; }); setMessage("Details and photo saved."); }, kind);
    }
    function change(key: keyof Fields, value: string) { setFields(old => ({ ...old, [key]: value })); setDirty(true); setMessage(""); errorAt(key, ""); }
    function field(key: keyof Fields, label: string, optional = false) { return <label className="museum-intake__field" key={key} htmlFor={`intake-${key}`}><span>{label}{optional ? <small> · Optional</small> : null}</span><input id={`intake-${key}`} data-field={key} value={fields[key] ?? ""} maxLength={key === "broughtByRaw" ? 500 : key === "saintPlaceRaw" ? 2000 : 300} disabled={!editable || busy} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={e => change(key, e.target.value)}/><ErrorText name={key} text={errors[key]}/></label>; }
    function photos(kind: PhotoKind, label: string) { return <section className="museum-intake__field" aria-label={label}><strong>{label}{kind === "saint_portrait" ? <small> · Optional</small> : null}</strong><div className="museum-intake__photos">{entry?.media.filter(p => p.kind === kind).map(p => <figure key={p.id}><a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={label}/></a>{editable ? <button type="button" disabled={busy || conflict} className="museum-admin-button museum-admin-button--secondary" onClick={() => perform(async () => { remember(await request<Entry>(`/${entry!.id}/media/${p.id}`, "DELETE", { expectedVersion: entry!.version })); }, kind)}>Remove photo</button> : null}</figure>)}</div>{editable ? <><div className="museum-intake__actions">{[true, false].map(camera => <label className="museum-intake__upload museum-admin-button museum-admin-button--secondary" key={String(camera)}>{camera ? "Take photo" : "Upload photo"}<input data-field={camera ? kind : undefined} type="file" accept="image/jpeg,image/png,image/webp" capture={camera ? "environment" : undefined} disabled={busy || conflict} aria-label={`${camera ? "Take" : "Upload"} ${label.toLowerCase()}`} aria-describedby={`hint-${kind}${errors[kind] ? ` error-${kind}` : ""}`} aria-invalid={!!errors[kind]} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file)
        void upload(kind, file); }}/></label>)}</div><small id={`hint-${kind}`}>JPEG, PNG or WebP · Up to 10 MB.</small></> : null}<ErrorText name={kind} text={errors[kind]}/>{retryPhotos[kind] && !busy ? <><p className="museum-filter-note">This photo has not saved yet. Keep this page open to retry.</p><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={conflict} onClick={() => upload(kind, retryPhotos[kind]!)}>Retry photo upload</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={() => { setRetryPhotos(old => { const next = {...old}; delete next[kind]; return next; }); errorAt(kind, ""); setMessage(""); }}>Remove unsaved photo</button></> : null}</section>; }
    return <div className="museum-intake"><aside className="museum-intake__queue"><div className="museum-intake__actions"><h2>{reviewMode ? "Review queue" : "Your entries"}</h2>{!reviewMode ? <button className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={() => open(null)}>New entry</button> : null}</div>{loading ? <p>Loading entries…</p> : <><p className="museum-filter-note">{queueEntries.length} {queueEntries.length === 1 ? "entry" : "entries"}</p>{queueEntries.length ? queueEntries.map(queueItem) : <p>{reviewMode ? "No entries submitted for review yet." : "No entries yet."}</p>}{reviewMode ? <section className="museum-intake__draft-queue" aria-label="Drafts"><h2>Drafts</h2><p className="museum-filter-note">{drafts.length} {drafts.length === 1 ? "draft" : "drafts"}</p>{drafts.length ? drafts.map(queueItem) : <p>No drafts yet.</p>}</section> : null}{cursor ? <button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={() => perform(async () => { const data = await request<{
        entries: Entry[];
        nextCursor: string | null;
    }>(`?museumId=${encodeURIComponent(museumId)}&cursor=${encodeURIComponent(cursor)}`); setEntries(old => [...old, ...data.entries.filter(e => !old.some(saved => saved.id === e.id))]); setCursor(data.nextCursor); })}>Load more entries</button> : null}</>}</aside><div><div role="status">{reviewMode && !entry && message ? <p>{message}</p> : null}</div>{conflict ? <button className="museum-admin-button" disabled={busy} onClick={() => perform(async () => { if (entry) {
        const fresh = await request<Entry>(`/${entry.id}`);
        if (!dirty || window.confirm("Replace your unsaved edits with the saved entry?")) {
            setDirty(false);
            setEntry(fresh);
            setFields(fresh.fields);
            setConflict(false);
            setMessage("Saved entry loaded.");
        }
    } })}>Reload saved entry</button> : null}{reviewMode && !entry ? <p>Select an entry to review.</p> : <form ref={form} noValidate onSubmit={e => { e.preventDefault(); if (!validate())
        return; void perform(async () => { const saved = dirty || !entry ? await saveFields() : entry; setActivity("Submitting for review…"); remember(await request<Entry>(`/${saved.id}/submit`, "POST", { expectedVersion: saved.version })); setMessage("Submitted for curator review."); }); }}><ReviewWorkflow eyebrow={entry ? statusNames[entry.status] : "New arrival"} title="Relic details" description={entry?.status === "needs_changes" ? entry.reviewNote ?? undefined : undefined} gridClassName="museum-intake__sections"><ReviewSection title="Required">{field("saintName", "Name of saint")}{photos("relic", "Photo of relic")}<label className="museum-intake__field" htmlFor="intake-description"><span>Description of relic</span><textarea id="intake-description" data-field="relicDescription" value={fields.relicDescription} maxLength={8000} disabled={!editable || busy} aria-invalid={!!errors.relicDescription} aria-describedby={errors.relicDescription ? "error-relicDescription" : undefined} onChange={e => change("relicDescription", e.target.value)}/><ErrorText name="relicDescription" text={errors.relicDescription}/></label>{photos("bio_document", "Bio document")}</ReviewSection><details className="museum-intake__optional"><summary>About the saint and arrival · Optional</summary>{photos("saint_portrait", "Photo of saint")}{field("saintPlaceRaw", "Place of saint", true)}{field("birthDateRaw", "Birth date", true)}{field("samadhiDateRaw", "Samadhi date", true)}<p className="museum-filter-note">Years and approximate dates are welcome.</p>{field("broughtByRaw", "Who brought the relic", true)}</details><p role="status" aria-live="polite">{busy ? activity || "Saving…" : message || (dirty ? "Unsaved changes" : entry ? "Details saved" : "")}</p>{editable ? <div className="museum-intake__actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy || conflict} onClick={() => perform(async () => { await saveFields(); setMessage("Saved."); })}>{busy ? "Saving…" : "Save details"}</button>{entry?.status !== "submitted" ? <button type="submit" className="museum-admin-button" disabled={busy || conflict}>Submit for review</button> : null}</div> : null}</ReviewWorkflow>{canReview && entry?.status === "submitted" ? <ReviewWorkflow eyebrow="Curator review" title="Review this entry" gridClassName="museum-intake__sections"><label className="museum-intake__field">Saint record<select value={decision} disabled={busy} onChange={e => { setDecision(e.target.value); errorAt("decision", ""); }} aria-describedby={errors.decision ? "error-decision" : undefined}><option value="">Choose an option</option><option value="existing">Link to an existing saint</option><option value="new_draft">Create a private saint draft</option></select><ErrorText name="decision" text={errors.decision}/></label>{decision === "existing" ? <SearchableSelect name="saintId" label="Find the saint" options={[]} searchEndpoint="/api/admin/saints/search" onValueChange={setSaintId}/> : null}<label className="museum-intake__field">Review note<textarea value={reviewNote} disabled={busy} maxLength={4000} onChange={e => { setReviewNote(e.target.value); errorAt("reviewNote", ""); }} aria-describedby={errors.reviewNote ? "error-reviewNote" : undefined}/><ErrorText name="reviewNote" text={errors.reviewNote}/></label><p>Approval saves the reviewed entry. Delivery to Airtable and the website is awaiting setup.</p><div className="museum-intake__actions"><button type="button" className="museum-admin-button" disabled={busy || dirty || conflict} onClick={() => { if (!decision || (decision === "existing" && !saintId)) {
        errorAt("decision", "Choose a saint record before approving.");
        return;
    } void perform(async () => { remember(await request<Entry>(`/${entry.id}/review`, "POST", { action: "approve", expectedVersion: entry.version, saintDecision: decision === "existing" ? { kind: "existing", saintId } : { kind: "new_draft" }, note: reviewNote })); setMessage("Approved. Delivery is awaiting setup."); }); }}>Approve entry</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy || dirty || conflict} onClick={() => { if (!reviewNote.trim()) {
        errorAt("reviewNote", "Describe the correction needed.");
        return;
    } void perform(async () => { remember(await request<Entry>(`/${entry.id}/review`, "POST", { action: "request_changes", expectedVersion: entry.version, note: reviewNote })); setMessage("Correction requested."); }); }}>Request correction</button></div>{dirty ? <p>Save details before reviewing.</p> : null}</ReviewWorkflow> : null}{entry?.deliveries.length ? <ReviewSection title="Delivery status">{entry.deliveries.map(d => <p key={d.target}><strong>{d.target === "website" ? "Website catalogue" : "Official Airtable"}</strong> · {deliveryNames[d.status] ?? d.status}</p>)}</ReviewSection> : null}</form>}</div></div>;
}
function ErrorText({ name, text }: {
    name: string;
    text?: string;
}) { return text ? <p className="museum-intake__error" id={`error-${name}`} role="alert">{text}</p> : null; }
