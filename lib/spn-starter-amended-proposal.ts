import proposal from '../data/museum/spn-starter-reviewed-proposal-v16.json';
import addition from '../data/museum/spn-gauridasa-starter-addition-v1.json';

// This guide amendment does not rewrite the frozen proposal or saved arrangements.
export const starterAmendedProposal = {...proposal, rows: proposal.rows.map(row =>
 row.sourceId === addition.row.sourceId ? {...row, vitrine: addition.row.vitrine, tier: addition.row.tier, section: addition.row.section} : row)};
