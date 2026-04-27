import { useState } from "react";
import { getZone } from "./zones";
import { FicheModal } from "./FicheModal";
import type { ParcelleProperties } from "../map/MapView";

const fmtPct = (v: number) => `${(v * 100).toFixed(0)} %`;
const fmtM = (v: number) => `${v} m`;
const fmtM2 = (v: number) => `${v.toLocaleString("fr-FR")} m²`;
const fmtCos = (v: number) => v.toFixed(2);

export function ZoneCard({ parcelle }: { parcelle: ParcelleProperties }) {
  const zone = getZone(parcelle.zone);
  const [ficheOpen, setFicheOpen] = useState(false);

  if (!zone) {
    return (
      <div className="zone-card">
        <span className="zone-code">{parcelle.zone}</span>
        <p>Zone non documentée dans le règlement actuel.</p>
      </div>
    );
  }

  const p = zone.parametres;
  const rows: { label: string; value: string }[] = [];
  if (p.cos != null) {
    const niveaux = (p.nombreEtagesMax ?? 0) + 1;
    const cosTotal = p.cos * niveaux;
    rows.push({
      label: "COS / étage",
      value: `${fmtCos(p.cos)} (total ${fmtCos(cosTotal)})`,
    });
  }
  if (p.cus != null) rows.push({ label: "CUS", value: fmtPct(p.cus) });
  if (p.hauteurMaxM != null)
    rows.push({
      label: "Hauteur max",
      value: `${fmtM(p.hauteurMaxM)}${p.nombreEtagesMax ? ` (RDC+${p.nombreEtagesMax})` : ""}`,
    });
  if (p.hauteurHotelBureauM != null)
    rows.push({
      label: "Hauteur hôtel/bureau",
      value: `${fmtM(p.hauteurHotelBureauM)}${p.etagesHotelBureau ? ` (RDC+${p.etagesHotelBureau})` : ""}`,
    });
  if (p.surfaceMinParcelleM2 != null)
    rows.push({ label: "Parcelle min.", value: fmtM2(p.surfaceMinParcelleM2) });
  if (p.facadeMinM != null) rows.push({ label: "Façade min.", value: fmtM(p.facadeMinM) });
  if (p.mixiteSocialePct != null)
    rows.push({ label: "Mixité sociale", value: fmtPct(p.mixiteSocialePct) });
  if (p.linealFacadeMinPct != null)
    rows.push({ label: "Linéaire façade min.", value: fmtPct(p.linealFacadeMinPct) });

  return (
    <>
      <div className="zone-card">
        <span className="zone-code">{zone.code}</span>
        <h3>{zone.nom}</h3>
        <p>{zone.description}</p>
        {rows.length > 0 && (
          <dl className="zone-grid">
            {rows.flatMap((r, i) => [
              <dt key={`dt-${i}`}>{r.label}</dt>,
              <dd key={`dd-${i}`}>{r.value}</dd>,
            ])}
          </dl>
        )}
        <p style={{ marginTop: 12, fontSize: 11 }}>
          <strong>Usages autorisés :</strong> {zone.usagesAutorises.join(", ")}
        </p>
        {zone.usagesInterdits.length > 0 && (
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--danger)" }}>
            <strong>Interdits :</strong> {zone.usagesInterdits.join(", ")}
          </p>
        )}
        {p.remarque && (
          <p style={{ marginTop: 8, fontSize: 11, fontStyle: "italic", color: "var(--muted)" }}>
            {p.remarque}
          </p>
        )}
        {zone.fichePages && zone.fichePages.length > 0 && (
          <button className="btn-fiche" onClick={() => setFicheOpen(true)}>
            📄 Voir la fiche officielle ({zone.fichePages.length} page
            {zone.fichePages.length > 1 ? "s" : ""})
          </button>
        )}
      </div>
      {ficheOpen && zone.fichePages && (
        <FicheModal
          title={zone.nom}
          pages={zone.fichePages}
          onClose={() => setFicheOpen(false)}
        />
      )}
    </>
  );
}
