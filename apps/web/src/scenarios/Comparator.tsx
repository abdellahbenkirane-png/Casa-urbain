import { useMemo, useRef } from "react";
import { simulate, computeAdvancedMetrics } from "@casa/core";
import { useScenarioStore } from "./store";
import { fmtDh, fmtPct } from "../simulator/format";

interface Row {
  id: string;
  nom: string;
  ca: number;
  charges: number;
  resultat: number;
  marge: number;
  roe: number;
  tri: number | null;
}

export function Comparator() {
  const { scenarios } = useScenarioStore();
  // Cache local : id+updatedAt → row déjà calculé. Évite de relancer
  // simulate() + computeAdvancedMetrics() sur les scénarios non modifiés.
  const cacheRef = useRef<Map<string, Row>>(new Map());

  const rows = useMemo(() => {
    const cache = cacheRef.current;
    const out: Row[] = [];
    const liveKeys = new Set<string>();
    for (const s of scenarios) {
      const key = `${s.id}@${s.updatedAt}`;
      liveKeys.add(key);
      const hit = cache.get(key);
      if (hit) {
        out.push(hit);
        continue;
      }
      const result = simulate(s.input);
      const adv = computeAdvancedMetrics(s.input, result);
      const row: Row = {
        id: s.id,
        nom: s.input.nom,
        ca: result.totaux.totalVentes,
        charges: result.totaux.totalCharges,
        resultat: result.totaux.resultatNet,
        marge: result.totaux.margeNette,
        roe: result.totaux.roe,
        tri: adv.tri,
      };
      cache.set(key, row);
      out.push(row);
    }
    // Purge des entrées orphelines (scénarios supprimés ou updatedAt obsolètes)
    for (const k of cache.keys()) {
      if (!liveKeys.has(k)) cache.delete(k);
    }
    return out;
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
