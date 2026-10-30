import { z } from "zod";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
const optionalPlace = z.string().trim().max(100).nullable().optional().transform(value => value || null);
export const guideDecisionInput = z.object({ museumId: z.literal("museum-spn"), guideVersion: z.string().min(1).max(200),
 contentDigest: z.string().regex(/^[a-f0-9]{64}$/), assignmentDigest: z.string().regex(/^[a-f0-9]{64}$/),
 suggestionId: z.string().min(1).max(300), expectedVersion: z.number().int().nonnegative(), clientRequestId: z.string().uuid(),
 decision: z.enum(["pending","deferred","declined","not_on_display"]), note: z.string().trim().max(2000).optional(),
 alternativeVitrine: optionalPlace, alternativeShelf: optionalPlace }).strict().superRefine((value,ctx)=>{
 if(value.decision==="not_on_display"&&!value.suggestionId.startsWith("row:"))ctx.addIssue({code:"custom",path:["suggestionId"],message:"Mark individual relic records as not on display."});
 if(value.alternativeShelf && !value.alternativeVitrine)ctx.addIssue({code:"custom",path:["alternativeShelf"],message:"Choose an alternative vitrine before adding its shelf."});
 if(value.decision!=="declined" && (value.alternativeVitrine || value.alternativeShelf))ctx.addIssue({code:"custom",path:["decision"],message:"An alternative destination belongs to a declined suggestion."});
});
type LayoutVitrine={number:string;availability:string;restriction:string};
export function availableDeclineAlternatives(layout:LayoutVitrine[]) {
 return [...new Set(layout.filter(v=>["existing","new"].includes(v.availability)&&v.restriction==="general").map(v=>v.number))];
}
export function assertDeclineAlternative(input:{alternativeVitrine:string|null},layout:LayoutVitrine[]){
 if(input.alternativeVitrine && !availableDeclineAlternatives(layout).includes(input.alternativeVitrine))throw new MuseumMoveSessionError(400,"Choose an available general-display vitrine. Future and special-housing cases need separate review.");
}

export function declineAlternativeValues(input:{decision:string;alternativeVitrine:string|null;alternativeShelf:string|null},
 before:{alternativeVitrine:string|null;alternativeShelf:string|null}|null, supplied:boolean){
 if(input.decision!=="declined")return {alternativeVitrine:null,alternativeShelf:null};
 return !supplied && before ? {alternativeVitrine:before.alternativeVitrine,alternativeShelf:before.alternativeShelf}
  : {alternativeVitrine:input.alternativeVitrine,alternativeShelf:input.alternativeShelf};
}
