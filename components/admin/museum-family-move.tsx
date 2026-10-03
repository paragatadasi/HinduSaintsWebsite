"use client";

import {MuseumFamilyArrangementEditor} from "@/components/admin/museum-arrangement-editor";
import { useId, useRef } from "react";
import { ArrowRightLeft, X } from "lucide-react";
import type { FamilyMoveOption } from "@/lib/museum-family-move-domain";
import { MuseumActionForm } from "@/components/admin/museum-action-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { moveFamilyProposalAction } from "@/app/museumadmin/family-move-action";

export function MuseumFamilyMove({ family, sections, card = false }: { family: FamilyMoveOption; sections: string[]; card?: boolean }) {
  const actionLabel=family.moveUnavailable?"Plan family":"Move family";
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button type="button" className={card ? "museum-family-card__move-trigger" : "museum-admin-button"} aria-hidden={card || undefined} tabIndex={card ? -1 : undefined} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} aria-label={`${actionLabel}: ${family.label}`}>
      {card ? <span className="sr-only">{actionLabel}: {family.label}</span> : <><ArrowRightLeft aria-hidden="true" size={16} /> {actionLabel}</>}
    </button>
    {card ? <button type="button" className="museum-icon-button museum-family-card__move-icon" aria-label={`${actionLabel}: ${family.label}`} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} title={actionLabel}>
      <ArrowRightLeft aria-hidden="true" size={16} />
    </button> : null}
    <dialog ref={dialog} aria-labelledby={titleId} className="museum-family-move-dialog">
      <div className="form-stack">
        <div className="museum-admin-section-heading">
          <h2 id={titleId}>{family.moveUnavailable?"Plan":"Move"} {family.label}</h2>
          <button type="button" className="museum-admin-button" aria-label="Close family planning" onClick={() => dialog.current?.close()}><X aria-hidden="true" size={16} /></button>
        </div>
        {!family.moveUnavailable?<><p>Update the proposed section for all {family.count} family members, including members currently proposed in other sections. Confirmed placements remain unchanged until reviewed.</p>
        <MuseumActionForm action={moveFamilyProposalAction}>
          <input type="hidden" name="familyKey" value={family.key} />
          <input type="hidden" name="revision" value={family.revision} />
          <SearchableSelect label="Destination section" name="section" options={sections.map(value => ({ value, label: value }))} placeholder="Find a museum section" required />
          <div className="review-actions">
            <button className="museum-admin-button" type="submit">Move family proposals</button>
            <button className="museum-admin-button" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
        </MuseumActionForm></>:null}
        {family.arrangement?<MuseumFamilyArrangementEditor familyKey={family.key} current={family.arrangement}/>:null}
      </div>
    </dialog>
  </>;
}
