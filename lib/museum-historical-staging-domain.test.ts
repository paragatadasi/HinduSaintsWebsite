import test from "node:test";
import assert from "node:assert/strict";
import { historicalStagingPreview, historicalStagingInput, assertHistoricalStagingSelection } from "./museum-historical-staging-domain";

const location = (code: string) => ({ kind: "vitrine" as const, code, label: `Vitrine ${code}` });
function row(id: string, code = "27") {
  return { sourceId: id, saintId: `saint-${id}`, name: id, current: location(code), original: location(code), currentBasis: "source",
    currentRevision: "a".repeat(64), sourceRevision: "b".repeat(64), currentVersion: 0,
    fixedHousing: false, identityChanged: false, verifiedItemIds: [] as string[] };
}
function input(preview: ReturnType<typeof historicalStagingPreview>) {
  return historicalStagingInput.parse({ action: "historical.staging.reconcile", museumId: "museum-spn",
    clientRequestId: "12345678-1234-4234-8234-123456789abc", expectedRevision: preview.revision,
    records: preview.eligible.map(({ name, from, ...record }) => record), reportedDate: "2026-10-29",
    historicalClearanceAcknowledged: true, currentStagingAcknowledged: true });
}
test("historical correction selects only source residuals and preserves placed, staged and unrelated rows", () => {
  const preview = historicalStagingPreview([row("residual"), { ...row("newly-placed"), currentBasis: "confirmed", currentVersion: 1 },
    { ...row("staged"), current: { kind: "table", code: "staging-area", label: "Staging area" }, currentBasis: "confirmed" }, row("other-case", "21")]);
  assert.deepEqual(preview.eligible.map(row => row.sourceId), ["residual"]);
  assert.equal(preview.preservedConfirmedCount, 2);
  assert.equal(preview.alreadyStagedCount, 1);
  assert.doesNotThrow(() => assertHistoricalStagingSelection(input(preview), preview));
});
test("restrictions are separate and never silently waived by the historical report", () => {
  const preview = historicalStagingPreview([{ ...row("fixed"), fixedHousing: true }, { ...row("items"), verifiedItemIds: ["item"] },
    { ...row("identity"), identityChanged: true }, { ...row("hold"), movementBlockedReason: "Duplicate observation" },
    { ...row("wrong-origin"), original: location("21") }]);
  assert.equal(preview.eligible.length, 0);
  assert.equal(preview.blocked.length, 5);
});
test("a later placement, changed source, missing or duplicate submitted record rejects the entire preview", () => {
  const rows = [row("one"), row("two")];
  const preview = historicalStagingPreview(rows), request = input(preview);
  for (const changed of [historicalStagingPreview([{ ...rows[0], currentBasis: "confirmed" }, rows[1]]),
    historicalStagingPreview([{ ...rows[0], sourceRevision: "c".repeat(64) }, rows[1]])])
    assert.throws(() => assertHistoricalStagingSelection(request, changed), /changed/);
  assert.throws(() => assertHistoricalStagingSelection({ ...request, records: request.records.slice(1) }, preview), /changed/);
  assert.throws(() => assertHistoricalStagingSelection({ ...request, records: [request.records[0], request.records[0]] }, preview), /changed/);
});
test("date, action, scope and both acknowledgements are required", () => {
  const request = input(historicalStagingPreview([row("one")]));
  for (const change of [{ reportedDate: "2026-02-30" }, { museumId: "museum-vrindavan" }, { action: "clear" },
    { historicalClearanceAcknowledged: false }, { currentStagingAcknowledged: false }, { clearedVitrines: ["27"] }])
    assert.equal(historicalStagingInput.safeParse({ ...request, ...change }).success, false);
});
