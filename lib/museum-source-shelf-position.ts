// Source notation confirmed by the curator: row.position, rows top to bottom.
// A row number without a position is valid and never means position 1.
export type SourceShelfPosition={rawText:string;row:number|null;position:number|null;precision:"row_and_position"|"row_only"|"unrecorded"|"unparsed";rowOrder:"top_to_bottom"};
export function parseSourceShelfPosition(raw:string):SourceShelfPosition{
 const value=raw.trim(),match=/^([1-9][0-9]*)(?:\.([1-9][0-9]*))?$/.exec(value);
 const row=match?Number(match[1]):null,position=match?.[2]?Number(match[2]):null;
 const valid=match&&Number.isSafeInteger(row)&&(position===null||Number.isSafeInteger(position));
 return {rawText:raw,row:valid?row:null,position:valid?position:null,precision:valid?(position===null?"row_only":"row_and_position"):value?"unparsed":"unrecorded",rowOrder:"top_to_bottom"};
}
