import {z} from "zod";
import {v19ComponentBinding,type ComponentPlacement} from "./museum-component-clearance-domain";
export const pagalComponentDestination="25";
export const pagalComponentReceiptId="cmvwko6oa000l07qz8em2nfuh";
export const pagalComponentAcknowledgement=z.object({sourceId:z.literal("rec7GxgNvmubmTvMM"),scope:z.literal("vitrine_19_contents_only"),stagingReceiptId:z.literal("cmvwko6oa000l07qz8em2nfuh"),excludedWalkingSticksUnchanged:z.literal(true)}).strict();
type Source={sourceId:string;saintId?:string|null;sourceRevision?:string;identityChanged?:boolean;fixedHousing?:boolean;verifiedItemIds?:string[];componentPlacement?:ComponentPlacement|null};
export function hasReviewedPagalComponent(row:Source){const c=row.componentPlacement;return row.sourceId===v19ComponentBinding.sourceId&&row.saintId===v19ComponentBinding.saintId&&row.sourceRevision===v19ComponentBinding.sourceRevision&&!row.identityChanged&&!row.fixedHousing&&!row.verifiedItemIds?.length&&!!c&&c.scope==="vitrine_19_contents_only"&&c.expectedSourceRevision===v19ComponentBinding.sourceRevision&&c.origin.kind==="vitrine"&&c.origin.code==="19"&&(c.clearanceReceiptId??c.receiptId)===pagalComponentReceiptId&&!c.includedWalkingSticks&&c.excludedWalkingSticks.location===null&&c.excludedWalkingSticks.status==="unverified";}
export function canPlacePagalComponent(row:Source,target:string){return target===pagalComponentDestination&&hasReviewedPagalComponent(row)&&row.componentPlacement!.location.kind==="table"&&row.componentPlacement!.location.code==="staging-area";}
export function isPagalComponentPlaced(row:Source,target:string){return target===pagalComponentDestination&&hasReviewedPagalComponent(row)&&row.componentPlacement!.location.kind==="vitrine"&&row.componentPlacement!.location.code===target;}

export function canConfirmPagalComponentDestination(row:Source,target:string,review:{sourceId:string;saintId:string|null;effectiveVitrine:string|null}[]){const matches=review.filter(entry=>entry.sourceId===row.sourceId);return canPlacePagalComponent(row,target)&&matches.length===1&&matches[0].saintId===row.saintId&&["25","26"].includes(matches[0].effectiveVitrine??"");}
