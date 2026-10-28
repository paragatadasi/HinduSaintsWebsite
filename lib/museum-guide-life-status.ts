import {parseImportedDate} from "./import-dates";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type { StarterMoveGuide } from "./spn-move-guide";
export type GuideLifeEvidence={id:string;birthYear:number|null;birthYearEnd?:number|null;birthMonth?:number|null;birthDay?:number|null;samadhiYear:number|null;samadhiDateRaw:string|null};
export function bornOverCenturyAgo(person:GuideLifeEvidence,now:Date){
 const year=person.birthYearEnd??person.birthYear;if(year===null)return false;
 const cutoff=now.getUTCFullYear()-100;
 if(year!==cutoff)return year<cutoff;
 if(person.birthYearEnd&&person.birthYearEnd!==person.birthYear)return false;
 if(!person.birthMonth||!person.birthDay)return false;
 return person.birthMonth<now.getUTCMonth()+1||(person.birthMonth===now.getUTCMonth()+1&&person.birthDay<now.getUTCDate());
}
export function projectGuideLifeStatus(guide:StarterMoveGuide,evidence:GuideLifeEvidence[],now=new Date()):StarterMoveGuide{
 const people=new Map(evidence.map(person=>[person.id,person]));
 return {...guide,entries:guide.entries.map(entry=>{
  const person=people.get(entry.sourceId);
  const raw=person?.samadhiDateRaw?.trim().toLowerCase();
  let lifeStatus=entry.lifeStatus;
  if(raw&&["still alive","alive","living"].includes(raw))lifeStatus={tag:"Still alive",basis:"Explicit living status in the current saint record."};
  else if(raw&&["may be alive","possibly alive"].includes(raw))lifeStatus={tag:"May be alive",basis:"Uncertain living status in the current saint record."};
  if(person?.samadhiYear!=null&&lifeStatus?.tag)lifeStatus={tag:null,basis:"A samadhi year is recorded; living-status tag withheld."};
  else if(lifeStatus?.tag==="May be alive"&&person&&bornOverCenturyAgo(person,now))lifeStatus={tag:null,basis:"Uncertain living-status tag withheld under the curator's over-100-years rule; this does not confirm death."};
  return {...entry,lifeStatus};
 })};
}

export function projectCurrentGuideLifeStatus(guide:StarterMoveGuide,current:{placements:MuseumSaintPlacement[];membersById:Map<string,Record<string,string>>},now=new Date()){
 const bySaint=new Map<string,MuseumSaintPlacement[]>();
 for(const row of current.placements)if(row.saintId)bySaint.set(row.saintId,[...(bySaint.get(row.saintId)??[]),row]);
 const evidence:GuideLifeEvidence[]=guide.entries.flatMap(entry=>{
  const candidates=entry.saintId?bySaint.get(entry.saintId)??[]:[];
  const exact=candidates.filter(row=>row.sourceRecordId===entry.sourceId||row.id===entry.sourceId);
  const matches=exact.length?exact:candidates;
  if(matches.length!==1||matches[0].linkIssue||matches[0].placementState?.startsWith("Conflicting"))return [];
  const member=current.membersById.get(matches[0].id);if(!member)return [];
  const birth=parseImportedDate(member.BirthDate||member.BirthYear),death=parseImportedDate(member.SamadhiDate);
  const knownBirth=["day","month","year","range"].includes(birth.precision);
  return [{id:entry.sourceId,birthYear:knownBirth?birth.year??null:null,birthYearEnd:birth.endYear,birthMonth:birth.month,birthDay:birth.day,samadhiYear:death.year??null,samadhiDateRaw:member.SamadhiDate??null}];
 });
 return projectGuideLifeStatus(guide,evidence,now);
}
