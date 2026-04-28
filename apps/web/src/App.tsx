import { lazy, Suspense, useState } from "react";
import { MapView, type ParcelleProperties } from "./map/MapView";
import { ZoneCard } from "./zoning/ZoneCard";

// Code-split : le simulateur est chargé seulement au 1er clic sur une parcelle.
// Économise ~80 kB sur le bundle initial.
const SimulatorPanel = lazy(() =>
  import("./simulator/SimulatorPanel").then((m) => ({ default: m.SimulatorPanel })),
);

export function App() {
  const [parcelle, setParcelle] = useState<ParcelleProperties | null>(null);

  return (
    <div className="layout">
      <div className="map-container">
        <MapView onParcelSelect={setParcelle} />
        <div className="header">
          <h1>Casa Urban</h1>
          <p>Plan d'Aménagement Unifié · Simulateur d'investissement</p>
        </div>
      </div>

      <aside className="panel">
        {!parcelle ? (
          <div className="panel-empty">
            <p>
              Cliquez sur une parcelle de la carte<br />
              pour afficher son zonage et lancer une simulation.
            </p>
            <p style={{ marginTop: 16, fontSize: 11 }}>
              Le calque <strong>Zonage AUC</strong> couvre tout Casablanca.<br />
              Règlement détaillé disponible : <strong>Aïn Chock</strong>.
            </p>
          </div>
        ) : (
          <>
            <h2 className="parcel-title">Parcelle {parcelle.id}</h2>
            <p className="parcel-sub">
              {parcelle.adresse} · {parcelle.surface} m² ·{" "}
              {parcelle.prixTerrainMedianDhM2.toLocaleString("fr-FR")} DH/m² (médiane zone)
            </p>
            {parcelle.prefecture && (
              <p className="prefecture-line">📍 {parcelle.prefecture}</p>
            )}
            <ZoneCard parcelle={parcelle} />
            <Suspense fallback={<div className="lazy-loading">Chargement du simulateur…</div>}>
              <SimulatorPanel parcelle={parcelle} />
            </Suspense>
          </>
        )}
      </aside>
    </div>
  );
}
