import assert from "node:assert/strict";
import test from "node:test";
import { assertIntakeEditable, assertIntakeSubmission, museumIntakeFields, reviewMuseumIntakeInput, intakeDeliverySummary, intakeRetryTargets } from "./museum-intake-domain";

test("reported geography and uncertain dates remain raw evidence", () => {
  const fields = { saintName: " Guru ", relicDescription: "cloth", birthDateRaw: "circa 1700?", samadhiDateRaw: "Still alive", saintPlaceRaw: "collection place / saint place?" };
  assert.deepEqual(museumIntakeFields.parse(fields), fields);
  assert.doesNotThrow(() => museumIntakeFields.parse({ saintName: "", relicDescription: "" }));
});
test("submission needs a relic photo, not merely an optional portrait", () => {
  const fields = { saintName: "Guru", relicDescription: "cloth" };
  assert.throws(() => assertIntakeSubmission(fields, [{ kind: "saint_portrait" }]), /photo of the relic/);
  assert.throws(() => assertIntakeSubmission({ ...fields, saintName: " " }, [{ kind: "relic" }]), /name/);
  assert.doesNotThrow(() => assertIntakeSubmission(fields, [{ kind: "relic" }]));
});
test("approval requires an explicit identity decision, and approved content is locked", () => {
  assert.equal(reviewMuseumIntakeInput.safeParse({ action: "approve", expectedVersion: 3 }).success, false);
  assert.equal(reviewMuseumIntakeInput.safeParse({ action: "approve", expectedVersion: 3, saintDecision: { kind: "new_draft" } }).success, true);
  assert.throws(() => assertIntakeEditable("approved"));
  assert.throws(() => assertIntakeEditable("submitted"));
  assert.doesNotThrow(() => assertIntakeEditable("needs_changes"));
  assert.equal(reviewMuseumIntakeInput.safeParse({ action: "request_changes", expectedVersion: 3, note: " " }).success, false);
});
test("partial delivery never retries a successful target or a timed-out unknown result", () => {
  const deliveries = [{ target: "website", status: "succeeded" }, { target: "official_airtable", status: "failed" }];
  assert.equal(intakeDeliverySummary(deliveries), "partial_success");
  assert.deepEqual(intakeRetryTargets(deliveries), ["official_airtable"]);
  assert.deepEqual(intakeRetryTargets([{ target: "official_airtable", status: "unknown" }]), []);
  assert.equal(intakeDeliverySummary([{ status: "unknown" }]), "needs_delivery_check");
  assert.equal(intakeDeliverySummary([{ status: "blocked_configuration" }, { status: "blocked_configuration" }]), "configuration_required");
});
