import type { SimulationOutput, AdvancedMetrics } from "@casa/core";
import { fmtDh, fmtDhSigned, fmtPct, fmtPctSigned } from "./format";

export function Results({
  result,
  advanced,
}: {
  result: SimulationOutput;
  advanced: AdvancedMetrics;
}) {
  const t = result.totaux;
  const profitable = t.resultatNet > 0;

  return (
    <div className="results">
      <div className={`kpi-grid ${profitable ? "ok" : "ko"}`}>
        <div className="kpi">
          <span className="kpi-label">CA HT</span>
          <span className="kpi-value">{fmtDh(t.totalVentes)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Charges totales</span>
          <span className="kpi-value">{fmtDh(t.totalCharges)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">EBIT</span>
          <span className="kpi-value">{fmtDh(t.ebit)}</span>
        </div>
        <div className="kpi big">
          <span className="kpi-label">Résultat net</span>
          <span className="kpi-value">{fmtDh(t.resultatNet)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Marge nette</span>
          <span className="kpi-value">{fmtPct(t.margeNette)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">ROE projet</span>
          <span className="kpi-value">{fmtPct(t.roe)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">TRI</span>
          <span className="kpi-value">
            {advanced.tri == null ? "—" : fmtPct(advanced.tri)}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Cash-on-cash / an</span>
          <span className="kpi-value">{fmtPct(advanced.cashOnCash)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Point mort prix apparts</span>
          <span className="kpi-value">
            {advanced.pointMortPrixApparts == null
              ? "—"
              : fmtDh(advanced.pointMortPrixApparts)}
          </span>
        </div>
      </div>

      <details className="breakdown">
        <summary>Détail des charges</summary>
        <table className="breakdown-table">
          <tbody>
            <tr>
              <td>Acquisition</td>
              <td>{fmtDh(result.acquisition.total)}</td>
            </tr>
            <tr>
              <td>Autorisations</td>
              <td>{fmtDh(result.autorisations.total)}</td>
            </tr>
            <tr>
              <td>Constructions</td>
              <td>{fmtDh(result.constructions.total)}</td>
            </tr>
            <tr>
              <td>Charges financières</td>
              <td>{fmtDh(result.chargesFinancieres.total)}</td>
            </tr>
            <tr>
              <td>Charges liées à la vente</td>
              <td>{fmtDh(result.chargesVente.total)}</td>
            </tr>
            <tr>
              <td>IS</td>
              <td>{fmtDh(t.is)}</td>
            </tr>
          </tbody>
        </table>
      </details>

      <details className="breakdown">
        <summary>Sensibilité</summary>
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Paramètre</th>
              <th>Variation</th>
              <th>Δ Résultat</th>
              <th>Marge</th>
            </tr>
          </thead>
          <tbody>
            {advanced.sensibilite.map((s, i) => (
              <tr key={i}>
                <td>{s.parametre}</td>
                <td>{fmtPctSigned(s.variation, 0)}</td>
                <td>{fmtDhSigned(s.delta)}</td>
                <td>{fmtPct(s.margeNette)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
