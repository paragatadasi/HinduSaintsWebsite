import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function parseArgs(argv) {
  const options = {
    owner: process.env.USERNAME || process.env.USER || "agent",
    summary: [],
    migrations: "none",
    env: "none",
    data: "none",
    shared: "none",
    conflicts: "none",
    verification: "`npm run dev:check`: passed",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--summary" && next) {
      options.summary.push(next);
      index += 1;
    } else if (arg === "--owner" && next) {
      options.owner = next;
      index += 1;
    } else if (arg === "--migrations" && next) {
      options.migrations = next;
      index += 1;
    } else if (arg === "--env" && next) {
      options.env = next;
      index += 1;
    } else if (arg === "--data" && next) {
      options.data = next;
      index += 1;
    } else if (arg === "--shared" && next) {
      options.shared = next;
      index += 1;
    } else if (arg === "--conflicts" && next) {
      options.conflicts = next;
      index += 1;
    } else if (arg === "--verification" && next) {
      options.verification = next;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Create a release handoff for the current branch.

Usage:
  npm run release:handoff -- --summary "Adds map timeline filtering" --shared "styles/globals.css"

Options:
  --summary <text>       Summary bullet. Repeat for multiple bullets.
  --owner <text>         Agent/task name. Defaults to current OS user.
  --migrations <text>    Migration notes. Defaults to none.
  --env <text>           Environment variable notes. Defaults to none.
  --data <text>          Data/backfill/release notes. Defaults to none.
  --shared <text>        Shared areas touched. Defaults to none.
  --conflicts <text>     Expected conflicts. Defaults to none.
  --verification <text>  Verification line. Defaults to dev:check passed.
`);
}

const options = parseArgs(process.argv.slice(2));
const branch = git(["branch", "--show-current"]);
if (!branch) {
  throw new Error("Release handoffs require a named branch, not detached HEAD.");
}
if (branch === "main" || branch === "deploy") {
  throw new Error("Create release handoffs from a feature branch, not main or deploy.");
}

const status = git(["status", "--porcelain=v1", "-uall"]);
if (status) {
  throw new Error("Working tree must be clean before creating a handoff. Commit the deployable code first.");
}

const commit = git(["rev-parse", "HEAD"]);
const safeBranchName = branch.replaceAll("/", "-");
const handoffDir = path.join("docs", "release-handoffs");
const handoffPath = path.join(handoffDir, `${safeBranchName}.md`);
if (existsSync(handoffPath)) {
  throw new Error(`Handoff already exists: ${handoffPath}`);
}

mkdirSync(handoffDir, { recursive: true });

const summaries = options.summary.length ? options.summary : ["<describe the deployable change>"];
const summaryLines = summaries.map((summary) => `- ${summary}`).join("\n");

const content = `# Release Handoff: ${branch}

- Status: ready
- Branch: \`${branch}\`
- Commit: \`${commit}\`
- Owner/agent: \`${options.owner}\`

## Summary

${summaryLines}

## Verification

- ${options.verification}

## Deploy Notes

- Migrations: ${options.migrations}
- Environment variables: ${options.env}
- Data/backfill/release steps: ${options.data}

## Risk And Conflicts

- Shared areas touched: ${options.shared}
- Expected conflicts: ${options.conflicts}
- Rollback notes: revert \`${commit.slice(0, 7)}\` and any dependent release commits

## Release Captain Notes

- Integrated into \`main\`: pending
- Pushed to \`main\`: no
- Merged to \`deploy\`: pending
- Production workflow: pending
`;

writeFileSync(handoffPath, content, "utf8");

console.log(`Created ${handoffPath}`);
console.log(`Branch: ${branch}`);
console.log(`Commit: ${commit}`);
console.log("");
console.log("Next:");
console.log(`  git add ${handoffPath}`);
console.log(`  git commit -m "Add ${safeBranchName} release handoff"`);
console.log(`  git push origin ${branch}`);
