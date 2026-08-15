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

type BrowserDraftSnapshot = {
  draftId?: string | null;
  payload?: EditorialDraftPayload;
  pendingApply?: boolean;
  revision?: number | null;
  updatedAt?: string;
};

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
  const sharedConflictRef = useRef<EditorialDraftSnapshot | null>(null);
  const changeSequenceRef = useRef(0);
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const draftIsStale = Boolean(initialDraft && initialDraft.baseVersion !== baseVersion);
  const [state, setState] = useState<DraftState>(draftIsStale ? "conflict" : initialDraft ? "saved" : "idle");
  const [canRebase, setCanRebase] = useState(draftIsStale);
  const [canReplaceSharedDraft, setCanReplaceSharedDraft] = useState(false);
  const [message, setMessage] = useState(draftIsStale
    ? "This interim draft was based on an older live version. Review it, then discard or reapply deliberately."
    : initialDraft
      ? `Draft restored. Last saved by ${initialDraft.updatedBy}.`
      : "Interim changes will be saved automatically.");
  const storageKey = `admin-editorial-draft:${entityType}:${entityId}:${section}`;

  useEffect(() => {
    const raw = readBrowserDraft(storageKey);
    if (!raw || !formRef.current) return;

    try {
      const local = JSON.parse(raw) as BrowserDraftSnapshot;
      if (!local.payload) return;

      const renderedPayload = serializeForm(formRef.current, entityType);
      if (payloadsMatch(local.payload, renderedPayload)) {
        if (local.pendingApply && !initialDraft) removeBrowserDraft(storageKey);
        return;
      }

      const matchesServerDraft = Boolean(
        initialDraft
        && local.draftId === initialDraft.id
        && local.revision === initialDraft.revision
      );
      const localUpdatedAt = Date.parse(local.updatedAt ?? "");
      const serverUpdatedAt = Date.parse(initialDraft?.updatedAt ?? "");
      const legacyBrowserDraftIsNewer = Number.isFinite(localUpdatedAt)
        && localUpdatedAt > (Number.isFinite(serverUpdatedAt) ? serverUpdatedAt : 0);
      if (initialDraft && !local.pendingApply && !matchesServerDraft && !legacyBrowserDraftIsNewer) return;

      applyPayload(formRef.current, local.payload);
      setState("recovered");
      setMessage("Recovered newer changes from this browser. Autosaving them now.");
      scheduleAutosave(100);
    } catch {
      removeBrowserDraft(storageKey);
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
    changeSequenceRef.current += 1;
    const payload = serializeForm(form, entityType);
    const browserCopySaved = writeBrowserDraft(storageKey, {
      draftId: draftIdRef.current,
      payload,
      revision: revisionRef.current,
      updatedAt: new Date().toISOString()
    });
    setState("dirty");
    setMessage(browserCopySaved
      ? "Unsaved changes are protected in this browser."
      : "Browser protection is unavailable. Keep this editor open while autosave retries.");
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
    writeBrowserDraft(storageKey, {
      draftId: draftIdRef.current,
      payload,
      pendingApply: true,
      revision: revisionRef.current,
      updatedAt: new Date().toISOString()
    });
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
        const saveSequence = changeSequenceRef.current;
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
            if (result.status === "draft_conflict" && result.draft && payloadsMatch(payload, result.draft.payload)) {
              draftIdRef.current = result.draft.id;
              revisionRef.current = result.draft.revision;
              sharedConflictRef.current = null;
              setCanRebase(false);
              setCanReplaceSharedDraft(false);
              if (changeSequenceRef.current === saveSequence) {
                writeBrowserDraft(storageKey, {
                  draftId: result.draft.id,
                  payload,
                  revision: result.draft.revision,
                  updatedAt: result.draft.updatedAt
                });
                setState("saved");
                setMessage("Interim draft saved.");
              } else {
                writeBrowserDraft(storageKey, {
                  draftId: result.draft.id,
                  payload: serializeForm(form, entityType),
                  revision: result.draft.revision,
                  updatedAt: new Date().toISOString()
                });
                setState("dirty");
                setMessage("Newer changes are protected in this browser and waiting to autosave.");
                if (timerRef.current == null) scheduleAutosave(100);
              }
              return true;
            }

            setState("conflict");
            if (result.status === "draft_conflict" && result.draft) {
              sharedConflictRef.current = result.draft;
              setCanRebase(false);
              setCanReplaceSharedDraft(true);
              setMessage("The shared interim draft changed while you were editing. Your browser copy is safe.");
            } else {
              sharedConflictRef.current = null;
              setCanRebase(result.status === "live_conflict");
              setCanReplaceSharedDraft(false);
              setMessage("The live record changed while you were editing. Review your browser copy, then rebase it onto the current version.");
            }
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
          setCanReplaceSharedDraft(false);
          sharedConflictRef.current = null;
          form.dispatchEvent(new CustomEvent("admin-draft-saved", { bubbles: true }));

          if (changeSequenceRef.current === saveSequence) {
            writeBrowserDraft(storageKey, {
              draftId: result.draft.id,
              payload,
              revision: result.draft.revision,
              updatedAt: result.draft.updatedAt
            });
            setState("saved");
            setMessage("Interim draft saved.");
          } else {
            const latestPayload = serializeForm(form, entityType);
            writeBrowserDraft(storageKey, {
              draftId: result.draft.id,
              payload: latestPayload,
              revision: result.draft.revision,
              updatedAt: new Date().toISOString()
            });
            setState("dirty");
            setMessage("Newer changes are protected in this browser and waiting to autosave.");
            if (timerRef.current == null) scheduleAutosave(100);
          }
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
    removeBrowserDraft(storageKey);
    draftIdRef.current = null;
    revisionRef.current = null;
    router.refresh();
  }

  function replaceSharedDraft() {
    const sharedDraft = sharedConflictRef.current;
    if (!sharedDraft) return;
    draftIdRef.current = sharedDraft.id;
    revisionRef.current = sharedDraft.revision;
    sharedConflictRef.current = null;
    setCanReplaceSharedDraft(false);
    void persistDraft();
  }

  return (
    <form
      action={action}
      aria-busy={state === "saving"}
      className={className}
      data-editorial-draft="true"
      ref={formRef}
      onChange={handleChange}
      onSubmit={handleSubmit}
    >
      <input name="_draftSection" type="hidden" value={section} />
      {children}
      <div className={`editorial-draft-status editorial-draft-status--${state}`} role={state === "error" || state === "conflict" ? "alert" : "status"} aria-live="polite">
        <span className="editorial-draft-status__message">
          {state === "conflict" ? <strong>Draft needs attention</strong> : null}
          {state === "error" ? <strong>Autosave needs attention</strong> : null}
          <span>{message}</span>
        </span>
        <span className="editorial-draft-status__actions">
          {canRebase ? <button className="admin-form-button admin-form-button--compact" type="button" onClick={() => void persistDraft(true)}>Rebase onto current version</button> : null}
          {canReplaceSharedDraft ? <button className="admin-form-button admin-form-button--compact" type="button" onClick={replaceSharedDraft}>Use this browser copy</button> : null}
          {state === "error" ? <button className="admin-form-button admin-form-button--compact" type="button" onClick={() => void persistDraft()}>Retry autosave</button> : null}
          {initialDraft || draftIdRef.current ? <button className="admin-form-button admin-form-button--compact admin-form-button--low-priority" type="button" onClick={discardDraft}>Discard interim draft</button> : null}
        </span>
      </div>
    </form>
  );
}
function readBrowserDraft(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeBrowserDraft(storageKey: string, snapshot: BrowserDraftSnapshot) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

function removeBrowserDraft(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage can be disabled by the browser. There is nothing to remove in that case.
  }
}

function payloadsMatch(left: EditorialDraftPayload, right: EditorialDraftPayload) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const leftValue = left[key] ?? "";
    const rightValue = right[key] ?? "";
    if (Array.isArray(leftValue) || Array.isArray(rightValue)) {
      const leftValues = Array.isArray(leftValue) ? leftValue : [leftValue];
      const rightValues = Array.isArray(rightValue) ? rightValue : [rightValue];
      if (leftValues.length !== rightValues.length || leftValues.some((value, index) => value !== rightValues[index])) return false;
    } else if (leftValue !== rightValue) {
      return false;
    }
  }
  return true;
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
