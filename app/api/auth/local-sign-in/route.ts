import { NextResponse } from "next/server";
import { localAccountHttp } from "@/lib/local-account-http";
import { signInLocalMuseumAccount } from "@/lib/local-accounts";
import { authSessionCookie, AUTH_SESSION_MAX_AGE } from "@/lib/auth-session-policy";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return localAccountHttp(request, false, async body => {
    const session = await signInLocalMuseumAccount(body);
    const cookie = authSessionCookie();
    const response = NextResponse.json({ ok: true, redirectTo: "/museumadmin/overview" }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(cookie.name, session.token, { ...cookie.options, expires: session.expires, maxAge: AUTH_SESSION_MAX_AGE });
    return response;
  });
}
