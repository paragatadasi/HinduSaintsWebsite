export type ShuffleMissingRecord={
 sourceId:string;
 name:string;
 description:string;
 location:string;
 note:string|null;
 photos:{kind:"saint"|"relic";url:string;alt:string}[];
};
