import type {ExplorerObservation} from './spn-room-proposal';

export type ExplorerSaint={
 saintId:string;name:string;tier:string;currentSections:string[];caseEnvelope:string[];
 sourceLocations:{vitrine:string;shelf:string}[];sourceAttributionHold:boolean;recommendedRegion:string;
 observations:ExplorerObservation[];
};
export type ExplorerDriver={connection:string;places:number[];contextPlaces?:number[];reason:string;sources?:{url:string}[]};
export type ExplorerPacket={unitId?:string;label:string;group:string;cases:number[];navigationKind?:string};
export type ExplorerOption={
 id:string;title:string;summary:string;
 assignments:{number:string;group:string;region:string;subsection:string}[];
 displayPackets:ExplorerPacket[];
 primeAnchors:Record<string,{people:string;reason:string}>;
 drivers:ExplorerDriver[];largeObjects:{note:string;fallback:string};tradeoffs:string[];
};
export type ExplorerPlacement={saintId:string;vitrine:number|string;priority?:number;rationale?:string;basis?:string;fitNote?:string};

export function vitrineNeighborhoods(option:ExplorerOption,number:string):ExplorerPacket[]{
 return option.displayPackets.filter(p=>p.navigationKind==='neighborhood'&&p.cases.map(String).includes(number));
}

export function explorerSaints(rows:ExplorerObservation[]):ExplorerSaint[]{
 const grouped=new Map<string,ExplorerSaint>();
 for(const row of rows){
  const key=(row.saintId||row.sourceId)+(row.unresolved?':review':'');
  let saint=grouped.get(key);
  if(!saint){saint={saintId:row.saintId||row.sourceId,name:row.name,tier:row.tier==='Featured'?'Primary':row.tier,currentSections:[],caseEnvelope:[],sourceLocations:[],sourceAttributionHold:row.unresolved,recommendedRegion:row.unresolved?'Identity under review':row.regions.join(' · '),observations:[]};grouped.set(key,saint);}
  if(!saint.currentSections.includes(row.section))saint.currentSections.push(row.section);
  if(!saint.caseEnvelope.includes(row.effectiveVitrine))saint.caseEnvelope.push(row.effectiveVitrine);
  if(row.sourceVitrine&&!saint.sourceLocations.some(l=>l.vitrine===row.sourceVitrine&&l.shelf===row.sourceShelf))saint.sourceLocations.push({vitrine:row.sourceVitrine,shelf:row.sourceShelf});
  saint.observations.push(row);
 }
 return [...grouped.values()];
}

export function vitrineConnectionPlaces(d:ExplorerDriver):number[]{
 if(d.contextPlaces)return d.places.filter(n=>!d.contextPlaces!.includes(n));
 if(['Upper family displays with labelled lower review cohorts','Western regional cohorts around preserved family anchors'].includes(d.connection))return [];
 if(d.connection==='Andhra Avadhuta / Datta families toward the Datta island')return d.places.filter(n=>n!==5);
 if(d.connection==='South–West hinge at the western approach')return [14,19,20];
 if(d.connection==='Coherent main displays in 12 / 15 / 72')return [12,15,72];
 return d.places;
}


