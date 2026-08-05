import Link from "next/link";
import type { Route } from "next";
import { db } from "@/lib/db";
import { reapplyConflict } from "@/app/admin/conflicts/actions";
import { getAdminUser } from "@/lib/admin-access";

export async function EditConflictPanel({ conflictId, returnTo }: { conflictId?: string; returnTo: string }) {
  if (!conflictId) return null;
  const user = await getAdminUser();
  if (!user) return null;
  const conflict = await db.adminEditConflict.findFirst({ where: { id: conflictId, userId: user.id } });
  if (!conflict) return null;
  return (
    <section className="review-panel form-status form-status--error">
      <div className="eyebrow">Edit conflict</div>
      <h2>Someone saved this record first</h2>
      <p>Your attempted save did not overwrite the newer version. Compare the current record with your attempted values, then reload or deliberately reapply your edit.</p>
      <div className="review-fact-grid">
        <div className="review-fact"><strong>Current version {conflict.currentVersion}</strong><pre className="raw-json-preview">{JSON.stringify(conflict.currentValue, null, 2)}</pre></div>
        <div className="review-fact"><strong>Your attempted version {conflict.expectedVersion}</strong><pre className="raw-json-preview">{JSON.stringify(conflict.attemptedValue, null, 2)}</pre></div>
      </div>
      <div className="review-actions">
        <Link className="admin-form-button admin-form-button--secondary" href={returnTo as Route}>Reload current version</Link>
        <form action={reapplyConflict}><input type="hidden" name="conflictId" value={conflict.id} /><input type="hidden" name="returnTo" value={returnTo} /><button className="admin-form-button" type="submit">Reapply my values</button></form>
      </div>
    </section>
  );
}
