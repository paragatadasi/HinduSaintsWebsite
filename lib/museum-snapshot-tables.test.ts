import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MUSEUM_SNAPSHOT_ENTRY_POINTS, MUSEUM_SNAPSHOT_TABLES } from "./museum-snapshot-tables";

// Conservative static dependency heuristic, supplemented by runtime SQL coverage
// and installed-trigger checks in the disposable database verifier.
const root = process.cwd();
const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const models = new Map([...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map(match => [match[1], match[2]]));

// Relation field name -> target models (e.g. "aliases" -> SaintAlias).
const relations = new Map<string, Set<string>>();
for (const body of models.values()) {
  for (const line of body.split("\n")) {
    const [field, type] = line.trim().split(/\s+/);
    const target = type?.replace(/[?[\]]/g, "");
    if (field && target && models.has(target)) relations.set(field, (relations.get(field) ?? new Set()).add(target));
  }
}

function resolveImport(from: string, specifier: string) {
  const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2))
    : specifier.startsWith(".") ? path.resolve(path.dirname(from), specifier) : null;
  if (!base) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && /\.tsx?$/.test(candidate)) return candidate;
  }
  return null;
}

// Over-approximates on purpose: every module reachable by import from the entry points, every Prisma read in it,
// and every relation key used inside include/select/where. An extra table only costs an extra rebuild.
function tracedTables() {
  const seen = new Set<string>();
  const tables = new Map<string, Set<string>>();
  const add = (table: string, file: string) => tables.set(table, (tables.get(table) ?? new Set()).add(path.relative(root, file)));
  const visit = (file: string) => {
    if (seen.has(file) || file.includes(`${path.sep}generated${path.sep}`) || file.endsWith(".test.ts")) return;
    seen.add(file);
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\b\w+\.(\w+)\.(?:findMany|findFirst|findUnique|findFirstOrThrow|findUniqueOrThrow|count|groupBy|aggregate)\b/g)) {
      const model = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      if (models.has(model)) add(model, file);
    }
    for (const match of source.matchAll(/\b(?:FROM|JOIN)\s+"(\w+)"/g)) if (models.has(match[1])) add(match[1], file);
    for (const match of source.matchAll(/\b(\w+)\s*:\s*(?:\{|true)/g)) {
      const targets = relations.get(match[1]);
      if (targets && /(include|select|where)\s*:/.test(source.slice(Math.max(0, match.index - 400), match.index))) {
        for (const target of targets) add(target, file);
      }
    }
    for (const match of source.matchAll(/(?:import|export)[^"']*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
      const resolved = resolveImport(file, match[1] ?? match[2]);
      if (resolved && resolved.startsWith(path.join(root, "lib"))) visit(resolved);
    }
  };
  for (const entry of MUSEUM_SNAPSHOT_ENTRY_POINTS) visit(path.join(root, entry));
  return { tables, files: seen.size };
}

test("statically discovered snapshot dependencies are listed for revision triggers", () => {
  const { tables, files } = tracedTables();
  assert.ok(files > 10, "the import trace should reach the snapshot's helper modules");
  const listed = new Set<string>([...MUSEUM_SNAPSHOT_TABLES, "MuseumDataRevision"]);
  const missing = [...tables].filter(([table]) => !listed.has(table))
    .map(([table, where]) => `${table} (read in ${[...where].join(", ")})`);
  assert.deepEqual(missing, [], `Add these to MUSEUM_SNAPSHOT_TABLES and a migration that attaches the revision triggers:\n${missing.join("\n")}`);
});

test("every listed table is a Prisma model", () => {
  assert.deepEqual(MUSEUM_SNAPSHOT_TABLES.filter(table => !models.has(table)), []);
});

test("the migrations attach the revision triggers to exactly the listed tables", () => {
  const migrations = path.join(root, "prisma/migrations");
  const triggered = new Set<string>();
  for (const name of fs.readdirSync(migrations).sort()) {
    const file = path.join(migrations, name, "migration.sql");
    if (!fs.existsSync(file)) continue;
    const sql = fs.readFileSync(file, "utf8");
    if (!sql.includes("museum_bump_revision")) continue;
    const loop = sql.match(/FOREACH t IN ARRAY ARRAY\[([\s\S]*?)\]\s*LOOP/);
    for (const match of (loop?.[1] ?? "").matchAll(/'(\w+)'/g)) triggered.add(match[1]);
  }
  assert.deepEqual([...triggered].sort(), [...MUSEUM_SNAPSHOT_TABLES].sort());
});
