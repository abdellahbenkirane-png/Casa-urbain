import { useEffect, useMemo, useState } from "react";
import {
  computeAdvancedMetrics,
  simulate,
  type SimulationInput,
} from "@casa/core";
import { ScenarioTabs } from "../scenarios/ScenarioTabs";
import { Comparator } from "../scenarios/Comparator";
import { useScenarioStore } from "../scenarios/store";
import { buildInitialScenario } from "./buildInitial";
import { SimulatorForm } from "./SimulatorForm";
import { Results } from "./Results";
import { exportScenarioPdf, exportScenarioXlsx } from "./exports";
import { validate } from "./zoneValidation";
import type { ParcelleProperties } from "../map/MapView";

export function SimulatorPanel({ parcelle }: { parcelle: ParcelleProperties }) {
  const { scenarios, activeId, loadForParcelle, upsert } = useScenarioStore();
  const [draft, setDraft] = useState<SimulationInput | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadForParcelle(parcelle.id);
  }, [parcelle.id, loadForParcelle]);

  useEffect(() => {
    const active = scenarios.find((s) => s.id === activeId);
    if (active) {
      setDraft(active.input);
      setDirty(false);
    } else {
      setDraft(buildInitialScenario(parcelle));
      setDirty(true);
    }
  }, [activeId, scenarios, parcelle]);

  const result = useMemo(() => (draft ? simulate(draft) : null), [draft]);
  const advanced = useMemo(
    () => (draft && result ? computeAdvancedMetrics(draft, result) : null),
    [draft, result],
  );
  const violations = useMemo(
    () => (draft ? validate(draft, parcelle.zone) : []),
    [draft, parcelle.zone],
  );

  if (!draft || !result || !advanced) return null;

  const onChange = (next: SimulationInput) => {
    setDraft(next);
    setDirty(true);
  };

  const onSave = async () => {
    await upsert(draft, activeId ?? undefined);
    setDirty(false);
  };

  const onSaveAsNew = async () => {
    await upsert({ ...draft, nom: `${draft.nom} (nouveau)` });
    setDirty(false);
  };

  return (
    <div className="simulator">
      <ScenarioTabs />
      <div className="sim-actions">
        <button className="btn primary" onClick={onSave} disabled={!dirty}>
          {activeId ? "Enregistrer" : "Créer le scénario"}
        </button>
        <button className="btn" onClick={onSaveAsNew}>
          Nouveau scénario
        </button>
        <button className="btn" onClick={() => exportScenarioXlsx(draft)}>
          ⬇ XLSX
        </button>
        <button className="btn" onClick={() => exportScenarioPdf(draft)}>
          ⬇ PDF
        </button>
      </div>
      {violations.length > 0 && (
        <div className="violations">
          <strong>Conformité PAU — {violations.length} alerte{violations.length > 1 ? "s" : ""}</strong>
          <ul>
            {violations.map((v, i) => (
              <li key={i} className={`violation ${v.severity}`}>
                {v.severity === "error" ? "🚫" : "⚠️"} {v.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Results result={result} advanced={advanced} />
      <Comparator />
      <SimulatorForm input={draft} onChange={onChange} />
    </div>
  );
}
