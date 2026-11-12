import {MuseumIntakeError} from "./museum-intake-domain";

export function shuffleAttachmentUrl(row:{id?:unknown;fields?:Record<string,unknown>}, table:string, recordId:string, sourceId:string, attachmentId:string):URL {
 const fields=row.fields;
 if(row.id!==recordId||!fields||(table==="Relics"? !Array.isArray(fields.Saint)||!fields.Saint.includes(sourceId):table!=="Saints"||recordId!==sourceId))throw new MuseumIntakeError(404,"Photo no longer belongs to this record.");
 const field=fields[table==="Relics"?"Relic picture":"Relics Pictures (move to other table)"];
 const attachment=Array.isArray(field)?field.find(item=>item?.id===attachmentId):null;
 if(!attachment||typeof attachment.url!=="string")throw new MuseumIntakeError(404,"Photo unavailable.");
 let url:URL;
 try{url=new URL(attachment.url);}catch{throw new MuseumIntakeError(400,"Unsupported photo address.");}
 if(url.protocol!=="https:"||url.username||url.password||url.port||!url.hostname.endsWith(".airtableusercontent.com"))throw new MuseumIntakeError(400,"Unsupported photo address.");
 return url;
}
