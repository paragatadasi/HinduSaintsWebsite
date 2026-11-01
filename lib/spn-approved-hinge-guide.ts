import packet from "../data/museum/spn-hinge-approved-guide-v2.json";
import {createApprovedReceivingGuide} from "./museum-approved-receiving-guide";

export const approvedHingeGuide = createApprovedReceivingGuide({
  ...packet,
  groups: packet.groups.map(group => ({...group, kind: group.kind === "family" ? "family" as const : "city" as const})),
}, "0acd2cbaaf5beb551c3867fa68e202e94eb920672c6a7e335d7167ae9ee1e954");
