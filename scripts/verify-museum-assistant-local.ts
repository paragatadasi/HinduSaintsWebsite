import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) || !database.pathname.startsWith("/museum_assistant_test")) {
  throw new Error("Use a disposable localhost museum_assistant_test database, never the website database.");
}
process.env.AUTH_SECRET ||= randomUUID();
const { db } = await import("../lib/db");
const accounts = await import("../lib/local-accounts");
const suffix = randomUUID().slice(0, 20);
const password = "museum test passphrase 2026", replacement = "replacement passphrase 2026";
try {
  await db.passwordLoginThrottle.deleteMany({ where: { key: "global" } });
  const admin = await db.user.create({ data: { email: `admin-${suffix}@example.invalid`, roles: ["site_admin"] } });
  const curator = await db.user.create({ data: { email: `curator-${suffix}@example.invalid`, roles: ["curator"] } });
  await assert.rejects(accounts.createLocalMuseumAccount({ username: `helper-${suffix}`, password }, curator.id), /Site Admin/);
  const account = await accounts.createLocalMuseumAccount({ username: ` Helper-${suffix} `, password }, admin.id);
  const user = await db.user.findUniqueOrThrow({ where: { id: account.userId } });
  assert.equal(user.email, null); assert.deepEqual(user.roles, ["museum_assistant"]);
  await assert.rejects(accounts.createLocalMuseumAccount({ username: account.username.toUpperCase(), password }, admin.id));
  const first = await accounts.signInLocalMuseumAccount({ username: account.username, password });
  assert.equal((await db.session.findUniqueOrThrow({ where: { sessionToken: first.token } })).userId, account.userId);
  await accounts.resetLocalMuseumPassword(account.userId, { password: replacement }, admin.id);
  assert.equal(await db.session.count({ where: { userId: account.userId } }), 0);
  await assert.rejects(accounts.signInLocalMuseumAccount({ username: account.username, password }), /incorrect/);
  await accounts.signInLocalMuseumAccount({ username: account.username, password: replacement });
  await db.user.update({ where: { id: account.userId }, data: { active: false } });
  await assert.rejects(accounts.signInLocalMuseumAccount({ username: account.username, password: replacement }), /incorrect/);
  await db.user.update({ where: { id: account.userId }, data: { active: true, roles: ["curator"] } });
  await assert.rejects(accounts.signInLocalMuseumAccount({ username: account.username, password: replacement }), /incorrect/);
  await assert.rejects(accounts.resetLocalMuseumPassword(account.userId, { password }, admin.id), /Museum Assistant/);
  const unknown = `unknown-${suffix}`;
  for (let i = 0; i < 8; i++) await assert.rejects(accounts.signInLocalMuseumAccount({ username: unknown, password }), /incorrect/);
  await assert.rejects(accounts.signInLocalMuseumAccount({ username: unknown, password }), /Too many/);
  await db.passwordLoginThrottle.upsert({ where: { key: "global" }, create: { key: "global", attempts: 100, windowStart: new Date() }, update: { attempts: 100, windowStart: new Date() } });
  await assert.rejects(accounts.signInLocalMuseumAccount({ username: `other-${suffix}`, password }), /Too many/);
  console.log("Local account creation, normalization, no-email identity, session creation/reset, role restriction, deactivation and persistent throttling passed.");
} finally {
  await db.passwordLoginThrottle.deleteMany({ where: { key: "global" } });
  await db.$disconnect();
}
