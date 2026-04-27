import { useMemo } from "react";
import { simulate, computeAdvancedMetrics } from "@casa/core";
import { useScenarioStore } from "./store";
import { fmtDh, fmtPct } from "../simulator/format";

export function Comparator() {
  const { scenarios } = useScenarioStore();

  const rows = useMemo(() => {
    return scenarios.map((s) => {
      const result = simulate(s.input);
      const adv = computeAdvancedMetrics(s.input, result);
      return {
        id: s.id,
        nom: s.input.nom,
        ca: result.totaux.totalVentes,
        charges: result.totaux.totalCharges,
        resultat: result.totaux.resultatNet,
        marge: result.totaux.margeNette,
        roe: result.totaux.roe,
        tri: adv.tri,
      };
    });
  }, [scenarios]);

  if (rows.length < 2) return null;

  const best = rows.reduce((a, b) => (a.resultat > b.resultat ? a : b));

  return (
    <details className="comparator" open>
      <summary>Comparaison ({rows.length} scénarios)</summary>
      <table className="compare-table">
        <thead>
          <tr>
            <th>Scénario</th>
            <th>CA HT</th>
            <th>Charges</th>
            <th>Résultat</th>
            <th>Marge</th>
            <th>ROE</th>
            <th>TRI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.id === best.id ? "best" : ""}>
              <td>{r.nom}</td>
              <td>{fmtDh(r.ca)}</td>
              <td>{fmtDh(r.charges)}</td>
              <td>
                <strong>{fmtDh(r.resultat)}</strong>
              </td>
              <td>{fmtPct(r.marge)}</td>
              <td>{fmtPct(r.roe)}</td>
              <td>{r.tri == null ? "—" : fmtPct(r.tri)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
