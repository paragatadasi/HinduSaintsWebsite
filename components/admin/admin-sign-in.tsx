import { LogIn, ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth";

type AdminSignInProps = {
  configured: boolean;
  configurationDescription: string;
  description: string;
  redirectTo: string;
  workspaceLabel: string;
  workspaceSubtitle: string;
};

export function AdminSignIn({
  configured,
  configurationDescription,
  description,
  redirectTo,
  workspaceLabel,
  workspaceSubtitle
}: AdminSignInProps) {
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

          <section className="admin-auth__content" aria-labelledby="admin-sign-in-title">
            <div className="admin-auth__heading">
              <div className="review-workflow__eyebrow">Secure access</div>
              <h1 id="admin-sign-in-title">Sign in to continue</h1>
              <p>{configured ? description : configurationDescription}</p>
            </div>

            <div className="admin-auth__actions">
              {configured ? (
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
              ) : (
                <>
                  <p className="admin-auth__configuration-note">
                    Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, then restart the Next.js dev server.
                  </p>
                  <button className="admin-form-button admin-auth__submit" type="button" disabled>
                    <LogIn aria-hidden="true" />
                    Sign in with Google
                  </button>
                </>
              )}
              <p className="admin-auth__access-note">Access is limited to approved team accounts.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
