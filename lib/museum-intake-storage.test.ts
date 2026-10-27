import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { prepareIntakeImage, writePrivateIntakeImage, readPrivateIntakeImage, discardPrivateIntakeImage } from "./museum-intake-storage";

test("intake image decode verifies bytes, reencodes to JPEG and strips original metadata", async () => {
  const raw = await sharp({ create: { width: 30, height: 20, channels: 3, background: "white" } }).withMetadata().png().toBuffer();
  const result = await prepareIntakeImage(new File([new Uint8Array(raw)], "portrait.png", { type: "image/png" }));
  const meta = await sharp(result.body).metadata();
  assert.equal(meta.format, "jpeg"); assert.equal(meta.exif, undefined); assert.equal(meta.icc, undefined);
  assert.equal(result.width, 30); assert.equal(result.height, 20);
  await assert.rejects(prepareIntakeImage(new File(["not an image"], "fake.jpg", { type: "image/jpeg" })), /could not be opened/);
});
test("private filesystem files round-trip without a public URL and reject traversal or public roots", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "museum-intake-"));
  const before = { root: process.env.MUSEUM_INTAKE_UPLOAD_ROOT, backend: process.env.MEDIA_STORAGE_BACKEND };
  process.env.MUSEUM_INTAKE_UPLOAD_ROOT = root;
  process.env.MEDIA_STORAGE_BACKEND = "filesystem";
  try {
    const key = await writePrivateIntakeImage(Buffer.from("private-test"));
    assert.match(key, /^museum-intake\//);
    assert.equal((await readPrivateIntakeImage(key)).toString(), "private-test");
    await assert.rejects(readPrivateIntakeImage("../private-test"), /not found/);
    await discardPrivateIntakeImage(key);
    await assert.rejects(readPrivateIntakeImage(key));
    process.env.MUSEUM_INTAKE_UPLOAD_ROOT = path.resolve("public", "intake");
    await assert.rejects(writePrivateIntakeImage(Buffer.from("private-test")), /outside the public/);
  } finally {
    if (before.root === undefined) delete process.env.MUSEUM_INTAKE_UPLOAD_ROOT; else process.env.MUSEUM_INTAKE_UPLOAD_ROOT = before.root;
    if (before.backend === undefined) delete process.env.MEDIA_STORAGE_BACKEND; else process.env.MEDIA_STORAGE_BACKEND = before.backend;
    await rm(root, { recursive: true, force: true });
  }
});
