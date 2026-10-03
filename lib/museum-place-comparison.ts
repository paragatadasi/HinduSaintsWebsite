import {identityName} from "./vrindavan-identity-domain";
export type ComparisonPlace = {id:string;name:string;alternateNames:string[];region:string|null;country:string|null;placeKind:string};
export type SaintComparisonPlace = ComparisonPlace & {placeType:string};
const norm=(value:string)=>identityName(value).replace(/\bindia$/," ").trim();
const forms=(place:ComparisonPlace)=>[place.name,...place.alternateNames].map(norm).filter(Boolean);
export function compareMuseumSourcePlace(sourceText:string,websitePlaces:SaintComparisonPlace[],catalogue:ComparisonPlace[]) {
 const text=sourceText.trim(),key=norm(text),parts=text.split(/[,;\n]/).map(norm).filter(Boolean);
 const actual=websitePlaces.filter(p=>p.placeKind!=="spiritual_region");
 const exact=actual.filter(p=>forms(p).includes(key));
 const overlap=actual.filter(p=>forms(p).some(name=>parts.includes(name)));
 const catalogueCandidates=key?catalogue.filter(p=>p.placeKind==="locality"&&forms(p).some(name=>name===key||parts.includes(name))):[];
 const category=!text?"missing_source_place":exact.length?"existing_association":overlap.length?"overlapping_association":"different_or_unrecognized";
 return {sourceText:text,category,matchedPlaceIds:[...new Set([...exact,...overlap].map(p=>p.id))],
  matchesPrimary:[...exact,...overlap].some(p=>p.placeType==="primary"),
  catalogueCandidates:catalogueCandidates.map(p=>({id:p.id,name:p.name,region:p.region,country:p.country})),
  needsResearch:category==="different_or_unrecognized",
  interpretation:"Source place meaning is unverified; agreement is not validation and a difference is not an approved correction."};
}