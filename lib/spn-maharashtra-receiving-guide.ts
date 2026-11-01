import packet from "../data/museum/spn-missing-receivers-guide-v1.json";
import {createApprovedReceivingGuide} from "./museum-approved-receiving-guide";

export const maharashtraReceivingGuide=createApprovedReceivingGuide({
 ...packet,
 groups:packet.groups.map(group=>({...group,kind:group.kind==="family"?"family" as const:"city" as const})),
},"7a4aeae9021e33ba7401e6f8aebc10d5dde6cbf0c907f6d7542657a02e59e50d");
