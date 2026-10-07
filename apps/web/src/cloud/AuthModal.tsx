import { useEffect, useState } from "react";
import { authErrorMessage, useAccount, useAuthModal } from "./account";

type Mode = "signin" | "signup" | "reset";

export function AuthModal() {
  const { open, hide } = useAuthModal();
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAccount();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Connexion réussie → la fenêtre se ferme d'elle-même.
  useEffect(() => {
    if (open && user) hide();
  }, [open, user, hide]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setInfo(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

  if (!open) return null;

  const run = async (fn: () => Promise<void>, done?: string) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (done) setInfo(done);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "reset") {
      run(() => resetPassword(email), "E-mail envoyé : suivez le lien pour choisir un nouveau mot de passe.");
    } else if (mode === "signup") {
      run(() => signUpWithEmail(email, password));
    } else {
      run(() => signInWithEmail(email, password));
    }
  };

  const title =
    mode === "signup" ? "Créer un compte" : mode === "reset" ? "Mot de passe oublié" : "Se connecter";

  return (
    <div className="modal-backdrop" onClick={hide}>
      <div className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(e) => e.stopPropagation()}>
        <header className="auth-head">
          <h3 id="auth-title">{title}</h3>
          <button className="icon-btn" onClick={hide} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <p className="auth-lead">
          Retrouvez vos scénarios sur tous vos appareils : ordinateur, téléphone, tablette.
        </p>

        {mode !== "reset" && (
          <>
            <button className="btn block auth-google" onClick={() => run(signInWithGoogle)} disabled={busy}>
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Continuer avec Google
            </button>
            <div className="auth-sep"><span>ou</span></div>
          </>
        )}

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>E-mail</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode !== "reset" && (
            <label>
              <span>Mot de passe</span>
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {info && <p className="auth-info" role="status">{info}</p>}
          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? "…" : mode === "signup" ? "Créer mon compte" : mode === "reset" ? "Envoyer le lien" : "Se connecter"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "signin" && (
            <>
              <button className="link-btn" onClick={() => setMode("signup")}>Créer un compte</button>
              <button className="link-btn" onClick={() => setMode("reset")}>Mot de passe oublié ?</button>
            </>
          )}
          {mode !== "signin" && (
            <button className="link-btn" onClick={() => setMode("signin")}>J'ai déjà un compte</button>
          )}
        </div>

        <p className="auth-privacy">
          Nous conservons uniquement votre e-mail et vos scénarios, pour vous les restituer. Ils ne
          sont ni partagés ni revendus. Vous pouvez demander leur suppression à tout moment.
        </p>
      </div>
    </div>
  );
}
