export const AUTH_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function authSessionCookie() {
  const canonical = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  const secure = canonical ? new URL(canonical).protocol === "https:" : process.env.NODE_ENV === "production";
  return {
    name: `${secure ? "__Secure-" : ""}authjs.session-token`,
    options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure }
  };
}
