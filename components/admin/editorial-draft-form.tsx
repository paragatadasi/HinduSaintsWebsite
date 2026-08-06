"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { EditorialDraftPayload, EditorialDraftSnapshot } from "@/lib/editorial-drafts";

type EditorialDraftFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  baseVersion: number;
  children: ReactNode;
  className?: string;
  entityId: string;
  entityType: "saint" | "tradition" | "place" | "instagram_item";
  initialDraft?: EditorialDraftSnapshot;
  section: string;
};

type DraftState = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict" | "recovered";

export function EditorialDraftForm({
  action,
  baseVersion,
  children,
  className,
  entityId,
  entityType,
  initialDraft,
  section
}: EditorialDraftFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);
  const bypassSubmitRef = useRef(false);
  const applyingRef = useRef(false);
  const draftIdRef = useRef(initialDraft?.id ?? null);
  const revisionRef = useRef(initialDraft?.revision ?? null);
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const draftIsStale = Boolean(initialDraft && initialDraft.baseVersion !== baseVersion);
  const [state, setState] = useState<DraftState>(draftIsStale ? "conflict" : initialDraft ? "saved" : "idle");
  const [canRebase, setCanRebase] = useState(draftIsStale);
  const [message, setMessage] = useState(draftIsStale
    ? "This interim draft was based on an older live version. Review it, then discard or reapply deliberately."
    : initialDraft
      ? `Draft restored. Last saved by ${initialDraft.updatedBy}.`
      : "Interim changes will be saved automatically.");
  const storageKey = `admin-editorial-draft:${entityType}:${entityId}:${section}`;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw || !formRef.current) return;

    try {
      const local = JSON.parse(raw) as { payload?: EditorialDraftPayload; updatedAt?: string; pendingApply?: boolean };
      if (local.pendingApply && !initialDraft) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      const localUpdatedAt = Date.parse(local.updatedAt ?? "");
      const serverUpdatedAt = Date.parse(initialDraft?.updatedAt ?? "");
      if (!local.payload || !Number.isFinite(localUpdatedAt) || localUpdatedAt <= (Number.isFinite(serverUpdatedAt) ? serverUpdatedAt : 0)) return;
      applyPayload(formRef.current, local.payload);
      setState("recovered");
      setMessage("Recovered newer changes from this browser. Autosaving them now.");
      scheduleAutosave(100);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  // The initial snapshot is intentionally read only during this form instance's mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
  }, []);

  function handleChange() {
    const form = formRef.current;
    if (!form) return;
    const payload = serializeForm(form, entityType);
    window.localStorage.setItem(storageKey, JSON.stringify({ payload, updatedAt: new Date().toISOString() }));
    setState("dirty");
    setMessage("Unsaved changes are protected in this browser.");
    scheduleAutosave(900);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (bypassSubmitRef.current) {
      bypassSubmitRef.current = false;
      return;
    }

    event.preventDefault();
    if (applyingRef.current) return;
    if (!event.currentTarget.reportValidity()) return;
    applyingRef.current = true;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;
    const saved = await persistDraft();
    if (!saved || !formRef.current) {
      applyingRef.current = false;
      return;
    }

    const payload = serializeForm(formRef.current, entityType);
    window.localStorage.setItem(storageKey, JSON.stringify({ payload, updatedAt: new Date().toISOString(), pendingApply: true }));
    bypassSubmitRef.current = true;
    formRef.current.requestSubmit(submitter ?? undefined);
  }

  function scheduleAutosave(delay: number) {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void persistDraft();
    }, delay);
  }

  function persistDraft(rebase = false) {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = null;

    const queued = saveQueueRef.current
      .catch(() => false)
      .then(async () => {
        const form = formRef.current;
        if (!form) return false;
        const payload = serializeForm(form, entityType);
        setState("saving");
        setMessage("Saving interim draft…");

        try {
          const response = await fetch("/api/admin/editorial-drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityType,
              entityId,
              section,
              baseVersion,
              draftId: draftIdRef.current,
              revision: revisionRef.current,
              rebase,
              payload
            })
          });
          const result = await response.json() as {
            error?: string;
            eventId?: string;
            status?: string;
            draft?: EditorialDraftSnapshot;
          };

          if (response.status === 401) {
            setState("error");
            setMessage("Your session expired. This browser copy is safe; sign in again, then retry.");
            return false;
          }
          if (response.status === 409) {
            setState("conflict");
            setCanRebase(result.status === "live_conflict");
            setMessage("A newer live record or shared draft exists. Reload before applying these changes; your browser copy is safe.");
            return false;
          }
          if (!response.ok || result.status !== "saved" || !result.draft) {
            setState("error");
            setMessage(result.eventId ? `Autosave failed. Reference ${result.eventId}. Your browser copy is safe.` : "Autosave failed. Your browser copy is safe; retry before leaving.");
            return false;
          }

          draftIdRef.current = result.draft.id;
          revisionRef.current = result.draft.revision;
          setCanRebase(false);
          window.localStorage.setItem(storageKey, JSON.stringify({ payload, updatedAt: result.draft.updatedAt }));
          form.dispatchEvent(new CustomEvent("admin-draft-saved", { bubbles: true }));
          setState("saved");
          setMessage("Interim draft saved.");
          return true;
        } catch {
          setState("error");
          setMessage("Autosave is offline. Your changes remain protected in this browser.");
          return false;
        }
      });

    saveQueueRef.current = queued;
    return queued;
  }

  async function discardDraft() {
    if (!window.confirm("Discard the saved interim draft and restore the live values?")) return;
    const response = await fetch("/api/admin/editorial-drafts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, section })
    });
    if (!response.ok) {
      setState("error");
      setMessage("The saved draft could not be discarded. Try again.");
      return;
    }
    window.localStorage.removeItem(storageKey);
    draftIdRef.current = null;
    revisionRef.current = null;
    router.refresh();
  }

  return (
    <form
      action={action}
      aria-busy={state === "saving"}
      className={className}
      data-editorial-draft="true"
      ref={formRef}
      onChange={handleChange}
      onInput={handleChange}
      onSubmit={handleSubmit}
    >
      <input name="_draftSection" type="hidden" value={section} />
      {children}
      <div className={`editorial-draft-status editorial-draft-status--${state}`} role={state === "error" || state === "conflict" ? "alert" : "status"} aria-live="polite">
        <span>{message}</span>
        <span className="editorial-draft-status__actions">
          {canRebase ? <button className="admin-text-link" type="button" onClick={() => void persistDraft(true)}>Rebase onto current version</button> : null}
          {initialDraft || draftIdRef.current ? <button className="admin-text-link" type="button" onClick={discardDraft}>Discard interim draft</button> : null}
        </span>
      </div>
    </form>
  );
}

function serializeForm(form: HTMLFormElement, entityType: string): EditorialDraftPayload {
  const formData = new FormData(form);
  const ignored = new Set(["_draftSection", "version", `${entityType}Id`]);
  const payload: EditorialDraftPayload = {};

  for (const key of new Set(Array.from(formData.keys()))) {
    if (ignored.has(key) || key.startsWith("_")) continue;
    const values = formData.getAll(key).flatMap((value) => typeof value === "string" ? [value] : []);
    payload[key] = values.length > 1 ? values : values[0] ?? "";
  }
  return payload;
}

function applyPayload(form: HTMLFormElement, payload: EditorialDraftPayload) {
  for (const [name, rawValue] of Object.entries(payload)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const controls = Array.from(form.elements).filter(
      (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => (
        (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
        && element.name === name
      )
    );

    controls.forEach((control, index) => {
      if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
        control.checked = values.includes(control.value);
      } else {
        control.value = values[Math.min(index, values.length - 1)] ?? "";
      }
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
}
