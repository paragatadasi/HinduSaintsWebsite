import { spnV16Release } from "./spn-v16-release";
// The accepted default is shared by the proposal view and future move-session readers.
export const currentSpnProposalRelease = { ...spnV16Release, acceptedBaseline: true, proposal: {...spnV16Release.proposal, layout: {...spnV16Release.proposal.layout, vitrines:spnV16Release.proposal.layout.vitrines.map(v=>v.number==="83"?{...v,availability:"new"}:v)}} };

// Curator confirmed case 83 installed and usable on 2 November 2026; no contents inferred.
