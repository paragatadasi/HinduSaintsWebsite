import assert from "node:assert/strict";
import test from "node:test";
import { getUserDisplayName } from "./user-display-name";

const user = {
  spiritualName: "Swami Anand",
  name: "Anand Sharma",
  telegramId: "anand_telegram",
  instagramId: "anand_instagram",
  email: "anand@example.com"
};

test("uses the spiritual name before every other user identifier", () => {
  assert.equal(getUserDisplayName(user), "Swami Anand");
});

test("falls back through name, Telegram ID, Instagram ID, and email", () => {
  assert.equal(getUserDisplayName({ ...user, spiritualName: "" }), "Anand Sharma");
  assert.equal(getUserDisplayName({ ...user, spiritualName: null, name: null }), "anand_telegram");
  assert.equal(getUserDisplayName({ ...user, spiritualName: null, name: null, telegramId: null }), "anand_instagram");
  assert.equal(getUserDisplayName({ ...user, spiritualName: null, name: null, telegramId: null, instagramId: null }), "anand@example.com");
});

test("ignores whitespace-only profile fields", () => {
  assert.equal(getUserDisplayName({ ...user, spiritualName: "  ", name: " ", telegramId: "" }), "anand_instagram");
});
