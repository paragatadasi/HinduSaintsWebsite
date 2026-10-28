import { starterAmendedProposal as previous } from './spn-starter-amended-proposal-v4';
import adjustments from '../data/museum/spn-starter-curator-adjustments-v1.json';
const destinations:Record<string,string>=adjustments.destinations;
export const starterAmendedProposal={...previous,rows:previous.rows.map(row=>({...row,
 ...(destinations[row.sourceId]?{vitrine:destinations[row.sourceId]}:{}),
 ...(adjustments.privateSourceIds.includes(row.sourceId)?{movementBlockedReason:adjustments.privateHoldReason}:{})}))};
