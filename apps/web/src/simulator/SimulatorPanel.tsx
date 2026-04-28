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
  const [busy, setBusy] = useState<null | "saving" | "xlsx" | "pdf">(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // Auto-dismiss feedback after a few seconds.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), feedback.kind === "ok" ? 2500 : 5000);
    return () => clearTimeout(t);
  }, [feedback]);

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
    setBusy("saving");
    try {
      await upsert(draft, activeId ?? undefined);
      setDirty(false);
      setFeedback({ kind: "ok", msg: "Scénario enregistré." });
    } catch (e) {
      console.error("[SimulatorPanel] save failed", e);
      setFeedback({ kind: "err", msg: `Échec de l'enregistrement : ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const onSaveAsNew = async () => {
    setBusy("saving");
    try {
      await upsert({ ...draft, nom: `${draft.nom} (nouveau)` });
      setDirty(false);
      setFeedback({ kind: "ok", msg: "Nouveau scénario créé." });
    } catch (e) {
      console.error("[SimulatorPanel] saveAsNew failed", e);
      setFeedback({ kind: "err", msg: `Échec de la création : ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const onXlsx = async () => {
    setBusy("xlsx");
    try {
      await exportScenarioXlsx(draft);
      setFeedback({ kind: "ok", msg: "Export XLSX prêt." });
    } catch (e) {
      console.error("[SimulatorPanel] xlsx export failed", e);
      setFeedback({ kind: "err", msg: `Export XLSX échoué : ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const onPdf = () => {
    setBusy("pdf");
    try {
      exportScenarioPdf(draft);
      setFeedback({ kind: "ok", msg: "Aperçu PDF ouvert." });
    } catch (e) {
      console.error("[SimulatorPanel] pdf export failed", e);
      setFeedback({ kind: "err", msg: `Export PDF échoué : ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="simulator">
      <ScenarioTabs />
      <div className="sim-actions">
        <button className="btn primary" onClick={onSave} disabled={!dirty || busy === "saving"}>
          {busy === "saving" ? "…" : activeId ? "Enregistrer" : "Créer le scénario"}
        </button>
        <button className="btn" onClick={onSaveAsNew} disabled={busy === "saving"}>
          Nouveau scénario
        </button>
        <button className="btn" onClick={onXlsx} disabled={busy === "xlsx"}>
          {busy === "xlsx" ? "⏳" : "⬇"} XLSX
        </button>
        <button className="btn" onClick={onPdf} disabled={busy === "pdf"}>
          {busy === "pdf" ? "⏳" : "⬇"} PDF
        </button>
      </div>
      {feedback && (
        <div className={`sim-feedback ${feedback.kind}`}>{feedback.msg}</div>
      )}
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
