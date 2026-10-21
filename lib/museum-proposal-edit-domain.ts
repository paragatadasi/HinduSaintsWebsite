// A tier/display-group edit does not change the chosen vitrine. Physical
// implementation is never reaffirmed automatically after a proposal changes.
export function retainPlannedDestination(status:string|undefined,oldSection:string,newSection:string){
 return status==="Planned"&&oldSection===newSection;
}
