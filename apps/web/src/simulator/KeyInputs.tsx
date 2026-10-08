import { useRef } from "react";
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

  // Les surfaces vendables / construites suivent la surface du terrain et le
  // nombre d'étages. On les recalcule depuis une référence (surfaces « par m²
  // de terrain » et « par étage ») mémorisée tant que la valeur est > 0 : vider
  // le champ pour le retaper passe par 0, et un simple rapport nouveau/ancien
  // aurait alors effacé définitivement toutes les surfaces.
  const perM2 = useRef<{ ventes: number[]; constructions: number[] } | null>(null);
  const perEtage = useRef<{ ventes: number[]; constructions: number[] } | null>(null);
  if (t.surface > 0) {
    perM2.current = {
      ventes: input.ventes.map((v) => v.superficieVendable / t.surface),
      constructions: input.constructions.map((c) => c.superficieConstruite / t.surface),
    };
  }
  if (t.nombreEtages > 0) {
    perEtage.current = {
      ventes: input.ventes.map((v) => v.superficieVendable / t.nombreEtages),
      constructions: input.constructions.map((c) => c.superficieConstruite / t.nombreEtages),
    };
  }

  const setSurface = (surface: number) => {
    const ref = perM2.current;
    // 0 = champ vidé en cours de saisie : on garde les surfaces telles quelles.
    if (surface <= 0 || !ref) {
      onChange({ ...input, terrain: { ...t, surface } });
      return;
    }
    onChange({
      ...input,
      terrain: { ...t, surface },
      ventes: input.ventes.map((v, i) => ({ ...v, superficieVendable: Math.round((ref.ventes[i] ?? 0) * surface) })),
      constructions: input.constructions.map((c, i) => ({ ...c, superficieConstruite: Math.round((ref.constructions[i] ?? 0) * surface) })),
    });
  };

  const setEtages = (nombreEtages: number) => {
    const ref = perEtage.current;
    if (!ref) {
      onChange({ ...input, terrain: { ...t, nombreEtages } });
      return;
    }
    // R+0 est une valeur valable : les surfaces d'étage passent à 0, mais la
    // référence par étage est conservée pour pouvoir remonter ensuite.
    const scale = (libelle: string, current: number, perFloor: number | undefined) =>
      GROUND_LEVEL.test(libelle) ? current : Math.round((perFloor ?? 0) * nombreEtages);
    onChange({
      ...input,
      terrain: { ...t, nombreEtages },
      ventes: input.ventes.map((v, i) => ({ ...v, superficieVendable: scale(v.libelle, v.superficieVendable, ref.ventes[i]) })),
      constructions: input.constructions.map((c, i) => ({ ...c, superficieConstruite: scale(c.libelle, c.superficieConstruite, ref.constructions[i]) })),
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
