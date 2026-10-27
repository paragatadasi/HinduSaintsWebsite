import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { MuseumIntakeError } from "./museum-intake-domain";

export const INTAKE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
let privateClient: S3Client | undefined;
const keyPattern = /^museum-intake\/[a-f0-9-]{36}\.jpg$/;
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new MuseumIntakeError(503, "Private photo storage needs configuration. Contact the site administrator.");
  return value;
}
function privateStorage() {
  if (process.env.MEDIA_STORAGE_BACKEND === "s3") {
    const bucket = required("MUSEUM_INTAKE_S3_BUCKET");
    if (bucket === process.env.MEDIA_S3_BUCKET) throw new MuseumIntakeError(503, "Intake photos need a separate private storage bucket.");
    privateClient ??= new S3Client({ endpoint: process.env.MEDIA_S3_ENDPOINT || undefined, region: process.env.MEDIA_S3_REGION || "auto", forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === "true", credentials: { accessKeyId: required("MEDIA_S3_ACCESS_KEY_ID"), secretAccessKey: required("MEDIA_S3_SECRET_ACCESS_KEY") } });
    return { kind: "s3" as const, bucket, client: privateClient };
  }
  if (process.env.NODE_ENV === "production" && !process.env.MUSEUM_INTAKE_UPLOAD_ROOT) required("MUSEUM_INTAKE_UPLOAD_ROOT");
  const root = path.resolve(process.env.MUSEUM_INTAKE_UPLOAD_ROOT || "private-uploads");
  const publicRoots = [path.resolve("public"), path.resolve(process.env.MEDIA_UPLOAD_ROOT || "uploads")];
  const normalizedRoot = process.platform === "win32" ? root.toLowerCase() : root;
  if (publicRoots.some(publicRoot => {
    const normalizedPublic = process.platform === "win32" ? publicRoot.toLowerCase() : publicRoot;
    return normalizedRoot === normalizedPublic || normalizedRoot.startsWith(normalizedPublic + path.sep);
  })) throw new MuseumIntakeError(503, "Intake photos need storage outside the public upload folders.");
  return { kind: "filesystem" as const, root };
}
export async function prepareIntakeImage(file: File) {
  if (!file.size || file.size > INTAKE_IMAGE_MAX_BYTES) throw new MuseumIntakeError(400, "Choose an image smaller than 10 MB.");
  const raw = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(raw, { limitInputPixels: 40_000_000, failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) throw new Error("format");
    const result = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer({ resolveWithObject: true });
    return { body: result.data, sourceSha256: createHash("sha256").update(raw).digest("hex"), width: result.info.width, height: result.info.height, byteSize: result.data.length, mimeType: "image/jpeg" };
  } catch {
    throw new MuseumIntakeError(400, "This photo could not be opened. Choose a JPEG, PNG or WebP image.");
  }
}
export async function writePrivateIntakeImage(body: Buffer) {
  const storage = privateStorage(), storageKey = `museum-intake/${randomUUID()}.jpg`;
  if (storage.kind === "s3") await storage.client.send(new PutObjectCommand({ Bucket: storage.bucket, Key: storageKey, Body: body, ContentType: "image/jpeg", CacheControl: "private, no-store" }));
  else { const filePath = path.join(storage.root, storageKey); await mkdir(path.dirname(filePath), { recursive: true }); await writeFile(filePath, body, { mode: 0o600, flag: "wx" }); }
  return storageKey;
}
export async function readPrivateIntakeImage(storageKey: string) {
  if (!keyPattern.test(storageKey)) throw new MuseumIntakeError(404, "Photo not found.");
  const storage = privateStorage();
  if (storage.kind === "filesystem") return readFile(path.join(storage.root, storageKey));
  const result = await storage.client.send(new GetObjectCommand({ Bucket: storage.bucket, Key: storageKey }));
  if (!result.Body) throw new MuseumIntakeError(404, "Photo not found.");
  return Buffer.from(await result.Body.transformToByteArray());
}
export async function discardPrivateIntakeImage(storageKey: string) {
  if (!keyPattern.test(storageKey)) throw new Error("Invalid private intake storage key");
  const storage = privateStorage();
  if (storage.kind === "s3") await storage.client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: storageKey }));
  else await unlink(path.join(storage.root, storageKey));
}
