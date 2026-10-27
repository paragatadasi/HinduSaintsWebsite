import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const localUsername = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9._-]{2,47}$/, "Use 3–48 letters, numbers, dots, underscores or hyphens, starting with a letter.");
export const localPassword = z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.").refine(value => Buffer.byteLength(value, "utf8") <= 256, "This password is too long.");
export const createLocalAccountInput = z.object({ username: localUsername, password: localPassword, name: z.string().trim().max(100).optional() }).strict();
export const resetLocalPasswordInput = z.object({ password: localPassword }).strict();
export const localSignInInput = z.object({ username: localUsername, password: z.string().min(1).max(128).refine(value => Buffer.byteLength(value, "utf8") <= 256) }).strict();
export class LocalAccountError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
export function isExclusiveMuseumAssistant(roles: readonly string[]) {
  return roles.length === 1 && roles[0] === "museum_assistant";
}

let activeDerivations = 0;
async function derive(password: string, salt: Buffer) {
  if (activeDerivations >= 2) throw new LocalAccountError(429, "Sign-in is busy. Please try again shortly.");
  activeDerivations++;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
    });
  } finally { activeDerivations--; }
}
export async function hashLocalPassword(password: string) {
  localPassword.parse(password);
  const salt = randomBytes(16);
  return `scrypt$v1$${salt.toString("hex")}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyLocalPassword(password: string, storedHash: string | null) {
  const match = storedHash ? /^scrypt\$v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(storedHash) : null;
  const salt = match ? Buffer.from(match[1], "hex") : Buffer.alloc(16, 1);
  const expected = match ? Buffer.from(match[2], "hex") : Buffer.alloc(64);
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected) && Boolean(match);
}
