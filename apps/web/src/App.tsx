import { useState } from "react";
import { MapView, type ParcelleProperties } from "./map/MapView";
import { ZoneCard } from "./zoning/ZoneCard";
import { DocumentLibrary } from "./zoning/DocumentLibrary";
import { SimulatorPanel } from "./simulator/SimulatorPanel";

/**
 * Préfectures pour lesquelles on a intégré le règlement détaillé du PAU.
 * Pour les autres arrondissements, on affiche un avertissement et le simulateur
 * tourne avec les paramètres calés sur Aïn Chock (best-effort).
 */
const REGLEMENT_DOCUMENTE = ["AIN CHOCK", "AÏN CHOCK"];

function isReglementDocumente(prefecture?: string): boolean {
  if (!prefecture) return true;
  const p = prefecture.toUpperCase();
  return REGLEMENT_DOCUMENTE.some((k) => p.includes(k));
}

export function App() {
  const [parcelle, setParcelle] = useState<ParcelleProperties | null>(null);
  const docDispo = isReglementDocumente(parcelle?.prefecture);

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
        <DocumentLibrary />
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
            {!docDispo && (
              <div className="reglement-warning">
                ⚠️ Le règlement officiel intégré est celui d'<strong>Aïn Chock</strong>. Pour cet
                arrondissement les paramètres réglementaires (COS, hauteurs, surfaces min…) sont
                affichés à titre indicatif et doivent être validés contre le PAU local de la
                préfecture.
              </div>
            )}
            <ZoneCard parcelle={parcelle} />
            <SimulatorPanel parcelle={parcelle} />
          </>
        )}
      </aside>
    </div>
  );
}
