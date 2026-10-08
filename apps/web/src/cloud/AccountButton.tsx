import { useEffect, useRef, useState } from "react";
import { cloudEnabled } from "./firebase";
import { GoogleIcon } from "./GoogleIcon";
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
