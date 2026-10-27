import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { deleteStoredMediaFile, getPublicMediaUrl, getStoredMediaFile, writeStoredMediaFile } from "./media-storage";
import { MuseumIntakeError } from "./museum-intake-domain";

export const INTAKE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const keyPattern = /^museum-intake\/[a-f0-9-]{36}\.jpg$/;
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
export async function writeIntakeImage(body: Buffer) {
  const storageKey = `museum-intake/${randomUUID()}.jpg`;
  await writeStoredMediaFile(storageKey, body, "image/jpeg");
  return storageKey;
}
export async function readIntakeImage(storageKey: string) {
  if (!keyPattern.test(storageKey)) throw new MuseumIntakeError(404, "Photo not found.");
  return (await getStoredMediaFile(storageKey)).body;
}
export async function discardIntakeImage(storageKey: string) {
  if (!keyPattern.test(storageKey)) throw new Error("Invalid private intake storage key");
  await deleteStoredMediaFile(storageKey);
}

export function getIntakeImageUrl(storageKey: string) {
  if (!keyPattern.test(storageKey)) throw new MuseumIntakeError(404, "Photo not found.");
  return getPublicMediaUrl(storageKey);
}
