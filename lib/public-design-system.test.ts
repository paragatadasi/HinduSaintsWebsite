import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import test from "node:test";
import { publicDesignRegistry } from "./design-system/public-registry";

test("public inventory covers each domain component file and has valid sources", async () => {
  const sources = new Set(publicDesignRegistry.map((entry) => entry.source));
  assert.equal(new Set(publicDesignRegistry.map((entry) => entry.id)).size, publicDesignRegistry.length);
  for (const source of sources) await access(source);
  for (const folder of ["content", "layout", "saints", "traditions", "places", "instagram"]) {
    for (const file of await readdir(`components/${folder}`)) {
      if (file.endsWith(".tsx")) assert.ok(sources.has(`components/${folder}/${file}`), `Missing inventory entry: ${folder}/${file}`);
    }
  }
});

test("preview coverage points to a real specimen or an integration route", async () => {
  const specimens = await readFile("components/design-system/public-specimens.tsx", "utf8");
  for (const entry of publicDesignRegistry) {
    if (entry.coverage === "integration" || entry.example === "shell") continue;
    assert.ok(specimens.includes(`"${entry.example}"`), `Missing specimen: ${entry.id}`);
  }
});
