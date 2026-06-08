import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const mediaRoutePrefix = "/media";
const defaultMaxBytes = 5 * 1024 * 1024;

const allowedImageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
} as const;

type AllowedImageType = keyof typeof allowedImageTypes;

export type StoredMedia = {
  url: string;
  storageKey: string;
  mimeType: AllowedImageType;
  width?: number;
  height?: number;
};

export function getMediaUploadRoot() {
  return process.env.MEDIA_UPLOAD_ROOT
    ? path.resolve(process.env.MEDIA_UPLOAD_ROOT)
    : path.join(process.cwd(), "uploads");
}

export function getMediaUploadMaxBytes() {
  const configured = Number(process.env.MEDIA_UPLOAD_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : defaultMaxBytes;
}

export function shouldRequireMediaUploadAuth() {
  return process.env.MEDIA_UPLOADS_REQUIRE_AUTH !== "false";
}

export function normalizeStorageKey(storageKey: string) {
  const normalized = storageKey.replaceAll("\\", "/").replace(/^\/+/, "");

  if (!normalized || normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid media storage key.");
  }

  if (!/^[a-zA-Z0-9/_\-.]+$/.test(normalized)) {
    throw new Error("Media storage key contains unsupported characters.");
  }

  return normalized;
}

export async function getStoredMediaFile(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);
  const root = getMediaUploadRoot();
  const filePath = path.resolve(root, normalized);

  if (!filePath.startsWith(root + path.sep)) {
    throw new Error("Media storage key resolves outside the upload root.");
  }

  return {
    body: await readFile(filePath),
    contentType: getContentTypeFromStorageKey(normalized)
  };
}

export async function saveUploadedImage(file: File): Promise<StoredMedia> {
  if (file.size <= 0) {
    throw new Error("Uploaded image is empty.");
  }

  if (file.size > getMediaUploadMaxBytes()) {
    throw new Error("Uploaded image is larger than the configured limit.");
  }

  const body = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageMimeType(body, file.type);
  const extension = allowedImageTypes[mimeType];
  const storageKey = [
    "media",
    new Date().toISOString().slice(0, 10),
    `${sanitizeFileStem(file.name)}-${randomUUID()}.${extension}`
  ].join("/");
  const filePath = path.join(getMediaUploadRoot(), storageKey);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body, { flag: "wx" });

  return {
    url: `${mediaRoutePrefix}/${storageKey}`,
    storageKey,
    mimeType
  };
}

function sanitizeFileStem(fileName: string) {
  const parsed = path.parse(fileName);
  const stem = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return stem || "image";
}

function getContentTypeFromStorageKey(storageKey: string): AllowedImageType {
  const extension = path.extname(storageKey).toLowerCase();

  for (const [contentType, allowedExtension] of Object.entries(allowedImageTypes)) {
    if (extension === `.${allowedExtension}`) {
      return contentType as AllowedImageType;
    }
  }

  throw new Error("Unsupported media file extension.");
}

function detectImageMimeType(body: Buffer, declaredType: string): AllowedImageType {
  const detected = sniffImageMimeType(body);

  if (!detected) {
    throw new Error("Uploaded file is not a supported image type.");
  }

  if (declaredType && declaredType !== detected) {
    throw new Error("Uploaded image MIME type does not match its file contents.");
  }

  return detected;
}

function sniffImageMimeType(body: Buffer): AllowedImageType | null {
  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    body.length >= 8 &&
    body[0] === 0x89 &&
    body[1] === 0x50 &&
    body[2] === 0x4e &&
    body[3] === 0x47 &&
    body[4] === 0x0d &&
    body[5] === 0x0a &&
    body[6] === 0x1a &&
    body[7] === 0x0a
  ) {
    return "image/png";
  }

  if (body.length >= 6 && (body.subarray(0, 6).toString("ascii") === "GIF87a" || body.subarray(0, 6).toString("ascii") === "GIF89a")) {
    return "image/gif";
  }

  if (body.length >= 12 && body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  return null;
}
