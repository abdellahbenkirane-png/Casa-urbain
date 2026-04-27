import type { SimulationInput, Hypotheses } from "@casa/core";

interface Props {
  input: SimulationInput;
  onChange: (next: SimulationInput) => void;
}

const NumInput = ({
  value,
  onChange,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) => (
  <div className="num-input">
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
    {suffix && <span className="suffix">{suffix}</span>}
  </div>
);

const PctInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="num-input">
    <input
      type="number"
      step={0.1}
      value={(value * 100).toFixed(2)}
      onChange={(e) => onChange((Number(e.target.value) || 0) / 100)}
    />
    <span className="suffix">%</span>
  </div>
);

export function SimulatorForm({ input, onChange }: Props) {
  const setH = (patch: Partial<Hypotheses>) =>
    onChange({ ...input, hypotheses: { ...input.hypotheses, ...patch } });

  return (
    <div className="form">
      <details open>
        <summary>Identification</summary>
        <div className="form-grid">
          <label>
            <span>Nom du scénario</span>
            <input
              type="text"
              value={input.nom}
              onChange={(e) => onChange({ ...input, nom: e.target.value })}
            />
          </label>
        </div>
      </details>

      <details open>
        <summary>Terrain</summary>
        <div className="form-grid">
          <label>
            <span>Surface</span>
            <NumInput
              value={input.terrain.surface}
              onChange={(v) => onChange({ ...input, terrain: { ...input.terrain, surface: v } })}
              suffix="m²"
            />
          </label>
          <label>
            <span>Prix terrain</span>
            <NumInput
              value={input.terrain.prixTerrainDhParM2}
              onChange={(v) =>
                onChange({ ...input, terrain: { ...input.terrain, prixTerrainDhParM2: v } })
              }
              step={500}
              suffix="DH/m²"
            />
          </label>
          <label>
            <span>Étages</span>
            <NumInput
              value={input.terrain.nombreEtages}
              onChange={(v) =>
                onChange({ ...input, terrain: { ...input.terrain, nombreEtages: v } })
              }
            />
          </label>
        </div>
      </details>

      <details open>
        <summary>Ventes</summary>
        <table className="row-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Prix TTC (DH/m²)</th>
              <th>Surface (m²)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {input.ventes.map((v, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={v.libelle}
                    onChange={(e) => {
                      const next = [...input.ventes];
                      next[i] = { ...v, libelle: e.target.value };
                      onChange({ ...input, ventes: next });
                    }}
                  />
                </td>
                <td>
                  <NumInput
                    value={v.prixTtcDhParM2}
                    step={500}
                    onChange={(val) => {
                      const next = [...input.ventes];
                      next[i] = { ...v, prixTtcDhParM2: val };
                      onChange({ ...input, ventes: next });
                    }}
                  />
                </td>
                <td>
                  <NumInput
                    value={v.superficieVendable}
                    onChange={(val) => {
                      const next = [...input.ventes];
                      next[i] = { ...v, superficieVendable: val };
                      onChange({ ...input, ventes: next });
                    }}
                  />
                </td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() =>
                      onChange({ ...input, ventes: input.ventes.filter((_, j) => j !== i) })
                    }
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn-add"
          onClick={() =>
            onChange({
              ...input,
              ventes: [
                ...input.ventes,
                { libelle: "Nouvelle ligne", prixTtcDhParM2: 0, superficieVendable: 0 },
              ],
            })
          }
        >
          + Ajouter une ligne
        </button>
      </details>

      <details open>
        <summary>Constructions</summary>
        <table className="row-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Prix HT (DH/m²)</th>
              <th>Surface (m²)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {input.constructions.map((c, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={c.libelle}
                    onChange={(e) => {
                      const next = [...input.constructions];
                      next[i] = { ...c, libelle: e.target.value };
                      onChange({ ...input, constructions: next });
                    }}
                  />
                </td>
                <td>
                  <NumInput
                    value={c.prixHtDhParM2}
                    step={100}
                    onChange={(val) => {
                      const next = [...input.constructions];
                      next[i] = { ...c, prixHtDhParM2: val };
                      onChange({ ...input, constructions: next });
                    }}
                  />
                </td>
                <td>
                  <NumInput
                    value={c.superficieConstruite}
                    onChange={(val) => {
                      const next = [...input.constructions];
                      next[i] = { ...c, superficieConstruite: val };
                      onChange({ ...input, constructions: next });
                    }}
                  />
                </td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() =>
                      onChange({
                        ...input,
                        constructions: input.constructions.filter((_, j) => j !== i),
                      })
                    }
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn-add"
          onClick={() =>
            onChange({
              ...input,
              constructions: [
                ...input.constructions,
                { libelle: "Nouveau poste", prixHtDhParM2: 0, superficieConstruite: 0 },
              ],
            })
          }
        >
          + Ajouter une ligne
        </button>
      </details>

      <details>
        <summary>Hypothèses</summary>
        <div className="form-grid">
          <label>
            <span>TVA vente</span>
            <PctInput value={input.hypotheses.tvaVente} onChange={(v) => setH({ tvaVente: v })} />
          </label>
          <label>
            <span>TVA construction</span>
            <PctInput
              value={input.hypotheses.tvaConstruction}
              onChange={(v) => setH({ tvaConstruction: v })}
            />
          </label>
          <label>
            <span>Enregistrement</span>
            <PctInput
              value={input.hypotheses.tauxEnregistrement}
              onChange={(v) => setH({ tauxEnregistrement: v })}
            />
          </label>
          <label>
            <span>Notaire</span>
            <NumInput
              value={input.hypotheses.notaireForfait}
              step={1000}
              onChange={(v) => setH({ notaireForfait: v })}
              suffix="DH"
            />
          </label>
          <label>
            <span>Études</span>
            <PctInput value={input.hypotheses.tauxEtudes} onChange={(v) => setH({ tauxEtudes: v })} />
          </label>
          <label>
            <span>Suivi chantier</span>
            <NumInput
              value={input.hypotheses.suiviChantierParMois}
              step={1000}
              onChange={(v) => setH({ suiviChantierParMois: v })}
              suffix="DH/mois"
            />
          </label>
          <label>
            <span>Durée chantier</span>
            <NumInput
              value={input.hypotheses.dureeChantierMois}
              onChange={(v) => setH({ dureeChantierMois: v })}
              suffix="mois"
            />
          </label>
          <label>
            <span>Frais commune</span>
            <NumInput
              value={input.hypotheses.fraisCommune}
              step={5000}
              onChange={(v) => setH({ fraisCommune: v })}
              suffix="DH"
            />
          </label>
          <label>
            <span>Charges fin.</span>
            <PctInput
              value={input.hypotheses.tauxChargesFinancieres}
              onChange={(v) => setH({ tauxChargesFinancieres: v })}
            />
          </label>
          <label>
            <span>Durée projet</span>
            <NumInput
              value={input.hypotheses.dureeProjetAnnees}
              onChange={(v) => setH({ dureeProjetAnnees: v })}
              suffix="ans"
            />
          </label>
          <label>
            <span>Hypothèque</span>
            <PctInput
              value={input.hypotheses.tauxHypotheque}
              onChange={(v) => setH({ tauxHypotheque: v })}
            />
          </label>
          <label>
            <span>Compteur général</span>
            <NumInput
              value={input.hypotheses.compteurGeneral}
              step={10000}
              onChange={(v) => setH({ compteurGeneral: v })}
              suffix="DH"
            />
          </label>
          <label>
            <span>Éclatement titres</span>
            <PctInput
              value={input.hypotheses.tauxEclatementTitres}
              onChange={(v) => setH({ tauxEclatementTitres: v })}
            />
          </label>
          <label>
            <span>Imprévus</span>
            <PctInput
              value={input.hypotheses.tauxImprevus}
              onChange={(v) => setH({ tauxImprevus: v })}
            />
          </label>
          <label>
            <span>IS</span>
            <PctInput value={input.hypotheses.tauxIs} onChange={(v) => setH({ tauxIs: v })} />
          </label>
          <label>
            <span>Ascenseur (TTC)</span>
            <NumInput
              value={input.hypotheses.ascenseurTtc}
              step={10000}
              onChange={(v) => setH({ ascenseurTtc: v })}
              suffix="DH"
            />
          </label>
          <label>
            <span>Aménag. communs</span>
            <NumInput
              value={input.hypotheses.amenagementsCommuns}
              step={10000}
              onChange={(v) => setH({ amenagementsCommuns: v })}
              suffix="DH"
            />
          </label>
          <label>
            <span>Aménag. façades</span>
            <NumInput
              value={input.hypotheses.amenagementsFacades}
              step={10000}
              onChange={(v) => setH({ amenagementsFacades: v })}
              suffix="DH"
            />
          </label>
          <label>
            <span>Frais ouverture</span>
            <NumInput
              value={input.hypotheses.fraisOuvertureCompte}
              step={10000}
              onChange={(v) => setH({ fraisOuvertureCompte: v })}
              suffix="DH"
            />
          </label>
        </div>
      </details>
    </div>
  );
}
