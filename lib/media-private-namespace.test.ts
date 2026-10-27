import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { normalizeStorageKey, getPublicMediaUrl, getStoredMediaFile } from "./media-storage";
import { GET } from "../app/media/[...key]/route";

const privateKeys = [
  "_museum-private/museum-intake/photo.jpg",
  "_MUSEUM-PRIVATE/museum-intake/photo.jpg",
  "\\_museum-private\\museum-intake\\photo.jpg",
  "/_museum-private/photo.jpg",
  "./_museum-private/photo.jpg",
  "././_museum-private/photo.jpg",
  "_museum-private./photo.jpg",
  "ordinary/../_museum-private/photo.jpg",
  "%5fmuseum-private/photo.jpg",
  "%255fmuseum-private/photo.jpg",
  "_museum%2dprivate/photo.jpg",
  "%2e%2f_museum-private%2fphoto.jpg",
  "%5c_museum-private%5cphoto.jpg"
];

test("public helpers reject the reserved namespace and path aliases", async () => {
  for (const key of privateKeys) {
    assert.throws(() => normalizeStorageKey(key), key);
    assert.throws(() => getPublicMediaUrl(key), key);
    await assert.rejects(getStoredMediaFile(key), key);
  }
  assert.equal(normalizeStorageKey("/saints/portrait.jpg"), "saints/portrait.jpg");
  assert.equal(normalizeStorageKey("saints\\portrait.jpg"), "saints/portrait.jpg");
  assert.equal(normalizeStorageKey("saints/./portrait.jpg"), "saints/./portrait.jpg");
});

test("public route denies private keys before filesystem reads or S3 redirects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "media-namespace-"));
  const previous = { backend: process.env.MEDIA_STORAGE_BACKEND, root: process.env.MEDIA_UPLOAD_ROOT, url: process.env.MEDIA_PUBLIC_BASE_URL };
  process.env.MEDIA_UPLOAD_ROOT = root;
  process.env.MEDIA_PUBLIC_BASE_URL = "https://public.example.invalid";
  try {
    await mkdir(path.join(root, "_museum-private"), { recursive: true });
    await writeFile(path.join(root, "_museum-private", "photo.jpg"), "private sentinel");
    await writeFile(path.join(root, "ordinary.jpg"), "ordinary sentinel");
    for (const backend of ["filesystem", "s3"]) {
      process.env.MEDIA_STORAGE_BACKEND = backend;
      for (const key of privateKeys) {
        for (const candidate of new Set([key, decodeURIComponent(key)])) {
          const response = await GET(new Request("http://localhost/media/test"), { params: Promise.resolve({ key: candidate.split("/") }) });
          assert.equal(response.status, 404, `${backend}: ${candidate}`);
          assert.equal(response.headers.get("location"), null);
          assert.equal((await response.text()).includes("private sentinel"), false);
        }
      }
      const ordinary = await GET(new Request("http://localhost/media/ordinary.jpg"), { params: Promise.resolve({ key: ["ordinary.jpg"] }) });
      if (backend === "filesystem") {
        assert.equal(ordinary.status, 200);
        assert.equal(await ordinary.text(), "ordinary sentinel");
        assert.equal(ordinary.headers.get("Cache-Control"), "public, max-age=31536000, immutable");
      } else {
        assert.equal(ordinary.status, 308);
        assert.equal(ordinary.headers.get("location"), "https://public.example.invalid/ordinary.jpg");
      }
    }
  } finally {
    for (const [name, value] of [["MEDIA_STORAGE_BACKEND", previous.backend], ["MEDIA_UPLOAD_ROOT", previous.root], ["MEDIA_PUBLIC_BASE_URL", previous.url]] as const) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
});
