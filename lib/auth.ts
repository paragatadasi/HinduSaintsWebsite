import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
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
