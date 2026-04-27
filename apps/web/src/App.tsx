import { useState } from "react";
import { MapView, type ParcelleProperties } from "./map/MapView";
import { ZoneCard } from "./zoning/ZoneCard";
import { DocumentLibrary } from "./zoning/DocumentLibrary";
import { SimulatorPanel } from "./simulator/SimulatorPanel";

export function App() {
  const [parcelle, setParcelle] = useState<ParcelleProperties | null>(null);

  return (
    <div className="layout">
      <div className="map-container">
        <MapView onParcelSelect={setParcelle} />
        <div className="header">
          <h1>Casa Urban — Aïn Chock</h1>
          <p>Plan d'Aménagement Unifié · Simulateur d'investissement</p>
        </div>
      </div>

      <aside className="panel">
        <DocumentLibrary />
        {!parcelle ? (
          <div className="panel-empty">
            <p>Cliquez sur une parcelle pour afficher son zonage<br />et lancer une simulation.</p>
          </div>
        ) : (
          <>
            <h2 className="parcel-title">Parcelle {parcelle.id}</h2>
            <p className="parcel-sub">
              {parcelle.adresse} · {parcelle.surface} m² ·{" "}
              {parcelle.prixTerrainMedianDhM2.toLocaleString("fr-FR")} DH/m² (médiane zone)
            </p>
            <ZoneCard parcelle={parcelle} />
            <SimulatorPanel parcelle={parcelle} />
          </>
        )}
      </aside>
    </div>
  );
}
