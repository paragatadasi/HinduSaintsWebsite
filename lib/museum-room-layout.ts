/** Shared schematic data, not measurements or an inventory occupancy claim. */
export type RoomVitrine = {
  id:string; number:string; zone:string; position:string;
  availability:"existing"|"new"|"future";
  restriction:"general"|"walking_sticks";
  provisional:boolean; sourceLabel:string;
  column:number; row:number; columnSpan:number; rowSpan:number;
};
export type MuseumRoomLayout = {
  id:string; museumId:string; name:string; columns:number; rows:number;
  vitrines:RoomVitrine[];
  landmarks:{id:string;label:string;column:number;row:number;columnSpan:number;rowSpan:number}[];
};
export function destinationEligibility(vitrine:RoomVitrine, itemKind:"general"|"walking_stick"|"unknown"="unknown") {
  if(vitrine.availability==="future")return {allowed:false,reason:"Future space — unavailable for this reorganization."};
  if(vitrine.restriction==="walking_sticks"&&itemKind!=="walking_stick")return {allowed:false,reason:"Walking sticks only — confirm the item type before assigning."};
  return {allowed:true,reason:"Available for planning; check physical space before moving."};
}
export function layoutValidationErrors(layout:MuseumRoomLayout):string[] {
  const errors:string[]=[],ids=new Set<string>(),numbers=new Set<string>(),cells=new Set<string>();
  for(const v of layout.vitrines){
    if(ids.has(v.id)||numbers.has(v.number))errors.push(`Duplicate vitrine: ${v.number}`);
    ids.add(v.id);numbers.add(v.number);
    if(!/^\d+$/.test(v.number))errors.push(`Invalid vitrine number: ${v.number}`);
    if(![v.column,v.row,v.columnSpan,v.rowSpan].every(n=>Number.isInteger(n)&&n>0)||v.column+v.columnSpan-1>layout.columns||v.row+v.rowSpan-1>layout.rows)errors.push(`Out of bounds: ${v.number}`);
    for(let x=v.column;x<v.column+v.columnSpan;x++)for(let y=v.row;y<v.row+v.rowSpan;y++){
      const key=`${x}:${y}`;if(cells.has(key))errors.push(`Overlapping vitrine: ${v.number}`);cells.add(key);
    }
  }
  return errors;
}
// Provisional layout labels are never automatically adopted as operational codes.
export function provisionalNumberCollisions(layout:MuseumRoomLayout, existingCodes:string[]) {
  const numbers=new Set(existingCodes.flatMap(code=>{
    const match=/^(?:vitrine\s*#?\s*)?(\d+)(?:\/[A-Z0-9]+)?$/i.exec(code.trim());return match?[String(Number(match[1]))]:[];
  }));
  return layout.vitrines.filter(v=>v.provisional&&numbers.has(v.number)).map(v=>v.number);
}
