import { createHmac, randomBytes } from "node:crypto";
import { Prisma } from "./generated/prisma/client";
import { db } from "./db";
import { AUTH_SESSION_MAX_AGE } from "./auth-session-policy";
import { createLocalAccountInput, resetLocalPasswordInput, localSignInInput, hashLocalPassword, verifyLocalPassword, isExclusiveMuseumAssistant, LocalAccountError } from "./local-password";

async function assertSiteAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const actor = await tx.user.findUnique({ where: { id: actorId }, select: { active: true, roles: true } });
  if (!actor?.active || !actor.roles.includes("site_admin")) throw new LocalAccountError(403, "Site Admin access is required.");
}
export async function createLocalMuseumAccount(raw: unknown, actorId: string) {
  const input = createLocalAccountInput.parse(raw);
  await assertSiteAdmin(db, actorId);
  const passwordHash = await hashLocalPassword(input.password);
  return db.$transaction(async tx => {
    await assertSiteAdmin(tx, actorId);
    const user = await tx.user.create({ data: { email: null, name: input.name || input.username, roles: ["museum_assistant"], passwordCredential: { create: { username: input.username, passwordHash } } } });
    await tx.auditEvent.create({ data: { userId: actorId, action: "user.local_account_created", entityType: "User", entityId: user.id, afterJson: { username: input.username, roles: ["museum_assistant"] } } });
    return { userId: user.id, username: input.username };
  });
}
export async function resetLocalMuseumPassword(userId: string, raw: unknown, actorId: string) {
  const input = resetLocalPasswordInput.parse(raw);
  await assertSiteAdmin(db, actorId);
  const passwordHash = await hashLocalPassword(input.password);
  return db.$transaction(async tx => {
    await assertSiteAdmin(tx, actorId);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`);
    const user = await tx.user.findUnique({ where: { id: userId }, include: { passwordCredential: true } });
    if (!user?.passwordCredential || !isExclusiveMuseumAssistant(user.roles)) throw new LocalAccountError(400, "Choose a Museum Assistant username account.");
    await tx.userPasswordCredential.update({ where: { userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.passwordLoginThrottle.deleteMany({ where: { key: usernameThrottleKey(user.passwordCredential.username) } });
    await tx.auditEvent.create({ data: { userId: actorId, action: "user.local_password_reset", entityType: "User", entityId: userId, afterJson: { sessionsRevoked: true } } });
    return { userId, username: user.passwordCredential.username };
  });
}
function usernameThrottleKey(username: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new LocalAccountError(503, "Sign-in needs configuration. Contact the administrator.");
  return `username:${createHmac("sha256", secret).update(username).digest("hex")}`;
}
async function consumeLoginQuota(username: string) {
  const key = usernameThrottleKey(username);
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext('museum-password-login'))`;
    const now = new Date();
    for (const bucket of [{ key: "global", limit: 100, windowMs: 60_000 }, { key, limit: 8, windowMs: 15 * 60_000 }]) {
      const row = await tx.passwordLoginThrottle.findUnique({ where: { key: bucket.key } });
      const reset = !row || now.getTime() - row.windowStart.getTime() >= bucket.windowMs;
      if (!reset && row.attempts >= bucket.limit) throw new LocalAccountError(429, "Too many sign-in attempts. Please try again later.");
      await tx.passwordLoginThrottle.upsert({ where: { key: bucket.key }, create: { key: bucket.key, windowStart: now, attempts: 1 }, update: { windowStart: reset ? now : row.windowStart, attempts: reset ? 1 : row.attempts + 1 } });
      if (bucket.key === "global" && reset) await tx.passwordLoginThrottle.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 86_400_000) }, key: { not: "global" } } });
    }
  });
}
export async function signInLocalMuseumAccount(raw: unknown) {
  const parsed = localSignInInput.safeParse(raw);
  if (!parsed.success) throw new LocalAccountError(401, "The username or password is incorrect.");
  const input = parsed.data;
  await consumeLoginQuota(input.username);
  const credential = await db.userPasswordCredential.findUnique({ where: { username: input.username }, include: { user: true } });
  const verified = await verifyLocalPassword(input.password, credential?.passwordHash ?? null);
  if (!verified || !credential?.user.active || !isExclusiveMuseumAssistant(credential.user.roles)) throw new LocalAccountError(401, "The username or password is incorrect.");
  return db.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "User" WHERE id=${credential.userId} FOR UPDATE`);
    const current = await tx.userPasswordCredential.findUnique({ where: { userId: credential.userId }, include: { user: true } });
    if (!current?.user.active || !isExclusiveMuseumAssistant(current.user.roles) || current.passwordHash !== credential.passwordHash) throw new LocalAccountError(401, "The username or password is incorrect.");
    const token = randomBytes(32).toString("hex"), expires = new Date(Date.now() + AUTH_SESSION_MAX_AGE * 1000);
    await tx.session.create({ data: { userId: current.userId, sessionToken: token, expires } });
    await tx.user.update({ where: { id: current.userId }, data: { lastSignedInAt: new Date() } });
    await tx.auditEvent.create({ data: { userId: current.userId, action: "user.local_signed_in", entityType: "User", entityId: current.userId } });
    return { token, expires };
  });
}
