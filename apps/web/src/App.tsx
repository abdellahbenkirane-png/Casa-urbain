import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MapView, type ParcelleProperties } from "./map/MapView";
import { ZoneCard, ZoneBadge } from "./zoning/ZoneCard";
import { useAccount } from "./cloud/account";
import { cloudEnabled } from "./cloud/firebase";
import { LoginGate } from "./cloud/LoginGate";

// Code-split : le simulateur est chargé seulement au 1er clic sur une parcelle.
// Économise ~80 kB sur le bundle initial.
const SimulatorPanel = lazy(() =>
  import("./simulator/SimulatorPanel").then((m) => ({ default: m.SimulatorPanel })),
);

/** Hauteur du panneau en mode mobile (bottom sheet). Ignoré sur desktop. */
type Sheet = "peek" | "half" | "full";
type Tab = "simulation" | "reglement";

export function App() {
  const [parcelle, setParcelle] = useState<ParcelleProperties | null>(null);
  const [sheet, setSheet] = useState<Sheet>("peek");
  const [tab, setTab] = useState<Tab>("simulation");
  // Le calculateur est réservé aux utilisateurs connectés (carte et règles libres).
  const user = useAccount((s) => s.user);
  const gated = cloudEnabled && !user;

  // Session de compte : démarrée après le premier affichage (le SDK Firebase
  // est chargé à la demande, il ne retarde pas la carte).
  useEffect(() => {
    const t = setTimeout(() => useAccount.getState().init(), 300);
    return () => clearTimeout(t);
  }, []);

  const select = useCallback((p: ParcelleProperties) => {
    setParcelle(p);
    setSheet((s) => (s === "full" ? s : "half"));
  }, []);

  const close = () => {
    setParcelle(null);
    setSheet("peek");
  };

  useEffect(() => {
    if (!parcelle) return;
    const onKey = (e: KeyboardEvent) => {
      // Un menu ou une fenêtre ouverte capte Échap en priorité.
      if (e.key === "Escape" && !document.querySelector(".modal-backdrop, .export-menu, .layers-menu")) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parcelle]);

  // Réduit → moitié → plein écran → réduit. Le mode réduit garde l'en-tête de
  // la parcelle visible : on revoit la carte sans perdre le brouillon en cours.
  const cycleSheet = () =>
    setSheet((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek"));

  // Glisser vers le haut / le bas sur la poignée ou l'en-tête (mobile).
  const swipeStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStart.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const end = e.changedTouches[0]?.clientY;
    if (start == null || end == null || Math.abs(end - start) < 40) return;
    const order: Sheet[] = ["peek", "half", "full"];
    setSheet((s) => {
      const i = order.indexOf(s) + (end < start ? 1 : -1);
      return order[Math.max(0, Math.min(order.length - 1, i))]!;
    });
  };

  return (
    <div className="layout">
      <main className="map-container">
        <MapView onParcelSelect={select} hasSelection={parcelle != null} />
      </main>

      <aside className={`panel sheet-${sheet}`} aria-label="Détails de la parcelle">
        <button
          className="sheet-handle"
          onClick={cycleSheet}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label={sheet === "full" ? "Réduire le panneau" : "Agrandir le panneau"}
        >
          <span />
        </button>

        {!parcelle ? (
          <Welcome />
        ) : (
          <>
            {/* En-tête + onglets collés ensemble en haut du panneau : un seul bloc
                sticky, quelle que soit la hauteur du titre. */}
            <div className="panel-top" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <header className="parcel-header">
              <div className="parcel-header-main">
                <ZoneBadge code={parcelle.zone} />
                <div>
                  <h2>{parcelle.adresse}</h2>
                  <p>
                    {parcelle.prefecture ? `${titleCase(parcelle.prefecture)} · ` : ""}
                    Terrain indicatif {parcelle.prixTerrainMedianDhM2.toLocaleString("fr-FR")} DH/m²
                  </p>
                </div>
              </div>
              <div className="parcel-header-actions">
                {/* Mobile : calculateur plein écran (carte masquée), ou retour à la carte. */}
                {sheet === "full" ? (
                  <button className="pill-btn mobile-only" onClick={() => setSheet("peek")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
                      <path d="M9 4v14M15 6v14" />
                    </svg>
                    Carte
                  </button>
                ) : (
                  <button className="icon-btn mobile-only" onClick={() => setSheet("full")} aria-label="Plein écran">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  </button>
                )}
                <button className="icon-btn" onClick={close} aria-label="Fermer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="tabs-bar" role="tablist">
              <button role="tab" aria-selected={tab === "simulation"} className={tab === "simulation" ? "on" : ""} onClick={() => setTab("simulation")}>
                Rentabilité
              </button>
              <button role="tab" aria-selected={tab === "reglement"} className={tab === "reglement" ? "on" : ""} onClick={() => setTab("reglement")}>
                Règles de la zone
              </button>
            </div>
            </div>

            <div className="panel-body">
              {tab === "reglement" && <ZoneCard parcelle={parcelle} />}
              {tab === "simulation" && gated && <LoginGate zone={parcelle.zone} />}
              {/* Toujours monté : changer d'onglet ne doit pas perdre le brouillon en cours. */}
              <div hidden={tab !== "simulation" || gated}>
                {!gated && (
                <Suspense fallback={<div className="lazy-loading">Chargement du simulateur…</div>}>
                  <SimulatorPanel
                    key={parcelle.id}
                    parcelle={parcelle}
                    onShowRules={() => setTab("reglement")}
                  />
                </Suspense>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Welcome() {
  return (
    <div className="welcome">
      <h2>Que puis-je construire, et est-ce rentable ?</h2>
      <p className="welcome-lead">
        Explorez le Plan d'Aménagement de Casablanca et estimez la rentabilité d'un projet
        immobilier en quelques secondes.
      </p>
      <ol className="steps">
        <li>
          <span className="step-num">01</span>
          <div>
            <strong>Trouvez votre terrain</strong>
            <p>Cherchez une adresse ou zoomez sur la carte.</p>
          </div>
        </li>
        <li>
          <span className="step-num">02</span>
          <div>
            <strong>Cliquez sur une zone colorée</strong>
            <p>Hauteur autorisée, usages permis, surface minimale…</p>
          </div>
        </li>
        <li>
          <span className="step-num">03</span>
          <div>
            <strong>Découvrez la rentabilité</strong>
            <p>Bénéfice et marge estimés, ajustables selon votre projet.</p>
          </div>
        </li>
      </ol>
      <p className="welcome-note">
        Vous connaissez les limites exactes de votre terrain ? Utilisez
        <strong> Dessiner un terrain</strong> sur la carte pour mesurer sa surface.
      </p>
      <p className="welcome-foot">
        Zonage : Agence Urbaine de Casablanca (PAU 2025). Règlement détaillé disponible pour
        Aïn Chock. Estimations indicatives, à confirmer par un professionnel.
      </p>
    </div>
  );
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());
