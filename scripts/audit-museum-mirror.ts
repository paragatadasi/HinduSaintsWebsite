import { db } from "../lib/db";
import { auditMuseumMirror } from "../lib/museum-mirror-audit";

// Run with an approved read-only database connection. No Airtable fetch or database writes.
try {
  const report = await db.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await tx.airtableMirrorRecord.findMany({
      select: { baseId: true, tableIdOrName: true, rawFieldsJson: true, importedAt: true }
    });
    return auditMuseumMirror(rows);
  }, { isolationLevel: "RepeatableRead", timeout: 60000 });
  console.log(JSON.stringify(report, null, 2));
} finally {
  await db.$disconnect();
}
