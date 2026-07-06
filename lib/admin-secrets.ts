import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 210_000;
const HASH_KEY_LENGTH = 32;

export const BULK_DELETE_PASSWORD_KEY = "saints_bulk_delete_password";

export async function getBulkDeletePasswordStatus() {
  const secret = await db.adminSecret.findUnique({
    where: { key: BULK_DELETE_PASSWORD_KEY },
    select: { updatedAt: true, updatedByEmail: true }
  });

  return {
    isConfigured: Boolean(secret || process.env.ADMIN_BULK_DELETE_PASSWORD),
    isDatabaseConfigured: Boolean(secret),
    updatedAt: secret?.updatedAt ?? null,
    updatedByEmail: secret?.updatedByEmail ?? null
  };
}

export async function setBulkDeletePassword(password: string, updatedByEmail?: string | null) {
  const passwordHash = hashPassword(password);

  await db.adminSecret.upsert({
    where: { key: BULK_DELETE_PASSWORD_KEY },
    create: {
      key: BULK_DELETE_PASSWORD_KEY,
      passwordHash,
      updatedByEmail
    },
    update: {
      passwordHash,
      updatedByEmail
    }
  });
}

export async function verifyBulkDeletePassword(password: string) {
  const secret = await db.adminSecret.findUnique({
    where: { key: BULK_DELETE_PASSWORD_KEY },
    select: { passwordHash: true }
  });

  if (secret) return verifyPassword(password, secret.passwordHash);

  const fallbackPassword = process.env.ADMIN_BULK_DELETE_PASSWORD;
  return Boolean(fallbackPassword && timingSafeStringEqual(password, fallbackPassword));
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM).toString("base64url");
  return `pbkdf2_${HASH_ALGORITHM}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [algorithmLabel, iterationsValue, salt, expectedHash] = passwordHash.split("$");
  if (algorithmLabel !== `pbkdf2_${HASH_ALGORITHM}` || !iterationsValue || !salt || !expectedHash) return false;

  const iterations = Number.parseInt(iterationsValue, 10);
  if (!Number.isInteger(iterations) || iterations < 1) return false;

  const actualHash = pbkdf2Sync(password, salt, iterations, HASH_KEY_LENGTH, HASH_ALGORITHM).toString("base64url");
  return timingSafeStringEqual(actualHash, expectedHash);
}

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
