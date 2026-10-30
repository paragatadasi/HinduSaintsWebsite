import {createHash} from "node:crypto";
export function paramanandHousingEvidence(raw:unknown):string|undefined{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return;
 const description=(raw as Record<string,unknown>)["Relics Description (move to other table)"];
 return typeof description==="string"?createHash("sha256").update(description.trim().replace(/\s+/g," ").toLowerCase()).digest("hex"):undefined;
}
