import { useAccount } from "./account";

/**
 * Affiché à la place du calculateur tant que le visiteur n'est pas connecté.
 * La carte, le zonage et les règles de la zone restent libres d'accès.
 */
export function LoginGate({ zone }: { zone: string }) {
  const { ready, busy, error, signIn } = useAccount();

  // Session en cours de vérification : on évite d'afficher l'écran de connexion
  // une fraction de seconde à quelqu'un de déjà connecté.
  if (!ready) return <div className="lazy-loading">Chargement…</div>;

  return (
    <section className="gate">
      <div className="gate-preview" aria-hidden>
        <span className="gate-preview-label">Bénéfice net estimé</span>
        <span className="gate-preview-big">•• M DH</span>
        <span className="gate-preview-bar" />
      </div>

      <h3>Estimez la rentabilité de votre projet en zone {zone}</h3>
      <ul className="gate-list">
        <li>Bénéfice, marge et rendement calculés selon le règlement de la zone</li>
        <li>Hypothèses ajustables : surface, étages, prix, coûts</li>
        <li>Scénarios enregistrés et retrouvés sur tous vos appareils</li>
        <li>Export PDF et Excel</li>
      </ul>

      <button className="btn primary block gate-btn" onClick={() => void signIn()} disabled={busy}>
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {busy ? "Connexion…" : "Continuer avec Google"}
      </button>
      {error && (
        <p className="gate-error" role="alert">
          {error}
        </p>
      )}

      <p className="gate-note">
        Gratuit. Les règles de la zone restent consultables sans compte.
      </p>
      <p className="gate-privacy">
        Nous conservons uniquement votre e-mail Google et vos scénarios, pour vous les
        restituer. Ils ne sont ni partagés ni revendus ; vous pouvez demander leur suppression
        à tout moment.
      </p>
    </section>
  );
}
