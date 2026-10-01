type MirrorRow = {
  baseId: string; tableIdOrName: string; rawFieldsJson: unknown; importedAt: Date;
};
type FieldSummary = {
  name: string; presentRows: number; nonemptyRows: number; valueTypes: string[];
  linkedRecordArrayRows: number; largestLinkedRecordArray: number;
};
function nonempty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true; // false and zero are meaningful values
}

// Aggregate only. Never return raw values, record IDs, attachment URLs, or credentials.
export function auditMuseumMirror(rows: MirrorRow[]) {
  const tables = new Map<string, {
    baseId: string; table: string; rows: number; firstImport: string; latestImport: string;
    fields: Map<string, FieldSummary>
  }>();
  for (const row of rows) {
    const key = JSON.stringify([row.baseId, row.tableIdOrName]);
    const time = row.importedAt.toISOString();
    let table = tables.get(key);
    if (!table) {
      table = { baseId: row.baseId, table: row.tableIdOrName, rows: 0, firstImport: time, latestImport: time, fields: new Map() };
      tables.set(key, table);
    }
    table.rows++;
    table.firstImport = table.firstImport < time ? table.firstImport : time;
    table.latestImport = table.latestImport > time ? table.latestImport : time;
    const fields = row.rawFieldsJson;
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) continue;
    for (const [name, value] of Object.entries(fields)) {
      let field = table.fields.get(name);
      if (!field) {
        field = { name, presentRows: 0, nonemptyRows: 0, valueTypes: [], linkedRecordArrayRows: 0, largestLinkedRecordArray: 0 };
        table.fields.set(name, field);
      }
      field.presentRows++;
      if (nonempty(value)) field.nonemptyRows++;
      const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
      if (!field.valueTypes.includes(type)) field.valueTypes.push(type);
      if (Array.isArray(value) && value.length && value.every(v => typeof v === "string" && /^rec[a-zA-Z0-9]+$/.test(v))) {
        field.linkedRecordArrayRows++;
        field.largestLinkedRecordArray = Math.max(field.largestLinkedRecordArray, value.length);
      }
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    limitation: "Observed mirror fields only: absent fields or tables may be unconfigured, view-filtered, or empty in Airtable. This does not prove a complete base export. Linked-record arrays are inferred from value shape.",
    tables: [...tables.values()].sort((a,b) => a.baseId.localeCompare(b.baseId) || a.table.localeCompare(b.table)).map(table => ({
      ...table,
      fields: [...table.fields.values()].sort((a,b) => a.name.localeCompare(b.name)).map(field => ({
        ...field, missingRows: table.rows - field.presentRows, valueTypes: field.valueTypes.sort(),
        collectionFieldCandidate: /vitrine|relic|object|collection|shelf|storage|cabinet|location/i.test(field.name)
      }))
    }))
  };
}
