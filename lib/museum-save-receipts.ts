/** Apply narrow save receipts without reverting newer confirmations from another response. */
export function mergeSavedRows<T extends {sourceId:string;currentVersion:number}>(current:T[], incoming:T[]):T[]{
 const byId=new Map(incoming.map(row=>[row.sourceId,row]));
 return current.map(row=>{const next=byId.get(row.sourceId);return next&&next.currentVersion>=row.currentVersion?next:row;});
}

export function mergeSourceWork<S extends {sourceId:string},T extends {sourceId:string}>(current:{shelves:S[];tasks:T[]},receipt:{sourceIds:string[];shelves:S[];tasks:T[]}){
 const changed=new Set(receipt.sourceIds);
 return {shelves:[...current.shelves.filter(row=>!changed.has(row.sourceId)),...receipt.shelves],tasks:[...current.tasks.filter(row=>!changed.has(row.sourceId)),...receipt.tasks]};
}
