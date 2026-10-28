import { spnV16Release } from "./spn-v16-release";
// The accepted default is shared by the proposal view and future move-session readers.
export const currentSpnProposalRelease = { ...spnV16Release, acceptedBaseline: true };
