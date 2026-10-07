import type { SimulationInput } from "@casa/core";
import { NumInput } from "./SimulatorForm";
import { resumeProgramme } from "./zoneProfiles";

/** Lignes qui ne dépendent pas du nombre d'étages (RDC, sous-sol, terrasse). */
const GROUND_LEVEL = /rdc|sous-sol|terrasse/i;

/**
 * Les 5 paramètres qui pèsent le plus sur le résultat. Changer la surface ou
 * le nombre d'étages ajuste les surfaces vendables / construites en proportion,
 * pour que le résultat suive sans avoir à ouvrir le formulaire détaillé.
 */
export function KeyInputs({
  input,
  onChange,
  defaultSurface,
  zone,
}: {
  input: SimulationInput;
  /** Code de zone, pour rappeler le programme type retenu par défaut. */
  zone: string;
  onChange: (next: SimulationInput) => void;
  /** true si la surface vient d'une valeur par défaut, pas du terrain réel. */
  defaultSurface: boolean;
}) {
  const t = input.terrain;

  const setSurface = (surface: number) => {
    const f = t.surface > 0 ? surface / t.surface : 1;
    onChange({
      ...input,
      terrain: { ...t, surface },
      ventes: input.ventes.map((v) => ({ ...v, superficieVendable: Math.round(v.superficieVendable * f) })),
      constructions: input.constructions.map((c) => ({ ...c, superficieConstruite: Math.round(c.superficieConstruite * f) })),
    });
  };

  const setEtages = (nombreEtages: number) => {
    const f = t.nombreEtages > 0 ? nombreEtages / t.nombreEtages : 1;
    const scale = (libelle: string, v: number) => (GROUND_LEVEL.test(libelle) ? v : Math.round(v * f));
    onChange({
      ...input,
      terrain: { ...t, nombreEtages },
      ventes: input.ventes.map((v) => ({ ...v, superficieVendable: scale(v.libelle, v.superficieVendable) })),
      constructions: input.constructions.map((c) => ({ ...c, superficieConstruite: scale(c.libelle, c.superficieConstruite) })),
    });
  };

  // Ligne de vente principale (appartements) et poste de construction le plus lourd.
  const venteIdx = input.ventes.findIndex((v) => /appart/i.test(v.libelle));
  const vi = venteIdx >= 0 ? venteIdx : 0;
  const ci = input.constructions.reduce(
    (best, c, i, arr) => (c.superficieConstruite > (arr[best]?.superficieConstruite ?? -1) ? i : best),
    0,
  );
  const vente = input.ventes[vi];
  const constr = input.constructions[ci];

  return (
    <section className="card">
      <div>
        <h3 className="card-title">Votre projet</h3>
        <p className="section-help">Par défaut : {resumeProgramme(zone)}</p>
      </div>
      <div className="field-grid">
        <label className={defaultSurface ? "needs-input" : ""}>
          <span>Surface du terrain</span>
          <NumInput value={t.surface} onChange={setSurface} step={10} suffix="m²" />
          {defaultSurface && <small>Valeur par défaut, indiquez la vôtre</small>}
        </label>
        <label>
          <span>Étages au-dessus du RDC</span>
          <NumInput value={t.nombreEtages} onChange={setEtages} suffix="étages" />
        </label>
        <label>
          <span>Prix d'achat du terrain</span>
          <NumInput
            value={t.prixTerrainDhParM2}
            onChange={(v) => onChange({ ...input, terrain: { ...t, prixTerrainDhParM2: v } })}
            step={500}
            suffix="DH/m²"
          />
        </label>
        {vente && (
          <label>
            <span>Prix de vente {vente.libelle.toLowerCase()}</span>
            <NumInput
              value={vente.prixTtcDhParM2}
              step={500}
              suffix="DH/m²"
              onChange={(v) => {
                // Les lignes de logement au même prix (ex. « Petites unités »
                // en zone à mixité) suivent le prix principal.
                const ventes = input.ventes.map((l, i) =>
                  i === vi || (l.prixTtcDhParM2 === vente.prixTtcDhParM2 && !/commerc|local/i.test(l.libelle))
                    ? { ...l, prixTtcDhParM2: v }
                    : l,
                );
                onChange({ ...input, ventes });
              }}
            />
          </label>
        )}
        {constr && (
          <label>
            <span>Coût de construction ({constr.libelle.toLowerCase()})</span>
            <NumInput
              value={constr.prixHtDhParM2}
              step={100}
              suffix="DH/m²"
              onChange={(v) => {
                const constructions = [...input.constructions];
                constructions[ci] = { ...constr, prixHtDhParM2: v };
                onChange({ ...input, constructions });
              }}
            />
          </label>
        )}
      </div>
      <p className="section-help">
        Les surfaces vendables et construites s'ajustent automatiquement. Tout le reste est
        modifiable dans « Hypothèses détaillées ».
      </p>
    </section>
  );
}
