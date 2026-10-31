import review from "../data/museum/spn-bimal-reviewed-assembly-v1.json";
import type {ReviewedHousingSource} from "./spn-paramanand-reviewed-object";
export const bimalAssemblyReview = review;
export function isReviewedBimalAssembly(source?: ReviewedHousingSource) {
 return !!source && source.sourceId === review.sourceId && source.saintId === review.saintId &&
  source.sourceRevision === review.sourceRevision && source.housingEvidenceRevision === review.housingEvidenceRevision && !source.identityChanged;
}
type Location = {kind?:string;code?:string;shelf?:string|null;museumId?:string}|null|undefined;
export function isReviewedBimalTransfer(source: ReviewedHousingSource|undefined, from:Location, to:Location) {
 return isReviewedBimalAssembly(source) && (!from?.museumId || from.museumId === "museum-spn") &&
  (!to?.museumId || to.museumId === "museum-spn") && from?.kind === "vitrine" &&
  from.code === review.origin && from.shelf === review.originShelf && to?.kind === "vitrine" && to.code === review.destination;
}
