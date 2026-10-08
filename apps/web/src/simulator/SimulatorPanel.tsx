import { useEffect, useMemo, useRef, useState } from "react";
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
import { KeyInputs } from "./KeyInputs";
import { CostBreakdown, Metrics, Sensitivity, Verdict } from "./Results";
import { exportScenarioPdf, exportScenarioXlsx } from "./exports";
import { validate } from "./zoneValidation";
import type { ParcelleProperties } from "../map/MapView";
import { useAccount } from "../cloud/account";

export function SimulatorPanel({
  parcelle,
  onShowRules,
}: {
  parcelle: ParcelleProperties;
  onShowRules: () => void;
}) {
  const { scenarios, activeId, loadForParcelle, upsert } = useScenarioStore();
  const [draft, setDraft] = useState<SimulationInput | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "saving" | "xlsx" | "pdf">(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Auto-dismiss feedback after a few seconds.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), feedback.kind === "ok" ? 2500 : 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (!exportOpen) return;
    const onDown = (e: PointerEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [exportOpen]);

  // Connexion / déconnexion : les scénarios viennent d'un autre endroit
  // (compte ou appareil) → on recharge.
  const uid = useAccount((s) => s.user?.uid ?? null);
  useEffect(() => {
    loadForParcelle(parcelle.id);
  }, [parcelle.id, loadForParcelle, uid]);

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

  // Les zones AUC arrivent avec une surface type de 500 m² (cf. MapView).
  const defaultSurface = parcelle.id.startsWith("AUC-") && draft.terrain.surface === parcelle.surface && !activeId;

  const onChange = (next: SimulationInput) => {
    setDraft(next);
    setDirty(true);
  };

  const run = async (kind: "saving" | "xlsx" | "pdf", fn: () => unknown, ok: string, err: string) => {
    setBusy(kind);
    try {
      await fn();
      setFeedback({ kind: "ok", msg: ok });
    } catch (e) {
      console.error(`[SimulatorPanel] ${kind} failed`, e);
      setFeedback({ kind: "err", msg: `${err} : ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const onSave = () =>
    run(
      "saving",
      async () => {
        await upsert(draft, activeId ?? undefined);
        setDirty(false);
      },
      activeId ? "Modifications enregistrées." : "Scénario enregistré.",
      "Échec de l'enregistrement",
    );

  const onSaveAsNew = () =>
    run(
      "saving",
      async () => {
        await upsert({ ...draft, nom: `${draft.nom} (variante)` });
        setDirty(false);
      },
      "Variante créée : comparez-la ci-dessous.",
      "Échec de la création",
    );

  return (
    <div className="simulator">
      <div className="scenario-bar">
        <input
          className="scenario-name"
          value={draft.nom}
          onChange={(e) => onChange({ ...draft, nom: e.target.value })}
          aria-label="Nom du scénario"
        />
        {activeId && (
          <button className="btn btn-sm ghost" onClick={onSaveAsNew} disabled={busy === "saving"}>
            + Variante
          </button>
        )}
      </div>
      <ScenarioTabs />

      <Verdict result={result} />

      {violations.length > 0 && (
        <section className={`notice ${violations.some((v) => v.severity === "error") ? "error" : "warn"}`}>
          <strong>
            {violations.some((v) => v.severity === "error")
              ? "Ce projet n'est pas conforme au règlement de la zone"
              : `${violations.length} point${violations.length > 1 ? "s" : ""} à vérifier avec le règlement`}
          </strong>
          <ul>
            {violations.map((v, i) => (
              <li key={i} className={v.severity}>
                {v.message}
              </li>
            ))}
          </ul>
          <button className="link-btn" onClick={onShowRules}>
            Voir les règles de la zone →
          </button>
        </section>
      )}

      <KeyInputs input={draft} onChange={onChange} defaultSurface={defaultSurface} zone={parcelle.zone} />

      <div className="accordion">
        <details>
          <summary>Indicateurs financiers</summary>
          <Metrics result={result} advanced={advanced} />
        </details>
        <details>
          <summary>Répartition des coûts</summary>
          <CostBreakdown result={result} />
        </details>
        <details>
          <summary>Sensibilité</summary>
          <Sensitivity advanced={advanced} />
        </details>
        <Comparator />
        <details>
          <summary>Hypothèses détaillées</summary>
          <SimulatorForm input={draft} onChange={onChange} />
        </details>
      </div>


      <p className="disclaimer">
        Estimation indicative basée sur des prix moyens de marché. Ne remplace pas une étude
        de faisabilité.
      </p>

      <footer className="action-bar">
        {feedback && (
          <div className={`toast ${feedback.kind}`} role="status">
            {feedback.msg}
          </div>
        )}
        <button className="btn primary grow" onClick={onSave} disabled={!dirty || busy === "saving"}>
          {busy === "saving"
            ? "Enregistrement…"
            : !dirty
              ? "Enregistré ✓"
              : activeId
                ? "Enregistrer les modifications"
                : "Enregistrer ce scénario"}
        </button>
        <div className="export" ref={exportRef}>
          <button className="btn" onClick={() => setExportOpen((o) => !o)} aria-expanded={exportOpen}>
            Exporter ▾
          </button>
          {exportOpen && (
            <div className="export-menu" role="menu">
              <button
                role="menuitem"
                disabled={busy === "pdf"}
                onClick={() => {
                  setExportOpen(false);
                  run("pdf", () => exportScenarioPdf(draft), "Aperçu PDF ouvert.", "Export PDF échoué");
                }}
              >
                <strong>PDF</strong>
                <small>Rapport à imprimer ou partager</small>
              </button>
              <button
                role="menuitem"
                disabled={busy === "xlsx"}
                onClick={() => {
                  setExportOpen(false);
                  run("xlsx", () => exportScenarioXlsx(draft), "Export Excel prêt.", "Export Excel échoué");
                }}
              >
                <strong>Excel</strong>
                <small>Pro forma détaillé (.xlsx)</small>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
