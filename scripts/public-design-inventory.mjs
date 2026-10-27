import { readFile, writeFile } from "node:fs/promises";

const source = (await readFile("styles/tokens.css", "utf8")).replaceAll("\r\n", "\n");
const tokens = [];
for (const block of source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  for (const declaration of block[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.push({ selector: block[1].trim(), name: declaration[1], value: declaration[2].trim() });
  }
}
const output = `${JSON.stringify(tokens, null, 2)}\n`;
const path = "lib/design-system/tokens.generated.json";
if (process.argv.includes("--check")) {
  if ((await readFile(path, "utf8")).replaceAll("\r\n", "\n") !== output) throw new Error("Token inventory is stale. Run npm run design:inventory.");
  console.log(`Token inventory matches styles/tokens.css (${tokens.length} declarations).`);
} else {
  await writeFile(path, output);
  console.log(`Recorded ${tokens.length} token declarations from styles/tokens.css.`);
}
