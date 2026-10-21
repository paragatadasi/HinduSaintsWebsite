import {z} from "zod";
export type CuratorReviewOption={id:string;label:string;description?:string;changes:{field:string;before:string;after:string}[];requiresIdentityLink:boolean;unavailableReason?:string};
export type CuratorReviewCase={caseId:string;revision:string;title:string;question:string;uncertainty?:string;sourceDetails?:{name:string;place:string;relic:string};status:"pending"|"unsure"|"different"|"resolved"|"blocked";note?:string;blockedReason?:string;sourceLabel:string;locationLabel:string;evidence:{label:string;url:string}[];options:CuratorReviewOption[];saintId?:string;portraitContext?:"website_candidate"};
export type CuratorReviewQueue={version:string;cases:CuratorReviewCase[];resolvedCount:number};
export const curatorReviewInput=z.object({caseId:z.string().min(1).max(200),revision:z.string().regex(/^[a-f0-9]{64}$/),decision:z.enum(["confirm_supported","different","unsure"]),explicitChoiceId:z.string().max(200).optional(),note:z.string().trim().max(4000).optional(),confirmIdentityLink:z.boolean().optional()}).strict().superRefine((value,ctx)=>{
 if(value.decision==="confirm_supported"&&!value.explicitChoiceId)ctx.addIssue({code:"custom",path:["explicitChoiceId"],message:"Choose the supported identity and museum proposal."});
 if(value.decision!=="confirm_supported"&&!value.note)ctx.addIssue({code:"custom",path:["note"],message:"Leave a note for the next reviewer."});
});
export type CuratorReviewInput=z.infer<typeof curatorReviewInput>;
