import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { isAuthEmailRateLimited } from "@/lib/auth-email-rate-limit";
import { db } from "@/lib/db";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
const resendApiKey = process.env.AUTH_RESEND_KEY;
const authEmailFrom = process.env.AUTH_EMAIL_FROM;
const emailVerificationMaxAgeSeconds = 15 * 60;
const emailVerificationRequestedPath = "/auth/check-email";

const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret);
export const isEmailAuthConfigured = Boolean(resendApiKey && authEmailFrom);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    ...(googleClientId && googleClientSecret
      ? [Google({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          // Users & Access intentionally pre-creates approved users by email. Google
          // verifies that email, so allow Auth.js to attach the OAuth account on the
          // user's first sign-in instead of rejecting it as OAuthAccountNotLinked.
          allowDangerousEmailAccountLinking: true
        })]
      : []),
    ...(resendApiKey && authEmailFrom
      ? [Resend({
          apiKey: resendApiKey,
          from: authEmailFrom,
          maxAge: emailVerificationMaxAgeSeconds
        })]
      : [])
  ],
  callbacks: {
    async authorized({ auth: session }) {
      const email = session?.user?.email?.toLowerCase();
      if (!email) return false;
      const user = await db.user.findUnique({ where: { email }, select: { active: true } });
      return Boolean(user?.active);
    },
    async signIn({ user, email: emailContext }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const siteAdminCount = await db.user.count({ where: { active: true, roles: { has: "site_admin" } } });
      if (siteAdminCount === 0 && allowlist.includes(email)) {
        await db.$transaction(allowlist.map((grandfatheredEmail) => db.user.upsert({
          where: { email: grandfatheredEmail },
          create: { email: grandfatheredEmail, roles: ["site_admin"], active: true },
          update: { roles: { push: "site_admin" }, active: true }
        })));
      }

      const existing = await db.user.findUnique({ where: { email }, select: { active: true } });
      if (!existing?.active) {
        return emailContext?.verificationRequest ? emailVerificationRequestedPath : false;
      }

      if (emailContext?.verificationRequest && isAuthEmailRateLimited(email)) {
        return emailVerificationRequestedPath;
      }

      return true;
    }
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      await db.user.updateMany({
        where: { email: user.email.toLowerCase() },
        data: { lastSignedInAt: new Date() }
      });
    }
  },
  pages: {
    signIn: "/admin",
    verifyRequest: emailVerificationRequestedPath
  }
});
