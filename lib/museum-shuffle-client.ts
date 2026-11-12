export type ShuffleState={actionId:string;completed:boolean;version:number};
export function mergeShuffleStates(previous:Record<string,ShuffleState>,rows:ShuffleState[]){
 const next={...previous};
 for(const row of rows)if(!next[row.actionId]||row.version>=next[row.actionId].version)next[row.actionId]=row;
 return next;
}
