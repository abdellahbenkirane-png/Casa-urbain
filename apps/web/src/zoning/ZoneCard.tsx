import { useState } from "react";
import { getZone, familleOf, AUTRE_COLOR, AUTRE_LABEL, FAMILLE_COLORS, FAMILLE_LABELS } from "./zones";
import { FicheModal } from "./FicheModal";
import type { ParcelleProperties } from "../map/MapView";

const fmtPct = (v: number) => `${(v * 100).toFixed(0)} %`;
const fmtM = (v: number) => `${v} m`;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtM2 = (v: number) => `${v.toLocaleString("fr-FR")} m²`;

export function ZoneBadge({ code }: { code: string }) {
  const color = FAMILLE_COLORS[familleOf(code)] ?? AUTRE_COLOR;
  const known = color !== AUTRE_COLOR;
  return (
    <span className={`zone-badge ${known ? "" : "other"}`} style={{ background: color }} title={code}>
      {code.length > 5 ? code.slice(0, 4) + "…" : code}
    </span>
  );
}

/** Règles clés sous forme de liste — partagé avec le simulateur. */
export function zoneRules(code: string): { label: string; value: string }[] {
  const zone = getZone(code);
  if (!zone) return [];
  const p = zone.parametres;
  const rows: { label: string; value: string }[] = [];
  if (p.hauteurMaxM != null)
    rows.push({
      label: "Hauteur max",
      value: `${fmtM(p.hauteurMaxM)}${p.nombreEtagesMax ? ` · R+${p.nombreEtagesMax}` : ""}`,
    });
  if (p.hauteurHotelBureauM != null)
    rows.push({
      label: "Hôtel / bureaux",
      value: `${fmtM(p.hauteurHotelBureauM)}${p.etagesHotelBureau ? ` · R+${p.etagesHotelBureau}` : ""}`,
    });
  if (p.surfaceMinParcelleM2 != null)
    rows.push({ label: "Terrain minimum", value: fmtM2(p.surfaceMinParcelleM2) });
  if (p.facadeMinM != null) rows.push({ label: "Façade minimum", value: fmtM(p.facadeMinM) });
  if (p.mixiteSocialePct != null)
    rows.push({ label: "Logement social", value: fmtPct(p.mixiteSocialePct) });
  if (p.linealFacadeMinPct != null)
    rows.push({ label: "Linéaire façade min.", value: fmtPct(p.linealFacadeMinPct) });
  return rows;
}

export function ZoneCard({ parcelle }: { parcelle: ParcelleProperties }) {
  const zone = getZone(parcelle.zone);
  const [ficheOpen, setFicheOpen] = useState(false);
  const famille = familleOf(parcelle.zone);
  const familleInfo = FAMILLE_LABELS[famille] ?? AUTRE_LABEL;

  if (parcelle.zone === "?") {
    return (
      <section className="card">
        <h3 className="card-title">Zone non identifiée</h3>
        <div className="notice info">
          Aucune zone du PAU n'a été trouvée sous ce terrain. Vérifiez que le calque « Zonage
          PAU » est activé et que le terrain se trouve dans une zone colorée. La simulation
          utilise des valeurs par défaut.
        </div>
      </section>
    );
  }

  if (!zone) {
    return (
      <section className="card">
        <h3 className="card-title">{familleInfo.nom}</h3>
        <p className="card-text">{familleInfo.description}</p>
        <div className="notice info">
          Le règlement détaillé du secteur <strong>{parcelle.zone}</strong> n'est pas encore
          intégré. La simulation utilise des valeurs par défaut que vous pouvez ajuster.
        </div>
      </section>
    );
  }

  const rows = zoneRules(parcelle.zone);
  const p = zone.parametres;

  return (
    <>
      <section className="card">
        <h3 className="card-title">{capitalize(zone.nom.replace(/^[^—]+—\s*/, ""))}</h3>
        <p className="card-text">{zone.description}</p>
        {rows.length > 0 && (
          <dl className="rule-grid">
            {rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card">
        <h4 className="card-subtitle">Autorisé</h4>
        <ul className="chips ok">
          {zone.usagesAutorises.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
        {zone.usagesInterdits.length > 0 && (
          <>
            <h4 className="card-subtitle">Interdit</h4>
            <ul className="chips ko">
              {zone.usagesInterdits.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </>
        )}
        {p.remarque && <p className="card-note">{p.remarque}</p>}
      </section>

      {zone.fichePages && zone.fichePages.length > 0 && (
        <button className="btn block" onClick={() => setFicheOpen(true)}>
          Voir la fiche officielle ({zone.fichePages.length} page
          {zone.fichePages.length > 1 ? "s" : ""})
        </button>
      )}
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
