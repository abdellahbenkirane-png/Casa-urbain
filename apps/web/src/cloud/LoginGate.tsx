import { useAccount } from "./account";
import { GoogleIcon } from "./GoogleIcon";

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
        <GoogleIcon />
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
