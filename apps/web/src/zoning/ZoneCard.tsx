import { getZone } from "./zones";
import type { ParcelleProperties } from "../map/MapView";

const fmtPct = (v: number) => `${(v * 100).toFixed(0)} %`;
const fmtM = (v: number) => `${v} m`;

export function ZoneCard({ parcelle }: { parcelle: ParcelleProperties }) {
  const zone = getZone(parcelle.zone);
  if (!zone) {
    return <div className="zone-card">Zone {parcelle.zone} non documentée.</div>;
  }
  const p = zone.parametres;
  return (
    <div className="zone-card">
      <span className="zone-code">{zone.code}</span>
      <h3>{zone.nom}</h3>
      <p>{zone.description}</p>
      <dl className="zone-grid">
        <dt>COS</dt>
        <dd>{p.cos.toFixed(1)}</dd>
        <dt>CUS</dt>
        <dd>{p.cus.toFixed(1)}</dd>
        <dt>Hauteur max</dt>
        <dd>{fmtM(p.hauteurMaxM)}</dd>
        <dt>Étages max</dt>
        <dd>R+{p.nombreEtagesMax}</dd>
        <dt>Retrait façade</dt>
        <dd>{fmtM(p.retraitFacadeM)}</dd>
        <dt>Retrait fond</dt>
        <dd>{fmtM(p.retraitFondM)}</dd>
        <dt>Emprise au sol</dt>
        <dd>{fmtPct(p.emprisAuSolMaxPct)}</dd>
      </dl>
      <p style={{ marginTop: 12, fontSize: 11 }}>
        <strong>Usages autorisés :</strong> {zone.usagesAutorises.join(", ")}
      </p>
    </div>
  );
}
