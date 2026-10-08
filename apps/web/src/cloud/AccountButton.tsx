import { useEffect, useRef, useState } from "react";
import { cloudEnabled } from "./firebase";
import { useAccount } from "./account";
import { importLocalIntoAccount, listLocal, useScenarioStore } from "../scenarios/store";

/** Bouton de compte dans la barre du haut. Absent si Firebase n'est pas configuré. */
export function AccountButton() {
  const { ready, user, busy, error, signIn, signOut, clearError } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // Scénarios encore sur l'appareil → proposer de les ranger dans le compte.
  useEffect(() => {
    if (!user) return;
    listLocal().then((l) => setLocalCount(l.length)).catch(() => setLocalCount(0));
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!cloudEnabled || !ready) return null;

  if (!user) {
    return (
      <div className="account">
        <button
          className="account-btn"
          onClick={() => void signIn()}
          disabled={busy}
          aria-label="Se connecter avec Google"
          title="Connexion Google : seuls votre e-mail et vos scénarios sont conservés."
        >
          <GoogleIcon />
          <span>{busy ? "Connexion…" : "Se connecter"}</span>
        </button>
        {error && (
          <div className="account-error" role="alert">
            {error}
            <button className="link-btn" onClick={clearError}>OK</button>
          </div>
        )}
      </div>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  const doImport = async () => {
    setImportMsg(null);
    try {
      const n = await importLocalIntoAccount();
      setLocalCount(0);
      setImportMsg(`${n} scénario${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""} à votre compte.`);
      // Recharge la parcelle ouverte pour afficher les scénarios importés.
      const { parcelleId, loadForParcelle } = useScenarioStore.getState();
      if (parcelleId) await loadForParcelle(parcelleId);
    } catch {
      setImportMsg("L'import a échoué. Réessayez.");
    }
  };

  return (
    <div className="account" ref={ref}>
      <button
        className="account-avatar"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-label="Mon compte"
      >
        {initial}
      </button>
      {menuOpen && (
        <div className="account-menu" role="menu">
          <div className="account-who">
            <small>Connecté</small>
            <strong>{user.email ?? user.name}</strong>
          </div>
          <p className="account-note">
            Vos scénarios sont enregistrés dans votre compte. Seuls votre e-mail et vos scénarios
            sont conservés ; ils ne sont ni partagés ni revendus.
          </p>
          {localCount > 0 && (
            <button role="menuitem" className="account-item" onClick={doImport}>
              Importer {localCount} scénario{localCount > 1 ? "s" : ""} de cet appareil
            </button>
          )}
          {importMsg && <p className="account-note">{importMsg}</p>}
          <button
            role="menuitem"
            className="account-item"
            onClick={() => {
              setMenuOpen(false);
              void signOut();
            }}
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
