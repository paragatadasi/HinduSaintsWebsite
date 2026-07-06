import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportsDir = path.join(root, "exports");
const treeDir = path.join(exportsDir, "family-trees");
const membersPath = path.join(exportsDir, "airtable-saint-family-members.csv");
const edgesPath = path.join(exportsDir, "airtable-saint-family-relationship-edges.csv");
const visualsPath = path.join(exportsDir, "airtable-saint-family-tree-visuals.csv");

const NODE_W = 260;
const NODE_H = 112;
const X_GAP = 124;
const Y_GAP = 128;
const MARGIN_X = 78;
const HEADER_H = 150;
const PALETTE = ["#2b6cb0", "#b7791f", "#6b46c1", "#2f855a", "#c05621", "#0f766e", "#9f1239"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }
  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  const [rawHeaders, ...data] = rows;
  const headers = rawHeaders.map((h) => h.trim().replace(/^\uFEFF/, ""));
  return data
    .filter((r) => r.some((cell) => cell !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function splitIds(value) {
  return String(value || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars = 31) {
  const words = String(text || "").trim().replace(/\s+/g, " ").split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= maxChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function counts(values, limit = 3) {
  const map = new Map();
  for (const raw of values) {
    for (const value of String(raw || "").split(";").map((s) => s.trim()).filter(Boolean)) {
      map.set(value, (map.get(value) || 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit)
    .map(([k, v]) => `${k} (${v})`).join(", ");
}

function parseYear(value) {
  const year = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(year) ? year : null;
}

function activeSpan(node) {
  const birthYear = parseYear(node.BirthYear);
  const samadhiYear = parseYear(node.SamadhiYear);
  if (birthYear === null && samadhiYear === null) return null;
  const start = birthYear ?? samadhiYear - 80;
  const end = samadhiYear ?? birthYear + 80;
  return { start, end, midpoint: (start + end) / 2 };
}

function spansOverlapOrTouch(a, b, toleranceYears = 20) {
  return a.start <= b.end + toleranceYears && b.start <= a.end + toleranceYears;
}

function hasAlternatePath(edges, from, to, ignoredEdgeKey) {
  const children = new Map();
  for (const edge of edges) {
    const key = `${edge.from}->${edge.to}`;
    if (key === ignoredEdgeKey) continue;
    if (!children.has(edge.from)) children.set(edge.from, []);
    children.get(edge.from).push(edge.to);
  }
  const seen = new Set([from]);
  const queue = [...(children.get(from) || [])];
  while (queue.length) {
    const id = queue.shift();
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(children.get(id) || []));
  }
  return false;
}

function makeGroups(nodes, partnerEdges, depth, guruEdges) {
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (id) => {
    while (parent.get(id) !== id) {
      parent.set(id, parent.get(parent.get(id)));
      id = parent.get(id);
    }
    return id;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  for (const edge of partnerEdges) union(edge.from, edge.to);
  const grouped = new Map();
  for (const node of nodes) {
    const id = find(node.id);
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(node);
  }
  const internalGuruPairs = new Set(guruEdges.flatMap((e) => [`${e.from}->${e.to}`, `${e.to}->${e.from}`]));
  return [...grouped.values()].map((items) => {
    const itemIds = new Set(items.map((n) => n.id));
    const hasInternalGuruPair = items.some((a) =>
      items.some((b) => a.id !== b.id && itemIds.has(b.id) && internalGuruPairs.has(`${a.id}->${b.id}`))
    );
    const itemDepths = items.map((n) => depth.get(n.id) ?? 0);
    const row = hasInternalGuruPair ? Math.min(...itemDepths) : Math.max(...itemDepths);
    for (const n of items) depth.set(n.id, row);
    items.sort((a, b) => a.name.localeCompare(b.name));
    return { id: items.map((n) => n.id).sort().join("|"), items, row, x: 0, width: items.length * NODE_W + (items.length - 1) * 62 };
  });
}

function renderTree(familyId, nodes, allEdges, meta) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rawGuruEdges = nodes.flatMap((node) =>
    splitIds(node.Disciples).filter((id) => byId.has(id)).map((id) => ({ from: node.id, to: id }))
  );
  const seenGuru = new Set();
  const dedupedGuruEdges = [];
  for (const edge of rawGuruEdges) {
    const key = `${edge.from}->${edge.to}`;
    if (!seenGuru.has(key)) {
      seenGuru.add(key);
      dedupedGuruEdges.push(edge);
    }
  }
  rawGuruEdges.length = 0;
  rawGuruEdges.push(...dedupedGuruEdges);
  const partnerEdges = nodes.flatMap((node) =>
    splitIds(node.Partner).filter((id) => byId.has(id)).map((id) => ({ from: node.id, to: id }))
  );
  const incarnationEdges = nodes.flatMap((node) =>
    splitIds(node.Incarnation).filter((id) => byId.has(id)).map((id) => ({ from: node.id, to: id }))
  );

  for (const edge of allEdges) {
    if (!byId.has(edge.FromRecordId) || !byId.has(edge.ToRecordId)) continue;
    const relationshipType = String(edge.RelationshipType || "").trim();
    if (relationshipType === "Partner" && byId.has(edge.FromRecordId) && byId.has(edge.ToRecordId)) {
      partnerEdges.push({ from: edge.FromRecordId, to: edge.ToRecordId });
    } else if (relationshipType === "Incarnation" && byId.has(edge.FromRecordId) && byId.has(edge.ToRecordId)) {
      incarnationEdges.push({ from: edge.FromRecordId, to: edge.ToRecordId });
    }
  }

  const partnerPair = new Set(partnerEdges.flatMap((e) => [`${e.from}->${e.to}`, `${e.to}->${e.from}`]));
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  const nonPartnerGuruEdges = rawGuruEdges.filter((e) => !partnerPair.has(`${e.from}->${e.to}`));
  const shortcutEdges = nonPartnerGuruEdges.filter((edge) =>
    hasAlternatePath(nonPartnerGuruEdges, edge.from, edge.to, `${edge.from}->${edge.to}`)
  );
  const shortcutEdgeKeys = new Set(shortcutEdges.map((edge) => `${edge.from}->${edge.to}`));
  const rankingEdges = nonPartnerGuruEdges.filter((edge) => !shortcutEdgeKeys.has(`${edge.from}->${edge.to}`));
  const terminalOutlierIds = new Set();
  for (let pass = 0; pass < nodes.length; pass += 1) {
    for (const edge of rankingEdges) {
      depth.set(edge.to, Math.max(depth.get(edge.to) ?? 0, (depth.get(edge.from) ?? 0) + 1));
    }
  }

  const preliminaryRoots = nodes.filter((n) => !rankingEdges.some((e) => e.to === n.id)).map((n) => n.id);
  const preliminaryRootSet = new Set(preliminaryRoots);
  const rankingChildren = new Map(nodes.map((n) => [n.id, []]));
  for (const edge of rankingEdges) rankingChildren.get(edge.from)?.push(edge.to);
  const maxDepth = Math.max(...nodes.map((n) => depth.get(n.id) ?? 0), 0);
  if (maxDepth >= 3) {
    const terminalSpans = nodes
      .filter((node) => (rankingChildren.get(node.id) || []).length === 0 && (depth.get(node.id) ?? 0) === maxDepth)
      .map(activeSpan)
      .filter(Boolean);
    for (const node of nodes) {
      const incoming = rankingEdges.filter((edge) => edge.to === node.id);
      const nodeSpan = activeSpan(node);
      const overlapsTerminalCohort = nodeSpan && terminalSpans.some((span) => spansOverlapOrTouch(nodeSpan, span));
      const isDirectRootLeaf =
        incoming.length === 1 &&
        preliminaryRootSet.has(incoming[0].from) &&
        (rankingChildren.get(node.id) || []).length === 0 &&
        !splitIds(node.Partner).some((id) => byId.has(id)) &&
        overlapsTerminalCohort;
      if (isDirectRootLeaf) {
        depth.set(node.id, maxDepth);
        terminalOutlierIds.add(node.id);
      }
    }
  }

  const groups = makeGroups(nodes, partnerEdges, depth, rankingEdges);
  const groupByNode = new Map();
  for (const group of groups) for (const item of group.items) groupByNode.set(item.id, group);
  const children = new Map(nodes.map((n) => [n.id, []]));
  for (const edge of rankingEdges) children.get(edge.from)?.push(edge.to);

  const memoSpan = new Map();
  const span = (id) => {
    if (memoSpan.has(id)) return memoSpan.get(id);
    const childGroups = [...new Set((children.get(id) || []).map((child) => groupByNode.get(child)?.id).filter(Boolean))];
    const total = Math.max(1, childGroups.reduce((sum, gid) => {
      const child = groups.find((g) => g.id === gid);
      return sum + Math.max(child.width / (NODE_W + X_GAP), ...child.items.map((n) => span(n.id)));
    }, 0));
    memoSpan.set(id, total);
    return total;
  };

  groups.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    const aParent = rankingEdges.find((e) => groupByNode.get(e.to)?.id === a.id)?.from;
    const bParent = rankingEdges.find((e) => groupByNode.get(e.to)?.id === b.id)?.from;
    const ax = aParent ? (groupByNode.get(aParent)?.x ?? 0) : 0;
    const bx = bParent ? (groupByNode.get(bParent)?.x ?? 0) : 0;
    return ax - bx || a.id.localeCompare(b.id);
  });

  const rows = new Map();
  for (const group of groups) {
    if (!rows.has(group.row)) rows.set(group.row, []);
    rows.get(group.row).push(group);
  }
  let maxWidth = 0;
  for (const [row, rowGroups] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const weighted = rowGroups.map((g) => ({ group: g, weight: Math.max(g.width / (NODE_W + X_GAP), ...g.items.map((n) => span(n.id))) }));
    weighted.sort((a, b) => {
      if (row === 0) {
        const rootSkipScore = (group) =>
          group.items.reduce((sum, item) =>
            sum + rankingEdges
              .filter((edge) => edge.from === item.id)
              .reduce((edgeSum, edge) => edgeSum + Math.max(0, (depth.get(edge.to) ?? 0) - (depth.get(edge.from) ?? 0) - 1), 0),
          0);
        const skipDiff = rootSkipScore(b.group) - rootSkipScore(a.group);
        if (skipDiff !== 0) return skipDiff;
      }
      const aOutlier = a.group.items.some((item) => terminalOutlierIds.has(item.id));
      const bOutlier = b.group.items.some((item) => terminalOutlierIds.has(item.id));
      if (aOutlier !== bOutlier) return aOutlier ? -1 : 1;
      const pa = rankingEdges.find((e) => groupByNode.get(e.to)?.id === a.group.id)?.from;
      const pb = rankingEdges.find((e) => groupByNode.get(e.to)?.id === b.group.id)?.from;
      return (pa ? (groupByNode.get(pa)?.x ?? 0) : 0) - (pb ? (groupByNode.get(pb)?.x ?? 0) : 0)
        || a.group.id.localeCompare(b.group.id);
    });
    const totalW = weighted.reduce((sum, item) => sum + item.group.width, 0) + (weighted.length - 1) * X_GAP;
    let x = MARGIN_X;
    for (const item of weighted) {
      item.group.x = x;
      x += item.group.width + X_GAP;
    }
    maxWidth = Math.max(maxWidth, totalW + MARGIN_X * 2);
  }

  for (let iter = 0; iter < 5; iter += 1) {
    for (const group of groups.filter((g) => g.row > 0)) {
      const parents = rankingEdges.filter((e) => groupByNode.get(e.to)?.id === group.id).map((e) => groupByNode.get(e.from)).filter(Boolean);
      if (!parents.length) continue;
      const desiredCenter = parents.reduce((sum, g) => sum + g.x + g.width / 2, 0) / parents.length;
      group.x = Math.max(MARGIN_X, desiredCenter - group.width / 2);
    }
    for (const [, rowGroups] of rows) {
      rowGroups.sort((a, b) => {
        const aOutlier = a.items.some((item) => terminalOutlierIds.has(item.id));
        const bOutlier = b.items.some((item) => terminalOutlierIds.has(item.id));
        if (aOutlier !== bOutlier) return aOutlier ? -1 : 1;
        return a.x - b.x;
      });
      let cursor = MARGIN_X;
      for (const group of rowGroups) {
        if (group.x < cursor) group.x = cursor;
        cursor = group.x + group.width + X_GAP;
        maxWidth = Math.max(maxWidth, cursor + MARGIN_X);
      }
    }
  }

  const maxRow = Math.max(...groups.map((g) => g.row), 0);
  const width = Math.ceil(maxWidth);
  const height = HEADER_H + (maxRow + 1) * (NODE_H + Y_GAP) + 90;
  const nodePos = new Map();
  for (const group of groups) {
    group.items.forEach((node, index) => {
      nodePos.set(node.id, {
        x: group.x + index * (NODE_W + 62),
        y: HEADER_H + group.row * (NODE_H + Y_GAP),
      });
    });
  }

  const rootIds = nodes.filter((n) => !rankingEdges.some((e) => e.to === n.id)).map((n) => n.id);
  const rootFor = new Map();
  const assignRoot = (id, rootId) => {
    if (rootFor.has(id)) return;
    rootFor.set(id, rootId);
    for (const child of children.get(id) || []) assignRoot(child, rootId);
  };
  rootIds.forEach((id) => assignRoot(id, id));
  const rootIndex = new Map(rootIds.map((id, i) => [id, i]));

  const edgeParts = [];
  const nodeBounds = [...nodePos.values()].map((p) => ({ x1: p.x, x2: p.x + NODE_W, y1: p.y, y2: p.y + NODE_H }));
  function edgePath(from, to, color, marker, dash = "", opacity = "0.86") {
    const a = nodePos.get(from);
    const b = nodePos.get(to);
    if (!a || !b) return "";
    const ax = a.x + NODE_W / 2;
    const ay = a.y + NODE_H;
    const bx = b.x + NODE_W / 2;
    const by = b.y;
    const minY = Math.min(ay, by);
    const maxY = Math.max(ay, by);
    const between = nodeBounds.some((r) => r.y1 > minY + 6 && r.y2 < maxY - 6 && Math.max(Math.min(ax, bx), r.x1) < Math.min(Math.max(ax, bx), r.x2));
    let d;
    if (between || Math.abs((depth.get(to) ?? 0) - (depth.get(from) ?? 0)) > 1) {
      const side = ax < width / 2 ? MARGIN_X / 2 : Math.max(width - MARGIN_X / 2, ax, bx);
      const midY = ay + 44;
      d = `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${ax.toFixed(1)} ${midY.toFixed(1)} L ${side.toFixed(1)} ${midY.toFixed(1)} L ${side.toFixed(1)} ${(by - 44).toFixed(1)} L ${bx.toFixed(1)} ${(by - 44).toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`;
    } else {
      const c1y = ay + Math.max(40, (by - ay) * 0.45);
      const c2y = by - Math.max(40, (by - ay) * 0.45);
      d = `M ${ax.toFixed(1)} ${ay.toFixed(1)} C ${ax.toFixed(1)} ${c1y.toFixed(1)}, ${bx.toFixed(1)} ${c2y.toFixed(1)}, ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" ${dash} ${marker ? `marker-end="url(#${marker})"` : ""} opacity="${opacity}"/>`;
  }

  rankingEdges.forEach((edge) => {
    const color = PALETTE[rootIndex.get(rootFor.get(edge.from)) % PALETTE.length] || PALETTE[0];
    edgeParts.push(edgePath(edge.from, edge.to, color, `arrow-${PALETTE.indexOf(color)}`));
  });
  const seenPartner = new Set();
  for (const edge of partnerEdges) {
    const key = [edge.from, edge.to].sort().join("|");
    if (seenPartner.has(key)) continue;
    seenPartner.add(key);
    const a = nodePos.get(edge.from);
    const b = nodePos.get(edge.to);
    if (!a || !b) continue;
    edgeParts.push(`<line x1="${(a.x + NODE_W / 2).toFixed(1)}" y1="${(a.y + NODE_H / 2).toFixed(1)}" x2="${(b.x + NODE_W / 2).toFixed(1)}" y2="${(b.y + NODE_H / 2).toFixed(1)}" stroke="#b45376" stroke-width="2.6" stroke-dasharray="8 6" opacity="0.9"/>`);
  }
  const seenInc = new Set();
  for (const edge of incarnationEdges) {
    const key = [edge.from, edge.to].sort().join("|");
    if (seenInc.has(key)) continue;
    seenInc.add(key);
    const a = nodePos.get(edge.from);
    const b = nodePos.get(edge.to);
    if (!a || !b) continue;
    edgeParts.push(`<line x1="${(a.x + NODE_W / 2).toFixed(1)}" y1="${(a.y + NODE_H / 2).toFixed(1)}" x2="${(b.x + NODE_W / 2).toFixed(1)}" y2="${(b.y + NODE_H / 2).toFixed(1)}" stroke="#2f855a" stroke-width="3" stroke-dasharray="5 10" opacity="0.9"/>`);
  }

  const nodeParts = nodes.map((node) => {
    const p = nodePos.get(node.id);
    const hasChildren = (children.get(node.id) || []).length > 0;
    const hasPartner = splitIds(node.Partner).some((id) => byId.has(id));
    const isRoot = rootIds.includes(node.id) && (hasChildren || !hasPartner);
    const fill = isRoot ? "#fff3c4" : hasChildren ? "#dceeff" : "#ffffff";
    const stroke = isRoot ? "#b7791f" : hasChildren ? "#2b6cb0" : "#c8c2b8";
    const weight = isRoot ? "700" : "600";
    const lines = wrapText(node.name);
    const dateRange = [node.BirthYear, node.SamadhiYear].filter(Boolean).join("-");
    const label = [isRoot ? "head" : hasChildren ? "subgroup" : "", dateRange, node.Sampradaya].filter(Boolean).join(" | ");
    return `<g transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})"><rect width="${NODE_W}" height="${NODE_H}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="1.7" filter="url(#shadow)"/>${lines.map((line, i) => `<text x="14" y="${24 + i * 16}" font-family="Arial" font-size="13" font-weight="${weight}" fill="#111827">${esc(line)}</text>`).join("")}${label ? `<text x="14" y="99" font-family="Arial" font-size="11" fill="#56616f">${esc(label)}</text>` : ""}</g>`;
  });

  const defs = `<defs>${PALETTE.map((color, i) => `<marker id="arrow-${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${color}"/></marker>`).join("")}<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#1f2937" flood-opacity="0.16"/></filter></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${defs}<rect width="${width}" height="${height}" fill="#f7f3eb"/><text x="70" y="44" font-family="Georgia,serif" font-size="30" font-weight="700" fill="#1f2933">${esc(familyId)} - ${nodes.length} saints</text><text x="70" y="76" font-family="Arial" font-size="15" fill="#4b5563">${esc(meta.states)}</text><text x="70" y="99" font-family="Arial" font-size="15" fill="#4b5563">${esc([meta.regions, meta.sampradayas].filter(Boolean).join(" | "))}</text><g id="edges">${edgeParts.join("")}</g><g id="nodes">${nodeParts.join("")}</g></svg>`;
}

const members = parseCsv(fs.readFileSync(membersPath, "utf8"));
const edges = parseCsv(fs.readFileSync(edgesPath, "utf8"));
const byFamily = new Map();
for (const row of members) {
  if (!byFamily.has(row.FamilyID)) byFamily.set(row.FamilyID, []);
  const states = splitIds(row.NormalizedPlaces)
    .map((place) => place.split(",").map((part) => part.trim()))
    .map((parts) => parts.length >= 3 ? parts[parts.length - 2] : "")
    .filter(Boolean)
    .join("; ");
  byFamily.get(row.FamilyID).push({
    id: row.RecordId,
    name: row.Name.trim(),
    Disciples: row.Disciples,
    Partner: row.Partner,
    Incarnation: row.Incarnation,
    BirthDate: row.BirthDate,
    SamadhiDate: row.SamadhiDate,
    BirthYear: row.BirthYear,
    SamadhiYear: row.SamadhiYear,
    Sampradaya: row.Sampradaya,
    State: states,
    SpiritualRegion: row.SpiritualRegion,
  });
}

fs.mkdirSync(treeDir, { recursive: true });
const visuals = [["FamilyID", "SaintCount", "TreeFile", "States", "SpiritualRegions", "Sampradayas"]];
const cards = [];
for (const [familyId, nodes] of [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (nodes.length < 4) continue;
  const familyEdges = edges.filter((e) => nodes.some((n) => n.id === e.FromRecordId) && nodes.some((n) => n.id === e.ToRecordId));
  const meta = {
    states: counts(nodes.map((n) => n.State)),
    regions: counts(nodes.map((n) => n.SpiritualRegion)),
    sampradayas: counts(nodes.map((n) => n.Sampradaya)),
  };
  const svg = renderTree(familyId, nodes, familyEdges, meta);
  const fileName = `${familyId.toLowerCase()}-tree.svg`;
  fs.writeFileSync(path.join(treeDir, fileName), svg);
  const size = svg.match(/width="(\d+)" height="(\d+)"/);
  visuals.push([familyId, nodes.length, `family-trees/${fileName}`, meta.states, meta.regions, meta.sampradayas]);
  cards.push({ familyId, count: nodes.length, fileName, width: size[1], height: size[2], meta });
}

fs.writeFileSync(visualsPath, visuals.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n");

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Saint Family Trees</title><style>:root{color-scheme:light}body{margin:0;background:#f7f3eb;color:#1f2933;font-family:Arial,sans-serif}main{max-width:1240px;margin:0 auto;padding:32px 24px 60px}h1{font-family:Georgia,serif;font-size:34px;margin:0 0 8px}p{color:#4b5563;line-height:1.5}.card{background:#fff;border:1px solid #d8d0c4;border-radius:8px;margin:22px 0;padding:16px;box-shadow:0 2px 10px rgba(31,41,55,.08)}.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}h2{margin:0 0 8px;font-size:22px}.meta{font-size:14px;color:#4b5563}.tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.tools button{border:1px solid #b9b0a3;background:#fffdf8;border-radius:6px;padding:7px 10px;font-weight:600;color:#1f2933;cursor:pointer}.zoom-label{min-width:46px;text-align:center;color:#4b5563;font-size:13px}.tree{width:100%;height:min(78vh,790px);overflow:auto;border:1px solid #e5ded4;border-radius:6px;background:#f7f3eb}.tree img{display:block;width:100%;height:auto;transform-origin:top left}.hint{font-size:13px;color:#6b7280;margin-top:8px}</style></head><body><main><h1>Saint Family Trees</h1><p>Families with at least 4 members. Colored arrows show guru-disciple lineages, pink dashed lines show partner links, and green dotted lines show incarnation associations. Guru-disciple rows are preserved except for partner/Guru Ma pair placement.</p>${cards.map((card) => `<section class="card" data-zoom="1" data-natural-width="${card.width}"><div class="card-head"><div><h2>${esc(card.familyId)} - ${card.count} saints</h2><div class="meta">${esc([card.meta.states, card.meta.regions, card.meta.sampradayas].filter(Boolean).join(" | "))}</div></div><div class="tools"><button data-zoom="fit">Fit</button><button data-zoom="actual">100%</button><button data-zoom="out">-</button><span class="zoom-label">100%</span><button data-zoom="in">+</button></div></div><div class="tree"><img src="${card.fileName}" width="${card.width}" height="${card.height}" alt="${esc(card.familyId)} family tree"></div><div class="hint">Colored arrows: guru-disciple lineages. Pink dashed: partner. Green dotted: incarnation association.</div></section>`).join("\n")}</main><script>document.querySelectorAll('.card').forEach(card=>{const img=card.querySelector('img'),label=card.querySelector('.zoom-label'),tree=card.querySelector('.tree');let z=1;function fit(){z=Math.min(1,tree.clientWidth/Number(card.dataset.naturalWidth));apply()}function apply(){img.style.width=(Number(card.dataset.naturalWidth)*z)+'px';label.textContent=Math.round(z*100)+'%'}card.querySelector('[data-zoom="fit"]').onclick=fit;card.querySelector('[data-zoom="actual"]').onclick=()=>{z=1;apply()};card.querySelector('[data-zoom="in"]').onclick=()=>{z=Math.min(2.5,z+.15);apply()};card.querySelector('[data-zoom="out"]').onclick=()=>{z=Math.max(.2,z-.15);apply()};setTimeout(fit,0);});</script></body></html>`;
fs.writeFileSync(path.join(treeDir, "index.html"), html);

console.log(`Generated ${cards.length} family tree SVGs.`);
