import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, LogIn, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth";

type AdminSignInProps = {
  emailConfigured: boolean;
  configurationDescription: string;
  description: string;
  googleConfigured: boolean;
  redirectTo: string;
  workspaceLabel: string;
  workspaceSubtitle: string;
};

export function AdminSignIn({
  emailConfigured,
  configurationDescription,
  description,
  googleConfigured,
  redirectTo,
  workspaceLabel,
  workspaceSubtitle
}: AdminSignInProps) {
  const configured = emailConfigured || googleConfigured;

  return (
    <AdminAuthPanel workspaceLabel={workspaceLabel} workspaceSubtitle={workspaceSubtitle}>
      <section className="admin-auth__content" aria-labelledby="admin-sign-in-title">
        <div className="admin-auth__heading">
          <div className="review-workflow__eyebrow">Secure access</div>
          <h1 id="admin-sign-in-title">Sign in to continue</h1>
          <p>{configured ? description : configurationDescription}</p>
        </div>

        <div className="admin-auth__actions">
          {emailConfigured ? (
            <form
              className="admin-auth__email-form"
              action={async (formData) => {
                "use server";
                await signIn("resend", {
                  email: String(formData.get("email") ?? ""),
                  redirectTo
                });
              }}
            >
              <label className="admin-field">
                <span>Email address</span>
                <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
              </label>
              <button className="admin-form-button admin-auth__submit" type="submit">
                <Mail aria-hidden="true" />
                Email me a sign-in link
              </button>
            </form>
          ) : null}

          {emailConfigured && googleConfigured ? (
            <div className="admin-auth__divider" role="separator">
              <span>or</span>
            </div>
          ) : null}

          {googleConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <button className="admin-form-button admin-auth__submit" type="submit">
                <LogIn aria-hidden="true" />
                Sign in with Google
              </button>
            </form>
          ) : null}

          {!configured ? (
            <p className="admin-auth__configuration-note">
              Configure Google OAuth or Resend email authentication in the environment, then restart the app.
            </p>
          ) : null}
          <p className="admin-auth__access-note">Access is limited to approved team accounts.</p>
        </div>
      </section>
    </AdminAuthPanel>
  );
}

export function AdminAuthNotice() {
  return (
    <AdminAuthPanel workspaceLabel="Admin access" workspaceSubtitle="Secure workspace">
      <section className="admin-auth__content" aria-labelledby="admin-auth-notice-title">
        <div className="admin-auth__notice-icon" aria-hidden="true">
          <MailCheck />
        </div>
        <div className="admin-auth__heading">
          <div className="review-workflow__eyebrow">One-time sign-in link</div>
          <h1 id="admin-auth-notice-title">Check your email</h1>
          <p>If the address belongs to an approved team account, a sign-in link is on its way. The link expires after 15 minutes.</p>
        </div>
        <div className="admin-auth__actions">
          <Link className="admin-form-button admin-form-button--secondary admin-auth__submit" href="/admin">
            <ArrowLeft aria-hidden="true" />
            Return to sign in
          </Link>
          <p className="admin-auth__access-note">You can close this page after opening the link.</p>
        </div>
      </section>
    </AdminAuthPanel>
  );
}

function AdminAuthPanel({
  children,
  workspaceLabel,
  workspaceSubtitle
}: {
  children: ReactNode;
  workspaceLabel: string;
  workspaceSubtitle: string;
}) {
  return (
    <main className="admin-shell">
      <div className="page-shell admin-auth">
        <div className="admin-auth__panel">
          <div className="admin-auth__identity">
            <div className="admin-auth__mark" aria-hidden="true">
              <ShieldCheck />
            </div>
            <div>
              <strong>{workspaceLabel}</strong>
              <p>{workspaceSubtitle}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
