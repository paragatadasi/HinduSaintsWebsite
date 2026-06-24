import "dotenv/config";
import { db } from "../lib/db";
import { runAirtableSaintsMissingDraftImport } from "../lib/airtable-saint-import";

function parseArgs(argv: string[]) {
  return {
    dryRun: !argv.includes("--write"),
    limit: numberArg(argv, "--limit")
  };
}

function numberArg(argv: string[], key: string) {
  const inline = argv.find((arg) => arg.startsWith(`${key}=`));
  const value = inline ? inline.split("=", 2)[1] : argv[argv.indexOf(key) + 1];
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await runAirtableSaintsMissingDraftImport(options);

  console.log(`${options.dryRun ? "Dry run: checked" : "Checked"} ${summary.mirrorRowsChecked} Airtable mirror saints.`);
  console.log(`${options.dryRun ? "Would create" : "Created"} ${summary.newDraftSaintsCreated} missing draft saints.`);
  console.log(`Existing Airtable-linked CMS saints skipped: ${summary.existingCmsSaintsSkipped}`);
  console.log(`Slug/name collisions skipped: ${summary.slugNameCollisionsSkipped}`);
  if (summary.errors.length > 0) {
    console.log(`Errors: ${summary.errors.length}`);
    summary.errors.forEach((error) => console.log(`- ${error}`));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
