export function companionClearFields(codes?:string[]){
 return codes?.length?{clearedVitrines:codes,initialCaseClearAcknowledged:true as const}:{};
}
