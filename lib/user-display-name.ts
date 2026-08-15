export type UserDisplayNameFields = {
  spiritualName?: string | null;
  name?: string | null;
  telegramId?: string | null;
  instagramId?: string | null;
  email: string;
};

export const userDisplayNameSelect = {
  spiritualName: true,
  name: true,
  telegramId: true,
  instagramId: true,
  email: true
} as const;

export function getUserDisplayName(user: UserDisplayNameFields) {
  return [user.spiritualName, user.name, user.telegramId, user.instagramId, user.email]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value)) ?? user.email;
}
