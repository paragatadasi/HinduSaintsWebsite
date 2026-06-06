import { confidenceForNameMatch } from "../lib/reconciliation";

const [extractedName = "", candidateName = ""] = process.argv.slice(2);

console.log({
  extractedName,
  candidateName,
  confidence: confidenceForNameMatch(extractedName, candidateName)
});
