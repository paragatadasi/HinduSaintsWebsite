"use client";

import { useId, useRef } from "react";
import { ArrowRightLeft, X } from "lucide-react";
import type { FamilyMoveOption } from "@/lib/museum-family-move-domain";
import { MuseumActionForm } from "@/components/admin/museum-action-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { moveFamilyProposalAction } from "@/app/museumadmin/family-move-action";

export function MuseumFamilyMove({ family, sections }: { family: FamilyMoveOption; sections: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button type="button" className="museum-admin-button" onClick={() => dialog.current?.showModal()} aria-label={`Move ${family.label} to another section`}>
      <ArrowRightLeft aria-hidden="true" size={16} /> Move family
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} className="museum-family-move-dialog">
      <div className="form-stack">
        <div className="museum-admin-section-heading">
          <h2 id={titleId}>Move {family.label}</h2>
          <button type="button" className="museum-admin-button" aria-label="Close move family" onClick={() => dialog.current?.close()}><X aria-hidden="true" size={16} /></button>
        </div>
        <p>Update the proposed section for all {family.count} family members, including members currently proposed in other sections. Confirmed placements remain unchanged until reviewed.</p>
        <MuseumActionForm action={moveFamilyProposalAction}>
          <input type="hidden" name="familyKey" value={family.key} />
          <input type="hidden" name="revision" value={family.revision} />
          <SearchableSelect label="Destination section" name="section" options={sections.map(value => ({ value, label: value }))} placeholder="Find a museum section" required />
          <div className="review-actions">
            <button className="museum-admin-button" type="submit">Move family proposals</button>
            <button className="museum-admin-button" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
        </MuseumActionForm>
      </div>
    </dialog>
  </>;
}
