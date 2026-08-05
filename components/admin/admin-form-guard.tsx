"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DIRTY_ATTRIBUTE = "data-admin-dirty";
const ERROR_CLASS = "admin-field-error";
const LEAVE_MESSAGE = "You have unsaved changes. Leave this page and discard them?";

function guardedForm(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const form = target.closest("form");
  if (!form || form.dataset.unsavedGuard === "off" || form.method.toLowerCase() !== "post") return null;
  return form;
}

function clearFieldError(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  control.removeAttribute("aria-invalid");
  const errorId = control.getAttribute("aria-errormessage");
  if (errorId) document.getElementById(errorId)?.remove();
  control.removeAttribute("aria-errormessage");
}

function showFieldError(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  clearFieldError(control);
  const id = control.id || `admin-field-${crypto.randomUUID()}`;
  const errorId = `${id}-error`;
  control.id = id;
  control.setAttribute("aria-invalid", "true");
  control.setAttribute("aria-errormessage", errorId);
  const message = document.createElement("span");
  message.className = ERROR_CLASS;
  message.id = errorId;
  message.textContent = control.validationMessage;
  control.insertAdjacentElement("afterend", message);
}

export function AdminFormGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dirtyCount, setDirtyCount] = useState(0);
  const [invalidFields, setInvalidFields] = useState<Array<{ id: string; label: string; message: string }>>([]);

  useEffect(() => {
    const dirtyForms = new Set<HTMLFormElement>();
    const syncDirtyCount = () => setDirtyCount(dirtyForms.size);
    const markDirty = (event: Event) => {
      const form = guardedForm(event.target);
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
        if (event.target.validity.valid) clearFieldError(event.target);
      }
      if (!form || dirtyForms.has(form)) return;
      dirtyForms.add(form);
      form.setAttribute(DIRTY_ATTRIBUTE, "true");
      syncDirtyCount();
    };
    const handleSubmit = (event: Event) => {
      const form = guardedForm(event.target);
      if (!form) return;
      const controls = Array.from(form.elements).filter(
        (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
      );
      const invalid = controls.filter((control) => !control.validity.valid);
      if (invalid.length) {
        event.preventDefault();
        invalid.forEach(showFieldError);
        setInvalidFields(invalid.map((control) => ({ id: control.id, label: control.labels?.[0]?.textContent?.trim() || control.name || "Field", message: control.validationMessage })));
        invalid[0]?.focus();
        return;
      }
      dirtyForms.delete(form);
      form.removeAttribute(DIRTY_ATTRIBUTE);
      syncDirtyCount();
      setInvalidFields([]);
    };
    const handleInvalid = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement)) return;
      showFieldError(event.target);
      const form = event.target.form;
      window.queueMicrotask(() => {
        if (!form) return;
        const invalid = Array.from(form.elements).filter(
          (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
            (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) && !element.validity.valid
        );
        setInvalidFields(invalid.map((control) => ({ id: control.id, label: control.labels?.[0]?.textContent?.trim() || control.name || "Field", message: control.validationMessage })));
      });
    };
    const handleClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || dirtyForms.size === 0) return;
      const destination = new URL((link as HTMLAnchorElement).href, window.location.href);
      if (destination.href === window.location.href || window.confirm(LEAVE_MESSAGE)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyForms.size === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("invalid", handleInvalid, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("invalid", handleInvalid, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  return <div className="admin-form-guard">
    {dirtyCount > 0 ? <div className="admin-unsaved-status" role="status">Unsaved changes</div> : null}
    {invalidFields.length > 0 ? <section className="admin-validation-summary" aria-labelledby="admin-validation-title" role="alert">
      <strong id="admin-validation-title">Please fix {invalidFields.length === 1 ? "this field" : `${invalidFields.length} fields`}:</strong>
      <ul>{invalidFields.map((field) => <li key={field.id}><button type="button" onClick={() => document.getElementById(field.id)?.focus()}>{field.label}: {field.message}</button></li>)}</ul>
    </section> : null}
    {children}
  </div>;
}
