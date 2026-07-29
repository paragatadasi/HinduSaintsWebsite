import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const mediaRoutePrefix = "/media";
const defaultMaxBytes = 5 * 1024 * 1024;
const responsiveWidths = [320, 640, 960, 1280, 1920] as const;

const allowedImageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
} as const;

type AllowedImageType = keyof typeof allowedImageTypes;

export type StoredMediaVariant = {
  url: string;
  storageKey: string;
  mimeType: "image/webp";
  width: number;
  height: number;
};

export type StoredMedia = {
  url: string;
  storageKey: string;
  mimeType: AllowedImageType;
  width?: number;
  height?: number;
  variants?: StoredMediaVariant[];
};

type ImageBufferInput = {
  body: Buffer;
  contentType?: string | null;
  fileName: string;
  folder?: string;
};

type StorageBackend = "filesystem" | "s3";

let s3Client: S3Client | undefined;

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

export function getMediaStorageBackend(): StorageBackend {
  return process.env.MEDIA_STORAGE_BACKEND === "s3" ? "s3" : "filesystem";
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

export function getPublicMediaUrl(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);

  if (getMediaStorageBackend() === "s3") {
    const publicBaseUrl = requireEnvironmentValue("MEDIA_PUBLIC_BASE_URL").replace(/\/+$/, "");
    return `${publicBaseUrl}/${encodeStorageKey(normalized)}`;
  }

  return `${mediaRoutePrefix}/${normalized}`;
}

export function getManagedStorageKeyFromUrl(url: string) {
  if (url.startsWith(`${mediaRoutePrefix}/`)) {
    return normalizeStorageKey(url.slice(`${mediaRoutePrefix}/`.length));
  }

  const publicBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (!publicBaseUrl || !url.startsWith(`${publicBaseUrl}/`)) return undefined;

  try {
    return normalizeStorageKey(
      new URL(url).pathname
        .slice(new URL(publicBaseUrl).pathname.replace(/\/+$/, "").length)
        .replace(/^\/+/, "")
        .split("/")
        .map(decodeURIComponent)
        .join("/")
    );
  } catch {
    return undefined;
  }
}

export async function getStoredMediaFile(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);

  if (getMediaStorageBackend() === "s3") {
    const response = await getS3Client().send(new GetObjectCommand({
      Bucket: requireEnvironmentValue("MEDIA_S3_BUCKET"),
      Key: normalized
    }));
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error("Stored media object has no body.");

    return {
      body: Buffer.from(bytes),
      contentType: normalizeStoredContentType(response.ContentType, normalized)
    };
  }

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
  return saveImageBuffer({ body, contentType: file.type, fileName: file.name });
}

export async function saveImageBuffer({
  body,
  contentType,
  fileName,
  folder = "media"
}: ImageBufferInput): Promise<StoredMedia> {
  if (body.length <= 0) {
    throw new Error("Image is empty.");
  }

  if (body.length > getMediaUploadMaxBytes()) {
    throw new Error("Image is larger than the configured limit.");
  }

  const mimeType = detectImageMimeType(body, contentType ?? "");
  const extension = allowedImageTypes[mimeType];
  const identity = `${sanitizeFileStem(fileName)}-${randomUUID()}`;
  const storageKey = [folder, new Date().toISOString().slice(0, 10), `${identity}.${extension}`].join("/");
  const metadata = await sharp(body, { animated: mimeType === "image/gif" }).metadata();
  const width = metadata.width;
  const height = metadata.height;
  const variants = mimeType === "image/gif" || !width || !height
    ? []
    : await createResponsiveVariants({ body, folder, height, identity, width });

  await Promise.all([
    writeStoredObject(storageKey, body, mimeType),
    ...variants.map((variant) => writeStoredObject(
      variant.storageKey,
      variant.body,
      variant.mimeType
    ))
  ]);

  return {
    url: getPublicMediaUrl(storageKey),
    storageKey,
    mimeType,
    width,
    height,
    variants: variants.map(({ body: _body, ...variant }) => ({
      ...variant,
      url: getPublicMediaUrl(variant.storageKey)
    }))
  };
}

async function createResponsiveVariants({
  body,
  folder,
  height,
  identity,
  width
}: {
  body: Buffer;
  folder: string;
  height: number;
  identity: string;
  width: number;
}) {
  const widths = responsiveWidths.filter((candidate) => candidate < width);

  return Promise.all(widths.map(async (variantWidth) => {
    const variantBody = await sharp(body)
      .rotate()
      .resize({ width: variantWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return {
      body: variantBody,
      storageKey: [folder, new Date().toISOString().slice(0, 10), `${identity}-${variantWidth}w.webp`].join("/"),
      mimeType: "image/webp" as const,
      width: variantWidth,
      height: Math.max(1, Math.round(height * variantWidth / width))
    };
  }));
}

async function writeStoredObject(storageKey: string, body: Buffer, contentType: AllowedImageType) {
  const normalized = normalizeStorageKey(storageKey);

  if (getMediaStorageBackend() === "s3") {
    await getS3Client().send(new PutObjectCommand({
      Bucket: requireEnvironmentValue("MEDIA_S3_BUCKET"),
      Key: normalized,
      Body: body,
      CacheControl: "public, max-age=31536000, immutable",
      ContentType: contentType
    }));
    return;
  }

  const filePath = path.join(getMediaUploadRoot(), normalized);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body, { flag: "wx" });
}

function getS3Client() {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    endpoint: process.env.MEDIA_S3_ENDPOINT || undefined,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === "true",
    region: process.env.MEDIA_S3_REGION || "auto",
    credentials: {
      accessKeyId: requireEnvironmentValue("MEDIA_S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnvironmentValue("MEDIA_S3_SECRET_ACCESS_KEY")
    }
  });

  return s3Client;
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

function normalizeStoredContentType(value: string | undefined, storageKey: string) {
  return value && value in allowedImageTypes
    ? value as AllowedImageType
    : getContentTypeFromStorageKey(storageKey);
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
    body.length >= 8
    && body[0] === 0x89
    && body[1] === 0x50
    && body[2] === 0x4e
    && body[3] === 0x47
    && body[4] === 0x0d
    && body[5] === 0x0a
    && body[6] === 0x1a
    && body[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    body.length >= 6
    && (body.subarray(0, 6).toString("ascii") === "GIF87a"
      || body.subarray(0, 6).toString("ascii") === "GIF89a")
  ) {
    return "image/gif";
  }

  if (
    body.length >= 12
    && body.subarray(0, 4).toString("ascii") === "RIFF"
    && body.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function encodeStorageKey(storageKey: string) {
  return storageKey.split("/").map(encodeURIComponent).join("/");
}

function requireEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set when MEDIA_STORAGE_BACKEND=s3.`);
  return value;
}
