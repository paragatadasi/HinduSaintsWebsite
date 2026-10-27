import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { prepareIntakeImage, writeIntakeImage, readIntakeImage, discardIntakeImage, getIntakeImageUrl } from "./museum-intake-storage";

test("intake image decode verifies bytes, reencodes to JPEG and strips original metadata", async () => {
  const raw = await sharp({ create: { width: 30, height: 20, channels: 3, background: "white" } }).withMetadata().png().toBuffer();
  const result = await prepareIntakeImage(new File([new Uint8Array(raw)], "portrait.png", { type: "image/png" }));
  const meta = await sharp(result.body).metadata();
  assert.equal(meta.format, "jpeg"); assert.equal(meta.exif, undefined); assert.equal(meta.icc, undefined);
  assert.equal(result.width, 30); assert.equal(result.height, 20);
  await assert.rejects(prepareIntakeImage(new File(["not an image"], "fake.jpg", { type: "image/jpeg" })), /could not be opened/);
});
test("intake photos use the existing public media backend and URL", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "museum-intake-"));
  const before = { backend: process.env.MEDIA_STORAGE_BACKEND, publicRoot: process.env.MEDIA_UPLOAD_ROOT, intakeRoot: process.env.MUSEUM_INTAKE_UPLOAD_ROOT, intakeBackend: process.env.MUSEUM_INTAKE_STORAGE_BACKEND };
  process.env.MEDIA_UPLOAD_ROOT = root;
  process.env.MEDIA_STORAGE_BACKEND = "filesystem";
  delete process.env.MUSEUM_INTAKE_UPLOAD_ROOT;
  delete process.env.MUSEUM_INTAKE_STORAGE_BACKEND;
  try {
    const key = await writeIntakeImage(Buffer.from("public-test"));
    assert.match(key, /^museum-intake\//);
    assert.equal(getIntakeImageUrl(key), `/media/${key}`);
    assert.equal((await readIntakeImage(key)).toString(), "public-test");
    await assert.rejects(readIntakeImage("../public-test"), /not found/);
    await discardIntakeImage(key);
    await assert.rejects(readIntakeImage(key));
  } finally {
    if (before.backend === undefined) delete process.env.MEDIA_STORAGE_BACKEND; else process.env.MEDIA_STORAGE_BACKEND = before.backend;
    if (before.publicRoot === undefined) delete process.env.MEDIA_UPLOAD_ROOT; else process.env.MEDIA_UPLOAD_ROOT = before.publicRoot;
    if (before.intakeRoot === undefined) delete process.env.MUSEUM_INTAKE_UPLOAD_ROOT; else process.env.MUSEUM_INTAKE_UPLOAD_ROOT = before.intakeRoot;
    if (before.intakeBackend === undefined) delete process.env.MUSEUM_INTAKE_STORAGE_BACKEND; else process.env.MUSEUM_INTAKE_STORAGE_BACKEND = before.intakeBackend;
    await rm(root, { recursive: true, force: true });
  }
});
