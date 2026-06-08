import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;

const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret
    })
  ],
  callbacks: {
    authorized({ auth: session }) {
      const email = session?.user?.email?.toLowerCase();
      return Boolean(email && allowlist.includes(email));
    },
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      return Boolean(email && allowlist.includes(email));
    }
  },
  pages: {
    signIn: "/admin"
  }
});
