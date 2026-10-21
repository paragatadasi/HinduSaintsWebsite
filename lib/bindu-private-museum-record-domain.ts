import {z} from "zod";
export const BINDU_SOURCE_ID="cmus5tiuc04d307p7ff5stscn";
export const BINDU_SNAPSHOT="89c0c02dcab10d81b439943be6667c981e1995448f098abcdcaf4f3c39c28c62";
export const BINDU_SOURCE_KEY=`vrindavan-workbook:${BINDU_SNAPSHOT}:Sheet1:179`;
export const BINDU_DRAFT={name:"Bindu Mata",slug:"bindu-mata",aliases:["Mata Bindu","Mata Bindu (Guruji's Mother)"]};
export const BINDU_SECTION="Bhakti Marga & Mauritius Lineage";
export const BINDU_NOTE="Curator confirmed this is Guruji's mother, Bindu Mata, and belongs with Bhakti Marga. Private catalogue identity created for museum reconciliation. Original Mauritius and 11 / 4.1 remain source inventory evidence, not a biographical locality or a planned destination.";
export const binduPrivateRecordInput=z.object({sourceId:z.literal(BINDU_SOURCE_ID),sourceVersion:z.string().regex(/^[a-f0-9]{64}$/),revision:z.string().regex(/^[a-f0-9]{64}$/),confirm:z.literal(true)}).strict();
export type BinduDuplicate={id:string;displayName:string;canonicalName:string;slug:string;status:string;aliases:{alias:string}[]};
export function possibleBinduDuplicates(saints:BinduDuplicate[]){
 const compact=(value:string)=>value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g,"");
 return saints.filter(saint=>saint.slug===BINDU_DRAFT.slug||[saint.displayName,saint.canonicalName,...saint.aliases.map(alias=>alias.alias)].some(name=>{const n=compact(name);return /bindu|bindoo|bindou/.test(n)||["gurujismother","gurujimother","motherofguruji","motherofswamivishwananda"].some(label=>n.includes(label));}));
}
export type BinduPrivateMuseumPlan={sourceId:string;sourceVersion:string;revision:string;canCreate:boolean;blockedReason?:string;existingSaints:{id:string;name:string;slug:string;status:string}[];draft:typeof BINDU_DRAFT;proposal:{section:string;tier:"Secondary";destination:{mode:"exact"|"flexible"|"unassigned";vitrines:string[];message:string}};linkedSaintIds:string[]};