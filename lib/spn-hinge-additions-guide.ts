import {createHash} from "node:crypto";
import packet from "../data/museum/spn-east-north-accepted-additions-v1.json";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {StarterMoveGuide} from "./spn-move-guide";

const rows = packet.rows.filter(row => packet.activeSourceIds.includes(row.sourceId) && (row.proposedVitrine === "8" || row.proposedVitrine === "9"));
const expected = ["recsDSL4ZC6AAyqLs", "rec2zMgJxQnGPmsC8", "recNCHFgORFcwkPZW"];
if (rows.length !== 3 || expected.some(id => !rows.some(row => row.sourceId === id))) throw new Error("The approved hinge supplement changed.");
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const hingeAdditionsGuideContext = {
  guideVersion: "spn-hinge-additions-2026-11-01-v1",
  contentDigest: hash(rows),
  assignmentDigest: hash(rows.map(row => [row.sourceId, row.proposedVitrine]).sort()),
};
export const hingeAdditionsGuideDefinition: GuideDefinition = {
  context: hingeAdditionsGuideContext,
  suggestions: rows.map(row => ({id: `row:${row.sourceId}`, kind: "row", sourceIds: [row.sourceId], targetVitrine: row.proposedVitrine!})),
  physicalScope: {allowClear: false, preparationVitrines: ["8", "9"], destinations: Object.fromEntries(rows.map(row => [row.sourceId, row.proposedVitrine!]))},
};
// Saved curator additions populate this supplement; the full cases are not allocated here.
export const hingeAdditionsMoveGuide: StarterMoveGuide = {
  version: hingeAdditionsGuideContext.guideVersion,
  ...hingeAdditionsGuideContext,
  proposalVersion: packet.version,
  title: "Hinge additions",
  phaseLabel: "Hinge additions",
  allowClear: false,
  receivingOnly: true,
  preparationVitrines: ["8", "9"],
  entries: [],
  vitrines: ["8", "9"].map(code => ({code, summary: "Approved additions · full case allocation to review", families: [], cityGroups: []})),
  alternatives: [],
  reportedPlacements: [],
};
