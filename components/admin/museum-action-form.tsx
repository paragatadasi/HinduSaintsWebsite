"use client";
import { startTransition, useActionState, type ReactNode } from "react";

// Keep the editor mounted on validation/conflict errors so entered values survive.
export function MuseumActionForm({
  action,
  children,
  className
}: {
  action: (form: FormData) => Promise<{ error: string }>;
  children: ReactNode;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(
    async (_previous: { error: string }, form: FormData) => action(form),
    { error: "" }
  );
  return (
    <form action={submit} className={className} aria-busy={pending} onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
      startTransition(() => submit(form));
    }}>
      {state.error ? <p role="alert">{state.error}</p> : null}
      <fieldset className="admin-field form-stack" disabled={pending}>
        {children}
      </fieldset>
      {pending ? <p role="status">Saving museum decision…</p> : null}
    </form>
  );
}
