"use client";
import type {FamilyMoveOption} from "@/lib/museum-family-move-domain";
import {MuseumFamilyMove} from "./museum-family-move";
import {moveVrindavanFamilyAction,saveVrindavanFamilyArrangementAction} from "@/app/vrindavanadmin/actions";
export function VrindavanFamilyCards({families,sections,canManage}:{families:FamilyMoveOption[];sections:string[];canManage:boolean}) {
 return <div className="museum-search-results__grid">{families.map(family=><article className={`museum-family-card${canManage?" museum-family-card--movable interactive-surface":""}`} key={family.key}><div className="museum-family-card__header"><div><h3>{family.label}</h3><p>{family.count} saints · {family.arrangement?.status||"Proposed"}</p></div></div>{canManage?<MuseumFamilyMove family={family} sections={sections} card scopeNote="Changes apply to Vrindavan. Historical relationships and individual relic locations stay unchanged." moveAction={moveVrindavanFamilyAction} arrangementAction={saveVrindavanFamilyArrangementAction}/>:null}</article>)}</div>;
}
