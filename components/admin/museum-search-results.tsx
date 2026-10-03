"use client";
import {VrindavanProposalControls,type VrindavanEditingOptions} from "./vrindavan-proposal-controls";
import {moveVrindavanFamilyAction,saveVrindavanFamilyArrangementAction} from "@/app/vrindavanadmin/actions";
import { useState } from "react";
import type { MuseumSaintPlacement } from "@/lib/museum-proposals";
import type { MuseumSaintProfile } from "@/lib/museum-saint-profile";
import type { FamilyMoveOption } from "@/lib/museum-family-move-domain";
import { MuseumSaintDialog } from "@/components/admin/museum-saint-dialog";
import { MuseumFamilyMove } from "@/components/admin/museum-family-move";

export function MuseumSearchResults({ matches, profiles, members, sections, familyMoveOptions, canManage, canEditRelationships=false,readOnly=false,sectionBasePath,inventoryBasePath,vrindavanEditing }: {
  matches: MuseumSaintPlacement[];
  profiles: Record<string, MuseumSaintProfile>;
  members: Record<string, Record<string, string>>;
  sections: Array<{name: string; slug: string}>;
  familyMoveOptions: FamilyMoveOption[];
  canManage: boolean;
  canEditRelationships?:boolean;
  vrindavanEditing?:VrindavanEditingOptions;
  readOnly?:boolean;sectionBasePath?:string;inventoryBasePath?:string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = matches.find(row => row.id === selectedId);
  const section = sections.find(s => s.name === selected?.section);
  const family = selected ? familyMoveOptions.find(f => f.key === (selected.curatorialFamily || selected.familyId)) : undefined;
  return <div className="museum-search-results">
    <p>{matches.length ? `${matches.length} matching placement${matches.length === 1 ? "" : "s"}` : "No matching placements found."}</p>
    <div className="museum-search-results__grid">
      {matches.map(match => <button type="button" aria-haspopup="dialog" className="museum-search-result interactive-surface" key={match.id} onClick={() => setSelectedId(match.id)}>
        <strong>{match.name}</strong><span>{match.section}</span>
        <small>{match.arrangement?.status || "Proposed"} · {match.tier} · {match.confidence} confidence</small>
      </button>)}
    </div>
    {selected && section ? <MuseumSaintDialog extraControls={canManage&&vrindavanEditing?<VrindavanProposalControls row={selected} options={vrindavanEditing} canEditRelationships={canEditRelationships}/>:undefined} readOnly={readOnly} sectionHref={sectionBasePath?`${sectionBasePath}?section=${encodeURIComponent(section.slug)}`:undefined} inventoryHref={inventoryBasePath?`${inventoryBasePath}?q=${encodeURIComponent(selected.name)}`:undefined} canManage={canManage} canEditRelationships={canEditRelationships} key={selected.id} row={selected} sectionSlug={section.slug} member={members[selected.id]} profile={selected.saintId ? profiles[selected.saintId] : undefined} onClose={() => setSelectedId(null)} moveControl={canManage && family ? <MuseumFamilyMove scopeNote={vrindavanEditing?"Changes apply to Vrindavan. Historical relationships and individual relic locations stay unchanged.":undefined} moveAction={vrindavanEditing?moveVrindavanFamilyAction:undefined} arrangementAction={vrindavanEditing?saveVrindavanFamilyArrangementAction:undefined} family={family} sections={vrindavanEditing?.sections||sections.map(s => s.name)} /> : undefined} /> : null}
  </div>;
}
